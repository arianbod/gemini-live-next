// components/App.tsx - Minimal changes to your existing file
'use client';

import { useRef, useState } from 'react';
import { LiveAPIProvider } from '../contexts/LiveAPIContext';
import ControlTray from './control-tray/ControlTray';
import { LiveClientOptions } from '../types';
import { AIAvatar } from './AIAvatar';

// Keep your existing backend configuration
const BACKEND_URL =
	process.env.NEXT_PUBLIC_BACKEND_URL || 'ws://localhost:8080';

const apiOptions: LiveClientOptions = {
	backendUrl: BACKEND_URL,
};

function App() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

	return (
		// Simple black background with Tailwind classes
		<div className='w-full h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden'>
			<LiveAPIProvider options={apiOptions}>
				{/* Main content area with the avatar */}
				<main className='flex-1 flex items-center justify-center w-full'>
					<AIAvatar />
				</main>

				{/* Video Stream - only show when active */}
				{videoStream && (
					<div className='absolute top-4 right-4 w-48 h-36 rounded-lg overflow-hidden border border-gray-700'>
						<video
							ref={videoRef}
							autoPlay
							playsInline
							className='w-full h-full object-cover'
						/>
					</div>
				)}

				{/* Keep your existing ControlTray but with minimal props */}
				<ControlTray
					videoRef={videoRef}
					supportsVideo={true}
					onVideoStreamChange={setVideoStream}
					enableEditingSettings={true}
				/>
			</LiveAPIProvider>
		</div>
	);
}

export default App;
