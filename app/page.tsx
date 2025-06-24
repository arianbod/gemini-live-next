// app/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Loading component
const LoadingComponent = () => (
	<div
		style={{
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			minHeight: '100vh',
			background:
				'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
			color: 'white',
			fontSize: '1.2rem',
			fontFamily: 'Inter, sans-serif',
		}}>
		<div style={{ textAlign: 'center' }}>
			<div
				style={{
					marginBottom: '20px',
					fontSize: '2rem',
				}}>
				🤖
			</div>
			<div>Loading BabaGPT...</div>
		</div>
	</div>
);

// Dynamically import the App component with no SSR since it uses browser APIs
const AppComponent = dynamic(() => import('../components/App'), {
	ssr: false,
	loading: () => <LoadingComponent />,
});

export default function HomePage() {
	return (
		<Suspense fallback={<LoadingComponent />}>
			<AppComponent />
		</Suspense>
	);
}
