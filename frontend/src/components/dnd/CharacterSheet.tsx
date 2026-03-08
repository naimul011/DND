/**
 * CharacterSheet - Sidebar panel displaying a character's full stat block.
 *
 * Shows: HP bar, AC/Speed/Prof/HitDie, stat grid, and collapsible sections
 * for features, racial traits, skills, languages, and inventory.
 */

import React, { useState } from 'react';
import { DnDCharacter } from '../../services/dndService';

interface CharacterSheetProps {
  character: DnDCharacter;
}

/** Compute ability modifier string: e.g. 14 → "+2", 8 → "-1" */
function statMod(val: number): string {
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function CharacterSheet({ character }: CharacterSheetProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const hpPercent = (character.hp / character.maxHp) * 100;
  const hpColor = hpPercent > 60 ? '#4CAF7A' : hpPercent > 30 ? '#F5A623' : '#FF6B6B';

  const toggle = (section: string) => setExpanded(prev => (prev === section ? null : section));

  const sectionHeader = (label: string, key: string) => (
    <button
      onClick={() => toggle(key)}
      style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '4px 0', background: 'none', border: 'none', cursor: 'pointer',
        color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600,
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: '9px', color: 'rgba(139,92,246,0.6)' }}>{expanded === key ? '▼' : '▶'}</span>
    </button>
  );

  const STATS: [string, number][] = [
    ['STR', character.str], ['DEX', character.dex], ['CON', character.con],
    ['INT', character.int], ['WIS', character.wis], ['CHA', character.cha],
  ];

  const COLLAPSIBLE_SECTIONS: { key: string; label: string; items: string[] | null; render?: () => React.ReactNode }[] = [
    { key: 'features', label: `Features (${character.features?.length || 0})`, items: character.features },
    { key: 'racialTraits', label: `Racial Traits (${character.racialTraits?.length || 0})`, items: character.racialTraits },
    { key: 'skills', label: `Skills (${character.skills?.length || 0})`, items: character.skills },
    { key: 'languages', label: `Languages (${character.languages?.length || 0})`, items: null, render: () => <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, paddingLeft: '4px' }}>{character.languages.join(', ')}</div> },
    { key: 'inventory', label: `Inventory (${character.inventory.length})`, items: character.inventory },
  ];

  return (
    <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Header */}
      <div style={{
        fontSize: '16px', fontWeight: 700, marginBottom: '2px',
        fontFamily: "'Cinzel', 'Georgia', serif",
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(192, 132, 252, 0.9))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>{character.name}</div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>
        Level {character.level} {character.race} {character.class}
      </div>
      {character.background && (
        <div style={{ fontSize: '11px', color: 'rgba(139,92,246,0.6)', marginBottom: '10px' }}>
          {character.background} Background
        </div>
      )}

      {/* HP Bar */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>HP</span>
          <span style={{ color: hpColor }}>{character.hp}/{character.maxHp}</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${hpPercent}%`, background: hpColor, borderRadius: '3px', transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Quick Stats Row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '11px' }}>
        {[
          { label: 'AC', value: character.ac },
          character.speed ? { label: 'SPD', value: `${character.speed}ft` } : null,
          character.proficiencyBonus ? { label: 'PROF', value: `+${character.proficiencyBonus}` } : null,
          character.hitDie ? { label: 'HIT', value: character.hitDie } : null,
        ].filter(Boolean).map(stat => (
          <div key={stat!.label} style={{ flex: 1, padding: '4px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px' }}>{stat!.label}</div>
            <div style={{ fontWeight: 700 }}>{stat!.value}</div>
          </div>
        ))}
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '10px' }}>
        {STATS.map(([label, val]) => (
          <div key={label} style={{ padding: '5px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{val}</div>
            <div style={{ fontSize: '10px', color: 'rgba(139, 92, 246, 0.7)' }}>{statMod(val)}</div>
          </div>
        ))}
      </div>

      {/* Collapsible Sections */}
      {COLLAPSIBLE_SECTIONS.map(section => {
        const hasItems = section.items ? section.items.length > 0 : section.key === 'inventory';
        if (!hasItems && !section.render) return null;
        return (
          <div key={section.key} style={{ marginBottom: '6px' }}>
            {sectionHeader(section.label, section.key)}
            {expanded === section.key && (
              section.render ? section.render() : (
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, paddingLeft: '4px' }}>
                  {section.items!.map((item, i) => <div key={i}>• {item}</div>)}
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
