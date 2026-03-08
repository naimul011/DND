/**
 * MapDiceOverlay — Transparent 3D dice overlay that rolls directly on the map.
 *
 * When activated, the dice-box canvas overlays the full screen with a fully
 * transparent background. The camera in IsometricWorld zooms to the
 * current player, creating the effect of dice rolling in front of them.
 *
 * Flow: parent passes `notation` (e.g. "1d20") → overlay inits dice-box →
 * rolls → shows result → calls onResult → parent zooms camera back.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  value: number;
}

function normalizeResults(raw: any[]): RollGroupResult[] {
  if (!raw || raw.length === 0) return [];
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
  return Array.from(groups.entries()).map(([, rolls]) => ({
    id: rolls[0].groupId,
    qty: rolls.length,
    sides: rolls[0].sides,
    rolls,
    value: rolls.reduce((s, r) => s + r.value, 0),
  }));
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface MapDiceOverlayProps {
  /** Whether the overlay is active */
  active: boolean;
  /** Dice notation to roll, e.g. "1d20" or "2d6" */
  notation: string | null;
  /** Called with formatted result string and numeric total when dice settle */
  onResult: (text: string, total: number) => void;
  /** Called when the result display auto-dismisses (parent should zoom back) */
  onDone: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MapDiceOverlay({ active, notation, onResult, onDone }: MapDiceOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diceBoxRef = useRef<any>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const rolledRef = useRef(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [results, setResults] = useState<RollGroupResult[] | null>(null);
  const [phase, setPhase] = useState<'init' | 'rolling' | 'result' | 'idle'>('idle');

  // ─── Initialize DiceBox when activated ─────────────────────────────────

  useEffect(() => {
    if (!active || !containerRef.current) return;
    if (diceBoxRef.current || initPromiseRef.current) return;

    let cancelled = false;

    const init = async () => {
      try {
        const DiceBoxModule = await import('@3d-dice/dice-box');
        const DiceBox = DiceBoxModule.default || DiceBoxModule;
        if (cancelled || !containerRef.current) return;

        const box = new DiceBox({
          assetPath: '/assets/dice-box/',
          container: '#map-dice-overlay-container',
          id: 'map-dice-canvas',
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
      } catch (err) {
        console.error('[MapDiceOverlay] Init failed:', err);
      }
    };

    setPhase('init');
    init();

    return () => { cancelled = true; };
  }, [active]);

  // ─── Roll when initialized and notation provided ───────────────────────

  useEffect(() => {
    if (!isInitialized || !notation || !diceBoxRef.current || rolledRef.current) return;
    rolledRef.current = true;
    setPhase('rolling');

    const doRoll = async () => {
      try {
        const raw = await diceBoxRef.current.roll(notation);
        const normalized = normalizeResults(raw);
        setResults(normalized);
        setPhase('result');

        // Format result text
        const parts: string[] = [];
        let grandTotal = 0;
        normalized.forEach((group) => {
          const rolls = group.rolls.map(r => r.value);
          grandTotal += group.value;
          if (rolls.length === 1) {
            parts.push(`d${group.sides}: **${rolls[0]}**`);
          } else {
            parts.push(`${rolls.length}d${group.sides}: **${rolls.join(', ')}** (${group.value})`);
          }
        });

        let resultText: string;
        if (normalized.length === 1 && normalized[0].rolls.length === 1) {
          resultText = parts[0];
        } else {
          resultText = parts.join(' + ') + ` = **${grandTotal}**`;
        }

        onResult(resultText, grandTotal);

        // Auto dismiss after showing result
        setTimeout(() => {
          setPhase('idle');
          onDone();
        }, 2500);
      } catch (err) {
        console.error('[MapDiceOverlay] Roll failed:', err);
        setPhase('idle');
        onDone();
      }
    };

    doRoll();
  }, [isInitialized, notation, onResult, onDone]);

  // ─── Cleanup when deactivated ──────────────────────────────────────────

  useEffect(() => {
    if (!active) {
      if (diceBoxRef.current) {
        try { diceBoxRef.current.clear(); } catch {}
      }
      diceBoxRef.current = null;
      initPromiseRef.current = null;
      rolledRef.current = false;
      setIsInitialized(false);
      setResults(null);
      setPhase('idle');
    }
  }, [active]);

  // ─── Render ────────────────────────────────────────────────────────────

  if (!active) return null;

  const grandTotal = results?.reduce((s, g) => s + g.value, 0) ?? 0;
  const isSingleD20 = results?.length === 1 && results[0].sides === 20 && results[0].rolls.length === 1;
  const isNat20 = isSingleD20 && results![0].rolls[0].value === 20;
  const isNat1 = isSingleD20 && results![0].rolls[0].value === 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      {/* Dice-box canvas container — fully transparent */}
      <div
        id="map-dice-overlay-container"
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          background: 'transparent',
          pointerEvents: 'auto',
        }}
      />

      {/* Result toast at center-top */}
      {phase === 'result' && results && (
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 55,
            pointerEvents: 'none',
            animation: 'dice-result-appear 0.5s ease-out',
          }}
        >
          <div style={{
            padding: '16px 32px',
            background: isNat20
              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.2))'
              : isNat1
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(185, 28, 28, 0.2))'
                : 'linear-gradient(135deg, rgba(10, 8, 20, 0.8), rgba(30, 20, 50, 0.7))',
            border: `2px solid ${
              isNat20 ? 'rgba(251, 191, 36, 0.6)' : isNat1 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(139, 92, 246, 0.4)'
            }`,
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
            textAlign: 'center',
          }}>
            {isNat20 && (
              <div style={{
                fontSize: '22px',
                fontWeight: 900,
                fontFamily: "'Cinzel', 'Georgia', serif",
                color: '#fbbf24',
                textShadow: '0 0 30px rgba(251, 191, 36, 0.8)',
                marginBottom: '4px',
              }}>
                ✨ NATURAL 20! ✨
              </div>
            )}
            {isNat1 && (
              <div style={{
                fontSize: '22px',
                fontWeight: 900,
                fontFamily: "'Cinzel', 'Georgia', serif",
                color: '#ef4444',
                textShadow: '0 0 30px rgba(239, 68, 68, 0.8)',
                marginBottom: '4px',
              }}>
                💀 CRITICAL FAIL 💀
              </div>
            )}

            {/* Die values */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {results.map((group, gi) => (
                <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                    {group.qty > 1 ? `${group.qty}` : ''}d{group.sides}:
                  </span>
                  {group.rolls.map((r, ri) => (
                    <span key={ri} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: r.value === r.sides
                        ? 'rgba(251, 191, 36, 0.25)'
                        : r.value === 1
                          ? 'rgba(239, 68, 68, 0.25)'
                          : 'rgba(139, 92, 246, 0.2)',
                      border: `1.5px solid ${
                        r.value === r.sides ? 'rgba(251, 191, 36, 0.5)'
                          : r.value === 1 ? 'rgba(239, 68, 68, 0.5)'
                            : 'rgba(139, 92, 246, 0.35)'
                      }`,
                      fontSize: '18px',
                      fontWeight: 900,
                      fontFamily: "'Georgia', serif",
                      color: r.value === r.sides ? '#fbbf24' : r.value === 1 ? '#ef4444' : '#c084fc',
                      textShadow: r.value === r.sides
                        ? '0 0 10px rgba(251, 191, 36, 0.5)'
                        : r.value === 1
                          ? '0 0 10px rgba(239, 68, 68, 0.5)'
                          : '0 0 8px rgba(139, 92, 246, 0.3)',
                    }}>
                      {r.value}
                    </span>
                  ))}
                </div>
              ))}

              {/* Total (shown when multiple dice) */}
              {(results.length > 1 || results[0]?.rolls.length > 1) && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px', margin: '0 2px' }}>=</span>
                  <span style={{
                    fontSize: '28px',
                    fontWeight: 900,
                    fontFamily: "'Georgia', serif",
                    color: '#c084fc',
                    textShadow: '0 0 15px rgba(139, 92, 246, 0.5)',
                  }}>
                    {grandTotal}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtle "rolling..." indicator */}
      {phase === 'rolling' && (
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '8px 20px',
          background: 'rgba(10, 8, 20, 0.6)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          backdropFilter: 'blur(8px)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '13px',
          fontFamily: "'Cinzel', 'Georgia', serif",
          letterSpacing: '2px',
          pointerEvents: 'none',
          animation: 'pulse 1.5s infinite',
        }}>
          🎲 Rolling...
        </div>
      )}
    </div>
  );
}
