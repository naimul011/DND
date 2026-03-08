/**
 * CharacterCreator - Multi-step wizard for creating a D&D 5e character.
 *
 * Steps: Name → Race → Class → Background → Stats (with racial bonuses).
 * On completion, calls `onComplete` with a fully-built DnDCharacter object.
 *
 * Uses data from dndService (RACES, CLASSES, BACKGROUNDS, RACE_DATA, CLASS_DATA).
 */

import React, { useState } from 'react';
import {
  DnDCharacter,
  RACES,
  CLASSES,
  RACE_DATA,
  CLASS_DATA,
  BACKGROUNDS,
  generateStats,
  applyRacialBonuses,
  createCharacter,
} from '../../services/dndService';

interface CharacterCreatorProps {
  onComplete: (character: DnDCharacter) => void;
}

/** Compute ability modifier string: e.g. 14 → "+2", 8 → "-1" */
function statMod(val: number): string {
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function CharacterCreator({ onComplete }: CharacterCreatorProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [race, setRace] = useState(RACES[0]);
  const [charClass, setCharClass] = useState(CLASSES[0]);
  const [background, setBackground] = useState(BACKGROUNDS[0].name);
  const [stats, setStats] = useState(generateStats());

  const rerollStats = () => setStats(generateStats());

  const finish = () => {
    if (!name.trim()) return;
    const character = createCharacter(name.trim(), race, charClass, background, stats);
    setName('');
    setRace(RACES[0]);
    setCharClass(CLASSES[0]);
    setBackground(BACKGROUNDS[0].name);
    setStats(generateStats());
    setStep(0);
    onComplete(character);
  };

  const raceData = RACE_DATA[race];
  const classData = CLASS_DATA[charClass];
  const bgData = BACKGROUNDS.find(b => b.name === background) || BACKGROUNDS[0];
  const finalStats = applyRacialBonuses(stats, race);

  // ─── Shared Styles ───────────────────────────────────────────────────────

  const chipStyle = (selected: boolean) => ({
    padding: '6px 14px',
    background: selected ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${selected ? 'rgba(139, 92, 246, 0.7)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.85)',
    cursor: 'pointer',
    fontSize: '13px',
  });

  const infoBoxStyle: React.CSSProperties = {
    padding: '10px 12px',
    background: 'rgba(139, 92, 246, 0.08)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '8px',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.5,
    marginTop: '12px',
  };

  const backBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    cursor: 'pointer',
  };

  const nextBtnStyle: React.CSSProperties = {
    flex: 2,
    padding: '12px',
    background: 'rgba(139, 92, 246, 0.6)',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  };

  // ─── Steps ──────────────────────────────────────────────────────────────

  const STEP_LABELS = ['Name', 'Race', 'Class', 'Background', 'Stats'];

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <h1 style={{
        fontSize: '28px', fontWeight: 700, textAlign: 'center', marginBottom: '4px',
        background: 'linear-gradient(135deg, #c084fc, #818cf8)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        Dungeons &amp; Dragons
      </h1>
      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '24px' }}>
        AI Dungeon Master &bull; Character Builder
      </p>

      {/* Step Indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
        {STEP_LABELS.map((label, i) => (
          <div key={label} style={{
            padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
            background: i === step ? 'rgba(139, 92, 246, 0.5)' : i < step ? 'rgba(76, 175, 122, 0.3)' : 'rgba(255,255,255,0.06)',
            color: i <= step ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
            border: `1px solid ${i === step ? 'rgba(139, 92, 246, 0.7)' : 'rgba(255,255,255,0.08)'}`,
          }}>
            {i < step ? '✓ ' : ''}{label}
          </div>
        ))}
      </div>

      {/* Step 0: Name */}
      {step === 0 && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'rgba(255,255,255,0.85)' }}>
            Name Your Hero
          </h2>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Enter character name..." autoFocus
            onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(1)}
            style={{
              width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px',
              color: 'rgba(255,255,255,0.9)', fontSize: '16px', outline: 'none', marginBottom: '16px',
            }}
          />
          <button
            onClick={() => name.trim() && setStep(1)} disabled={!name.trim()}
            style={{
              width: '100%', padding: '12px', borderRadius: '10px', border: 'none', fontSize: '15px', fontWeight: 600,
              background: name.trim() ? 'rgba(139, 92, 246, 0.6)' : 'rgba(255,255,255,0.05)',
              color: name.trim() ? 'white' : 'rgba(255,255,255,0.3)',
              cursor: name.trim() ? 'pointer' : 'default',
            }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 1: Race */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Choose Race</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {RACES.map(r => (
              <button key={r} onClick={() => setRace(r)} style={chipStyle(race === r)}>{r}</button>
            ))}
          </div>
          <div style={infoBoxStyle}>
            <div style={{ fontWeight: 600, color: 'rgba(192, 132, 252, 0.9)', marginBottom: '6px', fontSize: '13px' }}>{raceData.name}</div>
            <div><strong>Ability Bonuses:</strong> {Object.entries(raceData.abilityBonuses).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(', ')}</div>
            <div><strong>Speed:</strong> {raceData.speed} ft</div>
            <div><strong>Size:</strong> {raceData.size}</div>
            <div><strong>Traits:</strong> {raceData.traits.join(', ')}</div>
            <div><strong>Languages:</strong> {raceData.languages.join(', ')}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => setStep(0)} style={backBtnStyle}>Back</button>
            <button onClick={() => setStep(2)} style={nextBtnStyle}>Choose Class →</button>
          </div>
        </div>
      )}

      {/* Step 2: Class */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Choose Class</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {CLASSES.map(c => (
              <button key={c} onClick={() => setCharClass(c)} style={chipStyle(charClass === c)}>{c}</button>
            ))}
          </div>
          <div style={infoBoxStyle}>
            <div style={{ fontWeight: 600, color: 'rgba(192, 132, 252, 0.9)', marginBottom: '6px', fontSize: '13px' }}>{classData.name}</div>
            <div><strong>Hit Die:</strong> d{classData.hitDie} &nbsp;|&nbsp; <strong>Primary:</strong> {classData.primaryAbility}</div>
            <div><strong>Saving Throws:</strong> {classData.savingThrows.join(', ')}</div>
            <div><strong>Armor:</strong> {classData.armorProf.length > 0 ? classData.armorProf.join(', ') : 'None'}</div>
            <div><strong>Weapons:</strong> {classData.weaponProf.join(', ')}</div>
            <div><strong>Level 1 Features:</strong> {classData.features.join(', ')}</div>
            {classData.spellcaster && <div style={{ color: 'rgba(139, 92, 246, 0.8)', marginTop: '4px' }}>✨ Spellcaster</div>}
          </div>
          <div style={{ ...infoBoxStyle, marginTop: '8px' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Starting Equipment</div>
            {classData.startingEquipment.map((item, i) => <div key={i}>• {item}</div>)}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => setStep(1)} style={backBtnStyle}>Back</button>
            <button onClick={() => setStep(3)} style={nextBtnStyle}>Choose Background →</button>
          </div>
        </div>
      )}

      {/* Step 3: Background */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Choose Background</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {BACKGROUNDS.map(bg => (
              <button key={bg.name} onClick={() => setBackground(bg.name)} style={chipStyle(background === bg.name)}>{bg.name}</button>
            ))}
          </div>
          <div style={infoBoxStyle}>
            <div style={{ fontWeight: 600, color: 'rgba(192, 132, 252, 0.9)', marginBottom: '6px', fontSize: '13px' }}>{bgData.name}</div>
            <div><strong>Skill Proficiencies:</strong> {bgData.skillProfs.join(', ')}</div>
            {bgData.toolProfs.length > 0 && <div><strong>Tool Proficiencies:</strong> {bgData.toolProfs.join(', ')}</div>}
            {bgData.languages > 0 && <div><strong>Extra Languages:</strong> {bgData.languages}</div>}
            <div><strong>Feature:</strong> {bgData.feature}</div>
            <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'rgba(255,255,255,0.4)' }}>{bgData.personalityTraits.join(' • ')}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => setStep(2)} style={backBtnStyle}>Back</button>
            <button onClick={() => setStep(4)} style={nextBtnStyle}>Roll Stats →</button>
          </div>
        </div>
      )}

      {/* Step 4: Stats (with racial bonuses) */}
      {step === 4 && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
            {name} the {race} {charClass}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '16px' }}>
            Ability Scores (4d6 drop lowest) + Racial Bonuses
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {([
              ['STR', stats.str, finalStats.str, raceData.abilityBonuses.str || 0],
              ['DEX', stats.dex, finalStats.dex, raceData.abilityBonuses.dex || 0],
              ['CON', stats.con, finalStats.con, raceData.abilityBonuses.con || 0],
              ['INT', stats.int, finalStats.int, raceData.abilityBonuses.int || 0],
              ['WIS', stats.wis, finalStats.wis, raceData.abilityBonuses.wis || 0],
              ['CHA', stats.cha, finalStats.cha, raceData.abilityBonuses.cha || 0],
            ] as [string, number, number, number][]).map(([label, base, total, bonus]) => (
              <div key={label} style={{
                padding: '12px', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>{total}</div>
                <div style={{ fontSize: '12px', color: 'rgba(139, 92, 246, 0.8)' }}>{statMod(total)}</div>
                {bonus > 0 && (
                  <div style={{ fontSize: '10px', color: 'rgba(76, 175, 122, 0.8)', marginTop: '2px' }}>
                    {base} + {bonus} ({race})
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Character Summary */}
          <div style={infoBoxStyle}>
            <div style={{ fontWeight: 600, marginBottom: '4px', color: 'rgba(192, 132, 252, 0.9)' }}>Character Summary</div>
            <div>HP: {classData.hitDie + Math.floor((finalStats.con - 10) / 2)} | AC: {10 + Math.floor((finalStats.dex - 10) / 2)} | Hit Die: d{classData.hitDie}</div>
            <div>Background: {background} | Skills: {bgData.skillProfs.join(', ')}</div>
            <div>Features: {classData.features.join(', ')}, {bgData.feature}</div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={rerollStats} style={backBtnStyle}>Reroll</button>
            <button onClick={() => setStep(3)} style={backBtnStyle}>Back</button>
            <button onClick={finish} style={nextBtnStyle}>Create Character ✓</button>
          </div>
        </div>
      )}
    </div>
  );
}
