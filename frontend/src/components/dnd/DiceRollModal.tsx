/**
 * DiceRollModal — Full-screen 3D dice rolling modal using @3d-dice/dice-box.
 *
 * Opens as an overlay with a 3D physics-based dice canvas. Users can:
 *   - Select dice types (d4, d6, d8, d10, d12, d20)
 *   - Adjust quantity per die type
 *   - Roll with realistic 3D animation
 *   - See per-die and total results
 *   - Transfer results into the game via onAccept callback
 *
 * Uses BabylonJS + AmmoJS under the hood (from dice-box library).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────

const GLASS_BG = 'rgba(10, 8, 20, 0.85)';
const GLASS_BORDER = 'rgba(139, 92, 246, 0.2)';
const GLASS_BLUR = 'blur(16px)';

const DICE_TYPES = [
  { sides: 4,  icon: '▲', label: 'd4',  color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' },
  { sides: 6,  icon: '⬡', label: 'd6',  color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' },
  { sides: 8,  icon: '◆', label: 'd8',  color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { sides: 10, icon: '⬠', label: 'd10', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)' },
  { sides: 12, icon: '⬡', label: 'd12', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)' },
  { sides: 20, icon: '✦', label: 'd20', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)' },
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface DiceSelection {
  [sides: number]: number; // e.g. { 20: 2, 6: 1 } means 2d20 + 1d6
}

interface DieResult {
  sides: number;
  value: number;
  groupId: number;
  rollId: number;
}

interface RollGroupResult {
  id: number;
  qty: number;
  sides: number;
  rolls: DieResult[];
  value: number; // sum of this group
}

/**
 * Normalize dice-box results into grouped structure.
 * dice-box can return either:
 *   - A flat array of DieResult objects (each die individually)
 *   - A grouped array with .rolls sub-arrays (from parser interface)
 * This function handles both formats.
 */
function normalizeResults(raw: any[]): RollGroupResult[] {
  if (!raw || raw.length === 0) return [];

  // Check if already grouped (has .rolls array)
  if (raw[0] && Array.isArray(raw[0].rolls)) {
    return raw.map((g: any) => ({
      id: g.id ?? g.groupId ?? 0,
      qty: g.qty ?? g.rolls.length,
      sides: g.sides ?? g.rolls[0]?.sides ?? 0,
      rolls: g.rolls.map((r: any) => ({
        sides: r.sides,
        value: r.value,
        groupId: r.groupId ?? g.id ?? 0,
        rollId: r.rollId ?? 0,
      })),
      value: g.value ?? g.rolls.reduce((s: number, r: any) => s + (r.value || 0), 0),
    }));
  }

  // Flat array of individual die results — group by groupId + sides
  const groups = new Map<string, DieResult[]>();
  for (const die of raw) {
    const key = `${die.groupId ?? 0}_${die.sides}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({
      sides: die.sides,
      value: die.value,
      groupId: die.groupId ?? 0,
      rollId: die.rollId ?? 0,
    });
  }

  return Array.from(groups.entries()).map(([key, rolls]) => ({
    id: rolls[0].groupId,
    qty: rolls.length,
    sides: rolls[0].sides,
    rolls,
    value: rolls.reduce((s, r) => s + r.value, 0),
  }));
}

interface DiceRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with formatted result string when user accepts the roll */
  onAccept: (result: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DiceRollModal({ isOpen, onClose, onAccept }: DiceRollModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diceBoxRef = useRef<any>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  const [selection, setSelection] = useState<DiceSelection>({});
  const [isRolling, setIsRolling] = useState(false);
  const [results, setResults] = useState<RollGroupResult[] | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Calculate total count of dice selected
  const totalDice = Object.values(selection).reduce((sum, qty) => sum + qty, 0);

  // ─── Initialize DiceBox ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // Prevent double init
    if (diceBoxRef.current || initPromiseRef.current) return;

    let cancelled = false;

    const initDiceBox = async () => {
      try {
        const DiceBoxModule = await import('@3d-dice/dice-box');
        const DiceBox = DiceBoxModule.default || DiceBoxModule;

        if (cancelled || !containerRef.current) return;

        const box = new DiceBox({
          assetPath: '/assets/dice-box/',
          container: '#dice-roll-canvas-container',
          id: 'dice-roll-canvas',
          gravity: 1,
          mass: 1,
          friction: 0.8,
          restitution: 0,
          angularDamping: 0.5,
          linearDamping: 0.5,
          spinForce: 3,
          throwForce: 3,
          startingHeight: 6,
          settleTimeout: 5000,
          delay: 10,
          scale: 9,
          theme: 'default',
          themeColor: '#ffffff',
          enableShadows: true,
          lightIntensity: 1.5,
        });

        initPromiseRef.current = box.init();
        await initPromiseRef.current;

        if (cancelled) return;

        diceBoxRef.current = box;
        setIsInitialized(true);
      } catch (err: any) {
        console.error('Failed to initialize DiceBox:', err);
        if (!cancelled) {
          setInitError(err?.message || 'Failed to load 3D dice engine');
        }
      }
    };

    initDiceBox();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // ─── Cleanup on close ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen && diceBoxRef.current) {
      try {
        diceBoxRef.current.clear();
      } catch {}
      // Full cleanup — remove canvas and reset refs
      diceBoxRef.current = null;
      initPromiseRef.current = null;
      setIsInitialized(false);
      setResults(null);
      setIsRolling(false);
      setSelection({});
    }
  }, [isOpen]);

  // ─── Dice Selection ────────────────────────────────────────────────────────

  const updateSelection = useCallback((sides: number, delta: number) => {
    setSelection(prev => {
      const current = prev[sides] || 0;
      const next = Math.max(0, Math.min(10, current + delta));
      const copy = { ...prev };
      if (next === 0) {
        delete copy[sides];
      } else {
        copy[sides] = next;
      }
      return copy;
    });
    setResults(null); // Clear previous results when changing selection
  }, []);

  const quickSelect = useCallback((sides: number) => {
    // Quick-tap: if not selected, set to 1. If already selected, increment.
    setSelection(prev => {
      const current = prev[sides] || 0;
      if (current >= 10) return prev;
      return { ...prev, [sides]: current + 1 };
    });
    setResults(null);
  }, []);

  // ─── Roll Dice ─────────────────────────────────────────────────────────────

  const handleRoll = useCallback(async () => {
    if (!diceBoxRef.current || totalDice === 0 || isRolling) return;

    setIsRolling(true);
    setResults(null);

    // Build notation array from selection
    const notations: string[] = [];
    Object.entries(selection).forEach(([sides, qty]) => {
      if (qty > 0) {
        notations.push(`${qty}d${sides}`);
      }
    });

    try {
      const rollResult = await diceBoxRef.current.roll(notations);
      console.log('[DiceBox] raw roll result:', JSON.stringify(rollResult));
      setResults(normalizeResults(rollResult));
    } catch (err) {
      console.error('Roll failed:', err);
    } finally {
      setIsRolling(false);
    }
  }, [selection, totalDice, isRolling]);

  // ─── Quick Roll (single die) ───────────────────────────────────────────────

  const quickRoll = useCallback(async (sides: number) => {
    if (!diceBoxRef.current || isRolling) return;

    setIsRolling(true);
    setResults(null);
    setSelection({ [sides]: 1 });

    try {
      const rollResult = await diceBoxRef.current.roll(`1d${sides}`);
      console.log('[DiceBox] raw quick roll result:', JSON.stringify(rollResult));
      setResults(normalizeResults(rollResult));
    } catch (err) {
      console.error('Roll failed:', err);
    } finally {
      setIsRolling(false);
    }
  }, [isRolling]);

  // ─── Accept Results ────────────────────────────────────────────────────────

  const handleAccept = useCallback(() => {
    if (!results || results.length === 0) return;

    // Format: "2d20: **15, 8** (total: 23)" or "d20: **15**"
    const parts: string[] = [];
    let grandTotal = 0;

    results.forEach((group: RollGroupResult) => {
      const rolls = group.rolls.map((r: DieResult) => r.value);
      const groupSum = group.value;
      grandTotal += groupSum;

      if (rolls.length === 1) {
        parts.push(`d${group.sides}: **${rolls[0]}**`);
      } else {
        parts.push(`${rolls.length}d${group.sides}: **${rolls.join(', ')}** (${groupSum})`);
      }
    });

    let resultText: string;
    if (results.length === 1 && results[0].rolls.length === 1) {
      // Single die roll
      resultText = parts[0];
    } else {
      // Multiple dice or groups
      resultText = parts.join(' + ') + ` = **${grandTotal}**`;
    }

    onAccept(resultText);
    onClose();
  }, [results, onAccept, onClose]);

  // ─── Clear Dice ────────────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    if (diceBoxRef.current) {
      diceBoxRef.current.clear();
    }
    setResults(null);
    setSelection({});
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  // Calculate grand total for display
  const grandTotal = results?.reduce((sum: number, g: RollGroupResult) => sum + g.value, 0) ?? 0;
  const isSingleD20 = results?.length === 1 && results[0].sides === 20 && results[0].rolls.length === 1;
  const isNat20 = isSingleD20 && results![0].rolls[0].value === 20;
  const isNat1 = isSingleD20 && results![0].rolls[0].value === 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'rgba(10, 8, 20, 0.7)',
        borderBottom: `1px solid ${GLASS_BORDER}`,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🎲</span>
          <span style={{
            fontSize: '16px',
            fontWeight: 700,
            fontFamily: "'Cinzel', 'Georgia', serif",
            background: 'linear-gradient(135deg, #c084fc, #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '1px',
          }}>
            DICE ROLLER
          </span>
          {totalDice > 0 && !results && (
            <span style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.4)',
              fontStyle: 'italic',
            }}>
              {Object.entries(selection).map(([s, q]) => `${q}d${s}`).join(' + ')}
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          }}
        >
          ✕
        </button>
      </div>

      {/* ─── 3D Canvas Area ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div
          id="dice-roll-canvas-container"
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            background: 'transparent',
          }}
        />

        {/* Loading overlay */}
        {!isInitialized && !initError && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            background: 'rgba(10, 8, 20, 0.9)',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid rgba(139, 92, 246, 0.2)',
              borderTop: '3px solid #c084fc',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <span style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '13px',
              fontFamily: "'Cinzel', 'Georgia', serif",
            }}>
              Loading 3D Dice Engine...
            </span>
          </div>
        )}

        {/* Error overlay */}
        {initError && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: 'rgba(10, 8, 20, 0.95)',
          }}>
            <span style={{ fontSize: '32px' }}>⚠️</span>
            <span style={{ color: 'rgba(239, 68, 68, 0.8)', fontSize: '14px', textAlign: 'center', maxWidth: '300px' }}>
              {initError}
            </span>
            <button
              onClick={onClose}
              style={{
                padding: '8px 20px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Close
            </button>
          </div>
        )}

        {/* Nat 20 / Nat 1 Celebration Overlay */}
        {isNat20 && (
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 32px',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.2))',
            border: '2px solid rgba(251, 191, 36, 0.6)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
            animation: 'dice-result-appear 0.5s ease-out',
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 900,
              fontFamily: "'Cinzel', 'Georgia', serif",
              color: '#fbbf24',
              textShadow: '0 0 30px rgba(251, 191, 36, 0.8)',
            }}>
              ✨ NATURAL 20! ✨
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(251, 191, 36, 0.8)', marginTop: '4px' }}>
              Critical Hit!
            </div>
          </div>
        )}
        {isNat1 && (
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 32px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(185, 28, 28, 0.2))',
            border: '2px solid rgba(239, 68, 68, 0.6)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
            animation: 'dice-result-appear 0.5s ease-out',
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 900,
              fontFamily: "'Cinzel', 'Georgia', serif",
              color: '#ef4444',
              textShadow: '0 0 30px rgba(239, 68, 68, 0.8)',
            }}>
              💀 CRITICAL FAIL 💀
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(239, 68, 68, 0.8)', marginTop: '4px' }}>
              This won&apos;t end well...
            </div>
          </div>
        )}
      </div>

      {/* ─── Bottom Controls ──────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(10, 8, 20, 0.7)',
        borderTop: `1px solid ${GLASS_BORDER}`,
        backdropFilter: 'blur(12px)',
        padding: '12px 16px',
      }}>
        {/* Results Display (when available) */}
        {results && results.length > 0 && (
          <div style={{
            padding: '10px 16px',
            marginBottom: '12px',
            background: isNat20
              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.08))'
              : isNat1
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.08))'
                : 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(99, 60, 200, 0.06))',
            border: `1px solid ${
              isNat20 ? 'rgba(251, 191, 36, 0.3)' : isNat1 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(139, 92, 246, 0.2)'
            }`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {results.map((group: RollGroupResult, gi: number) => (
                <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: 600,
                  }}>
                    {group.qty}d{group.sides}:
                  </span>
                  {group.rolls.map((r: DieResult, ri: number) => (
                    <span key={ri} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: r.value === r.sides
                        ? 'rgba(251, 191, 36, 0.2)'
                        : r.value === 1
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(139, 92, 246, 0.15)',
                      border: `1px solid ${
                        r.value === r.sides
                          ? 'rgba(251, 191, 36, 0.4)'
                          : r.value === 1
                            ? 'rgba(239, 68, 68, 0.4)'
                            : 'rgba(139, 92, 246, 0.25)'
                      }`,
                      fontSize: '14px',
                      fontWeight: 800,
                      fontFamily: "'Georgia', serif",
                      color: r.value === r.sides
                        ? '#fbbf24'
                        : r.value === 1
                          ? '#ef4444'
                          : '#c084fc',
                    }}>
                      {r.value}
                    </span>
                  ))}
                  {gi < results.length - 1 && (
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>+</span>
                  )}
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                TOTAL
              </span>
              <span style={{
                fontSize: '24px',
                fontWeight: 900,
                fontFamily: "'Georgia', serif",
                color: isNat20 ? '#fbbf24' : isNat1 ? '#ef4444' : '#c084fc',
                textShadow: isNat20
                  ? '0 0 20px rgba(251, 191, 36, 0.5)'
                  : isNat1
                    ? '0 0 20px rgba(239, 68, 68, 0.5)'
                    : '0 0 15px rgba(139, 92, 246, 0.3)',
              }}>
                {grandTotal}
              </span>
            </div>
          </div>
        )}

        {/* Dice Selector Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '10px',
          flexWrap: 'wrap',
        }}>
          <span style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1px',
            marginRight: '4px',
          }}>
            SELECT
          </span>

          {DICE_TYPES.map(die => {
            const qty = selection[die.sides] || 0;
            const isActive = qty > 0;
            return (
              <div key={die.sides} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}>
                {/* Minus button */}
                {isActive && (
                  <button
                    onClick={() => updateSelection(die.sides, -1)}
                    style={{
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '4px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      transition: 'all 0.15s',
                    }}
                  >
                    −
                  </button>
                )}

                {/* Die button */}
                <button
                  onClick={() => quickSelect(die.sides)}
                  onDoubleClick={() => quickRoll(die.sides)}
                  title={`Click: add ${die.label} | Double-click: quick roll 1${die.label}`}
                  style={{
                    width: '52px',
                    height: '52px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    background: isActive
                      ? `linear-gradient(135deg, ${die.color}30, ${die.color}15)`
                      : die.sides === 20
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 60, 200, 0.1))'
                        : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${isActive ? die.color + '80' : die.sides === 20 ? 'rgba(139, 92, 246, 0.35)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px',
                    color: isActive ? die.color : die.sides === 20 ? '#c084fc' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: isActive
                      ? `0 0 15px ${die.color}30, inset 0 0 15px ${die.color}10`
                      : die.sides === 20
                        ? '0 2px 8px rgba(139, 92, 246, 0.1)'
                        : 'none',
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>{die.icon}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.85 }}>{die.label}</span>

                  {/* Quantity badge */}
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: die.color,
                      color: '#000',
                      fontSize: '11px',
                      fontWeight: 800,
                      borderRadius: '50%',
                      boxShadow: `0 0 8px ${die.color}80`,
                    }}>
                      {qty}
                    </span>
                  )}
                </button>

                {/* Plus button */}
                {isActive && (
                  <button
                    onClick={() => updateSelection(die.sides, 1)}
                    disabled={qty >= 10}
                    style={{
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: qty >= 10 ? 'rgba(255,255,255,0.02)' : 'rgba(52, 211, 153, 0.15)',
                      border: `1px solid ${qty >= 10 ? 'rgba(255,255,255,0.05)' : 'rgba(52, 211, 153, 0.3)'}`,
                      borderRadius: '4px',
                      color: qty >= 10 ? 'rgba(255,255,255,0.2)' : '#34d399',
                      cursor: qty >= 10 ? 'default' : 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      transition: 'all 0.15s',
                    }}
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {/* Roll Button */}
          <button
            onClick={handleRoll}
            disabled={totalDice === 0 || isRolling || !isInitialized}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: totalDice === 0 || !isInitialized
                ? 'rgba(255,255,255,0.04)'
                : isRolling
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 60, 200, 0.2))'
                  : 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(99, 60, 200, 0.3))',
              border: `1.5px solid ${
                totalDice === 0 || !isInitialized
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(139, 92, 246, 0.5)'
              }`,
              borderRadius: '12px',
              color: totalDice === 0 || !isInitialized ? 'rgba(255,255,255,0.2)' : 'white',
              cursor: totalDice === 0 || isRolling || !isInitialized ? 'default' : 'pointer',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: "'Cinzel', 'Georgia', serif",
              letterSpacing: '2px',
              transition: 'all 0.2s',
              boxShadow: totalDice > 0 && isInitialized && !isRolling
                ? '0 4px 20px rgba(139, 92, 246, 0.3)'
                : 'none',
            }}
          >
            {isRolling ? '⏳ Rolling...' : totalDice === 0 ? 'Select dice to roll' : `🎲 ROLL ${Object.entries(selection).map(([s, q]) => `${q}d${s}`).join(' + ')}`}
          </button>

          {/* Accept Button (when results available) */}
          {results && results.length > 0 && (
            <button
              onClick={handleAccept}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.3), rgba(16, 185, 129, 0.2))',
                border: '1.5px solid rgba(52, 211, 153, 0.5)',
                borderRadius: '12px',
                color: '#34d399',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: "'Cinzel', 'Georgia', serif",
                letterSpacing: '1px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(52, 211, 153, 0.2)',
                whiteSpace: 'nowrap',
              }}
            >
              ✓ USE RESULT
            </button>
          )}

          {/* Clear Button */}
          {(totalDice > 0 || results) && (
            <button
              onClick={handleClear}
              style={{
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
