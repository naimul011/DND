/**
 * D&D AI Dungeon Master — Main Game Page (with Isometric 3D World)
 *
 * Architecture:
 *   - IsometricWorld  — Full-screen Three.js isometric RPG background
 *   - useDnDGame      — session state, messaging, turns, scoring
 *   - useDnDVoice     — DM text-to-speech + player speech-to-text
 *   - Overlay UI      — Collapsible glassmorphism panels over the 3D world
 *
 * The Three.js canvas fills the viewport. All UI panels float on top
 * with semi-transparent backgrounds and can be collapsed to reveal the world.
 */

import React, { useCallback, useState, useMemo, useRef } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import useDnDGame from '../src/hooks/useDnDGame';
import useDnDVoice from '../src/hooks/useDnDVoice';
import {
  GameMainMenu,
  PartySetupScreen,
  CharacterCreator,
  MessageBubble,
  DiceRoller,
  DiceRollModal,
  MapDiceOverlay,
  AnimatedTranscript,
  CharacterSheet,
  Scoreboard,
  VoiceControls,
  CollapsiblePanel,
} from '../src/components/dnd';
import type { WorldPlayer, ChatBubble, TokenScreenPosition, CameraControls } from '../src/components/dnd/IsometricWorld';

// Dynamically import Three.js world (no SSR — needs window/document)
const IsometricWorld = dynamic(
  () => import('../src/components/dnd/IsometricWorld'),
  { ssr: false },
);

// ─── Quick Action Templates ──────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { value: 'I attack the enemy with my weapon', label: '⚔️ Attack' },
  { value: 'I cast a spell', label: '🔮 Cast Spell' },
  { value: 'I move towards', label: '➡️ Move' },
  { value: 'I search the area', label: '🔍 Search' },
  { value: 'I dodge to the side', label: '🛡️ Dodge' },
  { value: 'I use my special ability', label: '⚡ Special Ability' },
  { value: 'I interact with', label: '🤝 Interact' },
  { value: 'I wait and observe', label: '👀 Wait' },
];

// ─── Player Colors ───────────────────────────────────────────────────────────

const PLAYER_COLORS = ['#f59e0b', '#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#f97316'];

// ─── Glassmorphism Presets ───────────────────────────────────────────────────

const GLASS_BG = 'rgba(10, 8, 20, 0.75)';
const GLASS_BORDER = 'rgba(139, 92, 246, 0.15)';
const GLASS_BLUR = 'blur(16px)';

// ─── Page Component ──────────────────────────────────────────────────────────

export default function DnDPage() {
  // Voice hook
  const voice = useDnDVoice(useCallback((text: string) => {
    game.appendToInput(text);
  }, [])); // eslint-disable-line react-hooks/exhaustive-deps

  // Game hook
  const game = useDnDGame({
    onBeforeSend: voice.ensureAudioUnlocked,
    onDMResponse: voice.speakDMResponse,
    onStopSpeaking: voice.stopSpeaking,
  });

  // Menu state — show animated menu before setup
  const [showMainMenu, setShowMainMenu] = useState(true);

  // Sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);

  // 3D Dice Modal
  const [diceModalOpen, setDiceModalOpen] = useState(false);

  // Map dice overlay (rolling on the 3D map with camera zoom)
  const [mapDiceNotation, setMapDiceNotation] = useState<string | null>(null);
  const cameraControlsRef = useRef<CameraControls | null>(null);
  const handleCameraControls = useCallback((controls: CameraControls) => {
    cameraControlsRef.current = controls;
  }, []);

  /** Called when a die button is clicked — zoom camera then roll on the map */
  const handleMapDiceClick = useCallback((sides: number) => {
    const notation = `1d${sides}`;
    setMapDiceNotation(notation);
    const playerId = game.currentTurnPlayer?.id || game.session.party[0]?.id;
    if (playerId && cameraControlsRef.current) {
      cameraControlsRef.current.zoomToPlayer(playerId);
    }
  }, [game.currentTurnPlayer, game.session.party]);

  /** Called when the 3D dice on the map settle */
  const handleMapDiceResult = useCallback((text: string, _total: number) => {
    game.handleDiceRoll(text);
  }, [game]);

  /** Called when the result display auto-dismisses */
  const handleMapDiceDone = useCallback(() => {
    cameraControlsRef.current?.zoomBack();
    setMapDiceNotation(null);
  }, []);

  // World ref for projecting 3D positions to screen
  const tokenPositionsRef = useRef<TokenScreenPosition[]>([]);
  const [tokenPositions, setTokenPositions] = useState<TokenScreenPosition[]>([]);

  // Throttled callback from the 3D world (called every frame)
  const frameCountRef = useRef(0);
  const handleTokenPositions = useCallback((positions: TokenScreenPosition[]) => {
    tokenPositionsRef.current = positions;
    // Only update React state every 3 frames to avoid excessive re-renders
    frameCountRef.current++;
    if (frameCountRef.current % 3 === 0) {
      setTokenPositions(positions);
    }
  }, []);

  // Map party members to world tokens
  const worldPlayers: WorldPlayer[] = useMemo(() => {
    return game.session.party.map((member, idx) => ({
      id: member.id,
      name: member.name,
      color: PLAYER_COLORS[idx % PLAYER_COLORS.length],
      x: 5 + idx * 2,
      z: 8,
    }));
  }, [game.session.party]);

  // DM chat bubble — show DM responses above the DM token
  const dmChatBubble: ChatBubble | null = useMemo(() => {
    const messages = game.session.messages;
    if (messages.length === 0) return null;

    // Find the latest DM message
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'dm') {
        return {
          playerId: '__dm__',
          text: msg.content.slice(0, 120),
          speakerName: 'Dungeon Master',
          role: 'dm',
        };
      }
      if (msg.role === 'user') break; // Stop at the first player message going backwards
    }
    return null;
  }, [game.session.messages]);

  // Get screen position for a specific token
  const getTokenPos = useCallback((id: string) => {
    return tokenPositions.find(t => t.id === id);
  }, [tokenPositions]);

  // ─── Main Menu Screen ────────────────────────────────────────────────────

  if (showMainMenu && game.session.party.length === 0) {
    return (
      <>
        <Head><title>D&amp;D - AI Dungeon Master</title></Head>
        <IsometricWorld players={[]} />
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(6px)',
        }}>
          <GameMainMenu
            onStartGame={() => setShowMainMenu(false)}
          />
        </div>
      </>
    );
  }

  // ─── Party Setup Screen ──────────────────────────────────────────────────

  if (game.session.party.length === 0) {
    return (
      <>
        <Head><title>D&amp;D - Party Setup</title></Head>
        <IsometricWorld players={[]} />
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: GLASS_BG,
            backdropFilter: GLASS_BLUR,
            border: `1px solid ${GLASS_BORDER}`,
            borderRadius: '20px',
            maxWidth: '800px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.1)',
          }}>
            <PartySetupScreen
              onComplete={game.handlePartySetupComplete}
              voiceEnabled={voice.voiceEnabled}
              dmVoice={voice.dmVoice}
              voiceSettings={voice.voiceSettings}
              onToggleVoice={voice.toggleVoiceEnabled}
              onVoiceChange={voice.setDmVoice}
              onVoiceSettingsChange={voice.updateVoiceSettings}
            />
          </div>
        </div>

        {/* Floating dice button during setup */}
        <button
          onClick={() => setDiceModalOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 20,
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(99, 60, 200, 0.3))',
            border: '1.5px solid rgba(139, 92, 246, 0.5)',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            transition: 'all 0.2s',
          }}
          title="Open 3D Dice Roller"
        >
          🎲
        </button>

        {/* 3D Dice Modal */}
        <DiceRollModal
          isOpen={diceModalOpen}
          onClose={() => setDiceModalOpen(false)}
          onAccept={() => setDiceModalOpen(false)}
        />
      </>
    );
  }

  // ─── Game Screen ─────────────────────────────────────────────────────────

  return (
    <>
      <Head><title>D&amp;D - {game.session.campaignName}</title></Head>

      {/* 3D World Background */}
      <IsometricWorld
        players={worldPlayers}
        theme={game.session.campaignSetting?.theme}
        chatBubble={dmChatBubble}
        showDMToken={game.session.party.length > 0}
        onTokenPositions={handleTokenPositions}
        onCameraControls={handleCameraControls}
      />

      {/* ─── Floating Input Chathead (above current turn player token) ─── */}
      {!chatOpen && game.currentTurnPlayer && (() => {
        const pos = getTokenPos(game.currentTurnPlayer!.id);
        if (!pos || !pos.visible) return null;
        return (
          <MapInputChathead
            game={game}
            voice={voice}
            screenX={pos.x}
            screenY={pos.y}
          />
        );
      })()}

      {/* ─── Map Dice Roller (always visible at bottom when chat closed) ─── */}
      {!chatOpen && (
        <MapDiceRoller onRoll={game.handleDiceRoll} onDiceClick={handleMapDiceClick} onOpen3DDice={() => setDiceModalOpen(true)} />
      )}

      {/* ─── UI Overlay Layer ─────────────────────────────────────── */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        pointerEvents: 'none',
      }}>
        {/* ─── Sidebar (Left) ───────────────────────────────────── */}
        <div style={{
          width: sidebarOpen ? '260px' : '42px',
          minWidth: sidebarOpen ? '260px' : '42px',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
          position: 'relative',
        }}>
          {/* Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{
              position: 'absolute',
              top: '12px',
              right: sidebarOpen ? '-16px' : '4px',
              zIndex: 20,
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(139, 92, 246, 0.3)',
              backdropFilter: GLASS_BLUR,
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s',
              boxShadow: '0 2px 12px rgba(139, 92, 246, 0.3)',
            }}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>

          {/* Sidebar Content */}
          <div style={{
            flex: 1,
            background: GLASS_BG,
            backdropFilter: GLASS_BLUR,
            borderRight: `1px solid ${GLASS_BORDER}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: sidebarOpen ? 'auto' : 'hidden',
            opacity: sidebarOpen ? 1 : 0,
            transition: 'opacity 0.3s',
          }}>
            <Sidebar game={game} voice={voice} />
          </div>
        </div>

        {/* ─── Main Chat Area (Right) ───────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          pointerEvents: 'none',
        }}>
          {/* Top Bar: Turn Banner (always visible) */}
          <TopBar game={game} chatOpen={chatOpen} setChatOpen={setChatOpen} onOpenDice={() => setDiceModalOpen(true)} />

          {/* Chat Panel */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: chatOpen ? 'auto' : 'none',
            opacity: chatOpen ? 1 : 0,
            transition: 'opacity 0.3s ease',
            margin: '0 8px 8px 8px',
          }}>
            <ChatArea game={game} voice={voice} onDiceClick={handleMapDiceClick} />
          </div>
        </div>
      </div>

      {/* ─── Add Player Modal ──────────────────────────────────── */}
      {game.showAddPlayer && (
        <Modal onClose={() => game.setShowAddPlayer(false)}>
          <CharacterCreator onComplete={game.handleCharacterCreated} />
        </Modal>
      )}

      {/* ─── 3D Dice Roll Modal ────────────────────────────────── */}
      <DiceRollModal
        isOpen={diceModalOpen}
        onClose={() => setDiceModalOpen(false)}
        onAccept={(result) => {
          game.handleDiceRoll(result);
          setDiceModalOpen(false);
        }}
      />

      {/* ─── Map Dice Overlay (rolls on the 3D map with camera zoom) ── */}
      <MapDiceOverlay
        active={!!mapDiceNotation}
        notation={mapDiceNotation}
        onResult={handleMapDiceResult}
        onDone={handleMapDiceDone}
      />
    </>
  );
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────

function TopBar({
  game,
  chatOpen,
  setChatOpen,
  onOpenDice,
}: {
  game: ReturnType<typeof useDnDGame>;
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;
  onOpenDice: () => void;
}) {
  const { session, currentTurnPlayer, isCurrentPlayerTurn, getPlayerColor } = game;

  return (
    <div style={{
      pointerEvents: 'auto',
      margin: '8px 8px 0 8px',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Top Banner — always visible */}
      <div style={{
        padding: '10px 16px',
        background: GLASS_BG,
        backdropFilter: GLASS_BLUR,
        border: `1px solid ${GLASS_BORDER}`,
        borderRadius: chatOpen ? '12px 12px 0 0' : '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        {currentTurnPlayer ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <span style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: getPlayerColor(currentTurnPlayer.id),
              boxShadow: `0 0 10px ${getPlayerColor(currentTurnPlayer.id)}80`,
              animation: 'pulse 1.5s infinite',
            }} />
            <span style={{
              fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.9)',
              fontFamily: "'Cinzel', 'Georgia', serif",
            }}>
              🎲 Round {session.roundNumber} • {currentTurnPlayer.name}&apos;s Turn
            </span>
            {!isCurrentPlayerTurn && (
              <div style={{ fontSize: '11px', color: 'rgba(139, 92, 246, 0.7)', fontStyle: 'italic' }}>
                Waiting for {currentTurnPlayer.name}...
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <span style={{
              fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)',
              fontFamily: "'Cinzel', 'Georgia', serif",
            }}>
              ⚔️ {session.campaignName || 'D&D Adventure'}
            </span>
          </div>
        )}

        {/* 3D Dice Button */}
        <button
          onClick={onOpenDice}
          style={{
            padding: '4px 10px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 146, 60, 0.15))',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.5px',
            transition: 'all 0.2s',
          }}
          title="Open 3D Dice Roller"
        >
          🎲 Dice
        </button>

        {/* Chat Toggle — always visible */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          style={{
            padding: '4px 10px',
            background: chatOpen ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.4)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.5px',
          }}
          title={chatOpen ? 'Minimize chat to see the world' : 'Show chat panel'}
        >
          {chatOpen ? '🗺️ Map' : '💬 Chat'}
        </button>
      </div>

      {/* Score Toast */}
      {game.lastScoreToast && (
        <div className="score-toast" style={{
          padding: '8px 16px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(52, 211, 153, 0.08))',
          backdropFilter: GLASS_BLUR,
          borderBottom: `1px solid ${GLASS_BORDER}`,
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{
            fontSize: '18px', fontWeight: 800,
            background: 'linear-gradient(135deg, #c084fc, #34d399)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            +{game.lastScoreToast.points}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
            {game.lastScoreToast.reason}
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(139, 92, 246, 0.7)', marginLeft: 'auto', fontWeight: 600 }}>
            {game.lastScoreToast.playerName}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ game, voice }: { game: ReturnType<typeof useDnDGame>; voice: ReturnType<typeof useDnDVoice> }) {
  const { session, activeCharacter, currentTurnPlayer, isCurrentPlayerTurn, getPlayerColor, setActiveCharacter, setShowAddPlayer, resetSession } = game;

  return (
    <>
      {/* Ambient sidebar glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '120px',
        background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.08), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Campaign Header */}
      <div style={{ padding: '16px 12px 12px', borderBottom: `1px solid ${GLASS_BORDER}`, position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: '15px', fontWeight: 700,
          fontFamily: "'Cinzel', 'Georgia', serif",
          background: 'linear-gradient(135deg, #c084fc, #818cf8, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '1px',
        }}>
          D&amp;D AI
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '3px', fontStyle: 'italic' }}>
          {session.campaignName}
        </div>
      </div>

      {/* Party List — collapsible */}
      <CollapsiblePanel title="Party" icon="⚔" badge={`${session.party.length}`} defaultExpanded={true}>
        <div style={{ padding: '8px 12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {session.party.map((member) => {
              const isActive = member.id === activeCharacter?.id;
              const isTurnPlayer = member.id === currentTurnPlayer?.id;
              const accent = getPlayerColor(member.id);
              return (
                <button
                  key={member.id}
                  onClick={() => {
                    if (!isCurrentPlayerTurn || isTurnPlayer) setActiveCharacter(member.id);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px',
                    background: isTurnPlayer ? 'rgba(139, 92, 246, 0.15)' : isActive ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                    border: isTurnPlayer ? '2px solid rgba(139, 92, 246, 0.8)' : `1px solid ${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '11px',
                    cursor: 'pointer', textAlign: 'left', position: 'relative',
                    opacity: !isCurrentPlayerTurn || isActive || isTurnPlayer ? 1 : 0.6,
                  }}
                >
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%', background: accent,
                    boxShadow: isTurnPlayer ? `0 0 8px ${accent}` : isActive ? `0 0 0 3px ${accent}33` : 'none',
                    animation: isTurnPlayer ? 'pulse 2s infinite' : 'none',
                  }} />
                  <span style={{ fontWeight: isTurnPlayer ? 700 : 600, flex: 1 }}>{member.name}</span>
                  {isTurnPlayer && (
                    <span style={{ fontSize: '8px', color: 'rgba(139, 92, 246, 0.8)', fontWeight: 600 }}>TURN</span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => setShowAddPlayer(true)}
              style={{
                padding: '5px 8px', background: 'rgba(139, 92, 246, 0.12)',
                border: '1px dashed rgba(139, 92, 246, 0.4)', borderRadius: '8px',
                color: 'rgba(192, 132, 252, 0.8)', fontSize: '11px', cursor: 'pointer',
              }}
            >
              + Add Player
            </button>
          </div>
        </div>
      </CollapsiblePanel>

      {/* Character Sheet — collapsible */}
      {activeCharacter && (
        <CollapsiblePanel title="Character" icon="📜" defaultExpanded={false}>
          <CharacterSheet character={activeCharacter} />
        </CollapsiblePanel>
      )}

      {/* Scoreboard — collapsible */}
      <CollapsiblePanel title="Scoreboard" icon="🏆" defaultExpanded={false}>
        <Scoreboard scores={session.scores} />
      </CollapsiblePanel>

      {/* Voice Controls — collapsible */}
      <CollapsiblePanel title="DM Voice" icon="🔊" defaultExpanded={false}>
        <VoiceControls
          voiceEnabled={voice.voiceEnabled}
          dmVoice={voice.dmVoice}
          voiceSettings={voice.voiceSettings}
          isSpeaking={voice.isSpeaking}
          onToggleVoice={voice.toggleVoiceEnabled}
          onVoiceChange={voice.setDmVoice}
          onSettingsChange={voice.updateVoiceSettings}
          onStopSpeaking={voice.stopSpeaking}
        />
      </CollapsiblePanel>

      {/* New Adventure */}
      <div style={{ padding: '8px 12px', marginTop: 'auto' }}>
        <button
          onClick={() => {
            if (confirm('Start a new adventure? Current progress will be lost.')) resetSession();
          }}
          style={{
            width: '100%', padding: '6px', background: 'rgba(255, 100, 100, 0.1)',
            border: '1px solid rgba(255, 100, 100, 0.2)', borderRadius: '8px',
            color: 'rgba(255, 100, 100, 0.7)', fontSize: '11px', cursor: 'pointer',
          }}
        >
          🗡️ New Adventure
        </button>
      </div>
    </>
  );
}

// ─── Chat Area ───────────────────────────────────────────────────────────────

function ChatArea({ game, voice, onDiceClick }: { game: ReturnType<typeof useDnDGame>; voice: ReturnType<typeof useDnDVoice>; onDiceClick?: (sides: number) => void }) {
  const {
    session, input, setInput, isLoading, activeCharacter, currentTurnPlayer, isCurrentPlayerTurn,
    getPlayerColor, messagesEndRef, inputRef, handleSend, handleKeyDown, handleDiceRoll,
    advanceTurn, setActiveCharacter,
  } = game;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      background: GLASS_BG,
      backdropFilter: GLASS_BLUR,
      border: `1px solid ${GLASS_BORDER}`,
      borderRadius: '0 0 12px 12px',
      overflow: 'hidden',
    }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 0', minHeight: 0,
      }}>
        {session.messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="msg-appear" style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 12px', marginBottom: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', flexShrink: 0, marginRight: '8px', marginTop: '4px',
              boxShadow: '0 2px 12px rgba(139, 92, 246, 0.3)',
            }}>
              🐉
            </div>
            <div style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, rgba(30, 20, 45, 0.9), rgba(20, 15, 35, 0.95))',
              border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '4px 14px 14px 14px',
              boxShadow: '0 2px 20px rgba(0, 0, 0, 0.3)',
            }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
                background: 'linear-gradient(135deg, #c084fc, #a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                textTransform: 'uppercase', display: 'block', marginBottom: '6px',
              }}>
                Dungeon Master
              </span>
              <div className="dm-typing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        borderTop: `1px solid ${GLASS_BORDER}`,
        padding: '10px 12px',
        background: 'rgba(10, 8, 20, 0.4)',
      }}>
        {/* Turn hint */}
        {currentTurnPlayer && session.party.length > 1 && (
          <div style={{
            padding: '6px 10px', background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '8px', marginBottom: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: 'rgba(139, 92, 246, 0.9)', fontSize: '11px',
          }}>
            <span>🎲 <strong>{currentTurnPlayer.name}</strong>&apos;s turn</span>
          </div>
        )}

        <DiceRoller onRoll={handleDiceRoll} onDiceClick={onDiceClick} />

        {/* Live Transcript */}
        {(voice.liveTranscript || voice.isListening) && (
          <div style={{
            padding: '5px 10px', marginTop: '6px',
            background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '8px', fontSize: '11px', color: 'rgba(192, 132, 252, 0.8)',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{
              display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
              background: '#ef4444', animation: 'pulse 1s infinite',
            }} />
            <AnimatedTranscript text={voice.liveTranscript} isActive={voice.isListening} />
          </div>
        )}

        {/* Voice Error */}
        {voice.voiceError && (
          <div style={{
            padding: '5px 10px', marginTop: '6px',
            background: 'rgba(255, 100, 100, 0.08)', border: '1px solid rgba(255, 100, 100, 0.2)',
            borderRadius: '8px', fontSize: '11px', color: 'rgba(255, 100, 100, 0.8)',
          }}>
            {voice.voiceError}
            <button
              onClick={voice.clearVoiceError}
              style={{ marginLeft: '8px', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Input Row */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
          {/* Mic Button */}
          <button
            onClick={voice.toggleMic}
            title={voice.isListening ? 'Stop listening' : 'Speak your action'}
            style={{
              padding: '8px 12px',
              background: voice.isListening ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${voice.isListening ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '10px', color: voice.isListening ? '#ef4444' : 'rgba(255,255,255,0.6)',
              fontSize: '16px', cursor: 'pointer', alignSelf: 'flex-end',
              transition: 'all 0.2s', position: 'relative',
            }}
          >
            {voice.isListening ? '⏹' : '🎤'}
            {voice.isListening && (
              <span style={{
                position: 'absolute', top: '-2px', right: '-2px',
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#ef4444', animation: 'pulse 1s infinite',
              }} />
            )}
          </button>

          {/* Player Selector */}
          {session.party.length > 1 && (
            <select
              value={activeCharacter?.id || ''}
              onChange={e => setActiveCharacter(e.target.value)}
              style={{
                padding: '8px 10px', background: 'rgba(255,255,255,0.05)',
                border: `2px solid ${activeCharacter ? getPlayerColor(activeCharacter.id) : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '10px', color: 'rgba(255,255,255,0.9)', fontSize: '11px',
                cursor: 'pointer', minWidth: '100px', fontWeight: 600, outline: 'none',
              }}
              title="Select which character is speaking"
            >
              {session.party.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.race} {member.class})
                </option>
              ))}
            </select>
          )}

          {/* Quick Actions */}
          <select
            onChange={e => {
              if (e.target.value) {
                setInput((prev: string) => (prev ? prev + ' ' : '') + e.target.value);
                e.target.value = '';
              }
            }}
            style={{
              padding: '8px 10px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
              color: 'rgba(255,255,255,0.7)', fontSize: '11px', cursor: 'pointer', minWidth: '90px',
            }}
            title="Quick action templates"
          >
            <option value="">Quick...</option>
            {QUICK_ACTIONS.map(qa => (
              <option key={qa.value} value={qa.value}>{qa.label}</option>
            ))}
          </select>

          {/* Text Input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={activeCharacter
              ? `What does ${activeCharacter.name} do?`
              : 'What do you do?'}
            rows={2}
            style={{
              flex: 1, minWidth: '150px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
              color: 'rgba(255,255,255,0.9)', fontSize: '13px', resize: 'none',
              outline: 'none', fontFamily: 'inherit', lineHeight: 1.4,
            }}
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              padding: '8px 18px',
              background: input.trim() && !isLoading
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.7), rgba(124, 58, 237, 0.8))'
                : 'rgba(255,255,255,0.04)',
              border: input.trim() && !isLoading
                ? '1px solid rgba(139, 92, 246, 0.5)'
                : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: input.trim() && !isLoading ? 'white' : 'rgba(255,255,255,0.25)',
              fontSize: '13px', fontWeight: 600,
              cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              alignSelf: 'flex-end',
              boxShadow: input.trim() && !isLoading ? '0 2px 12px rgba(139, 92, 246, 0.25)' : 'none',
              letterSpacing: '0.5px',
            }}
          >
            Send ⚔
          </button>

          {/* End Turn */}
          {session.party.length > 1 && (
            <button
              onClick={advanceTurn}
              style={{
                padding: '8px 12px', background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '10px',
                color: 'rgba(192, 132, 252, 0.9)', fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', alignSelf: 'flex-end',
              }}
              title="Advance to next player's turn"
            >
              End Turn →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Map Input Chathead (floating above player token) ────────────────────────

function MapInputChathead({
  game,
  voice,
  screenX,
  screenY,
}: {
  game: ReturnType<typeof useDnDGame>;
  voice: ReturnType<typeof useDnDVoice>;
  screenX: number;
  screenY: number;
}) {
  const { input, setInput, isLoading, activeCharacter, currentTurnPlayer, handleSend, handleKeyDown } = game;
  const [showActions, setShowActions] = useState(false);

  // Position the chathead above the token, clamped to viewport
  const bubbleWidth = 320;
  const left = Math.max(8, Math.min(screenX - bubbleWidth / 2, window.innerWidth - bubbleWidth - 8));
  const top = Math.max(8, screenY - 180);

  return (
    <div style={{
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${bubbleWidth}px`,
      zIndex: 25,
      pointerEvents: 'auto',
      transition: 'left 0.15s ease-out, top 0.15s ease-out',
    }}>
      {/* Speech bubble container */}
      <div style={{
        background: GLASS_BG,
        backdropFilter: GLASS_BLUR,
        border: `1px solid ${GLASS_BORDER}`,
        borderRadius: '14px',
        padding: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(139, 92, 246, 0.15)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px',
          fontSize: '11px', fontWeight: 700, color: 'rgba(192, 132, 252, 0.9)',
          fontFamily: "'Cinzel', 'Georgia', serif",
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: activeCharacter ? game.getPlayerColor(activeCharacter.id) : '#8b5cf6',
            boxShadow: `0 0 6px ${activeCharacter ? game.getPlayerColor(activeCharacter.id) : '#8b5cf6'}80`,
          }} />
          {currentTurnPlayer?.name || 'Your'}&apos;s Turn
        </div>

        {/* Quick Actions Bar */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap',
        }}>
          {QUICK_ACTIONS.slice(0, 4).map(qa => (
            <button
              key={qa.value}
              onClick={() => setInput((prev: string) => (prev ? prev + ' ' : '') + qa.value)}
              style={{
                padding: '3px 8px', fontSize: '10px', fontWeight: 600,
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '6px', color: 'rgba(192, 132, 252, 0.9)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {qa.label}
            </button>
          ))}
          <button
            onClick={() => setShowActions(!showActions)}
            style={{
              padding: '3px 8px', fontSize: '10px', fontWeight: 600,
              background: showActions ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '6px', color: 'rgba(192, 132, 252, 0.8)',
              cursor: 'pointer',
            }}
          >
            {showActions ? '▲' : '▼ More'}
          </button>
        </div>

        {/* Expanded quick actions */}
        {showActions && (
          <div style={{
            display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap',
          }}>
            {QUICK_ACTIONS.slice(4).map(qa => (
              <button
                key={qa.value}
                onClick={() => {
                  setInput((prev: string) => (prev ? prev + ' ' : '') + qa.value);
                  setShowActions(false);
                }}
                style={{
                  padding: '3px 8px', fontSize: '10px', fontWeight: 600,
                  background: 'rgba(139, 92, 246, 0.12)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  borderRadius: '6px', color: 'rgba(192, 132, 252, 0.8)',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {qa.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Row */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {/* Mic */}
          <button
            onClick={voice.toggleMic}
            style={{
              padding: '6px 8px', fontSize: '14px',
              background: voice.isListening ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${voice.isListening ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '8px', color: voice.isListening ? '#ef4444' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            {voice.isListening ? '⏹' : '🎤'}
          </button>

          {/* Text Input */}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown as any}
            placeholder={`What does ${currentTurnPlayer?.name || 'your character'} do?`}
            style={{
              flex: 1, padding: '6px 10px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
              color: 'rgba(255,255,255,0.9)', fontSize: '12px', outline: 'none',
              fontFamily: 'inherit',
            }}
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              padding: '6px 12px',
              background: input.trim() && !isLoading
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.7), rgba(124, 58, 237, 0.8))'
                : 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '8px', color: 'white', fontSize: '11px', fontWeight: 600,
              cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              flexShrink: 0,
            }}
          >
            ⚔
          </button>
        </div>
      </div>

      {/* Tail pointing down to token */}
      <div style={{
        width: 0, height: 0,
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderTop: `10px solid rgba(10, 8, 20, 0.75)`,
        margin: '0 auto',
      }} />
    </div>
  );
}

// ─── Map Dice Roller (floating at bottom of screen) ──────────────────────────

function MapDiceRoller({ onRoll, onDiceClick, onOpen3DDice }: { onRoll: (result: string) => void; onDiceClick?: (sides: number) => void; onOpen3DDice: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 20,
      pointerEvents: 'auto',
    }}>
      <div style={{
        background: GLASS_BG,
        backdropFilter: GLASS_BLUR,
        border: `1px solid ${GLASS_BORDER}`,
        borderRadius: '16px',
        padding: '8px 12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(139, 92, 246, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <DiceRoller onRoll={onRoll} onDiceClick={onDiceClick} />

        {/* Separator */}
        <div style={{
          width: '1px', height: '36px',
          background: 'rgba(255,255,255,0.08)',
          flexShrink: 0,
        }} />

        {/* 3D Dice Button */}
        <button
          onClick={onOpen3DDice}
          style={{
            padding: '8px 14px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(251, 146, 60, 0.15))',
            border: '1.5px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '10px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            boxShadow: '0 2px 10px rgba(245, 158, 11, 0.15)',
          }}
          title="Open 3D Dice Roller"
        >
          🎲 3D
        </button>
      </div>
    </div>
  );
}

// ─── Modal Wrapper ───────────────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: GLASS_BG,
        backdropFilter: GLASS_BLUR,
        border: `1px solid ${GLASS_BORDER}`,
        borderRadius: '16px', width: '90%', maxWidth: '620px', position: 'relative',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.1)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '12px',
            padding: '6px 8px', cursor: 'pointer', zIndex: 10,
          }}
        >
          Close
        </button>
        {children}
      </div>
    </div>
  );
}
