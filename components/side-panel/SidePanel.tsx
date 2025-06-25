// File location: components/side-panel/SidePanel.tsx
import React, { useRef, useEffect, useState } from 'react';
import Logger from '../logger/Logger'; // Default import
// Alternative: import { Logger } from '../logger/Logger'; // Named import (if you prefer)

export type LoggerFilterType = 'none' | 'client' | 'server' | 'error';

interface FilterOption {
	value: LoggerFilterType;
	label: string;
}

interface SidePanelProps {
	isOpen: boolean;
	onClose: () => void;
	logEntries: Array<{
		date: any;
		type: string;
		message: any;
	}>;
	isRecording?: boolean;
	onClearLog?: () => void;
}

const filterOptions: FilterOption[] = [
	{ value: 'none', label: 'All Messages' },
	{ value: 'client', label: 'Client Only' },
	{ value: 'server', label: 'Server Only' },
	{ value: 'error', label: 'Errors Only' },
];

export const SidePanel: React.FC<SidePanelProps> = ({
	isOpen,
	onClose,
	logEntries,
	isRecording = false,
	onClearLog,
}) => {
	const loggerRef = useRef<HTMLDivElement>(null);
	const [selectedOption, setSelectedOption] = useState<FilterOption>(
		filterOptions[0]
	);

	// Filter log entries based on selected filter
	const filteredEntries = React.useMemo(() => {
		if (selectedOption.value === 'none') {
			return logEntries;
		}

		return logEntries.filter((entry) => {
			switch (selectedOption.value) {
				case 'client':
					return entry.type.startsWith('client.');
				case 'server':
					return entry.type.startsWith('server.');
				case 'error':
					return entry.type.includes('error');
				default:
					return true;
			}
		});
	}, [logEntries, selectedOption.value]);

	// Auto-scroll to bottom when new entries are added
	useEffect(() => {
		if (loggerRef.current) {
			const loggerContainer = loggerRef.current.querySelector('.overflow-auto');
			if (loggerContainer) {
				loggerContainer.scrollTop = loggerContainer.scrollHeight;
			}
		}
	}, [filteredEntries]);

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 flex'>
			{/* Backdrop */}
			<div
				className='absolute inset-0 bg-black bg-opacity-50 transition-opacity'
				onClick={onClose}
			/>

			{/* Panel */}
			<div className='relative ml-auto w-full max-w-2xl bg-white shadow-xl flex flex-col h-full'>
				{/* Header */}
				<div className='flex items-center justify-between p-4 border-b border-gray-200'>
					<div className='flex items-center gap-4'>
						<h2 className='text-lg font-semibold text-gray-900'>
							Connection Logger
						</h2>

						{/* Filter Dropdown */}
						<div className='relative'>
							<select
								value={selectedOption.value}
								onChange={(e) => {
									const option = filterOptions.find(
										(opt) => opt.value === e.target.value
									);
									if (option) setSelectedOption(option);
								}}
								className='text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
								{filterOptions.map((option) => (
									<option
										key={option.value}
										value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>

						{/* Entry Count */}
						<span className='text-sm text-gray-500'>
							{filteredEntries.length} / {logEntries.length} entries
						</span>
					</div>

					<div className='flex items-center gap-3'>
						{/* Recording Indicator */}
						{isRecording && (
							<div className='flex items-center gap-2'>
								<div className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
								<span className='text-sm text-red-600 font-medium'>Live</span>
							</div>
						)}

						{/* Clear Button */}
						{onClearLog && logEntries.length > 0 && (
							<button
								onClick={onClearLog}
								className='text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors'>
								Clear All
							</button>
						)}

						{/* Close Button */}
						<button
							onClick={onClose}
							className='text-gray-400 hover:text-gray-600 transition-colors p-1'
							aria-label='Close panel'>
							<svg
								className='w-6 h-6'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M6 18L18 6M6 6l12 12'
								/>
							</svg>
						</button>
					</div>
				</div>

				{/* Logger Content */}
				<div
					className='flex-1 logger-container'
					ref={loggerRef}>
					<Logger
						entries={filteredEntries}
						isRecording={isRecording}
						onClear={onClearLog}
					/>
				</div>

				{/* Footer */}
				<div className='p-4 border-t border-gray-200 bg-gray-50'>
					<div className='flex items-center justify-between text-sm text-gray-600'>
						<div className='flex items-center gap-4'>
							<div className='flex items-center gap-2'>
								<div className='w-3 h-3 bg-blue-500 rounded-sm'></div>
								<span>Client Messages</span>
							</div>
							<div className='flex items-center gap-2'>
								<div className='w-3 h-3 bg-green-500 rounded-sm'></div>
								<span>Server Messages</span>
							</div>
							<div className='flex items-center gap-2'>
								<div className='w-3 h-3 bg-red-500 rounded-sm'></div>
								<span>Errors</span>
							</div>
						</div>
						<div className='text-xs'>
							Last updated: {new Date().toLocaleTimeString()}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SidePanel;
