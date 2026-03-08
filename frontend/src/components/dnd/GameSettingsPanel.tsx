/**
 * GameSettingsPanel — Game-style settings menu with dropdowns, sliders, and toggles.
 *
 * Organized into collapsible sections: Graphics, Audio, Controls.
 * Uses Framer Motion for smooth animations.
 * All options use dropdowns instead of showing all choices at once.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameSettings } from './GameMainMenu';

interface GameSettingsPanelProps {
  settings: GameSettings;
  onApply: (settings: GameSettings) => void;
  onBack: () => void;
}

type Section = 'graphics' | 'audio' | 'controls';

const sectionConfig: { key: Section; label: string; icon: string }[] = [
  { key: 'graphics', label: 'Graphics', icon: '🖥️' },
  { key: 'audio', label: 'Audio', icon: '🔊' },
  { key: 'controls', label: 'Controls', icon: '🎮' },
];

const RESOLUTIONS = ['1280x720', '1600x900', '1920x1080', '2560x1440', '3840x2160'];
const QUALITY_LEVELS = ['Low', 'Medium', 'High', 'Ultra'];

export default function GameSettingsPanel({
  settings: initialSettings,
  onApply,
  onBack,
}: GameSettingsPanelProps) {
  const [settings, setSettings] = useState<GameSettings>({ ...initialSettings });
  const [openSection, setOpenSection] = useState<Section | null>('audio');

  const update = (key: keyof GameSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleSection = (section: Section) => {
    setOpenSection(prev => (prev === section ? null : section));
  };

  const renderVolumeBar = (value: number) => {
    const filled = Math.round(value / 10);
    const empty = 10 - filled;
    return (
      <span className="settings-volume-bar">
        {'█'.repeat(filled)}
        <span style={{ opacity: 0.2 }}>{'░'.repeat(empty)}</span>
      </span>
    );
  };

  return (
    <div className="settings-panel">
      {/* Header */}
      <div className="settings-header">
        <h2 className="settings-title">Settings</h2>
        <div className="settings-header-line" />
      </div>

      {/* Sections */}
      <div className="settings-sections">
        {sectionConfig.map(({ key, label, icon }) => (
          <div key={key} className="settings-section">
            {/* Section Header (dropdown toggle) */}
            <motion.button
              className={`settings-section-header ${openSection === key ? 'active' : ''}`}
              onClick={() => toggleSection(key)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="settings-section-icon">{icon}</span>
              <span className="settings-section-label">{label}</span>
              <motion.span
                className="settings-section-chevron"
                animate={{ rotate: openSection === key ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▾
              </motion.span>
            </motion.button>

            {/* Section Content */}
            <AnimatePresence>
              {openSection === key && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="settings-section-content">
                    {key === 'graphics' && (
                      <>
                        {/* Resolution */}
                        <div className="settings-row">
                          <label className="settings-label">Resolution</label>
                          <select
                            className="settings-select"
                            value={settings.resolution}
                            onChange={e => update('resolution', e.target.value)}
                          >
                            {RESOLUTIONS.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>

                        {/* Quality */}
                        <div className="settings-row">
                          <label className="settings-label">Quality</label>
                          <select
                            className="settings-select"
                            value={settings.quality}
                            onChange={e => update('quality', e.target.value)}
                          >
                            {QUALITY_LEVELS.map(q => (
                              <option key={q} value={q}>{q}</option>
                            ))}
                          </select>
                        </div>

                        {/* Fullscreen */}
                        <div className="settings-row">
                          <label className="settings-label">Fullscreen</label>
                          <motion.button
                            className={`settings-toggle ${settings.fullscreen ? 'on' : 'off'}`}
                            onClick={() => update('fullscreen', !settings.fullscreen)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {settings.fullscreen ? 'ON' : 'OFF'}
                          </motion.button>
                        </div>

                        {/* Show FPS */}
                        <div className="settings-row">
                          <label className="settings-label">Show FPS</label>
                          <motion.button
                            className={`settings-toggle ${settings.showFPS ? 'on' : 'off'}`}
                            onClick={() => update('showFPS', !settings.showFPS)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {settings.showFPS ? 'ON' : 'OFF'}
                          </motion.button>
                        </div>
                      </>
                    )}

                    {key === 'audio' && (
                      <>
                        {/* Master Volume */}
                        <div className="settings-slider-row">
                          <div className="settings-slider-header">
                            <label className="settings-label">Master Volume</label>
                            <span className="settings-value">{settings.masterVolume}%</span>
                          </div>
                          <div className="settings-slider-container">
                            {renderVolumeBar(settings.masterVolume)}
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={settings.masterVolume}
                              onChange={e => update('masterVolume', parseInt(e.target.value))}
                              className="settings-slider"
                            />
                          </div>
                        </div>

                        {/* Music Volume */}
                        <div className="settings-slider-row">
                          <div className="settings-slider-header">
                            <label className="settings-label">Music Volume</label>
                            <span className="settings-value">{settings.musicVolume}%</span>
                          </div>
                          <div className="settings-slider-container">
                            {renderVolumeBar(settings.musicVolume)}
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={settings.musicVolume}
                              onChange={e => update('musicVolume', parseInt(e.target.value))}
                              className="settings-slider"
                            />
                          </div>
                        </div>

                        {/* SFX Volume */}
                        <div className="settings-slider-row">
                          <div className="settings-slider-header">
                            <label className="settings-label">SFX Volume</label>
                            <span className="settings-value">{settings.sfxVolume}%</span>
                          </div>
                          <div className="settings-slider-container">
                            {renderVolumeBar(settings.sfxVolume)}
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={settings.sfxVolume}
                              onChange={e => update('sfxVolume', parseInt(e.target.value))}
                              className="settings-slider"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {key === 'controls' && (
                      <>
                        {/* Mouse Sensitivity */}
                        <div className="settings-slider-row">
                          <div className="settings-slider-header">
                            <label className="settings-label">Mouse Sensitivity</label>
                            <span className="settings-value">{settings.mouseSensitivity}%</span>
                          </div>
                          <div className="settings-slider-container">
                            {renderVolumeBar(settings.mouseSensitivity)}
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={settings.mouseSensitivity}
                              onChange={e => update('mouseSensitivity', parseInt(e.target.value))}
                              className="settings-slider"
                            />
                          </div>
                        </div>

                        {/* Invert Y Axis */}
                        <div className="settings-row">
                          <label className="settings-label">Invert Y Axis</label>
                          <motion.button
                            className={`settings-toggle ${settings.invertYAxis ? 'on' : 'off'}`}
                            onClick={() => update('invertYAxis', !settings.invertYAxis)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {settings.invertYAxis ? 'ON' : 'OFF'}
                          </motion.button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="settings-actions">
        <motion.button
          className="settings-action-btn settings-apply-btn"
          whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)' }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onApply(settings)}
        >
          Apply
        </motion.button>
        <motion.button
          className="settings-action-btn settings-back-btn"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onBack}
        >
          Back
        </motion.button>
      </div>
    </div>
  );
}
