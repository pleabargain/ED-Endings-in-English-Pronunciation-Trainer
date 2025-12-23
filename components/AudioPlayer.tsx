
import React, { useRef, useState } from 'react';
import { geminiService, decodeAudioData } from '../services/geminiService';

interface AudioPlayerProps {
  text: string;
  label?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, label }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handlePlay = async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      
      const audioBytes = await geminiService.speakWord(text);
      if (audioBytes) {
        const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlaying(false);
        source.start();
      } else {
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsPlaying(false);
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={isPlaying}
      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        isPlaying 
          ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed' 
          : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
      }`}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-5 w-5 mr-2 ${isPlaying ? 'animate-pulse' : ''}`} 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
      </svg>
      {label || (isPlaying ? 'Speaking...' : 'Listen')}
    </button>
  );
};
