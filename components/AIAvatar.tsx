// components/AIAvatar.tsx
'use client';

import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { useEffect, useState } from 'react';

export const AIAvatar = () => {
	const { connected, volume } = useLiveAPIContext();
	const [isListening, setIsListening] = useState(false);

	// Generate random wave heights for animation when not receiving audio
	const [randomWaves, setRandomWaves] = useState<number[]>([
		0.1, 0.3, 0.2, 0.4, 0.1,
	]);

	useEffect(() => {
		const interval = setInterval(() => {
			if (!isListening && connected) {
				setRandomWaves([
					Math.random() * 0.3 + 0.1,
					Math.random() * 0.5 + 0.2,
					Math.random() * 0.4 + 0.1,
					Math.random() * 0.6 + 0.2,
					Math.random() * 0.3 + 0.1,
				]);
			}
		}, 150);

		return () => clearInterval(interval);
	}, [isListening, connected]);

	useEffect(() => {
		setIsListening(volume > 0.01);
	}, [volume]);

	// Create wave heights based on volume or random animation
	const waveHeights = isListening
		? [
				Math.min(volume * 8 + 0.1, 1),
				Math.min(volume * 12 + 0.2, 1),
				Math.min(volume * 10 + 0.15, 1),
				Math.min(volume * 15 + 0.25, 1),
				Math.min(volume * 8 + 0.1, 1),
		  ]
		: randomWaves;

	return (
		<div className='flex flex-col items-center justify-center'>
			{/* Main Avatar Circle */}
			<div className='relative'>
				{/* Outer glow ring */}
				<div
					className={`absolute inset-0 rounded-full transition-all duration-300 ${
						connected
							? 'bg-white bg-opacity-5 scale-110'
							: 'bg-white bg-opacity-2 scale-100'
					}`}
					style={{
						width: '200px',
						height: '200px',
						transform: `scale(${1 + (isListening ? volume * 0.3 : 0)})`,
					}}
				/>

				{/* Main circle */}
				<div
					className={`relative w-48 h-48 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
						connected
							? 'border-white bg-white bg-opacity-5'
							: 'border-gray-600 bg-gray-900'
					}`}
					style={{
						transform: `scale(${1 + (isListening ? volume * 0.1 : 0)})`,
						boxShadow: connected
							? `0 0 30px rgba(255, 255, 255, ${
									isListening ? volume * 0.5 + 0.1 : 0.1
							  })`
							: 'none',
					}}>
					{/* Sound wave visualization */}
					<div className='flex items-center justify-center space-x-1'>
						{waveHeights.map((height, index) => (
							<div
								key={index}
								className='bg-white rounded-full transition-all duration-150'
								style={{
									width: '3px',
									height: `${height * 40 + 8}px`,
									opacity: connected ? (isListening ? 0.9 : 0.4) : 0.2,
								}}
							/>
						))}
					</div>
				</div>

				{/* Pulse rings when talking */}
				{isListening && connected && (
					<>
						<div
							className='absolute inset-0 rounded-full border border-white animate-ping'
							style={{
								width: '220px',
								height: '220px',
								top: '-16px',
								left: '-16px',
								opacity: 0.3,
							}}
						/>
						<div
							className='absolute inset-0 rounded-full border border-white animate-ping'
							style={{
								width: '240px',
								height: '240px',
								top: '-26px',
								left: '-26px',
								opacity: 0.2,
								animationDelay: '0.2s',
							}}
						/>
					</>
				)}
			</div>

			{/* Status text */}
			<div className='mt-8 text-center'>
				<p className='text-white text-sm font-medium'>
					{connected
						? isListening
							? 'Listening...'
							: 'Ready'
						: 'Disconnected'}
				</p>
				{connected && !isListening && (
					<p className='text-gray-400 text-xs mt-1'>Press and hold to speak</p>
				)}
			</div>
		</div>
	);
};
