// lib/websocket-live-client.ts
'use client';

import { EventEmitter } from 'eventemitter3';
import { LiveConnectConfig, LiveClientToolResponse, Part } from '@google/genai';
import { LiveClientEventTypes } from './genai-live-client';
import { StreamingLog } from '../types';
import { base64ToArrayBuffer } from './utils';

/**
 * WebSocket Live Client that communicates with our separate Node.js backend
 * instead of directly with Gemini API. Maintains the same interface
 * as the original GenAILiveClient for seamless replacement.
 */
export class WebSocketLiveClient extends EventEmitter<LiveClientEventTypes> {
	private backendUrl: string;
	private ws: WebSocket | null = null;
	private _status: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
	private _model: string | null = null;
	private config: LiveConnectConfig | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;

	public get status() {
		return this._status;
	}

	public get model() {
		return this._model;
	}

	public getConfig() {
		return { ...this.config };
	}

	constructor(backendUrl: string) {
		super();
		this.backendUrl = backendUrl;
		this.send = this.send.bind(this);
	}

	protected log(type: string, message: StreamingLog['message']) {
		const log: StreamingLog = {
			date: new Date(),
			type,
			message,
		};
		this.emit('log', log);
	}

	private setupWebSocket() {
		try {
			this.ws = new WebSocket(this.backendUrl);

			this.ws.onopen = () => {
				console.log('Connected to backend WebSocket');
				this._status = 'connected';
				this.reconnectAttempts = 0;
				this.emit('open');
				this.log('client.open', 'Connected to backend');
			};

			this.ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					this.handleBackendMessage(data);
				} catch (error) {
					console.error('Error parsing WebSocket message:', error);
				}
			};

			this.ws.onclose = (event) => {
				console.log('WebSocket connection closed:', event.code, event.reason);
				this._status = 'disconnected';
				this.emit('close', event);
				this.log(
					'client.close',
					`Disconnected: ${event.reason || 'Connection closed'}`
				);

				// Attempt to reconnect if not a clean close
				if (
					event.code !== 1000 &&
					this.reconnectAttempts < this.maxReconnectAttempts
				) {
					setTimeout(() => {
						this.reconnectAttempts++;
						console.log(
							`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
						);
						this.setupWebSocket();
					}, this.reconnectDelay * this.reconnectAttempts);
				}
			};

			this.ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				this.emit('error', error as ErrorEvent);
				this.log('client.error', 'WebSocket connection error');
			};
		} catch (error) {
			console.error('Failed to create WebSocket connection:', error);
			this._status = 'disconnected';
		}
	}

	private handleBackendMessage(data: any) {
		switch (data.type) {
			case 'connected':
				this.emit('open');
				break;
			case 'disconnected':
				this._status = 'disconnected';
				this.emit('close', new CloseEvent('close'));
				break;
			case 'setupComplete':
				this.emit('setupcomplete');
				break;
			case 'content':
				this.emit('content', data.data);
				break;
			case 'audio':
				// Convert base64 audio data to ArrayBuffer
				const audioBuffer = base64ToArrayBuffer(data.data);
				this.emit('audio', audioBuffer);
				break;
			case 'toolCall':
				this.emit('toolcall', data.data);
				break;
			case 'toolCallCancellation':
				this.emit('toolcallcancellation', data.data);
				break;
			case 'interrupted':
				this.emit('interrupted');
				break;
			case 'turnComplete':
				this.emit('turncomplete');
				break;
			case 'error':
				this.emit('error', new ErrorEvent('error', { message: data.message }));
				break;
			case 'log':
				this.emit('log', data.data);
				break;
			default:
				console.log('Unknown message type from backend:', data.type);
		}
	}

	private sendToBackend(message: any) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(message));
		} else {
			console.warn('WebSocket not connected, message not sent:', message);
		}
	}

	async connect(model: string, config: LiveConnectConfig): Promise<boolean> {
		if (this._status === 'connected' || this._status === 'connecting') {
			return false;
		}

		this._status = 'connecting';
		this.config = config;
		this._model = model;

		// Setup WebSocket connection
		this.setupWebSocket();

		// Wait for connection to be established
		return new Promise((resolve) => {
			const onOpen = () => {
				// Send connect message to backend
				this.sendToBackend({
					type: 'connect',
					model,
					config,
				});
				this.off('open', onOpen);
				resolve(true);
			};

			const onError = () => {
				this.off('error', onError);
				this.off('open', onOpen);
				resolve(false);
			};

			this.on('open', onOpen);
			this.on('error', onError);
		});
	}

	public disconnect() {
		if (this._status === 'disconnected') {
			return false;
		}

		// Send disconnect message to backend
		this.sendToBackend({
			type: 'disconnect',
		});

		// Close WebSocket connection
		if (this.ws) {
			this.ws.close(1000, 'Client disconnect');
			this.ws = null;
		}

		this._status = 'disconnected';
		this.log('client.close', 'Disconnected');
		return true;
	}

	/**
	 * send realtimeInput, this is base64 chunks of "audio/pcm" and/or "image/jpg"
	 */
	sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
		if (this._status !== 'connected') return;

		this.sendToBackend({
			type: 'sendRealtimeInput',
			data: chunks,
		});

		let hasAudio = false;
		let hasVideo = false;
		for (const ch of chunks) {
			if (ch.mimeType.includes('audio')) {
				hasAudio = true;
			}
			if (ch.mimeType.includes('image')) {
				hasVideo = true;
			}
			if (hasAudio && hasVideo) {
				break;
			}
		}
		const message =
			hasAudio && hasVideo
				? 'audio + video'
				: hasAudio
				? 'audio'
				: hasVideo
				? 'video'
				: 'unknown';
		this.log(`client.realtimeInput`, message);
	}

	/**
	 *  send a response to a function call and provide the id of the functions you are responding to
	 */
	sendToolResponse(toolResponse: LiveClientToolResponse) {
		if (this._status !== 'connected') return;

		if (
			toolResponse.functionResponses &&
			toolResponse.functionResponses.length
		) {
			this.sendToBackend({
				type: 'sendToolResponse',
				data: toolResponse,
			});
			this.log(`client.toolResponse`, toolResponse);
		}
	}

	/**
	 * send normal content parts such as { text }
	 */
	send(parts: Part | Part[], turnComplete: boolean = true) {
		if (this._status !== 'connected') return;

		this.sendToBackend({
			type: 'send',
			data: { turns: parts, turnComplete },
		});

		this.log(`client.send`, {
			turns: Array.isArray(parts) ? parts : [parts],
			turnComplete,
		});
	}
}
