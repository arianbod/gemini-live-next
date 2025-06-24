// components/App.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import './App.scss';
import { LiveAPIProvider } from '../contexts/LiveAPIContext';
import SidePanel from './side-panel/SidePanel';
import { Altair } from './altair/Altair';
import ControlTray from './control-tray/ControlTray';
import cn from 'classnames';
import { LiveClientOptions } from '../types';

// Get API key from environment variables (Next.js format)
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
if (typeof API_KEY !== 'string') {
	throw new Error('set NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
}

const apiOptions: LiveClientOptions = {
	apiKey: API_KEY,
};

// Floating particles component
const FloatingParticles = () => {
	const [particles, setParticles] = useState<
		Array<{ id: number; x: number; y: number; size: number; duration: number }>
	>([]);

	useEffect(() => {
		const generateParticles = () => {
			const newParticles = Array.from({ length: 20 }, (_, i) => ({
				id: i,
				x: Math.random() * 100,
				y: Math.random() * 100,
				size: Math.random() * 4 + 1,
				duration: Math.random() * 10 + 10,
			}));
			setParticles(newParticles);
		};

		generateParticles();
		const interval = setInterval(generateParticles, 15000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className='floating-particles'>
			{particles.map((particle) => (
				<div
					key={particle.id}
					className='particle'
					style={{
						left: `${particle.x}%`,
						top: `${particle.y}%`,
						width: `${particle.size}px`,
						height: `${particle.size}px`,
						animationDuration: `${particle.duration}s`,
					}}
				/>
			))}
		</div>
	);
};

// Animated background waves
const BackgroundWaves = () => (
	<div className='background-waves'>
		<div className='wave wave-1'></div>
		<div className='wave wave-2'></div>
		<div className='wave wave-3'></div>
	</div>
);

// AI Avatar component
const AIAvatar = ({
	isConnected,
	volume,
}: {
	isConnected: boolean;
	volume: number;
}) => {
	return (
		<div
			className={cn('ai-avatar', {
				connected: isConnected,
				talking: volume > 0.1,
			})}>
			<div className='avatar-core'>
				<div className='avatar-inner'>
					<div className='avatar-pulse'></div>
					<div className='avatar-glow'></div>
				</div>
			</div>
			<div className='avatar-rings'>
				<div className='ring ring-1'></div>
				<div className='ring ring-2'></div>
				<div className='ring ring-3'></div>
			</div>
		</div>
	);
};

function App() {
	// this video reference is used for displaying the active stream, whether that is the webcam or screen capture
	// feel free to style as you see fit
	const videoRef = useRef<HTMLVideoElement>(null);
	// either the screen capture, the video or null, if null we hide it
	const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

	return (
		<div className='App'>
			<LiveAPIProvider options={apiOptions}>
				<div className='streaming-console'>
					<FloatingParticles />
					<BackgroundWaves />

					{/* Header with animated title */}
					<header className='app-header'>
						<div className='title-container'>
							<h1 className='app-title'>
								<span className='title-letter'>B</span>
								<span className='title-letter'>a</span>
								<span className='title-letter'>b</span>
								<span className='title-letter'>a</span>
								<span className='title-letter'>G</span>
								<span className='title-letter'>P</span>
								<span className='title-letter'>T</span>
							</h1>
							<p className='app-subtitle'>AI Assistant • Live & Interactive</p>
						</div>
					</header>

					<SidePanel />

					<main className='main-content'>
						<div className='main-app-area'>
							{/* Central AI Avatar */}
							<div className='avatar-section'>
								<AIAvatar
									isConnected={true}
									volume={0}
								/>
							</div>

							{/* Chart Area */}
							<div className='chart-container'>
								<Altair />
							</div>

							{/* Video Stream */}
							<div
								className={cn('video-container', {
									hidden: !videoRef.current || !videoStream,
								})}>
								<video
									className='stream-video'
									ref={videoRef}
									autoPlay
									playsInline
								/>
							</div>
						</div>

						<ControlTray
							videoRef={videoRef}
							supportsVideo={true}
							onVideoStreamChange={setVideoStream}
							enableEditingSettings={true}
						/>
					</main>
				</div>
			</LiveAPIProvider>
		</div>
	);
}

export default App;
