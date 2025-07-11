// contexts/LiveAPIContext.tsx
'use client';

import { createContext, FC, ReactNode, useContext } from 'react';
import { useLiveAPI, UseLiveAPIResults } from '@/hooks/use-live-api';
import { LiveClientOptions } from '../types';

const LiveAPIContext = createContext<UseLiveAPIResults | undefined>(undefined);

export type LiveAPIProviderProps = {
	children: ReactNode;
	options: LiveClientOptions; // Backend URL options
};

export const LiveAPIProvider: FC<LiveAPIProviderProps> = ({
	options,
	children,
}) => {
	const liveAPI = useLiveAPI(options);

	return (
		<LiveAPIContext.Provider value={liveAPI}>
			{children}
		</LiveAPIContext.Provider>
	);
};

export const useLiveAPIContext = () => {
	const context = useContext(LiveAPIContext);
	if (!context) {
		throw new Error('useLiveAPIContext must be used within a LiveAPIProvider');
	}
	return context;
};
