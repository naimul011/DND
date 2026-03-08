/**
 * PartySetupScreen - Pre-game screen for campaign configuration and party creation.
 *
 * Two-phase flow:
 *   1. Campaign settings (theme, town, story hook)
 *   2. Party creation (add/remove characters using CharacterCreator)
 *
 * On "Begin Adventure", fires `onComplete(party, campaignSetting)`.
 */

import React, { useState } from 'react';
import {
  DnDCharacter,
  CampaignSetting,
  CAMPAIGN_THEMES,
  CAMPAIGN_TOWNS,
  STORY_HOOKS,
} from '../../services/dndService';
import CharacterCreator from './CharacterCreator';

interface PartySetupScreenProps {
  onComplete: (party: DnDCharacter[], campaignSetting: CampaignSetting) => void;
}

export default function PartySetupScreen({ onComplete }: PartySetupScreenProps) {
  const [party, setParty] = useState<DnDCharacter[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [setupStep, setSetupStep] = useState<'campaign' | 'party'>('campaign');
  const [selectedTheme, setSelectedTheme] = useState(CAMPAIGN_THEMES[0].id);
  const [selectedTown, setSelectedTown] = useState(CAMPAIGN_TOWNS[0].id);
  const [selectedHook, setSelectedHook] = useState(STORY_HOOKS[0].id);

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

  const optionButtonStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '10px 14px',
    background: isSelected ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.04)',
    border: `2px solid ${isSelected ? 'rgba(139, 92, 246, 0.7)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '10px',
    color: isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  });

  // ─── Campaign Step ─────────────────────────────────────────────

  const renderCampaignStep = () => {
    const OPTION_GROUPS = [
      { label: 'Campaign Theme', items: CAMPAIGN_THEMES, selected: selectedTheme, onSelect: setSelectedTheme },
      { label: 'Starting Town', items: CAMPAIGN_TOWNS, selected: selectedTown, onSelect: setSelectedTown },
      { label: 'Story Hook', items: STORY_HOOKS, selected: selectedHook, onSelect: setSelectedHook },
    ];

    return (
      <div style={{
        padding: '24px', background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', marginBottom: '16px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: 'rgba(255,255,255,0.9)' }}>
          ⚔️ Choose Your Campaign
        </h2>

        {OPTION_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '12px',
              marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {group.label}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => group.onSelect(item.id)}
                  style={optionButtonStyle(group.selected === item.id)}
                >
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => setSetupStep('party')}
          style={{
            width: '100%', padding: '14px', background: 'rgba(139, 92, 246, 0.6)',
            border: 'none', borderRadius: '10px', color: 'white',
            fontSize: '16px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Next: Create Your Party →
        </button>
      </div>
    );
  };

  // ─── Party Step ────────────────────────────────────────────────

  const renderPartyStep = () => (
    <>
      {/* Campaign summary chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', justifyContent: 'center' }}>
        {[
          CAMPAIGN_THEMES.find(t => t.id === selectedTheme)?.label,
          CAMPAIGN_TOWNS.find(t => t.id === selectedTown)?.label,
          STORY_HOOKS.find(h => h.id === selectedHook)?.label,
        ].map((label, i) => (
          <span key={i} style={{
            padding: '4px 12px', background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '20px',
            fontSize: '12px', color: 'rgba(192, 132, 252, 0.9)',
          }}>
            {label}
          </span>
        ))}
        <button
          onClick={() => setSetupStep('campaign')}
          style={{
            padding: '4px 10px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
            fontSize: '11px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
          }}
        >
          ✎ Change
        </button>
      </div>

      <div style={{
        padding: '24px', background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', marginBottom: '16px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: 'rgba(255,255,255,0.9)' }}>
          Select Your Party ({party.length} created)
        </h2>

        {party.length === 0 ? (
          <div style={{
            padding: '32px 16px', textAlign: 'center',
            background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
            border: '1px dashed rgba(255,255,255,0.1)',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
              No characters yet. Create your first party member!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {party.map(member => (
              <div key={member.id} style={{
                padding: '12px', background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '12px', position: 'relative',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>
                  {member.name}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                  {member.race} {member.class}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', lineHeight: 1.4 }}>
                  HP {member.hp}/{member.maxHp} • AC {member.ac}
                </div>
                <button
                  onClick={() => removeCharacter(member.id)}
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'rgba(255, 100, 100, 0.2)', border: 'none',
                    color: 'rgba(255, 100, 100, 0.8)', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 700, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {!showCreator ? (
          <button
            onClick={() => setShowCreator(true)}
            style={{
              width: '100%', padding: '12px', background: 'rgba(139, 92, 246, 0.15)',
              border: '1px dashed rgba(139, 92, 246, 0.5)', borderRadius: '10px',
              color: 'rgba(192, 132, 252, 0.9)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Create Character
          </button>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '16px', marginTop: '-8px',
          }}>
            <CharacterCreator onComplete={handleCharacterCreated} />
          </div>
        )}
      </div>

      <button
        onClick={startGame}
        disabled={party.length === 0 || hasStarted}
        style={{
          width: '100%', padding: '14px',
          background: party.length > 0 && !hasStarted ? 'rgba(139, 92, 246, 0.6)' : 'rgba(255,255,255,0.05)',
          border: 'none', borderRadius: '10px',
          color: party.length > 0 && !hasStarted ? 'white' : 'rgba(255,255,255,0.3)',
          fontSize: '16px', fontWeight: 600,
          cursor: party.length > 0 && !hasStarted ? 'pointer' : 'default',
          transition: 'all 0.3s', opacity: hasStarted ? 0.5 : 1,
        }}
      >
        {hasStarted ? 'Loading Adventure...' : `Begin Adventure with ${party.length === 1 ? '1 Hero' : `${party.length} Heroes`}`}
      </button>
    </>
  );

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#1C1C1E', padding: '24px',
    }}>
      <div style={{ maxWidth: '700px', width: '100%' }}>
        <h1 style={{
          fontSize: '32px', fontWeight: 700, textAlign: 'center', marginBottom: '8px',
          background: 'linear-gradient(135deg, #c084fc, #818cf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Dungeons &amp; Dragons
        </h1>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '32px' }}>
          AI Dungeon Master
        </p>

        {setupStep === 'campaign' ? renderCampaignStep() : renderPartyStep()}
      </div>
    </div>
  );
}
