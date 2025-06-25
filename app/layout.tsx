// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: 'Voice Assistant',
	description: 'Minimal AI Voice Assistant',
	keywords: ['AI', 'Assistant', 'Voice', 'Chat'],
	authors: [{ name: 'Your Name' }],
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en'>
			<head>
				<link
					href='https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
					rel='stylesheet'
				/>
			</head>
			<body className='bg-black text-white overflow-hidden'>{children}</body>
		</html>
	);
}
