/**
 * VoiceControls - Sidebar widget for DM text-to-speech settings.
 *
 * Allows toggling TTS on/off, selecting a DM voice, adjusting speed,
 * volume, and paragraph pause duration. Also shows speaking indicator.
 */

import React, { useState } from 'react';
import { DMVoice, VoiceSettings } from '../../services/dndVoiceService';

interface VoiceControlsProps {
  voiceEnabled: boolean;
  dmVoice: DMVoice;
  voiceSettings: VoiceSettings;
  isSpeaking: boolean;
  onToggleVoice: () => void;
  onVoiceChange: (voice: DMVoice) => void;
  onSettingsChange: (settings: Partial<VoiceSettings>) => void;
  onStopSpeaking: () => void;
}

const VOICE_OPTIONS: { value: DMVoice; label: string; desc: string }[] = [
  { value: 'aura-orion-en',   label: 'Orion',   desc: 'Male \u2022 deep & authoritative' },
  { value: 'aura-arcas-en',   label: 'Arcas',   desc: 'Male \u2022 warm & friendly' },
  { value: 'aura-perseus-en', label: 'Perseus', desc: 'Male \u2022 clear & crisp' },
  { value: 'aura-asteria-en', label: 'Asteria', desc: 'Female \u2022 confident' },
  { value: 'aura-luna-en',    label: 'Luna',    desc: 'Female \u2022 calm & gentle' },
  { value: 'aura-stella-en',  label: 'Stella',  desc: 'Female \u2022 expressive' },
];

const SPEED_PRESETS = [
  { value: 0.6, label: 'Slow' },
  { value: 0.8, label: 'Relaxed' },
  { value: 1.0, label: 'Normal' },
  { value: 1.2, label: 'Brisk' },
  { value: 1.5, label: 'Fast' },
];

const PAUSE_PRESETS = [
  { value: 0, label: 'None' },
  { value: 400, label: 'Short' },
  { value: 800, label: 'Medium' },
  { value: 1500, label: 'Long' },
  { value: 2500, label: 'Dramatic' },
];

export default function VoiceControls({
  voiceEnabled, dmVoice, voiceSettings, isSpeaking,
  onToggleVoice, onVoiceChange, onSettingsChange, onStopSpeaking,
}: VoiceControlsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div style={{
        fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>DM Voice</span>
        {voiceEnabled && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              background: 'none', border: 'none', color: 'rgba(139, 92, 246, 0.7)',
              fontSize: '10px', cursor: 'pointer', padding: 0,
            }}
          >
            {expanded ? '\u25B2 Less' : '\u2699 Settings'}
          </button>
        )}
      </div>

      {/* TTS Toggle */}
      <button
        onClick={onToggleVoice}
        style={{
          width: '100%', padding: '6px 10px',
          background: voiceEnabled ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${voiceEnabled ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '6px',
          color: voiceEnabled ? 'rgba(192, 132, 252, 0.9)' : 'rgba(255,255,255,0.4)',
          fontSize: '12px', cursor: 'pointer', marginBottom: '8px', textAlign: 'left',
        }}
      >
        {voiceEnabled ? '\uD83D\uDD0A DM Voice ON' : '\uD83D\uDD07 DM Voice OFF'}
      </button>

      {voiceEnabled && (
        <>
          {/* Voice Selector - always visible */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>Narrator Voice</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {VOICE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onVoiceChange(opt.value)}
                  style={{
                    padding: '5px 8px',
                    background: dmVoice === opt.value ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${dmVoice === opt.value ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '5px', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '11px', color: dmVoice === opt.value ? 'rgba(192, 132, 252, 0.95)' : 'rgba(255,255,255,0.65)', fontWeight: dmVoice === opt.value ? 600 : 400 }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Expanded Settings */}
          {expanded && (
            <div style={{
              padding: '8px', background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              {/* Speed */}
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>\uD83C\uDFC3 Speed</span>
                  <span style={{ color: 'rgba(139, 92, 246, 0.8)' }}>{voiceSettings.speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5" max="1.8" step="0.1"
                  value={voiceSettings.speed}
                  onChange={e => onSettingsChange({ speed: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer', height: '4px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>
                  {SPEED_PRESETS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => onSettingsChange({ speed: p.value })}
                      style={{
                        background: Math.abs(voiceSettings.speed - p.value) < 0.05 ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${Math.abs(voiceSettings.speed - p.value) < 0.05 ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '3px', padding: '2px 4px', cursor: 'pointer',
                        color: Math.abs(voiceSettings.speed - p.value) < 0.05 ? 'rgba(192, 132, 252, 0.9)' : 'rgba(255,255,255,0.35)',
                        fontSize: '9px',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume */}
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{voiceSettings.volume === 0 ? '\uD83D\uDD07' : voiceSettings.volume < 0.4 ? '\uD83D\uDD08' : voiceSettings.volume < 0.7 ? '\uD83D\uDD09' : '\uD83D\uDD0A'} Volume</span>
                  <span style={{ color: 'rgba(139, 92, 246, 0.8)' }}>{Math.round(voiceSettings.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0" max="1" step="0.05"
                  value={voiceSettings.volume}
                  onChange={e => onSettingsChange({ volume: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer', height: '4px' }}
                />
              </div>

              {/* Paragraph Pause */}
              <div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>\u23F8 Paragraph Pauses</span>
                  <span style={{ color: 'rgba(139, 92, 246, 0.8)' }}>
                    {voiceSettings.pauseBetweenParagraphs === 0 ? 'Off' : `${(voiceSettings.pauseBetweenParagraphs / 1000).toFixed(1)}s`}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                  {PAUSE_PRESETS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => onSettingsChange({ pauseBetweenParagraphs: p.value })}
                      style={{
                        flex: 1, minWidth: '40px',
                        padding: '4px 6px',
                        background: voiceSettings.pauseBetweenParagraphs === p.value ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${voiceSettings.pauseBetweenParagraphs === p.value ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '4px', cursor: 'pointer', textAlign: 'center',
                        color: voiceSettings.pauseBetweenParagraphs === p.value ? 'rgba(192, 132, 252, 0.9)' : 'rgba(255,255,255,0.35)',
                        fontSize: '9px', fontWeight: voiceSettings.pauseBetweenParagraphs === p.value ? 600 : 400,
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '4px', lineHeight: 1.3 }}>
                  The DM pauses between paragraphs for dramatic effect
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div style={{
          marginTop: '6px', fontSize: '11px', color: 'rgba(139, 92, 246, 0.8)',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <span style={{
            display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
            background: '#8b5cf6', animation: 'pulse 1s infinite',
          }} />
          DM speaking...
          <button
            onClick={onStopSpeaking}
            style={{
              marginLeft: 'auto', padding: '2px 6px',
              background: 'rgba(255,100,100,0.15)', border: '1px solid rgba(255,100,100,0.3)',
              borderRadius: '4px', color: 'rgba(255,100,100,0.8)', fontSize: '10px', cursor: 'pointer',
            }}
          >
            Stop
          </button>
        </div>
      )}
    </div>
  );
}
