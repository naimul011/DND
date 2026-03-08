/**
 * useDnDGame - Core game state and logic for the D&D multiplayer session.
 *
 * Manages:
 *   - Session state (party, messages, scores, campaign, turns)
 *   - Character creation → opening narration flow
 *   - Sending player messages → DM AI responses
 *   - Turn advancement (round-robin with round tracking)
 *   - Dice roll logging
 *   - Player action scoring
 *
 * Designed to be composed with useDnDVoice for audio features.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  DnDMessage,
  DnDCharacter,
  DnDSession,
  CampaignSetting,
  PlayerScore,
  createInitialScore,
  scorePlayerAction,
  sendMessageToDM,
  createMessageId,
} from '../services/dndService';

// ─── Initial Session State ───────────────────────────────────────────────────

const INITIAL_SESSION: DnDSession = {
  party: [],
  activeCharacterId: null,
  currentTurnIndex: 0,
  roundNumber: 1,
  messages: [],
  campaignName: 'The Ruins of Thornhaven',
  campaignSetting: { theme: 'Epic Quest', town: 'Thornhaven', storyHook: 'Ruins Exploration' },
  scores: [],
  isActive: false,
};

// ─── Score Toast Type ────────────────────────────────────────────────────────

export interface ScoreToast {
  points: number;
  reason: string;
  playerName: string;
}

// ─── Player Colors ───────────────────────────────────────────────────────────

const PLAYER_COLORS = ['#f59e0b', '#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#f97316'];

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseDnDGameOptions {
  /** Called before sending any message (for audio unlock) */
  onBeforeSend?: () => Promise<void>;
  /** Called with DM response text (for TTS) */
  onDMResponse?: (text: string) => void;
  /** Called to stop DM speech (when player sends) */
  onStopSpeaking?: () => void;
}

export default function useDnDGame(options: UseDnDGameOptions = {}) {
  const { onBeforeSend, onDMResponse, onStopSpeaking } = options;

  const [session, setSession] = useState<DnDSession>(INITIAL_SESSION);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [lastScoreToast, setLastScoreToast] = useState<ScoreToast | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ─── Derived State ──────────────────────────────────────────────────────

  const activeCharacter = session.party.find(p => p.id === session.activeCharacterId) || session.party[0] || null;
  const currentTurnPlayer = session.party[session.currentTurnIndex] || null;
  const isCurrentPlayerTurn = currentTurnPlayer?.id === activeCharacter?.id;

  const getPlayerColor = useCallback((playerId: string) => {
    const index = session.party.findIndex(p => p.id === playerId);
    return PLAYER_COLORS[Math.max(0, index) % PLAYER_COLORS.length];
  }, [session.party]);

  // ─── Auto-select first character ────────────────────────────────────────

  useEffect(() => {
    if (!session.activeCharacterId && session.party.length > 0) {
      setSession(prev => ({ ...prev, activeCharacterId: prev.party[0]?.id || null }));
    }
  }, [session.activeCharacterId, session.party.length]);

  // ─── Auto-scroll ────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [session.messages, scrollToBottom]);

  // ─── Turn System ────────────────────────────────────────────────────────

  const advanceTurn = useCallback(() => {
    setSession(prev => ({
      ...prev,
      currentTurnIndex: (prev.currentTurnIndex + 1) % Math.max(prev.party.length, 1),
      roundNumber: prev.currentTurnIndex + 1 >= prev.party.length ? prev.roundNumber + 1 : prev.roundNumber,
      activeCharacterId: prev.party[(prev.currentTurnIndex + 1) % Math.max(prev.party.length, 1)]?.id || null,
    }));
  }, []);

  // ─── Character Created → Start Adventure ────────────────────────────────

  const handleCharacterCreated = useCallback(async (character: DnDCharacter) => {
    await onBeforeSend?.();
    setShowAddPlayer(false);

    const isFirstPlayer = session.party.length === 0;

    setSession(prev => {
      const nextParty = [...prev.party, character];
      const nextScores = [...prev.scores, createInitialScore(character.id, character.name)];
      const nextMessages = isFirstPlayer
        ? [{
            id: createMessageId(),
            role: 'system' as const,
            content: `${character.name} the ${character.race} ${character.class} (${character.background}) begins their adventure...`,
            timestamp: new Date(),
          }]
        : [
            ...prev.messages,
            {
              id: createMessageId(),
              role: 'system' as const,
              content: `${character.name} joins the party.`,
              timestamp: new Date(),
            },
          ];
      return {
        ...prev,
        party: nextParty,
        scores: nextScores,
        activeCharacterId: prev.activeCharacterId ?? character.id,
        isActive: true,
        messages: nextMessages,
      };
    });

    if (isFirstPlayer) {
      setIsLoading(true);
      const dmResponse = await sendMessageToDM(
        [], [character], character.id,
        session.campaignSetting, character.name, true
      );
      setSession(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: createMessageId(), role: 'dm' as const, content: dmResponse, timestamp: new Date() },
        ],
      }));
      setIsLoading(false);
      onDMResponse?.(dmResponse);
    }
  }, [onBeforeSend, onDMResponse, session.party.length, session.campaignSetting]);

  // ─── Send Player Message ────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !activeCharacter) return;
    await onBeforeSend?.();
    onStopSpeaking?.();

    // Score the action
    const scoring = scorePlayerAction(input.trim());
    if (scoring.points > 0) {
      setSession(prev => ({
        ...prev,
        scores: prev.scores.map(s => {
          if (s.playerId !== activeCharacter.id) return s;
          const updated = { ...s };
          const key = `${scoring.category}Points` as keyof PlayerScore;
          (updated[key] as number) = (updated[key] as number) + scoring.points;
          updated.totalPoints += scoring.points;
          return updated;
        }),
      }));
      if (scoring.reason) {
        setLastScoreToast({ points: scoring.points, reason: scoring.reason, playerName: activeCharacter.name });
        setTimeout(() => setLastScoreToast(null), 3000);
      }
    }

    const playerMessage: DnDMessage = {
      id: createMessageId(),
      role: 'user',
      content: input.trim(),
      speakerId: activeCharacter.id,
      speakerName: activeCharacter.name,
      timestamp: new Date(),
    };

    const updatedMessages = [...session.messages, playerMessage];
    setSession(prev => ({ ...prev, messages: updatedMessages }));
    setInput('');
    setIsLoading(true);

    const contextMessages = updatedMessages.filter(m => m.role !== 'system');
    const nextTurnIndex = (session.currentTurnIndex + 1) % Math.max(session.party.length, 1);
    const nextTurnPlayer = session.party[nextTurnIndex];

    const dmResponse = await sendMessageToDM(
      contextMessages, session.party, activeCharacter.id,
      session.campaignSetting, nextTurnPlayer?.name || null, false
    );

    setSession(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        { id: createMessageId(), role: 'dm', content: dmResponse, timestamp: new Date() },
      ],
    }));

    setIsLoading(false);
    inputRef.current?.focus();
    onDMResponse?.(dmResponse);

    // Advance turn after DM responds
    setTimeout(() => advanceTurn(), 1000);
  }, [input, isLoading, session, activeCharacter, onBeforeSend, onDMResponse, onStopSpeaking, advanceTurn]);

  // ─── Dice Roll ──────────────────────────────────────────────────────────

  const handleDiceRoll = useCallback((result: string) => {
    if (!activeCharacter) return;
    setSession(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: createMessageId(),
          role: 'user' as const,
          content: `🎲 ${result.replace(/\*\*/g, '')}`,
          speakerId: activeCharacter.id,
          speakerName: activeCharacter.name,
          timestamp: new Date(),
        },
      ],
    }));
  }, [activeCharacter]);

  // ─── Keyboard ───────────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ─── Party Setup Complete ───────────────────────────────────────────────

  const handlePartySetupComplete = useCallback(async (party: DnDCharacter[], campaignSetting: CampaignSetting) => {
    await onBeforeSend?.();

    const firstChar = party[0];
    const initialScores = party.map(p => createInitialScore(p.id, p.name));

    // Set everything in one atomic update to avoid race conditions
    setSession(prev => ({
      ...prev,
      campaignSetting,
      campaignName: `${campaignSetting.storyHook} in ${campaignSetting.town}`,
      party,
      scores: initialScores,
      activeCharacterId: firstChar?.id || null,
      currentTurnIndex: 0,
      roundNumber: 1,
      isActive: true,
      messages: firstChar
        ? [{
            id: createMessageId(),
            role: 'system' as const,
            content: `${firstChar.name} the ${firstChar.race} ${firstChar.class} (${firstChar.background}) begins their adventure...`,
            timestamp: new Date(),
          }]
        : [],
    }));

    // Send opening DM narration for the first character
    if (firstChar) {
      setIsLoading(true);
      const dmResponse = await sendMessageToDM(
        [], party, firstChar.id,
        campaignSetting, firstChar.name, true
      );
      setSession(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: createMessageId(), role: 'dm' as const, content: dmResponse, timestamp: new Date() },
        ],
      }));
      setIsLoading(false);
      onDMResponse?.(dmResponse);
    }
  }, [onBeforeSend, onDMResponse]);

  // ─── Select Active Character ────────────────────────────────────────────

  const setActiveCharacter = useCallback((characterId: string) => {
    setSession(prev => ({ ...prev, activeCharacterId: characterId }));
  }, []);

  // ─── New Adventure ──────────────────────────────────────────────────────

  const resetSession = useCallback(() => {
    setSession(INITIAL_SESSION);
  }, []);

  // ─── Append Text to Input (for voice) ───────────────────────────────────

  const appendToInput = useCallback((text: string) => {
    setInput(prev => (prev ? prev + ' ' + text : text));
  }, []);

  return {
    // Session state
    session,
    input,
    setInput,
    isLoading,
    showAddPlayer,
    setShowAddPlayer,
    lastScoreToast,

    // Derived state
    activeCharacter,
    currentTurnPlayer,
    isCurrentPlayerTurn,
    getPlayerColor,

    // Refs (for the page to attach to DOM)
    messagesEndRef,
    inputRef,

    // Actions
    handleSend,
    handleKeyDown,
    handleDiceRoll,
    handleCharacterCreated,
    handlePartySetupComplete,
    advanceTurn,
    setActiveCharacter,
    resetSession,
    appendToInput,
  };
}
