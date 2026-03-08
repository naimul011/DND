/**
 * useDnDVoice - Manages DM text-to-speech and player microphone input.
 *
 * Encapsulates:
 *   - DMVoiceService lifecycle (init, voice selection, speak, stop)
 *   - PlayerMicService lifecycle (start/stop, transcript streaming)
 *   - Audio unlock on first user gesture (browser autoplay policy)
 *
 * Returns voice state and control functions for the game page.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { PlayerMicService, DMVoiceService, DMVoice, VoiceSettings, DEFAULT_VOICE_SETTINGS } from '../services/dndVoiceService';

export interface DnDVoiceState {
  /** Whether the player mic is active */
  isListening: boolean;
  /** Whether the DM TTS is currently playing */
  isSpeaking: boolean;
  /** Whether DM TTS is enabled */
  voiceEnabled: boolean;
  /** Currently selected DM voice */
  dmVoice: DMVoice;
  /** Current voice settings (speed, volume, pause) */
  voiceSettings: VoiceSettings;
  /** In-progress speech-to-text transcript */
  liveTranscript: string;
  /** Last error from voice services */
  voiceError: string | null;
}

export interface DnDVoiceActions {
  /** Toggle player microphone on/off */
  toggleMic: () => Promise<void>;
  /** Speak text as the DM (if voice enabled) */
  speakDMResponse: (text: string) => Promise<void>;
  /** Stop DM speech immediately */
  stopSpeaking: () => void;
  /** Toggle TTS on/off */
  toggleVoiceEnabled: () => void;
  /** Change the DM voice */
  setDmVoice: (voice: DMVoice) => void;
  /** Update voice settings (speed, volume, pause) */
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  /** Clear voice error */
  clearVoiceError: () => void;
  /** Clear the live transcript */
  clearTranscript: () => void;
  /** Ensure audio is unlocked (call on user gesture) */
  ensureAudioUnlocked: () => Promise<void>;
}

export default function useDnDVoice(
  /** Callback when a final utterance is recognized from the mic */
  onUtterance: (text: string) => void
): DnDVoiceState & DnDVoiceActions {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [dmVoice, setDmVoice] = useState<DMVoice>('aura-orion-en');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({ ...DEFAULT_VOICE_SETTINGS });
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const micServiceRef = useRef<PlayerMicService | null>(null);
  const ttsServiceRef = useRef<DMVoiceService | null>(null);
  const audioUnlockedRef = useRef(false);

  // Initialize TTS service
  useEffect(() => {
    ttsServiceRef.current = new DMVoiceService(dmVoice, (speaking) => {
      setIsSpeaking(speaking);
    }, voiceSettings);
    return () => { ttsServiceRef.current?.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update voice when changed
  useEffect(() => {
    ttsServiceRef.current?.setVoice(dmVoice);
  }, [dmVoice]);

  // Sync voice settings to service
  useEffect(() => {
    ttsServiceRef.current?.updateSettings(voiceSettings);
  }, [voiceSettings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      micServiceRef.current?.stop();
      ttsServiceRef.current?.stop();
    };
  }, []);

  const ensureAudioUnlocked = useCallback(async () => {
    if (!audioUnlockedRef.current && ttsServiceRef.current) {
      await ttsServiceRef.current.unlock();
      audioUnlockedRef.current = true;
    }
  }, []);

  const speakDMResponse = useCallback(async (text: string) => {
    if (!voiceEnabled || !ttsServiceRef.current) return;
    await ttsServiceRef.current.speak(text);
  }, [voiceEnabled]);

  const stopSpeaking = useCallback(() => {
    ttsServiceRef.current?.stop();
  }, []);

  const toggleVoiceEnabled = useCallback(() => {
    setVoiceEnabled(prev => {
      if (prev) ttsServiceRef.current?.stop();
      return !prev;
    });
  }, []);

  const updateVoiceSettings = useCallback((partial: Partial<VoiceSettings>) => {
    setVoiceSettings(prev => {
      const next = { ...prev, ...partial };
      ttsServiceRef.current?.updateSettings(next);
      return next;
    });
  }, []);

  const toggleMic = useCallback(async () => {
    await ensureAudioUnlocked();

    if (isListening && micServiceRef.current) {
      micServiceRef.current.stop();
      micServiceRef.current = null;
      setIsListening(false);
      setLiveTranscript('');
      return;
    }

    setVoiceError(null);

    const mic = new PlayerMicService({
      onTranscript: (text, isFinal) => {
        if (!isFinal) setLiveTranscript(text);
      },
      onUtterance: (text) => {
        onUtterance(text);
        setLiveTranscript('');
      },
      onError: (error) => {
        setVoiceError(error);
        setIsListening(false);
      },
      onStateChange: (listening) => {
        setIsListening(listening);
      },
    });

    micServiceRef.current = mic;
    await mic.start();
  }, [isListening, ensureAudioUnlocked, onUtterance]);

  return {
    // State
    isListening,
    isSpeaking,
    voiceEnabled,
    dmVoice,
    voiceSettings,
    liveTranscript,
    voiceError,
    // Actions
    toggleMic,
    speakDMResponse,
    stopSpeaking,
    toggleVoiceEnabled,
    setDmVoice,
    updateVoiceSettings,
    clearVoiceError: useCallback(() => setVoiceError(null), []),
    clearTranscript: useCallback(() => setLiveTranscript(''), []),
    ensureAudioUnlocked,
  };
}
