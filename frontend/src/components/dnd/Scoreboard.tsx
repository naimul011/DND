/**
 * Scoreboard - Sidebar widget showing player scores across categories.
 *
 * Displays each player's RP, Combat, Exploration, and Teamwork points
 * sorted by total, with colored category bars.
 */

import React from 'react';
import { PlayerScore } from '../../services/dndService';

interface ScoreboardProps {
  scores: PlayerScore[];
}

const CATEGORIES = [
  { label: 'RP', key: 'roleplayPoints' as const, color: '#c084fc' },
  { label: 'CBT', key: 'combatPoints' as const, color: '#f87171' },
  { label: 'EXP', key: 'explorationPoints' as const, color: '#34d399' },
  { label: 'TM', key: 'teamworkPoints' as const, color: '#60a5fa' },
];

export default function Scoreboard({ scores }: ScoreboardProps) {
  if (scores.length === 0) return null;

  const sorted = scores
    .slice()
    .sort((a, b) => {
      const totalA = a.roleplayPoints + a.combatPoints + a.explorationPoints + a.teamworkPoints;
      const totalB = b.roleplayPoints + b.combatPoints + b.explorationPoints + b.teamworkPoints;
      return totalB - totalA;
    });

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(139, 92, 246, 0.08)' }}>
      <div style={{
        fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '1px',
      }}>
        🏆 Scoreboard
      </div>
      {sorted.map(score => {
        const total = score.roleplayPoints + score.combatPoints + score.explorationPoints + score.teamworkPoints;
        return (
          <div key={score.playerId} style={{
            marginBottom: '8px', padding: '6px 8px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '6px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                {score.playerName}
              </span>
              <span style={{
                fontSize: '13px', fontWeight: 700,
                background: 'linear-gradient(135deg, #c084fc, #818cf8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {total} pts
              </span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {CATEGORIES.map(cat => {
                const val = score[cat.key];
                return (
                  <div key={cat.label} style={{
                    flex: 1, textAlign: 'center', padding: '2px', borderRadius: '3px',
                    background: val > 0 ? `${cat.color}15` : 'rgba(255,255,255,0.02)',
                  }}>
                    <div style={{ fontSize: '8px', color: val > 0 ? cat.color : 'rgba(255,255,255,0.2)' }}>{cat.label}</div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: val > 0 ? cat.color : 'rgba(255,255,255,0.15)' }}>{val}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
