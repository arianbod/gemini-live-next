// hooks/use-live-api.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WebSocketLiveClient } from '../lib/websocket-live-client';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext } from '@/lib/utils';
import VolMeterWorket from '@/lib/worklets/vol-meter';
import { LiveConnectConfig } from '@google/genai';
import { LiveClientOptions } from '@/types';

export type UseLiveAPIResults = {
	client: WebSocketLiveClient;
	setConfig: (config: LiveConnectConfig) => void;
	config: LiveConnectConfig;
	model: string;
	setModel: (model: string) => void;
	connected: boolean;
	connect: () => Promise<void>;
	disconnect: () => Promise<void>;
	volume: number;
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
	const client = useMemo(
		() => new WebSocketLiveClient(options.backendUrl),
		[options.backendUrl]
	);
	const audioStreamerRef = useRef<AudioStreamer | null>(null);

	const [model, setModel] = useState<string>('models/gemini-2.0-flash-exp');
	const [config, setConfig] = useState<LiveConnectConfig>({});
	const [connected, setConnected] = useState(false);
	const [volume, setVolume] = useState(0);

	// register audio for streaming server -> speakers
	useEffect(() => {
		if (!audioStreamerRef.current) {
			audioContext({ id: 'audio-out' }).then((audioCtx: AudioContext) => {
				audioStreamerRef.current = new AudioStreamer(audioCtx);
				audioStreamerRef.current
					.addWorklet<any>('vumeter-out', VolMeterWorket, (ev: any) => {
						setVolume(ev.data.volume);
					})
					.then(() => {
						// Successfully added worklet
					});
			});
		}
	}, [audioStreamerRef]);

	useEffect(() => {
		const onOpen = () => {
			setConnected(true);
		};

		const onClose = () => {
			setConnected(false);
		};

		const onError = (error: ErrorEvent) => {
			console.error('error', error);
		};

		const stopAudioStreamer = () => audioStreamerRef.current?.stop();

		const onAudio = (data: ArrayBuffer) =>
			audioStreamerRef.current?.addPCM16(new Uint8Array(data));

		client
			.on('error', onError)
			.on('open', onOpen)
			.on('close', onClose)
			.on('interrupted', stopAudioStreamer)
			.on('audio', onAudio);

		return () => {
			client
				.off('error', onError)
				.off('open', onOpen)
				.off('close', onClose)
				.off('interrupted', stopAudioStreamer)
				.off('audio', onAudio)
				.disconnect();
		};
	}, [client]);

	const connect = useCallback(async () => {
		if (!config) {
			throw new Error('config has not been set');
		}
		client.disconnect();
		await client.connect(model, config);
	}, [client, config, model]);

	const disconnect = useCallback(async () => {
		client.disconnect();
		setConnected(false);
	}, [setConnected, client]);

	return {
		client,
		config,
		setConfig,
		model,
		setModel,
		connected,
		connect,
		disconnect,
		volume,
	};
}
