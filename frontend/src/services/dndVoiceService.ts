/**
 * D&D Voice Service
 * Handles both speech-to-text (player mic) and text-to-speech (DM voice)
 * Uses Deepgram via the backend proxy (no API keys on frontend)
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DMVoice =
  | 'aura-orion-en'    // Male - deep, authoritative (good DM voice)
  | 'aura-arcas-en'    // Male - warm
  | 'aura-perseus-en'  // Male - clear
  | 'aura-asteria-en'  // Female
  | 'aura-luna-en'     // Female
  | 'aura-stella-en';  // Female

export interface VoiceSettings {
  speed: number;          // 0.5 – 2.0 (playback rate)
  volume: number;         // 0.0 – 1.0
  pauseBetweenParagraphs: number; // ms pause between paragraphs (0 = no pause)
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  speed: 0.9,
  volume: 1.0,
  pauseBetweenParagraphs: 800,
};

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
}

// ─── Speech-to-Text (Player Microphone) ──────────────────────────────────────

export class PlayerMicService {
  private websocket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private mediaStream: MediaStream | null = null;
  private isActive = false;
  private currentTranscript = '';

  private onTranscript: (text: string, isFinal: boolean) => void;
  private onUtterance: (text: string) => void;
  private onError: (error: string) => void;
  private onStateChange: (listening: boolean) => void;

  constructor(callbacks: {
    onTranscript: (text: string, isFinal: boolean) => void;
    onUtterance: (text: string) => void;
    onError: (error: string) => void;
    onStateChange: (listening: boolean) => void;
  }) {
    this.onTranscript = callbacks.onTranscript;
    this.onUtterance = callbacks.onUtterance;
    this.onError = callbacks.onError;
    this.onStateChange = callbacks.onStateChange;
  }

  async start(): Promise<boolean> {
    if (this.isActive) return false;

    try {
      // 1. Get mic permission
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      // 2. Get temporary Deepgram token from backend
      const tokenRes = await fetch(`${BACKEND_URL}/api/deepgram/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!tokenRes.ok) {
        throw new Error('Failed to get voice token - check backend DEEPGRAM_API_KEY');
      }

      const { token } = await tokenRes.json();

      // 3. Connect to Deepgram WebSocket with Nova-3
      const wsUrl = 'wss://api.deepgram.com/v1/listen?' + new URLSearchParams({
        model: 'nova-3',
        encoding: 'linear16',
        sample_rate: '16000',
        channels: '1',
        punctuate: 'true',
        interim_results: 'true',
        smart_format: 'true',
        endpointing: '600',
        language: 'en',
      }).toString();

      this.websocket = new WebSocket(wsUrl, ['token', token]);

      this.websocket.onopen = () => {
        this.isActive = true;
        this.onStateChange(true);
        this.startAudioStream();
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch { /* ignore parse errors */ }
      };

      this.websocket.onerror = () => {
        this.onError('Voice connection error');
      };

      this.websocket.onclose = (event) => {
        if (event.code === 4001) this.onError('Invalid voice API key');
        this.isActive = false;
        this.onStateChange(false);
      };

      return true;
    } catch (error: any) {
      this.onError(error.message || 'Failed to start microphone');
      return false;
    }
  }

  private startAudioStream() {
    if (!this.mediaStream) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      this.audioSource = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.audioProcessor.onaudioprocess = (event) => {
        if (this.websocket?.readyState === WebSocket.OPEN) {
          const input = event.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          this.websocket.send(int16.buffer);
        }
      };

      this.audioSource.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);
    } catch {
      this.onError('Failed to process microphone audio');
    }
  }

  private handleMessage(data: any) {
    if (!data.channel?.alternatives?.[0]) return;
    const transcript = data.channel.alternatives[0].transcript;
    if (!transcript?.trim()) return;

    const isFinal = data.is_final || false;
    const speechFinal = data.speech_final || false;

    if (isFinal) {
      this.currentTranscript += transcript + ' ';
    }

    this.onTranscript(transcript, isFinal);

    if (speechFinal && this.currentTranscript.trim()) {
      this.onUtterance(this.currentTranscript.trim());
      this.currentTranscript = '';
    }
  }

  stop() {
    try {
      if (this.audioProcessor) { this.audioProcessor.disconnect(); this.audioProcessor = null; }
      if (this.audioSource) { this.audioSource.disconnect(); this.audioSource = null; }
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close().catch(() => {});
        this.audioContext = null;
      }
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.close();
      }
      this.websocket = null;
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(t => t.stop());
        this.mediaStream = null;
      }
      this.isActive = false;
      this.currentTranscript = '';
      this.onStateChange(false);
    } catch { /* silent */ }
  }

  get running() { return this.isActive; }
}

// ─── Text-to-Speech (DM Voice) ──────────────────────────────────────────────

export class DMVoiceService {
  private currentAudio: HTMLAudioElement | null = null;
  private voice: DMVoice;
  private settings: VoiceSettings;
  private audioUnlocked = false;
  private _isSpeaking = false;
  private _cancelled = false;
  private onStateChange: (speaking: boolean) => void;

  constructor(voice: DMVoice = 'aura-orion-en', onStateChange: (speaking: boolean) => void, settings?: VoiceSettings) {
    this.voice = voice;
    this.settings = settings ?? { ...DEFAULT_VOICE_SETTINGS };
    this.onStateChange = onStateChange;
  }

  updateSettings(s: Partial<VoiceSettings>) {
    this.settings = { ...this.settings, ...s };
    // Apply volume to currently playing audio immediately
    if (this.currentAudio) {
      if (s.volume !== undefined) this.currentAudio.volume = s.volume;
      if (s.speed !== undefined) this.currentAudio.playbackRate = s.speed;
    }
  }

  getSettings(): VoiceSettings { return { ...this.settings }; }

  /** Must be called on a user gesture to satisfy browser autoplay policy */
  async unlock(): Promise<void> {
    if (this.audioUnlocked) return;
    try {
      const silentWav = new Uint8Array([
        0x52,0x49,0x46,0x46, 0x24,0x00,0x00,0x00,
        0x57,0x41,0x56,0x45, 0x66,0x6D,0x74,0x20,
        0x10,0x00,0x00,0x00, 0x01,0x00, 0x01,0x00,
        0x44,0xAC,0x00,0x00, 0x88,0x58,0x01,0x00,
        0x02,0x00, 0x10,0x00, 0x64,0x61,0x74,0x61,
        0x00,0x00,0x00,0x00,
      ]);
      const blob = new Blob([silentWav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      a.volume = 0.01;
      await a.play();
      a.pause();
      URL.revokeObjectURL(url);
      this.audioUnlocked = true;
    } catch {
      this.audioUnlocked = true; // allow attempts anyway
    }
  }

  setVoice(v: DMVoice) { this.voice = v; }

  /**
   * Split text into paragraphs for natural pauses, then speak each one.
   */
  async speak(text: string): Promise<void> {
    if (!text.trim()) return;
    this._cancelled = false;

    // Strip markdown formatting for cleaner speech
    const cleaned = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/[_~`]/g, '')
      .trim();

    // Split into paragraphs (double newline or more)
    const paragraphs = cleaned
      .split(/\n{2,}/)
      .map(p => p.replace(/\n/g, '. ').trim())
      .filter(p => p.length >= 3);

    if (paragraphs.length === 0) return;

    try {
      this._isSpeaking = true;
      this.onStateChange(true);

      for (let i = 0; i < paragraphs.length; i++) {
        if (this._cancelled) break;

        await this.speakParagraph(paragraphs[i]);

        // Pause between paragraphs (not after the last one)
        if (i < paragraphs.length - 1 && this.settings.pauseBetweenParagraphs > 0 && !this._cancelled) {
          await this.wait(this.settings.pauseBetweenParagraphs);
        }
      }
    } catch (error) {
      console.error('[DM Voice] TTS error:', error);
    } finally {
      this._isSpeaking = false;
      this.onStateChange(false);
    }
  }

  private async speakParagraph(text: string): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/deepgram/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: this.voice }),
    });

    if (!response.ok) throw new Error(`TTS failed: ${response.status}`);

    const audioBlob = await response.blob();
    if (audioBlob.size === 0) throw new Error('Empty audio');

    const audioUrl = URL.createObjectURL(audioBlob);
    await this.playAudio(audioUrl);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => {
      const timer = setTimeout(resolve, ms);
      // Allow cancel to interrupt the wait
      const check = setInterval(() => {
        if (this._cancelled) { clearTimeout(timer); clearInterval(check); resolve(); }
      }, 50);
      setTimeout(() => clearInterval(check), ms + 100);
    });
  }

  private playAudio(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop previous audio but don't cancel the full sequence
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio = null;
      }
      const audio = new Audio(url);
      this.currentAudio = audio;
      audio.playbackRate = this.settings.speed;
      audio.volume = this.settings.volume;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        this.currentAudio = null;
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(url);
        this.currentAudio = null;
        reject(e);
      };
      audio.play().catch(reject);
    });
  }

  stop() {
    this._cancelled = true;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this._isSpeaking = false;
    this.onStateChange(false);
  }

  get isSpeaking() { return this._isSpeaking; }
}
