/**
 * DiceRoller - Animated dice rolling toolbar for D&D gameplay.
 *
 * Features 3D CSS dice faces with tumble animation, shake feedback,
 * glowing result display, and natural-20/natural-1 celebration effects.
 */

import React, { useState, useCallback } from 'react';
import { rollDice } from '../../services/dndService';

interface DiceRollerProps {
  onRoll: (result: string) => void;
  /** When provided, clicking a die calls this instead of doing the internal CSS roll */
  onDiceClick?: (sides: number) => void;
}

const DICE = [
  { sides: 4,  icon: '▲', label: 'd4',  color: '#34d399' },
  { sides: 6,  icon: '⬡', label: 'd6',  color: '#60a5fa' },
  { sides: 8,  icon: '◆', label: 'd8',  color: '#f59e0b' },
  { sides: 10, icon: '⬠', label: 'd10', color: '#fb923c' },
  { sides: 12, icon: '⬡', label: 'd12', color: '#f472b6' },
  { sides: 20, icon: '✦', label: 'd20', color: '#c084fc' },
] as const;

export default function DiceRoller({ onRoll, onDiceClick }: DiceRollerProps) {
  const [rolling, setRolling] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{ sides: number; value: number; text: string } | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleRoll = useCallback((sides: number) => {
    if (rolling !== null) return;

    // If onDiceClick is provided, delegate to parent (map dice flow)
    if (onDiceClick) {
      onDiceClick(sides);
      return;
    }

    setRolling(sides);
    setShowResult(false);

    // Animate for 800ms, then show result
    setTimeout(() => {
      const value = rollDice(sides);
      const text = `d${sides}: **${value}**`;
      setLastResult({ sides, value, text });
      setRolling(null);
      setShowResult(true);
      onRoll(text);

      // Hide result after 4s
      setTimeout(() => setShowResult(false), 4000);
    }, 800);
  }, [rolling, onRoll, onDiceClick]);

  const isNat20 = lastResult?.sides === 20 && lastResult?.value === 20;
  const isNat1 = lastResult?.sides === 20 && lastResult?.value === 1;

  return (
    <div style={{
      padding: '10px 14px',
      background: 'linear-gradient(135deg, rgba(30, 20, 45, 0.6), rgba(20, 15, 35, 0.8))',
      borderRadius: '12px',
      border: '1px solid rgba(139, 92, 246, 0.15)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background shimmer */}
      <div style={{
        position: 'absolute', inset: 0,
        background: rolling !== null
          ? 'linear-gradient(45deg, transparent, rgba(139, 92, 246, 0.08), transparent)'
          : 'none',
        animation: rolling !== null ? 'shimmer 0.5s infinite' : 'none',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', zIndex: 1 }}>
        {/* Label */}
        <span style={{
          color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: 600,
          letterSpacing: '0.5px', marginRight: '2px',
        }}>
          🎲 ROLL
        </span>

        {/* Dice Buttons */}
        {DICE.map(die => {
          const isRolling = rolling === die.sides;
          return (
            <button
              key={die.sides}
              onClick={() => handleRoll(die.sides)}
              disabled={rolling !== null}
              className={isRolling ? 'dice-rolling' : 'dice-btn'}
              style={{
                width: '42px', height: '42px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '1px',
                background: isRolling
                  ? `linear-gradient(135deg, ${die.color}40, ${die.color}20)`
                  : die.sides === 20
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(99, 60, 200, 0.15))'
                    : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isRolling ? die.color : die.sides === 20 ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '10px',
                color: isRolling ? die.color : die.sides === 20 ? '#c084fc' : 'rgba(255,255,255,0.75)',
                cursor: rolling !== null ? 'default' : 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isRolling ? `0 0 15px ${die.color}40` : die.sides === 20 ? '0 2px 8px rgba(139, 92, 246, 0.15)' : 'none',
              }}
            >
              <span style={{ fontSize: '15px', lineHeight: 1 }}>{die.icon}</span>
              <span style={{ fontSize: '9px', fontWeight: 700, opacity: 0.8 }}>{die.label}</span>

              {/* Rolling sparkle overlay */}
              {isRolling && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(circle, ${die.color}20, transparent)`,
                  animation: 'dicePulse 0.3s ease-in-out infinite alternate',
                }} />
              )}
            </button>
          );
        })}

        {/* Separator */}
        <div style={{
          width: '1px', height: '30px', margin: '0 4px',
          background: 'rgba(255,255,255,0.08)',
        }} />

        {/* Result Display */}
        <div style={{
          minWidth: '80px', height: '42px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 12px',
          background: showResult && lastResult
            ? isNat20
              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1))'
              : isNat1
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.1))'
                : 'rgba(139, 92, 246, 0.1)'
            : 'rgba(255,255,255,0.02)',
          border: `1px solid ${
            showResult && lastResult
              ? isNat20 ? 'rgba(251, 191, 36, 0.4)' : isNat1 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(139, 92, 246, 0.2)'
              : 'rgba(255,255,255,0.06)'
          }`,
          borderRadius: '10px',
          transition: 'all 0.3s ease',
        }}>
          {rolling !== null ? (
            <span className="dice-number-spin" style={{
              fontSize: '18px', fontWeight: 800, color: DICE.find(d => d.sides === rolling)?.color || '#c084fc',
              fontFamily: "'Georgia', serif",
            }}>
              ?
            </span>
          ) : showResult && lastResult ? (
            <div className="dice-result-appear" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span style={{
                fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600,
              }}>
                d{lastResult.sides}
              </span>
              <span style={{
                fontSize: '22px', fontWeight: 800,
                fontFamily: "'Georgia', serif",
                color: isNat20 ? '#fbbf24' : isNat1 ? '#ef4444' : '#c084fc',
                textShadow: isNat20
                  ? '0 0 20px rgba(251, 191, 36, 0.6)'
                  : isNat1
                    ? '0 0 20px rgba(239, 68, 68, 0.6)'
                    : '0 0 10px rgba(139, 92, 246, 0.3)',
              }}>
                {lastResult.value}
              </span>
              {isNat20 && <span style={{ fontSize: '14px' }}>🔥</span>}
              {isNat1 && <span style={{ fontSize: '14px' }}>💀</span>}
            </div>
          ) : (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>—</span>
          )}
        </div>
      </div>

      {/* Nat 20 / Nat 1 banner */}
      {showResult && isNat20 && (
        <div className="nat-banner" style={{
          position: 'absolute', top: '-2px', left: '50%', transform: 'translateX(-50%)',
          padding: '2px 12px', borderRadius: '0 0 8px 8px',
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          color: '#1C1C1E', fontSize: '10px', fontWeight: 800, letterSpacing: '1px',
        }}>
          ✨ NATURAL 20! ✨
        </div>
      )}
      {showResult && isNat1 && (
        <div className="nat-banner" style={{
          position: 'absolute', top: '-2px', left: '50%', transform: 'translateX(-50%)',
          padding: '2px 12px', borderRadius: '0 0 8px 8px',
          background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
          color: 'white', fontSize: '10px', fontWeight: 800, letterSpacing: '1px',
        }}>
          💀 CRITICAL FAIL 💀
        </div>
      )}
    </div>
  );
}
