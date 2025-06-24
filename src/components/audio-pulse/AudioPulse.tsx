// src/components/audio-pulse/AudioPulse.tsx
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import './audio-pulse.scss';
import React from 'react';
import { useEffect, useRef } from 'react';
import c from 'classnames';

const lineCount = 5;

export type AudioPulseProps = {
	active: boolean;
	volume: number;
	hover?: boolean;
};

export default function AudioPulse({ active, volume, hover }: AudioPulseProps) {
	const lines = useRef<HTMLDivElement[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let timeout: number | null = null;
		const update = () => {
			lines.current.forEach((line, i) => {
				if (line) {
					// Create different height patterns for each bar
					const baseHeight = 4;
					const maxHeight = 28;
					const multiplier = i === 2 ? 1.2 : i === 1 || i === 3 ? 0.8 : 0.6;
					const volumeHeight = Math.min(
						maxHeight,
						baseHeight + volume * 300 * multiplier
					);

					line.style.height = `${volumeHeight}px`;

					// Add color based on volume
					if (volume > 0.5) {
						line.style.background = 'linear-gradient(to top, #ff4757, #ff6b7a)';
					} else if (volume > 0.2) {
						line.style.background = 'linear-gradient(to top, #ffa502, #ffcc02)';
					} else if (volume > 0.05) {
						line.style.background = 'linear-gradient(to top, #3742fa, #5352ed)';
					} else {
						line.style.background = 'linear-gradient(to top, #2ed573, #7bed9f)';
					}
				}
			});

			if (containerRef.current && volume > 0.1) {
				containerRef.current.style.transform = `scale(${1 + volume * 0.1})`;
			} else if (containerRef.current) {
				containerRef.current.style.transform = 'scale(1)';
			}

			timeout = window.setTimeout(update, 100);
		};

		if (active) {
			update();
		} else {
			// Reset to minimal state when inactive
			lines.current.forEach((line) => {
				if (line) {
					line.style.height = '4px';
					line.style.background = 'rgba(255, 255, 255, 0.2)';
				}
			});
			if (containerRef.current) {
				containerRef.current.style.transform = 'scale(1)';
			}
		}

		return () => {
			if (timeout) {
				clearTimeout(timeout);
			}
		};
	}, [volume, active]);

	return (
		<div
			ref={containerRef}
			className={c('audioPulse', { active, hover })}>
			<div className='pulse-background'></div>
			<div className='bars-container'>
				{Array(lineCount)
					.fill(null)
					.map((_, i) => (
						<div
							key={i}
							className={c('audio-bar', `bar-${i}`)}
							ref={(el) => (lines.current[i] = el!)}
							style={{
								animationDelay: `${i * 100}ms`,
								transitionDelay: `${i * 50}ms`,
							}}
						/>
					))}
			</div>
			<div className='pulse-glow'></div>
		</div>
	);
}
