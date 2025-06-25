// components/settings-dialog/SettingsDialog.tsx
'use client';

import { useState } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';

const voiceOptions = [
	{ value: 'Puck', label: 'Puck' },
	{ value: 'Charon', label: 'Charon' },
	{ value: 'Kore', label: 'Kore' },
	{ value: 'Fenrir', label: 'Fenrir' },
	{ value: 'Aoede', label: 'Aoede' },
];

export default function SettingsDialog() {
	const [open, setOpen] = useState(false);
	const { config, setConfig, connected } = useLiveAPIContext();

	const currentVoice =
		config?.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName ||
		'Aoede';

	const updateVoice = (voiceName: string) => {
		if (!config) return;

		setConfig({
			...config,
			speechConfig: {
				voiceConfig: {
					prebuiltVoiceConfig: {
						voiceName: voiceName,
					},
				},
			},
		});
	};

	return (
		<>
			{/* Settings Trigger Button */}
			<button
				className='w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all duration-200 flex items-center justify-center'
				onClick={() => setOpen(!open)}
				title='Settings'>
				<span className='material-symbols-outlined text-sm'>settings</span>
			</button>

			{/* Settings Modal */}
			{open && (
				<>
					{/* Backdrop */}
					<div
						className='fixed inset-0 bg-black bg-opacity-50 z-40'
						onClick={() => setOpen(false)}
					/>

					{/* Modal Content */}
					<div className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-80 bg-gray-900 rounded-lg border border-gray-700 shadow-xl'>
						{/* Header */}
						<div className='flex items-center justify-between p-4 border-b border-gray-700'>
							<h2 className='text-lg font-semibold text-white'>
								Voice Settings
							</h2>
							<button
								className='w-6 h-6 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all duration-200 flex items-center justify-center'
								onClick={() => setOpen(false)}>
								<span className='material-symbols-outlined text-sm'>close</span>
							</button>
						</div>

						{/* Content */}
						<div className='p-4'>
							{connected && (
								<div className='mb-4 p-3 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-md'>
									<p className='text-yellow-400 text-sm'>
										Voice changes will take effect on next connection.
									</p>
								</div>
							)}

							<div className='space-y-3'>
								<label className='block text-sm font-medium text-gray-300'>
									Select Voice
								</label>

								<div className='space-y-2'>
									{voiceOptions.map((voice) => (
										<button
											key={voice.value}
											className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 ${
												currentVoice === voice.value
													? 'bg-white text-black'
													: 'bg-gray-800 text-white hover:bg-gray-700'
											}`}
											onClick={() => updateVoice(voice.value)}
											disabled={connected}>
											<div className='flex items-center justify-between'>
												<span>{voice.label}</span>
												{currentVoice === voice.value && (
													<span className='material-symbols-outlined text-sm'>
														check
													</span>
												)}
											</div>
										</button>
									))}
								</div>
							</div>
						</div>

						{/* Footer */}
						<div className='p-4 border-t border-gray-700'>
							<button
								className='w-full bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200 transition-all duration-200'
								onClick={() => setOpen(false)}>
								Done
							</button>
						</div>
					</div>
				</>
			)}
		</>
	);
}
