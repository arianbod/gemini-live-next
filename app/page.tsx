// app/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Simple loading component
const LoadingComponent = () => (
	<div className='w-full h-screen bg-black flex items-center justify-center'>
		<div className='text-center'>
			<div className='w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
			<div className='text-white text-sm'>Loading...</div>
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
