// components/VoiceAssistantProvider.tsx
'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function VoiceAssistantProvider() {
  useEffect(() => {
    // Initialize after component mounts
    const initVoiceAssistant = () => {
      if (typeof window !== 'undefined' && window.VoiceAssistant) {
        window.VoiceAssistant.init({
          backendUrl: 'ws://localhost:8080',
          theme: 'theme-dark',
          position: 'bottom-right',
          voiceName: 'Aoede',
        });

        // Auto-connect
        setTimeout(() => {
          window.VoiceAssistant.connect();
        }, 1000);
      }
    };

    // If already loaded
    if (window.VoiceAssistant) {
      initVoiceAssistant();
    }
  }, []);

  return (
    <>
      <Script
        src='http://localhost:3000/voice-assistant-bundle.min.js'
        strategy='afterInteractive'
        onLoad={() => {
          console.log('Voice Assistant Bundle loaded');
          // Initialize after script loads
          setTimeout(() => {
            if (window.VoiceAssistant) {
              window.VoiceAssistant.init({
                backendUrl: 'ws://localhost:8080',
                theme: 'theme-dark',
                position: 'bottom-right',
                voiceName: 'Aoede',
              });
            }
          }, 100);
        }}
      />
    </>
  );
}
