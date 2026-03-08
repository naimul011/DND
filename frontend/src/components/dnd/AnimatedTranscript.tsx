/**
 * AnimatedTranscript - Shows live speech-to-text with a "playhead" highlight.
 *
 * Words appear one-by-one with a highlight on the current word, giving users
 * feedback that the microphone is actively transcribing their speech.
 */

import React, { useState, useEffect } from 'react';

interface AnimatedTranscriptProps {
  /** Current transcript text */
  text: string;
  /** Whether the mic is actively listening */
  isActive: boolean;
}

export default function AnimatedTranscript({ text, isActive }: AnimatedTranscriptProps) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => { setActiveIndex(0); }, [text]);

  useEffect(() => {
    if (!isActive || words.length === 0) return;
    const stepMs = Math.max(120, Math.min(240, 200 - words.length));
    const interval = window.setInterval(() => {
      setActiveIndex(prev => (prev < words.length - 1 ? prev + 1 : prev));
    }, stepMs);
    return () => window.clearInterval(interval);
  }, [isActive, words.length, text]);

  if (!text.trim()) return <span>Listening...</span>;

  return (
    <span>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className={index === activeIndex ? 'transcript-word transcript-active' : 'transcript-word'}
        >
          {word}{index < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}
