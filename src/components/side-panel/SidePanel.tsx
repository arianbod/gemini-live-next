// src/components/side-panel/SidePanel.tsx
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

import './react-select.scss';
import cn from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { RiSidebarFoldLine, RiSidebarUnfoldLine } from 'react-icons/ri';
import Select from 'react-select';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { useLoggerStore } from '../../lib/store-logger';
import Logger, { LoggerFilterType } from '../logger/Logger';
import './side-panel.scss';

const filterOptions = [
	{ value: 'conversations', label: 'Conversations' },
	{ value: 'tools', label: 'Tool Use' },
	{ value: 'none', label: 'All' },
];

export default function SidePanel() {
	const { connected, client } = useLiveAPIContext();
	const [open, setOpen] = useState(true);
	const loggerRef = useRef<HTMLDivElement>(null);
	const loggerLastHeightRef = useRef<number>(-1);
	const { log, logs } = useLoggerStore();

	const [textInput, setTextInput] = useState('');
	const [selectedOption, setSelectedOption] = useState<{
		value: string;
		label: string;
	} | null>(filterOptions[0]);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	//scroll the log to the bottom when new logs come in
	useEffect(() => {
		if (loggerRef.current) {
			const el = loggerRef.current;
			const scrollHeight = el.scrollHeight;
			if (scrollHeight !== loggerLastHeightRef.current) {
				el.scrollTop = scrollHeight;
				loggerLastHeightRef.current = scrollHeight;
			}
		}
	}, [logs]);

	// listen for log events and store them
	useEffect(() => {
		client.on('log', log);
		return () => {
			client.off('log', log);
		};
	}, [client, log]);

	const handleSubmit = () => {
		if (!textInput.trim()) return;

		client.send([{ text: textInput }]);
		setTextInput('');
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	return (
		<div className={cn('side-panel', { open })}>
			{/* Header */}
			<header className='panel-header'>
				<div className='header-content'>
					<div className='title-section'>
						<h2 className='panel-title'>Console</h2>
						<div className='title-glow'></div>
					</div>
					<button
						className='toggle-button'
						onClick={() => setOpen(!open)}
						title={open ? 'Collapse Panel' : 'Expand Panel'}>
						{open ? (
							<RiSidebarFoldLine size={20} />
						) : (
							<RiSidebarUnfoldLine size={20} />
						)}
						<span className='button-ripple'></span>
					</button>
				</div>
			</header>

			{/* Controls Section */}
			<section className='panel-controls'>
				<div className='filter-section'>
					<label className='filter-label'>Filter Messages</label>
					<Select
						className='react-select'
						classNamePrefix='react-select'
						styles={{
							control: (baseStyles, state) => ({
								...baseStyles,
								background: 'rgba(255, 255, 255, 0.08)',
								backdropFilter: 'blur(10px)',
								border: '1px solid rgba(255, 255, 255, 0.12)',
								borderRadius: '12px',
								color: '#ffffff',
								minHeight: '40px',
								boxShadow: state.isFocused
									? '0 0 0 2px rgba(139, 92, 246, 0.3)'
									: 'none',
								'&:hover': {
									borderColor: 'rgba(255, 255, 255, 0.2)',
								},
							}),
							option: (styles, { isFocused, isSelected }) => ({
								...styles,
								backgroundColor: isFocused
									? 'rgba(139, 92, 246, 0.2)'
									: isSelected
									? 'rgba(139, 92, 246, 0.3)'
									: 'transparent',
								color: '#ffffff',
								cursor: 'pointer',
								'&:hover': {
									backgroundColor: 'rgba(139, 92, 246, 0.2)',
								},
							}),
							menu: (styles) => ({
								...styles,
								background: 'rgba(20, 20, 30, 0.95)',
								backdropFilter: 'blur(20px)',
								border: '1px solid rgba(255, 255, 255, 0.12)',
								borderRadius: '12px',
								boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
							}),
							singleValue: (styles) => ({
								...styles,
								color: '#ffffff',
							}),
						}}
						value={selectedOption}
						options={filterOptions}
						onChange={(e) => setSelectedOption(e)}
						isSearchable={false}
					/>
				</div>

				<div className='status-section'>
					<div className={cn('streaming-indicator', { connected })}>
						<div className='status-icon'>
							<div className={cn('status-dot', { connected })}>
								<div className='status-pulse'></div>
							</div>
						</div>
						<span className='status-text'>
							{connected ? 'Streaming' : 'Paused'}
						</span>
					</div>
				</div>
			</section>

			{/* Logger Section */}
			<div
				className='logger-container'
				ref={loggerRef}>
				<Logger
					filter={(selectedOption?.value as LoggerFilterType) || 'none'}
				/>
			</div>

			{/* Input Section */}
			<div className={cn('input-section', { disabled: !connected })}>
				<div className='input-container'>
					<div className='input-wrapper'>
						<textarea
							ref={inputRef}
							className='message-input'
							value={textInput}
							onChange={(e) => setTextInput(e.target.value)}
							onKeyDown={handleKeyPress}
							placeholder='Type your message...'
							rows={1}
							disabled={!connected}
						/>
						<button
							className={cn('send-button', {
								active: textInput.trim().length > 0 && connected,
							})}
							onClick={handleSubmit}
							disabled={!connected || !textInput.trim()}
							title='Send Message'>
							<span className='material-symbols-outlined'>send</span>
							<span className='button-ripple'></span>
						</button>
					</div>

					{!connected && (
						<div className='connection-prompt'>
							<span>Connect to start chatting</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
