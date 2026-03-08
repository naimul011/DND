/**
 * GameMainMenu — Full-screen animated main menu with AAA game feel.
 *
 * Uses Framer Motion for smooth hover/tap/entrance animations.
 * Shows: Title, Start Game, Settings, Credits buttons.
 * Emits callbacks for each menu action.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameSettingsPanel from './GameSettingsPanel';

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  resolution: string;
  quality: string;
  fullscreen: boolean;
  mouseSensitivity: number;
  invertYAxis: boolean;
  showFPS: boolean;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  masterVolume: 80,
  musicVolume: 60,
  sfxVolume: 80,
  resolution: '1920x1080',
  quality: 'High',
  fullscreen: false,
  mouseSensitivity: 50,
  invertYAxis: false,
  showFPS: false,
};

interface GameMainMenuProps {
  onStartGame: () => void;
  onSettings?: (settings: GameSettings) => void;
}

// Stagger children animation
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.6 },
  },
  exit: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 14 },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: -60, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 80, damping: 12, delay: 0.1 },
  },
  exit: { opacity: 0, y: -40, transition: { duration: 0.3 } },
};

const subtitleVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.4, duration: 0.6, ease: 'easeOut' },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export default function GameMainMenu({ onStartGame, onSettings }: GameMainMenuProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_GAME_SETTINGS });
  const [showCredits, setShowCredits] = useState(false);

  const handleApplySettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    onSettings?.(newSettings);
    setShowSettings(false);
  };

  return (
    <div className="game-menu-root">
      {/* Animated background particles */}
      <div className="game-menu-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="game-menu-particle"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.6, 0],
              y: [0, -200 - Math.random() * 300],
              x: [0, (Math.random() - 0.5) * 100],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              bottom: `${Math.random() * 30}%`,
              left: `${10 + Math.random() * 80}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              borderRadius: '50%',
              background: `rgba(${139 + Math.random() * 50}, ${92 + Math.random() * 40}, 246, ${0.3 + Math.random() * 0.5})`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>

      {/* Ambient top light */}
      <div className="game-menu-ambient" />

      <AnimatePresence mode="wait">
        {showSettings ? (
          <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'relative',
              zIndex: 10,
              width: '100%',
              maxWidth: '540px',
              padding: '0 16px',
            }}
          >
            <GameSettingsPanel
              settings={settings}
              onApply={handleApplySettings}
              onBack={() => setShowSettings(false)}
            />
          </motion.div>
        ) : showCredits ? (
          <motion.div
            key="credits"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'relative',
              zIndex: 10,
              textAlign: 'center',
              maxWidth: '500px',
              padding: '0 16px',
            }}
          >
            <div className="game-menu-credits-panel">
              <h2 className="game-menu-credits-title">Credits</h2>
              <div className="game-menu-credits-content">
                <p className="game-menu-credits-role">Dungeon Master AI</p>
                <p className="game-menu-credits-name">Powered by Groq LLM</p>
                <div className="game-menu-credits-divider" />
                <p className="game-menu-credits-role">Voice Narration</p>
                <p className="game-menu-credits-name">Deepgram Aura</p>
                <div className="game-menu-credits-divider" />
                <p className="game-menu-credits-role">3D World Engine</p>
                <p className="game-menu-credits-name">Three.js + React</p>
                <div className="game-menu-credits-divider" />
                <p className="game-menu-credits-role">Interface</p>
                <p className="game-menu-credits-name">Next.js + Framer Motion</p>
              </div>
              <motion.button
                className="game-menu-back-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCredits(false)}
              >
                Back
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="main"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '0 16px',
            }}
          >
            {/* Title */}
            <motion.div variants={titleVariants} style={{ textAlign: 'center', marginBottom: '4px' }}>
              <h1 className="game-menu-title">
                Dungeons & Dragons
              </h1>
              <div className="game-menu-title-underline" />
            </motion.div>

            <motion.p variants={subtitleVariants} className="game-menu-subtitle">
              AI Dungeon Master
            </motion.p>

            {/* Menu Buttons */}
            <motion.div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                maxWidth: '340px',
                marginTop: '24px',
              }}
            >
              <motion.button
                variants={itemVariants}
                whileHover={{
                  scale: 1.04,
                  boxShadow: '0 0 40px rgba(139, 92, 246, 0.5), 0 8px 32px rgba(0,0,0,0.4)',
                }}
                whileTap={{ scale: 0.96 }}
                className="game-menu-btn game-menu-btn-primary"
                onClick={onStartGame}
              >
                <span className="game-menu-btn-icon">⚔️</span>
                <span>Start Adventure</span>
                <span className="game-menu-btn-arrow">→</span>
              </motion.button>

              <motion.button
                variants={itemVariants}
                whileHover={{
                  scale: 1.04,
                  boxShadow: '0 0 30px rgba(139, 92, 246, 0.3), 0 6px 24px rgba(0,0,0,0.3)',
                }}
                whileTap={{ scale: 0.96 }}
                className="game-menu-btn game-menu-btn-secondary"
                onClick={() => setShowSettings(true)}
              >
                <span className="game-menu-btn-icon">⚙️</span>
                <span>Settings</span>
              </motion.button>

              <motion.button
                variants={itemVariants}
                whileHover={{
                  scale: 1.04,
                  boxShadow: '0 0 30px rgba(139, 92, 246, 0.3), 0 6px 24px rgba(0,0,0,0.3)',
                }}
                whileTap={{ scale: 0.96 }}
                className="game-menu-btn game-menu-btn-secondary"
                onClick={() => setShowCredits(true)}
              >
                <span className="game-menu-btn-icon">📜</span>
                <span>Credits</span>
              </motion.button>
            </motion.div>

            {/* Bottom hint */}
            <motion.p
              variants={itemVariants}
              className="game-menu-hint"
            >
              Press Start to begin your quest
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
