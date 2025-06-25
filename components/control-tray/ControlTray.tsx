// components/control-tray/ControlTray.tsx - Replace your existing file with this simplified version
'use client';

import { memo, RefObject, useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { useScreenCapture } from '../../hooks/use-screen-capture';
import { useWebcam } from '../../hooks/use-webcam';
import { AudioRecorder } from '@/lib/audio-recorder';
import SettingsDialog from '../settings-dialog/SettingsDialog';

export type ControlTrayProps = {
	videoRef: RefObject<HTMLVideoElement>;
	supportsVideo: boolean;
	onVideoStreamChange?: (stream: MediaStream | null) => void;
	enableEditingSettings?: boolean;
};

function ControlTray({
	videoRef,
	onVideoStreamChange = () => {},
	supportsVideo,
	enableEditingSettings,
}: ControlTrayProps) {
	const webcam = useWebcam();
	const screenCapture = useScreenCapture();
	const [activeVideoStream, setActiveVideoStream] =
		useState<MediaStream | null>(null);
	const [muted, setMuted] = useState(false);
	const [audioRecorder] = useState(() => new AudioRecorder());
	const renderCanvasRef = useRef<HTMLCanvasElement>(null);

	const { client, connected, connect, disconnect } = useLiveAPIContext();

	// Keep all your existing audio recording logic
	useEffect(() => {
		const onData = (base64: string) => {
			client.sendRealtimeInput([
				{
					mimeType: 'audio/pcm;rate=16000',
					data: base64,
				},
			]);
		};

		if (connected && !muted && audioRecorder) {
			audioRecorder.on('data', onData).start();
		} else {
			audioRecorder.stop();
		}

		return () => {
			audioRecorder.off('data', onData);
		};
	}, [connected, client, muted, audioRecorder]);

	// Keep all your existing video streaming logic
	useEffect(() => {
		if (videoRef.current) {
			videoRef.current.srcObject = activeVideoStream;
		}

		let timeoutId = -1;

		function sendVideoFrame() {
			const video = videoRef.current;
			const canvas = renderCanvasRef.current;

			if (!video || !canvas) return;

			const ctx = canvas.getContext('2d')!;
			canvas.width = video.videoWidth * 0.25;
			canvas.height = video.videoHeight * 0.25;

			if (canvas.width + canvas.height > 0) {
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
				const base64 = canvas.toDataURL('image/jpeg', 1.0);
				const data = base64.slice(base64.indexOf(',') + 1);
				client.sendRealtimeInput([{ mimeType: 'image/jpeg', data }]);
			}

			if (connected) {
				timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5);
			}
		}

		if (connected && activeVideoStream !== null) {
			requestAnimationFrame(sendVideoFrame);
		}

		return () => {
			clearTimeout(timeoutId);
		};
	}, [connected, activeVideoStream, client, videoRef]);

	// Simplified video stream handlers
	const toggleWebcam = async () => {
		if (webcam.isStreaming) {
			webcam.stop();
			setActiveVideoStream(null);
			onVideoStreamChange(null);
		} else {
			const stream = await webcam.start();
			screenCapture.stop();
			setActiveVideoStream(stream);
			onVideoStreamChange(stream);
		}
	};

	const toggleScreenShare = async () => {
		if (screenCapture.isStreaming) {
			screenCapture.stop();
			setActiveVideoStream(null);
			onVideoStreamChange(null);
		} else {
			const stream = await screenCapture.start();
			webcam.stop();
			setActiveVideoStream(stream);
			onVideoStreamChange(stream);
		}
	};

	return (
		<>
			<canvas
				style={{ display: 'none' }}
				ref={renderCanvasRef}
			/>

			{/* Simplified control tray with Tailwind classes */}
			<div className='fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50'>
				<div className='flex items-center space-x-4 bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-700'>
					{/* Microphone Button */}
					<button
						className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
							!muted && connected
								? 'bg-white text-black hover:bg-gray-200'
								: 'bg-gray-700 text-white hover:bg-gray-600'
						}`}
						onClick={() => setMuted(!muted)}
						title={muted ? 'Unmute' : 'Mute'}
						disabled={!connected}>
						<span className='material-symbols-outlined text-lg'>
							{!muted ? 'mic' : 'mic_off'}
						</span>
					</button>

					{supportsVideo && (
						<>
							{/* Camera Button */}
							<button
								className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
									webcam.isStreaming
										? 'bg-white text-black hover:bg-gray-200'
										: 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
								}`}
								onClick={toggleWebcam}
								title={webcam.isStreaming ? 'Stop Camera' : 'Start Camera'}
								disabled={!connected}>
								<span className='material-symbols-outlined text-sm'>
									{webcam.isStreaming ? 'videocam_off' : 'videocam'}
								</span>
							</button>

							{/* Screen Share Button */}
							<button
								className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
									screenCapture.isStreaming
										? 'bg-white text-black hover:bg-gray-200'
										: 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
								}`}
								onClick={toggleScreenShare}
								title={
									screenCapture.isStreaming ? 'Stop Sharing' : 'Share Screen'
								}
								disabled={!connected}>
								<span className='material-symbols-outlined text-sm'>
									{screenCapture.isStreaming
										? 'cancel_presentation'
										: 'present_to_all'}
								</span>
							</button>
						</>
					)}

					{/* Connection Toggle */}
					<button
						className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
							connected
								? 'bg-red-600 text-white hover:bg-red-700'
								: 'bg-green-600 text-white hover:bg-green-700'
						}`}
						onClick={connected ? disconnect : connect}
						title={connected ? 'Disconnect' : 'Connect'}>
						<span className='material-symbols-outlined text-lg'>
							{connected ? 'stop' : 'play_arrow'}
						</span>
					</button>

					{/* Settings Button */}
					{enableEditingSettings && (
						<div className='ml-2'>
							<SettingsDialog />
						</div>
					)}
				</div>
			</div>
		</>
	);
}

export default memo(ControlTray);
