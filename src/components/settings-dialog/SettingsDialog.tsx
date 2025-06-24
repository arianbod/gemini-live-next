// src/components/settings-dialog/SettingsDialog.tsx
import {
	ChangeEvent,
	FormEventHandler,
	useCallback,
	useMemo,
	useState,
} from 'react';
import './settings-dialog.scss';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import VoiceSelector from './VoiceSelector';
import ResponseModalitySelector from './ResponseModalitySelector';
import { FunctionDeclaration, LiveConnectConfig, Tool } from '@google/genai';

type FunctionDeclarationsTool = Tool & {
	functionDeclarations: FunctionDeclaration[];
};

export default function SettingsDialog() {
	const [open, setOpen] = useState(false);
	const { config, setConfig, connected } = useLiveAPIContext();
	const functionDeclarations: FunctionDeclaration[] = useMemo(() => {
		if (!Array.isArray(config.tools)) {
			return [];
		}
		return (config.tools as Tool[])
			.filter((t: Tool): t is FunctionDeclarationsTool =>
				Array.isArray((t as any).functionDeclarations)
			)
			.map((t) => t.functionDeclarations)
			.filter((fc) => !!fc)
			.flat();
	}, [config]);

	// system instructions can come in many types
	const systemInstruction = useMemo(() => {
		if (!config.systemInstruction) {
			return '';
		}
		if (typeof config.systemInstruction === 'string') {
			return config.systemInstruction;
		}
		if (Array.isArray(config.systemInstruction)) {
			return config.systemInstruction
				.map((p) => (typeof p === 'string' ? p : p.text))
				.join('\n');
		}
		if (
			typeof config.systemInstruction === 'object' &&
			'parts' in config.systemInstruction
		) {
			return (
				config.systemInstruction.parts?.map((p) => p.text).join('\n') || ''
			);
		}
		return '';
	}, [config]);

	const updateConfig: FormEventHandler<HTMLTextAreaElement> = useCallback(
		(event: ChangeEvent<HTMLTextAreaElement>) => {
			const newConfig: LiveConnectConfig = {
				...config,
				systemInstruction: event.target.value,
			};
			setConfig(newConfig);
		},
		[config, setConfig]
	);

	const updateFunctionDescription = useCallback(
		(editedFdName: string, newDescription: string) => {
			const newConfig: LiveConnectConfig = {
				...config,
				tools:
					config.tools?.map((tool) => {
						const fdTool = tool as FunctionDeclarationsTool;
						if (!Array.isArray(fdTool.functionDeclarations)) {
							return tool;
						}
						return {
							...tool,
							functionDeclarations: fdTool.functionDeclarations.map((fd) =>
								fd.name === editedFdName
									? { ...fd, description: newDescription }
									: fd
							),
						};
					}) || [],
			};
			setConfig(newConfig);
		},
		[config, setConfig]
	);

	const closeDialog = () => setOpen(false);

	return (
		<div className='settings-dialog'>
			<button
				className='settings-trigger'
				onClick={() => setOpen(!open)}
				title='Open Settings'>
				<span className='material-symbols-outlined'>settings</span>
				<span className='button-ripple'></span>
			</button>

			{open && (
				<>
					<div
						className='dialog-backdrop'
						onClick={closeDialog}
					/>
					<div className='dialog-container'>
						<div className='dialog-content'>
							{/* Header */}
							<div className='dialog-header'>
								<div className='header-content'>
									<h2 className='dialog-title'>
										<span className='title-icon'>
											<span className='material-symbols-outlined'>tune</span>
										</span>
										Configuration
									</h2>
									<button
										className='close-button'
										onClick={closeDialog}
										title='Close Settings'>
										<span className='material-symbols-outlined'>close</span>
										<span className='button-ripple'></span>
									</button>
								</div>

								{connected && (
									<div className='connection-warning'>
										<div className='warning-content'>
											<span className='material-symbols-outlined'>info</span>
											<p>
												Settings can only be modified when disconnected. Changes
												will take effect on next connection.
											</p>
										</div>
									</div>
								)}
							</div>

							{/* Settings Content */}
							<div
								className={`settings-content ${connected ? 'disabled' : ''}`}>
								{/* Voice & Response Settings */}
								<section className='settings-section'>
									<div className='section-header'>
										<h3>Audio Configuration</h3>
										<div className='section-divider'></div>
									</div>
									<div className='mode-selectors'>
										<ResponseModalitySelector />
										<VoiceSelector />
									</div>
								</section>

								{/* System Instructions */}
								<section className='settings-section'>
									<div className='section-header'>
										<h3>System Instructions</h3>
										<div className='section-divider'></div>
									</div>
									<div className='instruction-container'>
										<textarea
											className='system-instruction-input'
											onChange={updateConfig}
											value={systemInstruction}
											placeholder='Enter system instructions for the AI assistant...'
											disabled={connected}
										/>
										<div className='input-footer'>
											<span className='input-hint'>
												Define how the AI should behave and respond to your
												requests
											</span>
										</div>
									</div>
								</section>

								{/* Function Declarations */}
								{functionDeclarations.length > 0 && (
									<section className='settings-section'>
										<div className='section-header'>
											<h3>Function Declarations</h3>
											<div className='section-divider'></div>
										</div>
										<div className='function-declarations'>
											<div className='functions-grid'>
												{functionDeclarations.map((fd, fdKey) => (
													<div
														className='function-card'
														key={`function-${fdKey}`}>
														<div className='function-header'>
															<div className='function-name'>
																<span className='function-icon'>
																	<span className='material-symbols-outlined'>
																		code
																	</span>
																</span>
																<span className='name-text'>{fd.name}</span>
															</div>
															<div className='function-params'>
																{Object.keys(
																	fd.parameters?.properties || {}
																).map((param, k) => (
																	<span
																		key={k}
																		className='param-tag'>
																		{param}
																	</span>
																))}
															</div>
														</div>
														<div className='function-description'>
															<label className='description-label'>
																Description
															</label>
															<textarea
																key={`fd-${fd.description}`}
																className='description-input'
																defaultValue={fd.description}
																onBlur={(e) =>
																	updateFunctionDescription(
																		fd.name!,
																		e.target.value
																	)
																}
																disabled={connected}
																rows={2}
															/>
														</div>
													</div>
												))}
											</div>
										</div>
									</section>
								)}
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
