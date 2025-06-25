// types.ts
import { LiveClientToolResponse, Part } from '@google/genai';

/**
 * the options to initiate the client - now with backend URL instead of API key
 */
export type LiveClientOptions = {
	backendUrl: string; // WebSocket URL to our backend
};

/** log types */
export type StreamingLog = {
	date: Date;
	type: string;
	count?: number;
	message:
		| string
		| ClientContentLog
		| any // Simplified since we're proxying through backend
		| LiveClientToolResponse;
};

export type ClientContentLog = {
	turns: Part[];
	turnComplete: boolean;
};
