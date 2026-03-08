/**
 * PartySetupScreen - Pre-game screen for campaign configuration and party creation.
 *
 * Three-phase flow:
 *   1. Campaign settings (theme, town, story hook) — using dropdowns
 *   2. Narrator/DM voice settings
 *   3. Party creation (add/remove characters using CharacterCreator)
 *
 * On "Begin Adventure", fires `onComplete(party, campaignSetting)`.
 * Uses Framer Motion for smooth game-style animations.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DnDCharacter,
  CampaignSetting,
  CAMPAIGN_THEMES,
  CAMPAIGN_TOWNS,
  STORY_HOOKS,
} from '../../services/dndService';
import { DMVoice, VoiceSettings, DEFAULT_VOICE_SETTINGS } from '../../services/dndVoiceService';
import CharacterCreator from './CharacterCreator';
import NarratorVoiceSetup from './NarratorVoiceSetup';

interface PartySetupScreenProps {
  onComplete: (party: DnDCharacter[], campaignSetting: CampaignSetting) => void;
  /** Voice state passed in from parent so it persists */
  voiceEnabled?: boolean;
  dmVoice?: DMVoice;
  voiceSettings?: VoiceSettings;
  onToggleVoice?: () => void;
  onVoiceChange?: (voice: DMVoice) => void;
  onVoiceSettingsChange?: (settings: Partial<VoiceSettings>) => void;
}

type SetupStep = 'campaign' | 'voice' | 'party';

const pageVariants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.25 } },
};

const PLAYER_COLORS = ['#f59e0b', '#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#f97316'];

export default function PartySetupScreen({
  onComplete,
  voiceEnabled = true,
  dmVoice = 'aura-orion-en',
  voiceSettings = { ...DEFAULT_VOICE_SETTINGS },
  onToggleVoice,
  onVoiceChange,
  onVoiceSettingsChange,
}: PartySetupScreenProps) {
  const [party, setParty] = useState<DnDCharacter[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>('campaign');
  const [selectedTheme, setSelectedTheme] = useState(CAMPAIGN_THEMES[0].id);
  const [selectedTown, setSelectedTown] = useState(CAMPAIGN_TOWNS[0].id);
  const [selectedHook, setSelectedHook] = useState(STORY_HOOKS[0].id);

  // Local voice state fallbacks (when parent doesn't provide controls)
  const [localVoiceEnabled, setLocalVoiceEnabled] = useState(voiceEnabled);
  const [localDmVoice, setLocalDmVoice] = useState<DMVoice>(dmVoice);
  const [localVoiceSettings, setLocalVoiceSettings] = useState<VoiceSettings>({ ...voiceSettings });

  const toggleVoice = onToggleVoice || (() => setLocalVoiceEnabled(v => !v));
  const changeVoice = onVoiceChange || ((v: DMVoice) => setLocalDmVoice(v));
  const changeSettings = onVoiceSettingsChange || ((s: Partial<VoiceSettings>) => setLocalVoiceSettings(prev => ({ ...prev, ...s })));
  const isVoiceEnabled = onToggleVoice ? voiceEnabled : localVoiceEnabled;
  const currentDmVoice = onVoiceChange ? dmVoice : localDmVoice;
  const currentVoiceSettings = onVoiceSettingsChange ? voiceSettings : localVoiceSettings;

  const handleCharacterCreated = (character: DnDCharacter) => {
    setParty(prev => [...prev, character]);
    setShowCreator(false);
  };

  const removeCharacter = (id: string) => {
    setParty(prev => prev.filter(p => p.id !== id));
  };

  const startGame = () => {
    if (party.length === 0) return;
    setHasStarted(true);
    const setting: CampaignSetting = {
      theme: CAMPAIGN_THEMES.find(t => t.id === selectedTheme)?.label || 'Epic Quest',
      town: CAMPAIGN_TOWNS.find(t => t.id === selectedTown)?.label || 'Thornhaven',
      storyHook: STORY_HOOKS.find(h => h.id === selectedHook)?.label || 'Ruins Exploration',
    };
    setTimeout(() => onComplete(party, setting), 300);
  };

  // Step indicators
  const steps: { key: SetupStep; label: string; icon: string }[] = [
    { key: 'campaign', label: 'Campaign', icon: '⚔️' },
    { key: 'voice', label: 'Narrator', icon: '🎙️' },
    { key: 'party', label: 'Party', icon: '🛡️' },
  ];

  const stepIndex = steps.findIndex(s => s.key === setupStep);

  return (
    <div className="party-setup-root">
      {/* Title + Step Indicator */}
      <div className="party-setup-header">
        <motion.h1
          className="party-setup-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Dungeons &amp; Dragons
        </motion.h1>
        <motion.p
          className="party-setup-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          AI Dungeon Master
        </motion.p>

        {/* Progress Steps */}
        <motion.div
          className="party-setup-steps"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {steps.map((step, i) => (
            <React.Fragment key={step.key}>
              <button
                className={`party-step ${i <= stepIndex ? 'active' : ''} ${step.key === setupStep ? 'current' : ''}`}
                onClick={() => {
                  if (i < stepIndex) setSetupStep(step.key);
                }}
              >
                <span className="party-step-icon">{step.icon}</span>
                <span className="party-step-label">{step.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`party-step-line ${i < stepIndex ? 'filled' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </motion.div>
      </div>

      {/* Step Content */}
      <div className="party-setup-content">
        <AnimatePresence mode="wait">
          {setupStep === 'campaign' && (
            <motion.div
              key="campaign"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="party-setup-step-panel"
            >
              <h2 className="party-setup-section-title">
                <span>⚔️</span> Choose Your Campaign
              </h2>

              {/* Campaign Theme — Dropdown */}
              <div className="party-setup-field">
                <label className="party-setup-label">Campaign Theme</label>
                <select
                  className="party-setup-select"
                  value={selectedTheme}
                  onChange={e => setSelectedTheme(e.target.value)}
                >
                  {CAMPAIGN_THEMES.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.label} — {t.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Starting Town — Dropdown */}
              <div className="party-setup-field">
                <label className="party-setup-label">Starting Town</label>
                <select
                  className="party-setup-select"
                  value={selectedTown}
                  onChange={e => setSelectedTown(e.target.value)}
                >
                  {CAMPAIGN_TOWNS.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.label} — {t.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Story Hook — Dropdown */}
              <div className="party-setup-field">
                <label className="party-setup-label">Story Hook</label>
                <select
                  className="party-setup-select"
                  value={selectedHook}
                  onChange={e => setSelectedHook(e.target.value)}
                >
                  {STORY_HOOKS.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.label} — {h.desc}
                    </option>
                  ))}
                </select>
              </div>

              <motion.button
                className="party-setup-next-btn"
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSetupStep('voice')}
              >
                Next: Narrator Voice →
              </motion.button>
            </motion.div>
          )}

          {setupStep === 'voice' && (
            <motion.div
              key="voice"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="party-setup-step-panel"
            >
              <NarratorVoiceSetup
                voiceEnabled={isVoiceEnabled}
                dmVoice={currentDmVoice}
                voiceSettings={currentVoiceSettings}
                onToggleVoice={toggleVoice}
                onVoiceChange={changeVoice}
                onSettingsChange={changeSettings}
              />

              <div className="party-setup-nav-row">
                <motion.button
                  className="party-setup-back-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSetupStep('campaign')}
                >
                  ← Campaign
                </motion.button>
                <motion.button
                  className="party-setup-next-btn"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSetupStep('party')}
                >
                  Next: Create Party →
                </motion.button>
              </div>
            </motion.div>
          )}

          {setupStep === 'party' && (
            <motion.div
              key="party"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="party-setup-step-panel"
            >
              {/* Summary Chips */}
              <div className="party-setup-summary-chips">
                {[
                  CAMPAIGN_THEMES.find(t => t.id === selectedTheme)?.label,
                  CAMPAIGN_TOWNS.find(t => t.id === selectedTown)?.label,
                  STORY_HOOKS.find(h => h.id === selectedHook)?.label,
                ].map((label, i) => (
                  <span key={i} className="party-setup-chip">
                    {label}
                  </span>
                ))}
                <button
                  className="party-setup-chip-edit"
                  onClick={() => setSetupStep('campaign')}
                >
                  ✎ Change
                </button>
              </div>

              <h2 className="party-setup-section-title">
                <span>🛡️</span> Your Party ({party.length} heroes)
              </h2>

              {/* Party Members */}
              {party.length === 0 ? (
                <div className="party-setup-empty">
                  <p>No characters yet. Create your first party member!</p>
                </div>
              ) : (
                <div className="party-setup-members">
                  {party.map((member, idx) => (
                    <motion.div
                      key={member.id}
                      className="party-member-card"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        borderColor: PLAYER_COLORS[idx % PLAYER_COLORS.length] + '40',
                      }}
                    >
                      <div
                        className="party-member-color-dot"
                        style={{ background: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}
                      />
                      <div className="party-member-info">
                        <div className="party-member-name">{member.name}</div>
                        <div className="party-member-class">{member.race} {member.class}</div>
                        <div className="party-member-stats">
                          HP {member.hp}/{member.maxHp} • AC {member.ac}
                        </div>
                      </div>
                      <button
                        className="party-member-remove"
                        onClick={() => removeCharacter(member.id)}
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Character Creator Toggle */}
              {!showCreator ? (
                <motion.button
                  className="party-setup-add-btn"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreator(true)}
                >
                  + Create Character
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="party-setup-creator-wrap"
                >
                  <CharacterCreator onComplete={handleCharacterCreated} />
                  <button
                    className="party-setup-cancel-creator"
                    onClick={() => setShowCreator(false)}
                  >
                    Cancel
                  </button>
                </motion.div>
              )}

              {/* Bottom Nav */}
              <div className="party-setup-nav-row" style={{ marginTop: '20px' }}>
                <motion.button
                  className="party-setup-back-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSetupStep('voice')}
                >
                  ← Narrator
                </motion.button>
                <motion.button
                  className={`party-setup-start-btn ${party.length === 0 || hasStarted ? 'disabled' : ''}`}
                  whileHover={party.length > 0 && !hasStarted ? { scale: 1.04, boxShadow: '0 0 40px rgba(139, 92, 246, 0.5)' } : {}}
                  whileTap={party.length > 0 && !hasStarted ? { scale: 0.96 } : {}}
                  onClick={startGame}
                  disabled={party.length === 0 || hasStarted}
                >
                  {hasStarted
                    ? '⏳ Loading Adventure...'
                    : `⚔️ Begin Adventure with ${party.length === 1 ? '1 Hero' : `${party.length} Heroes`}`}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
