/**
 * D&D Dungeon Master AI Service
 * Uses the Groq LLM proxy through the backend to power AI Dungeon Master
 * Character building inspired by D&D Beyond (5e SRD)
 */

import { generateStoryContext } from '../data/dndStoryTemplates';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

export interface DnDMessage {
  id: string;
  role: 'user' | 'dm' | 'system';
  content: string;
  speakerId?: string;
  speakerName?: string;
  timestamp: Date;
}

// ─── D&D Beyond–style Race Data ──────────────────────────────────────────────

export interface RaceData {
  name: string;
  abilityBonuses: Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>;
  speed: number;
  traits: string[];
  languages: string[];
  size: string;
}

export const RACE_DATA: Record<string, RaceData> = {
  Human:      { name: 'Human',      abilityBonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }, speed: 30, traits: ['Extra Language', 'Versatile'],                                  languages: ['Common', 'One extra'], size: 'Medium' },
  Elf:        { name: 'Elf',        abilityBonuses: { dex: 2 },                                           speed: 30, traits: ['Darkvision', 'Keen Senses', 'Fey Ancestry', 'Trance'],         languages: ['Common', 'Elvish'],    size: 'Medium' },
  Dwarf:      { name: 'Dwarf',      abilityBonuses: { con: 2 },                                           speed: 25, traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning'],           languages: ['Common', 'Dwarvish'],  size: 'Medium' },
  Halfling:   { name: 'Halfling',   abilityBonuses: { dex: 2 },                                           speed: 25, traits: ['Lucky', 'Brave', 'Halfling Nimbleness'],                     languages: ['Common', 'Halfling'],  size: 'Small'  },
  Dragonborn: { name: 'Dragonborn', abilityBonuses: { str: 2, cha: 1 },                                   speed: 30, traits: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance'],  languages: ['Common', 'Draconic'],  size: 'Medium' },
  Tiefling:   { name: 'Tiefling',   abilityBonuses: { int: 1, cha: 2 },                                   speed: 30, traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'],      languages: ['Common', 'Infernal'],  size: 'Medium' },
  'Half-Orc':  { name: 'Half-Orc',  abilityBonuses: { str: 2, con: 1 },                                   speed: 30, traits: ['Darkvision', 'Menacing', 'Relentless Endurance', 'Savage Attacks'], languages: ['Common', 'Orc'], size: 'Medium' },
  Gnome:      { name: 'Gnome',      abilityBonuses: { int: 2 },                                           speed: 25, traits: ['Darkvision', 'Gnome Cunning'],                              languages: ['Common', 'Gnomish'],   size: 'Small'  },
};

// ─── D&D Beyond–style Class Data ─────────────────────────────────────────────

export interface ClassData {
  name: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: string[];
  armorProf: string[];
  weaponProf: string[];
  features: string[];            // Level 1 features
  startingEquipment: string[];
  spellcaster: boolean;
}

export const CLASS_DATA: Record<string, ClassData> = {
  Fighter:   { name: 'Fighter',   hitDie: 10, primaryAbility: 'STR or DEX', savingThrows: ['STR', 'CON'], armorProf: ['All armor', 'Shields'], weaponProf: ['Simple', 'Martial'],         features: ['Fighting Style', 'Second Wind'],                          startingEquipment: ['Chain mail', 'Longsword', 'Shield', 'Handaxes ×2', 'Explorer\'s pack'],  spellcaster: false },
  Wizard:    { name: 'Wizard',    hitDie: 6,  primaryAbility: 'INT',        savingThrows: ['INT', 'WIS'], armorProf: [],                       weaponProf: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'], features: ['Arcane Recovery', 'Spellcasting (INT)'],  startingEquipment: ['Quarterstaff', 'Arcane focus', 'Scholar\'s pack', 'Spellbook'],         spellcaster: true  },
  Rogue:     { name: 'Rogue',     hitDie: 8,  primaryAbility: 'DEX',        savingThrows: ['DEX', 'INT'], armorProf: ['Light armor'],          weaponProf: ['Simple', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'], features: ['Expertise', 'Sneak Attack (1d6)', 'Thieves\' Cant'], startingEquipment: ['Rapier', 'Shortbow', 'Burglar\'s pack', 'Leather armor', 'Daggers ×2', 'Thieves\' tools'], spellcaster: false },
  Cleric:    { name: 'Cleric',    hitDie: 8,  primaryAbility: 'WIS',        savingThrows: ['WIS', 'CHA'], armorProf: ['Light armor', 'Medium armor', 'Shields'], weaponProf: ['Simple'], features: ['Spellcasting (WIS)', 'Divine Domain'],            startingEquipment: ['Mace', 'Scale mail', 'Light crossbow', 'Shield', 'Holy symbol', 'Priest\'s pack'],        spellcaster: true  },
  Ranger:    { name: 'Ranger',    hitDie: 10, primaryAbility: 'DEX & WIS',  savingThrows: ['STR', 'DEX'], armorProf: ['Light armor', 'Medium armor', 'Shields'], weaponProf: ['Simple', 'Martial'], features: ['Favored Enemy', 'Natural Explorer'],              startingEquipment: ['Scale mail', 'Shortswords ×2', 'Explorer\'s pack', 'Longbow', 'Quiver of 20 arrows'],    spellcaster: true  },
  Paladin:   { name: 'Paladin',   hitDie: 10, primaryAbility: 'STR & CHA',  savingThrows: ['WIS', 'CHA'], armorProf: ['All armor', 'Shields'], weaponProf: ['Simple', 'Martial'],         features: ['Divine Sense', 'Lay on Hands'],                          startingEquipment: ['Chain mail', 'Shield', 'Longsword', 'Javelins ×5', 'Priest\'s pack', 'Holy symbol'],     spellcaster: true  },
  Barbarian: { name: 'Barbarian', hitDie: 12, primaryAbility: 'STR',        savingThrows: ['STR', 'CON'], armorProf: ['Light armor', 'Medium armor', 'Shields'], weaponProf: ['Simple', 'Martial'], features: ['Rage', 'Unarmored Defense'],                              startingEquipment: ['Greataxe', 'Handaxes ×2', 'Explorer\'s pack', 'Javelins ×4'],                            spellcaster: false },
  Bard:      { name: 'Bard',      hitDie: 8,  primaryAbility: 'CHA',        savingThrows: ['DEX', 'CHA'], armorProf: ['Light armor'],          weaponProf: ['Simple', 'Hand crossbows', 'Longswords', 'Rapiers', 'Shortswords'], features: ['Spellcasting (CHA)', 'Bardic Inspiration (d6)'], startingEquipment: ['Rapier', 'Diplomat\'s pack', 'Lute', 'Leather armor', 'Dagger'], spellcaster: true },
  Sorcerer:  { name: 'Sorcerer',  hitDie: 6,  primaryAbility: 'CHA',        savingThrows: ['CON', 'CHA'], armorProf: [],                       weaponProf: ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light crossbows'], features: ['Spellcasting (CHA)', 'Sorcerous Origin'],    startingEquipment: ['Light crossbow', 'Arcane focus', 'Dungeoneer\'s pack', 'Daggers ×2'],                    spellcaster: true  },
  Warlock:   { name: 'Warlock',   hitDie: 8,  primaryAbility: 'CHA',        savingThrows: ['WIS', 'CHA'], armorProf: ['Light armor'],          weaponProf: ['Simple'],                                                           features: ['Otherworldly Patron', 'Pact Magic'],            startingEquipment: ['Light crossbow', 'Arcane focus', 'Scholar\'s pack', 'Leather armor', 'Simple weapon', 'Daggers ×2'], spellcaster: true },
  Druid:     { name: 'Druid',     hitDie: 8,  primaryAbility: 'WIS',        savingThrows: ['INT', 'WIS'], armorProf: ['Light armor', 'Medium armor', 'Shields (non-metal)'], weaponProf: ['Clubs', 'Daggers', 'Darts', 'Javelins', 'Maces', 'Quarterstaffs', 'Scimitars', 'Sickles', 'Slings', 'Spears'], features: ['Druidic', 'Spellcasting (WIS)'], startingEquipment: ['Wooden shield', 'Scimitar', 'Leather armor', 'Explorer\'s pack', 'Druidic focus'], spellcaster: true },
  Monk:      { name: 'Monk',      hitDie: 8,  primaryAbility: 'DEX & WIS',  savingThrows: ['STR', 'DEX'], armorProf: [],                       weaponProf: ['Simple', 'Shortswords'],                                            features: ['Unarmored Defense', 'Martial Arts (d4)'],       startingEquipment: ['Shortsword', 'Dungeoneer\'s pack', 'Darts ×10'],                                                     spellcaster: false },
};

// ─── Backgrounds (D&D Beyond style) ──────────────────────────────────────────

export interface BackgroundData {
  name: string;
  skillProfs: string[];
  toolProfs: string[];
  languages: number; // extra languages
  equipment: string[];
  feature: string;
  personalityTraits: string[];
}

export const BACKGROUNDS: BackgroundData[] = [
  { name: 'Acolyte',         skillProfs: ['Insight', 'Religion'],       toolProfs: [],                            languages: 2,  equipment: ['Holy symbol', 'Prayer book', 'Incense ×5', 'Vestments', '15 gp'],     feature: 'Shelter of the Faithful', personalityTraits: ['Devoted to a deity', 'Seeks to prove worthy'] },
  { name: 'Criminal',        skillProfs: ['Deception', 'Stealth'],      toolProfs: ["Thieves' tools", 'One gaming set'], languages: 0, equipment: ['Crowbar', 'Dark common clothes', 'Belt pouch', '15 gp'],             feature: 'Criminal Contact',        personalityTraits: ['Always has a plan', 'Doesn\'t trust easily'] },
  { name: 'Folk Hero',       skillProfs: ['Animal Handling', 'Survival'], toolProfs: ["One artisan's tool", 'Vehicles (land)'], languages: 0, equipment: ["Artisan's tools", 'Shovel', 'Iron pot', 'Common clothes', '10 gp'], feature: 'Rustic Hospitality',       personalityTraits: ['Stands up for the oppressed', 'Humble origins'] },
  { name: 'Noble',           skillProfs: ['History', 'Persuasion'],     toolProfs: ['One gaming set'],             languages: 1,  equipment: ['Fine clothes', 'Signet ring', 'Scroll of pedigree', '25 gp'],        feature: 'Position of Privilege',   personalityTraits: ['Accustomed to luxury', 'Noblesse oblige'] },
  { name: 'Sage',            skillProfs: ['Arcana', 'History'],         toolProfs: [],                            languages: 2,  equipment: ['Ink and quill', 'Small knife', 'Letter from colleague', '10 gp'],    feature: 'Researcher',              personalityTraits: ['Endlessly curious', 'Knowledge above all'] },
  { name: 'Soldier',         skillProfs: ['Athletics', 'Intimidation'], toolProfs: ['One gaming set', 'Vehicles (land)'], languages: 0, equipment: ['Insignia of rank', 'Trophy from battle', 'Dice set', 'Common clothes', '10 gp'], feature: 'Military Rank', personalityTraits: ['Follows orders', 'Protects companions fiercely'] },
  { name: 'Charlatan',       skillProfs: ['Deception', 'Sleight of Hand'], toolProfs: ['Disguise kit', 'Forgery kit'], languages: 0, equipment: ['Fine clothes', 'Disguise kit', 'Con tools', '15 gp'],              feature: 'False Identity',          personalityTraits: ['Silver tongue', 'Multiple personas'] },
  { name: 'Hermit',          skillProfs: ['Medicine', 'Religion'],      toolProfs: ['Herbalism kit'],             languages: 1,  equipment: ['Scroll case with notes', 'Winter blanket', 'Herbalism kit', '5 gp'], feature: 'Discovery',               personalityTraits: ['Reclusive', 'Connected to nature'] },
  { name: 'Outlander',       skillProfs: ['Athletics', 'Survival'],     toolProfs: ['One musical instrument'],    languages: 1,  equipment: ['Staff', 'Hunting trap', 'Trophy from animal', 'Traveler\'s clothes', '10 gp'], feature: 'Wanderer', personalityTraits: ['Restless wanderer', 'Connected to the wild'] },
  { name: 'Entertainer',     skillProfs: ['Acrobatics', 'Performance'], toolProfs: ['Disguise kit', 'One musical instrument'], languages: 0, equipment: ['Musical instrument', 'Favor from admirer', 'Costume', '15 gp'], feature: 'By Popular Demand', personalityTraits: ['Loves an audience', 'Dramatic flair'] },
];

// ─── Points / Scoring System ─────────────────────────────────────────────────

export interface PlayerScore {
  playerId: string;
  playerName: string;
  roleplayPoints: number;    // creative & in-character responses
  combatPoints: number;      // effective combat actions
  explorationPoints: number; // discovery & investigation
  teamworkPoints: number;    // helping other players
  totalPoints: number;
}

export function createInitialScore(playerId: string, playerName: string): PlayerScore {
  return { playerId, playerName, roleplayPoints: 0, combatPoints: 0, explorationPoints: 0, teamworkPoints: 0, totalPoints: 0 };
}

/**
 * Evaluate a player's message and award points.
 * Uses keyword heuristics (can be enhanced with AI scoring later).
 */
export function scorePlayerAction(message: string): { points: number; category: 'roleplay' | 'combat' | 'exploration' | 'teamwork'; reason: string } {
  const lower = message.toLowerCase();
  const wordCount = message.trim().split(/\s+/).length;

  // Longer, more detailed responses score higher
  const detailBonus = wordCount >= 20 ? 2 : wordCount >= 10 ? 1 : 0;

  // Teamwork keywords
  const teamworkKeywords = ['help', 'protect', 'heal', 'assist', 'cover', 'support', 'shield', 'defend my', 'save', 'give', 'share', 'together'];
  if (teamworkKeywords.some(kw => lower.includes(kw))) {
    return { points: 3 + detailBonus, category: 'teamwork', reason: 'Helping the team!' };
  }

  // Creative roleplay keywords
  const roleplayKeywords = ['i say', 'i speak', 'i tell', 'i whisper', 'i shout', 'i convince', 'i persuade', 'i bluff', 'i negotiate', 'i seduce', 'i intimidate', 'in character', 'i bow', 'i kneel', 'my character', 'i perform', 'i sing', 'i play my'];
  if (roleplayKeywords.some(kw => lower.includes(kw))) {
    return { points: 3 + detailBonus, category: 'roleplay', reason: 'Great roleplay!' };
  }

  // Combat keywords
  const combatKeywords = ['attack', 'strike', 'slash', 'stab', 'shoot', 'cast', 'fireball', 'smite', 'rage', 'sneak attack', 'flank', 'charge', 'grapple', 'disarm'];
  if (combatKeywords.some(kw => lower.includes(kw))) {
    return { points: 2 + detailBonus, category: 'combat', reason: 'Combat action!' };
  }

  // Exploration keywords
  const explorationKeywords = ['search', 'investigate', 'examine', 'look', 'inspect', 'open', 'check', 'perception', 'insight', 'detect', 'listen', 'sneak', 'scout', 'explore', 'read', 'decipher'];
  if (explorationKeywords.some(kw => lower.includes(kw))) {
    return { points: 2 + detailBonus, category: 'exploration', reason: 'Smart exploration!' };
  }

  // Creative/unique long response bonus
  if (wordCount >= 15) {
    return { points: 2, category: 'roleplay', reason: 'Detailed response!' };
  }

  // Basic action
  return { points: 1, category: 'roleplay', reason: '' };
}

export interface DnDCharacter {
  id: string;
  name: string;
  race: string;
  class: string;
  background: string;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  speed: number;
  proficiencyBonus: number;
  hitDie: string;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  savingThrows: string[];
  skills: string[];
  features: string[];
  inventory: string[];
  backstory: string;
  racialTraits: string[];
  languages: string[];
}

export interface CampaignSetting {
  theme: string;         // e.g. 'Dark Fantasy', 'Epic Quest'
  town: string;          // e.g. 'Thornhaven', 'Waterdeep'
  storyHook: string;     // e.g. 'Ruins exploration', 'Dragon hunt'
}

export const CAMPAIGN_THEMES = [
  { id: 'dark-fantasy', label: 'Dark Fantasy', desc: 'Grim world, moral ambiguity, horror elements' },
  { id: 'epic-quest', label: 'Epic Quest', desc: 'Grand adventure to save the realm' },
  { id: 'mystery', label: 'Mystery & Intrigue', desc: 'Clues, secrets, and political plots' },
  { id: 'dungeon-crawl', label: 'Dungeon Crawl', desc: 'Classic monster-slaying loot runs' },
  { id: 'pirate', label: 'Pirate Adventure', desc: 'High-seas exploration and treasure' },
  { id: 'underdark', label: 'Underdark Descent', desc: 'Subterranean horrors and dark elves' },
];

export const CAMPAIGN_TOWNS = [
  { id: 'thornhaven', label: 'Thornhaven', desc: 'A frontier outpost near ancient ruins' },
  { id: 'waterdeep', label: 'Waterdeep', desc: 'A grand port city of trade and intrigue' },
  { id: 'neverwinter', label: 'Neverwinter', desc: 'A jewel of the North, rebuilt from ashes' },
  { id: 'baldurs-gate', label: "Baldur's Gate", desc: 'A sprawling city of ambition and danger' },
  { id: 'ravenloft', label: 'Ravenloft', desc: 'A cursed domain shrouded in mist' },
  { id: 'undermountain', label: 'Undermountain', desc: 'A mega-dungeon beneath the city' },
  { id: 'icewind-dale', label: 'Icewind Dale', desc: 'A frozen frontier of blizzards and ancient evil' },
  { id: 'phandalin', label: 'Phandalin', desc: 'A small mining town with big problems' },
  { id: 'luskan', label: 'Luskan', desc: 'A lawless pirate port ruled by arcane lords' },
  { id: 'calimport', label: 'Calimport', desc: 'A desert metropolis of genies and intrigue' },
  { id: 'menzoberranzan', label: 'Menzoberranzan', desc: 'The drow city of treachery and spider queens' },
  { id: 'saltmarsh', label: 'Saltmarsh', desc: 'A coastal town hiding smugglers and sea monsters' },
];

export const STORY_HOOKS = [
  { id: 'ruins', label: 'Ruins Exploration', desc: 'Ancient ruins hold forgotten secrets' },
  { id: 'dragon', label: 'Dragon Hunt', desc: 'A dragon threatens the region' },
  { id: 'curse', label: 'Lift the Curse', desc: 'A dark curse plagues the land' },
  { id: 'heist', label: 'The Great Heist', desc: 'Steal a priceless artifact from a tyrant' },
  { id: 'war', label: 'Brewing War', desc: 'Two kingdoms on the brink of conflict' },
  { id: 'artifact', label: 'Lost Artifact', desc: 'Recover a legendary magical item' },
  { id: 'plague', label: 'The Spreading Plague', desc: 'A supernatural disease ravages the populace' },
  { id: 'portal', label: 'Rift in Reality', desc: 'A planar rift tears open, unleashing horrors' },
  { id: 'bounty', label: 'Monster Bounty', desc: 'Hunt a legendary beast terrorizing travelers' },
  { id: 'rebellion', label: 'The Uprising', desc: 'The oppressed rise against a tyrant lord' },
];

export interface DnDSession {
  party: DnDCharacter[];
  activeCharacterId: string | null;
  currentTurnIndex: number;
  roundNumber: number;
  messages: DnDMessage[];
  campaignName: string;
  campaignSetting: CampaignSetting;
  scores: PlayerScore[];
  isActive: boolean;
}

export const RACES = Object.keys(RACE_DATA);
export const CLASSES = Object.keys(CLASS_DATA);

function rollStat(): number {
  // 4d6 drop lowest
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
}

export function rollDice(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function generateStats(): Pick<DnDCharacter, 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'> {
  return {
    str: rollStat(),
    dex: rollStat(),
    con: rollStat(),
    int: rollStat(),
    wis: rollStat(),
    cha: rollStat(),
  };
}

/** Apply racial ability bonuses to base stats */
export function applyRacialBonuses(
  stats: Pick<DnDCharacter, 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>,
  race: string
): Pick<DnDCharacter, 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'> {
  const raceData = RACE_DATA[race];
  if (!raceData) return stats;
  const result = { ...stats };
  for (const [ability, bonus] of Object.entries(raceData.abilityBonuses)) {
    result[ability as keyof typeof result] += bonus;
  }
  return result;
}

export function createCharacter(
  name: string,
  race: string,
  charClass: string,
  backgroundName: string,
  baseStats: Pick<DnDCharacter, 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>
): DnDCharacter {
  const stats = applyRacialBonuses(baseStats, race);
  const conModifier = Math.floor((stats.con - 10) / 2);
  const dexModifier = Math.floor((stats.dex - 10) / 2);
  const raceData = RACE_DATA[race] || RACE_DATA['Human'];
  const classData = CLASS_DATA[charClass] || CLASS_DATA['Fighter'];
  const background = BACKGROUNDS.find(b => b.name === backgroundName) || BACKGROUNDS[0];

  // Calculate HP from class hit die
  const hp = classData.hitDie + conModifier;

  // Calculate AC — if Barbarian/Monk with no armor, use unarmored defense
  let ac = 10 + dexModifier;
  if (charClass === 'Barbarian') ac = 10 + dexModifier + Math.floor((stats.con - 10) / 2);
  else if (charClass === 'Monk') ac = 10 + dexModifier + Math.floor((stats.wis - 10) / 2);
  else if (classData.armorProf.some(a => a.includes('Medium') || a.includes('All'))) ac = 14 + Math.min(dexModifier, 2); // scale mail equivalent
  else if (classData.armorProf.includes('Light armor')) ac = 11 + dexModifier; // leather

  // Merge starting equipment
  const inventory = [...new Set([...classData.startingEquipment, ...background.equipment])];

  return {
    id: createCharacterId(),
    name,
    race,
    class: charClass,
    background: backgroundName,
    level: 1,
    hp,
    maxHp: hp,
    ac,
    speed: raceData.speed,
    proficiencyBonus: 2,
    hitDie: `1d${classData.hitDie}`,
    ...stats,
    savingThrows: classData.savingThrows,
    skills: [...background.skillProfs],
    features: [...classData.features, background.feature],
    inventory,
    backstory: '',
    racialTraits: raceData.traits,
    languages: raceData.languages,
  };
}

function buildSystemPrompt(
  party: DnDCharacter[],
  activeCharacterId: string | null,
  campaignSetting?: CampaignSetting,
  currentTurnPlayerName?: string | null,
  isFirstMessage?: boolean
): string {
  const activeCharacter = party.find(p => p.id === activeCharacterId) || party[0];
  const partySummary = party.length
    ? party.map(p => {
      const bg = p.background ? ` (${p.background})` : '';
      return `- ${p.name} — ${p.race} ${p.class}${bg}, Level ${p.level}, HP ${p.hp}/${p.maxHp}, AC ${p.ac}, Speed ${p.speed || 30}ft\n` +
        `  Stats: STR ${p.str}, DEX ${p.dex}, CON ${p.con}, INT ${p.int}, WIS ${p.wis}, CHA ${p.cha}\n` +
        `  Features: ${(p.features || []).join(', ')}\n` +
        `  Skills: ${(p.skills || []).join(', ')}\n` +
        `  Inventory: ${p.inventory.join(', ')}`;
    }).join('\n\n')
    : '- (No player characters created yet)';

  const activeLine = activeCharacter
    ? `ACTIVE PLAYER (currently speaking): ${activeCharacter.name} (${activeCharacter.race} ${activeCharacter.class})`
    : 'ACTIVE PLAYER: None';

  // Generate rich story context from templates
  const themeId = Object.keys(CAMPAIGN_THEMES.reduce((acc, t) => { acc[t.label] = t.id; return acc; }, {} as Record<string, string>))
    .length ? CAMPAIGN_THEMES.find(t => t.label === campaignSetting?.theme)?.id || 'epic-quest' : 'epic-quest';
  const townId = CAMPAIGN_TOWNS.find(t => t.label === campaignSetting?.town)?.id || 'thornhaven';
  const hookId = STORY_HOOKS.find(h => h.label === campaignSetting?.storyHook)?.id || 'ruins';
  const { storyContext } = generateStoryContext(themeId, townId, hookId);

  const turnInstruction = party.length > 1
    ? `\nTURN SYSTEM:\n- This is a multiplayer game with ${party.length} players taking turns.\n- After narrating consequences, directly address the NEXT player by name and ask what they do.\n- Example: "**${party[0]?.name}**, what do you do?" or "${party[1]?.name || party[0]?.name}, it's your turn — how do you respond?"\n- Keep each player engaged by acknowledging their previous actions.\n${currentTurnPlayerName ? `- The current turn belongs to **${currentTurnPlayerName}**. End your response by addressing them.` : ''}`
    : '';

  const lengthRule = isFirstMessage
    ? '1. For the OPENING scene only, paint a vivid picture (2-3 short paragraphs). Set the atmosphere and hook the players. Use the STORY CONTEXT below for rich details — mention specific NPCs, locations, and the tavern by name.'
    : '1. Keep responses VERY SHORT — 2-4 sentences MAX. Be punchy and vivid. Describe only what matters right now. Never write walls of text or repeat information the players already know.';

  return `You are an expert Dungeon Master running a Dungeons & Dragons 5th Edition campaign. You are creative, dramatic, and fair.

${storyContext}

PARTY:
${partySummary}

${activeLine}
${turnInstruction}

RULES:
${lengthRule}
2. When a player attempts an action requiring a check, tell them what to roll (e.g., "Roll a Perception check (DC 14)") and wait.
3. Track combat with initiative, HP, and turns.
4. Present meaningful choices — not just "go left or right".
5. Include NPCs from the KEY NPCs list above — use their names, personalities, and secrets.
6. Be responsive to creative solutions. Reward clever play.
7. Keep the tone matching the CAMPAIGN TONE described above.
8. Use formatting: **bold** for important items/NPCs, *italics* for atmosphere.
9. For dice rolls, specify the type (d20, d6, etc.) and modifier.
10. Don't control the players' actions — describe world and consequences, let them decide.
11. Reference the player's class features, racial traits, and background when relevant (e.g., a Rogue's Sneak Attack, a Dwarf's Darkvision).
${party.length > 1 ? '12. Always end your response by addressing the next player by name and asking what they do.' : ''}`;
}

export async function sendMessageToDM(
  messages: DnDMessage[],
  party: DnDCharacter[],
  activeCharacterId: string | null,
  campaignSetting?: CampaignSetting,
  currentTurnPlayerName?: string | null,
  isFirstMessage?: boolean
): Promise<string> {
  const systemPrompt = buildSystemPrompt(party, activeCharacterId, campaignSetting, currentTurnPlayerName, isFirstMessage);

  const chatMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({
      role: m.role === 'dm' ? 'assistant' : 'user',
      content: m.role === 'user' && m.speakerName ? `${m.speakerName}: ${m.content}` : m.content,
    })),
  ];

  try {
    const response = await fetch(`${BACKEND_URL}/api/groq/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: chatMessages,
        temperature: 0.8,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'The Dungeon Master ponders silently...';
  } catch (error) {
    console.error('DM API error:', error);
    // Fallback response when API is unavailable
    const townName = campaignSetting?.town || 'the town';
    const partyNames = party.map(p => `${p.name} the ${p.race} ${p.class}`).join(', ') || 'Adventurer';
    return `*The torchlight flickers as you stand at the gates of ${townName}. The wind carries whispers of adventure...*

**Welcome, ${partyNames}!**

The settlement looms before you — weathered buildings line narrow streets, their windows glowing faintly in the dusk. A notice board near the gate is covered in parchments, and the nearest tavern beckons with warmth and noise.

What do you do?

_(Note: AI backend is currently unavailable. Responses are limited.)_`;
  }
}

export function createMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createCharacterId(): string {
  return `pc-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
}
