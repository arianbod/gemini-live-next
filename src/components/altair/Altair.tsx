// src/components/altair/Altair.tsx
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useEffect, useRef, useState, memo } from 'react';
import vegaEmbed from 'vega-embed';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import {
	FunctionDeclaration,
	LiveServerToolCall,
	Modality,
	Type,
} from '@google/genai';

/* ─────────────────────────────────────────────────────────
   1.  Function declaration Gemini will call
   ───────────────────────────────────────────────────────── */
const declaration: FunctionDeclaration = {
	name: 'render_altair',
	description: 'Displays an Altair/Vega-Lite JSON chart specification.',
	parameters: {
		type: Type.OBJECT,
		properties: {
			json_graph: {
				type: Type.STRING,
				description:
					'A STRINGIFIED JSON representation of the Vega‑Lite spec. MUST be a string, not a raw object.',
			},
		},
		required: ['json_graph'],
	},
};

/* ─────────────────────────────────────────────────────────
   2.  Component
   ───────────────────────────────────────────────────────── */
function AltairComponent() {
	// ‑‑ Local UI state
	const [jsonString, setJSONString] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [connectionStatus, setConnectionStatus] = useState<
		'Connected' | 'Disconnected' | 'Error' | 'Unknown'
	>('Unknown');

	// ‑‑ Live‑API context helpers
	const { client, setConfig, setModel, connected } = useLiveAPIContext();

	/* ------------------------------------------------------
     Connection status helper
  ------------------------------------------------------ */
	useEffect(() => {
		setConnectionStatus(connected ? 'Connected' : 'Disconnected');
	}, [connected]);

	/* ------------------------------------------------------
     Initialise Gemini model + tool declaration once
  ------------------------------------------------------ */
	useEffect(() => {
		setModel('models/gemini-2.0-flash-exp');

		setConfig({
			responseModalities: [Modality.AUDIO],
			speechConfig: {
				voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
			},
			systemInstruction: {
				parts: [
					{
						text: 'You are a helpful assistant. When a graph is requested, call the `render_altair` function. Favour vibrant modern colour palettes and smooth animations.',
					},
				],
			},
			tools: [{ googleSearch: {} }, { functionDeclarations: [declaration] }],
		});
	}, [setConfig, setModel]);

	/* ------------------------------------------------------
     Handle incoming tool calls
  ------------------------------------------------------ */
	useEffect(() => {
		const onToolCall = (toolCall: LiveServerToolCall) => {
			console.log('🔧 Tool call received:', toolCall);

			const functionCalls = toolCall.functionCalls ?? [];
			if (!functionCalls.length) return;

			// 1️⃣  Pick our specific function call (could be multiple)
			const chartCall = functionCalls.find((c) => c.name === declaration.name);
			if (chartCall) {
				setIsLoading(true);
				setError('');
				setJSONString((chartCall.args as any).json_graph);
			}

			// 2️⃣  Acknowledge every call (Gemini expects a response)
			client.sendToolResponse({
				functionResponses: functionCalls.map((c) => ({
					id: c.id,
					name: c.name,
					response: { output: { success: true } },
				})),
			});
		};

		/* ---------- Low‑level connection diagnostics ---------- */
		const onConnect = () => {
			console.log('🟢 Live API connected');
			setConnectionStatus('Connected');
		};
		const onDisconnect = () => {
			console.log('🔴 Live API disconnected');
			setConnectionStatus('Disconnected');
		};
		const onError = (err: unknown) => {
			console.error('❌ Live API error:', err);
			setError('Live API connection error – known Google issue');
			setConnectionStatus('Error');
		};

		// Cast away type gap – these events aren’t yet exposed in type defs
		const clientAny = client as unknown as {
			on: (ev: string, h: (...a: any[]) => void) => void;
			off: (ev: string, h: (...a: any[]) => void) => void;
		};

		client.on('toolcall', onToolCall);
		clientAny.on('connect', onConnect);
		clientAny.on('disconnect', onDisconnect);
		clientAny.on('error', onError);

		return () => {
			client.off('toolcall', onToolCall);
			clientAny.off('connect', onConnect);
			clientAny.off('disconnect', onDisconnect);
			clientAny.off('error', onError);
		};
	}, [client]);

	/* ------------------------------------------------------
     Render (Vega‑Embed)
  ------------------------------------------------------ */
	const embedRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!embedRef.current || !jsonString) return;

		setIsLoading(true);
		setError('');

		try {
			const spec = JSON.parse(jsonString);
			const enhanced = {
				...spec,
				background: 'transparent',
				config: {
					...spec.config,
					view: { stroke: 'transparent' },
					axis: {
						...spec.config?.axis,
						labelColor: '#fff',
						titleColor: '#fff',
						tickColor: 'rgba(255,255,255,0.3)',
						domainColor: 'rgba(255,255,255,0.2)',
						gridColor: 'rgba(255,255,255,0.1)',
						labelFont: 'Space Mono, monospace',
						titleFont: 'Inter, sans-serif',
						titleFontWeight: 600,
						labelFontSize: 11,
						titleFontSize: 13,
					},
					legend: {
						...spec.config?.legend,
						labelColor: '#fff',
						titleColor: '#fff',
						labelFont: 'Space Mono, monospace',
						titleFont: 'Inter, sans-serif',
						titleFontWeight: 600,
					},
					title: {
						...spec.config?.title,
						color: '#fff',
						font: 'Inter, sans-serif',
						fontSize: 16,
						fontWeight: 700,
					},
				},
			};

			vegaEmbed(embedRef.current, enhanced, {
				theme: 'dark',
				renderer: 'svg',
				actions: {
					export: true,
					source: false,
					compiled: false,
					editor: false,
				},
				padding: 20,
			})
				.then(() => setIsLoading(false))
				.catch((err) => {
					console.error('❌ Vega render error:', err);
					setError('Failed to render chart');
					setIsLoading(false);
				});
		} catch (err) {
			console.error('❌ JSON parse error:', err);
			setError('Invalid chart data');
			setIsLoading(false);
		}
	}, [jsonString]);

	/* ------------------------------------------------------
     JSX UI
  ------------------------------------------------------ */
	return (
		<div className='altair-container'>
			{/* Header */}
			<div className='chart-header'>
				<h3 className='chart-title'>📊 Data Visualization</h3>
				<div className='chart-status'>
					<div
						className={`connection-status ${connectionStatus.toLowerCase()}`}>
						<div className='status-dot' />
						<span>{connectionStatus}</span>
					</div>

					{isLoading && (
						<div className='status-indicator loading'>
							<div className='spinner' />
							<span>Rendering…</span>
						</div>
					)}
					{error && (
						<div className='status-indicator error'>
							<span className='material-symbols-outlined'>error</span>
							<span>{error}</span>
						</div>
					)}
					{jsonString && !isLoading && !error && (
						<div className='status-indicator success'>
							<span className='material-symbols-outlined'>check_circle</span>
							<span>Chart ready</span>
						</div>
					)}
				</div>
			</div>

			{/* Content */}
			<div className='chart-content'>
				{!jsonString && !isLoading && (
					<div className='empty-state'>
						<div className='empty-icon'>
							<span className='material-symbols-outlined'>bar_chart</span>
						</div>
						<h4>Ready for visualization</h4>
						<p>Ask me for a chart and I’ll display it here.</p>

						{!connected && (
							<div className='api-warning'>
								<p>
									⚠️ <strong>Known issue:</strong> Google’s Live‑API
									occasionally stalls. This is on Google’s end.
								</p>
								<p>Just reconnect – it’s temporary.</p>
							</div>
						)}

						<div className='example-prompts'>
							<span className='prompt-label'>Try:</span>
							<div className='prompt-examples'>
								<span>“Show me a bar chart of monthly sales”</span>
								<span>“Plot a line graph of temperature over time”</span>
								<span>“Create a scatter plot of height vs weight”</span>
							</div>
						</div>
					</div>
				)}

				<div
					ref={embedRef}
					className='vega-embed-container'
					style={{
						display: jsonString ? 'block' : 'none',
						opacity: isLoading ? 0.5 : 1,
					}}
				/>
			</div>

			{process.env.NODE_ENV === 'development' && (
				<div className='debug-info'>
					<small>
						Model: gemini-2.0-flash-exp | Status: {connectionStatus} |
						Connected: {connected ? 'Yes' : 'No'}
					</small>
				</div>
			)}
		</div>
	);
}

export const Altair = memo(AltairComponent);
