/**
 * NarratorVoiceSetup — Pre-game voice settings for the Dungeon Master / Narrator.
 *
 * Allows choosing DM voice, speed, volume, and paragraph pause
 * BEFORE starting the game, using dropdown-based controls.
 * Uses Framer Motion for smooth game-feel animations.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DMVoice, VoiceSettings, DEFAULT_VOICE_SETTINGS } from '../../services/dndVoiceService';

interface NarratorVoiceSetupProps {
  voiceEnabled: boolean;
  dmVoice: DMVoice;
  voiceSettings: VoiceSettings;
  onToggleVoice: () => void;
  onVoiceChange: (voice: DMVoice) => void;
  onSettingsChange: (settings: Partial<VoiceSettings>) => void;
  /** Optional: called to preview/test the voice */
  onPreview?: () => void;
}

const VOICE_OPTIONS: { value: DMVoice; label: string; desc: string; gender: string }[] = [
  { value: 'aura-orion-en',   label: 'Orion',   desc: 'Deep & authoritative',  gender: '♂' },
  { value: 'aura-arcas-en',   label: 'Arcas',   desc: 'Warm & friendly',       gender: '♂' },
  { value: 'aura-perseus-en', label: 'Perseus', desc: 'Clear & crisp',         gender: '♂' },
  { value: 'aura-asteria-en', label: 'Asteria', desc: 'Confident & bold',      gender: '♀' },
  { value: 'aura-luna-en',    label: 'Luna',    desc: 'Calm & gentle',         gender: '♀' },
  { value: 'aura-stella-en',  label: 'Stella',  desc: 'Expressive & vibrant',  gender: '♀' },
];

const SPEED_OPTIONS = [
  { value: 0.6, label: 'Slow' },
  { value: 0.8, label: 'Relaxed' },
  { value: 1.0, label: 'Normal' },
  { value: 1.2, label: 'Brisk' },
  { value: 1.5, label: 'Fast' },
];

const PAUSE_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 400, label: 'Short' },
  { value: 800, label: 'Medium' },
  { value: 1500, label: 'Long' },
  { value: 2500, label: 'Dramatic' },
];

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut', staggerChildren: 0.08 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export default function NarratorVoiceSetup({
  voiceEnabled,
  dmVoice,
  voiceSettings,
  onToggleVoice,
  onVoiceChange,
  onSettingsChange,
  onPreview,
}: NarratorVoiceSetupProps) {
  const [expanded, setExpanded] = useState(true);

  const currentVoice = VOICE_OPTIONS.find(v => v.value === dmVoice);
  const currentSpeed = SPEED_OPTIONS.find(s => Math.abs(s.value - voiceSettings.speed) < 0.05);
  const currentPause = PAUSE_OPTIONS.find(p => p.value === voiceSettings.pauseBetweenParagraphs);

  return (
    <motion.div
      className="narrator-setup"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Section Header */}
      <motion.div
        className="narrator-setup-header"
        variants={rowVariants}
      >
        <div className="narrator-setup-header-left">
          <span className="narrator-setup-icon">🎙️</span>
          <div>
            <h3 className="narrator-setup-title">Narrator Voice</h3>
            <p className="narrator-setup-subtitle">
              Choose how your Dungeon Master sounds
            </p>
          </div>
        </div>
        <motion.button
          className={`narrator-toggle ${voiceEnabled ? 'on' : 'off'}`}
          onClick={onToggleVoice}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="narrator-toggle-indicator" />
          <span>{voiceEnabled ? 'ON' : 'OFF'}</span>
        </motion.button>
      </motion.div>

      {/* Voice Settings (collapsed when disabled) */}
      <AnimatePresence>
        {voiceEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="narrator-setup-body">
              {/* Voice Selection */}
              <motion.div className="narrator-row" variants={rowVariants}>
                <label className="narrator-label">Voice</label>
                <div className="narrator-control-group">
                  <select
                    className="narrator-select"
                    value={dmVoice}
                    onChange={e => onVoiceChange(e.target.value as DMVoice)}
                  >
                    {VOICE_OPTIONS.map(v => (
                      <option key={v.value} value={v.value}>
                        {v.gender} {v.label} — {v.desc}
                      </option>
                    ))}
                  </select>
                  {onPreview && (
                    <motion.button
                      className="narrator-preview-btn"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onPreview}
                      title="Preview voice"
                    >
                      ▶
                    </motion.button>
                  )}
                </div>
              </motion.div>

              {/* Speed */}
              <motion.div className="narrator-row" variants={rowVariants}>
                <label className="narrator-label">
                  Speed
                  <span className="narrator-label-value">
                    {currentSpeed?.label || `${voiceSettings.speed.toFixed(1)}x`}
                  </span>
                </label>
                <div className="narrator-slider-wrap">
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.1"
                    value={voiceSettings.speed}
                    onChange={e => onSettingsChange({ speed: parseFloat(e.target.value) })}
                    className="narrator-slider"
                  />
                  <div className="narrator-slider-labels">
                    {SPEED_OPTIONS.map(s => (
                      <button
                        key={s.value}
                        className={`narrator-speed-chip ${Math.abs(voiceSettings.speed - s.value) < 0.05 ? 'active' : ''}`}
                        onClick={() => onSettingsChange({ speed: s.value })}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Volume */}
              <motion.div className="narrator-row" variants={rowVariants}>
                <label className="narrator-label">
                  Volume
                  <span className="narrator-label-value">{Math.round(voiceSettings.volume * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={voiceSettings.volume}
                  onChange={e => onSettingsChange({ volume: parseFloat(e.target.value) })}
                  className="narrator-slider"
                />
              </motion.div>

              {/* Paragraph Pause */}
              <motion.div className="narrator-row" variants={rowVariants}>
                <label className="narrator-label">Dramatic Pauses</label>
                <select
                  className="narrator-select"
                  value={voiceSettings.pauseBetweenParagraphs}
                  onChange={e => onSettingsChange({ pauseBetweenParagraphs: parseInt(e.target.value) })}
                >
                  {PAUSE_OPTIONS.map(p => (
                    <option key={p.value} value={p.value}>
                      {p.label}{p.value > 0 ? ` (${(p.value / 1000).toFixed(1)}s)` : ''}
                    </option>
                  ))}
                </select>
              </motion.div>

              {/* Info */}
              <motion.p className="narrator-hint" variants={rowVariants}>
                The narrator will read DM responses aloud during gameplay. You can change these settings later from the sidebar.
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
