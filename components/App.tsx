// components/App.tsx
'use client';

import { useRef, useState } from 'react';
import { LiveAPIProvider } from '../contexts/LiveAPIContext';
import ControlTray from './control-tray/ControlTray';
import { LiveClientOptions } from '../types';
import { AIAvatar } from './AIAvatar';

// Get API key from environment variables - will connect to our backend
const BACKEND_URL =
	process.env.NEXT_PUBLIC_BACKEND_URL || 'ws://localhost:8080';

const apiOptions: LiveClientOptions = {
	// We'll use the backend URL instead of API key
	backendUrl: BACKEND_URL,
};

function App() {
	// this video reference is used for displaying the active stream, whether that is the webcam or screen capture
	const videoRef = useRef<HTMLVideoElement>(null);
	// either the screen capture, the video or null, if null we hide it
	const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

	return (
		<div className='w-full h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden'>
			<LiveAPIProvider options={apiOptions}>
				{/* Main content area */}
				<main className='flex-1 flex items-center justify-center w-full'>
					{/* Central AI Avatar */}
					<AIAvatar />
				</main>

				{/* Video Stream - hidden by default, shown when active */}
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

				{/* Control buttons at bottom */}
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
