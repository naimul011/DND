/**
 * D&D Story Templates & Campaign Data
 * 
 * Each combination of theme × town × story hook produces a unique story
 * with NPCs, locations, encounters, lore, and opening scene ingredients.
 * The DM AI uses these as rich context to generate unique adventures.
 */

// ─── Story Ingredients per Town ─────────────────────────────────────────────

export interface TownData {
  id: string;
  name: string;
  description: string;
  districts: string[];
  keyNPCs: { name: string; role: string; personality: string; secret?: string }[];
  landmarks: string[];
  tavern: { name: string; vibe: string };
  rumor: string;
}

export const TOWN_DATA: Record<string, TownData> = {
  thornhaven: {
    id: 'thornhaven',
    name: 'Thornhaven',
    description: 'A rugged frontier outpost on the edge of the Thornwood, built atop ancient Elven ruins. Palisade walls surround muddy streets. The townsfolk are hardy, suspicious of outsiders, and haunted by disappearances at night.',
    districts: ['The Muddy Row (market)', 'Chapel Hill', 'The Underworks (old tunnels)'],
    keyNPCs: [
      { name: 'Mayor Edda Gravecross', role: 'Town leader', personality: 'Stern, pragmatic, hides grief over her missing son', secret: 'Knows the ruins are connected to the disappearances but fears a panic' },
      { name: 'Old Maren', role: 'Herbalist & seer', personality: 'Cryptic, kind, speaks in riddles', secret: 'Was once an adventurer who explored the ruins decades ago' },
      { name: 'Brakk Ironjaw', role: 'Blacksmith', personality: 'Loud, jolly Half-Orc, protective of the town' },
      { name: 'Sister Vael', role: 'Priestess of Selûne', personality: 'Calm, observant, suspects dark magic nearby' },
    ],
    landmarks: ['The Thorngate (main entrance)', 'The Standing Stones (ancient Elven markers)', 'The Well of Echoes (rumored to whisper answers)'],
    tavern: { name: 'The Rusty Tankard', vibe: 'Warm and rowdy, with a mounted owlbear head above the hearth' },
    rumor: 'Folk say the standing stones glow blue on moonless nights, and those who touch them vanish.',
  },

  waterdeep: {
    id: 'waterdeep',
    name: 'Waterdeep',
    description: 'The City of Splendors — a massive port metropolis of a million souls. Towering spires, bustling docks, opulent noble villas, and a criminal underworld run by the Xanathar Guild. Laws are strict, but gold speaks louder.',
    districts: ['Dock Ward', 'Castle Ward', 'The Field of Triumph (arena)', 'Skullport (underground)'],
    keyNPCs: [
      { name: 'Laeral Silverhand', role: 'Open Lord of Waterdeep', personality: 'Wise, powerful archmage, rules with a fair but iron hand' },
      { name: 'Durnan', role: 'Owner of the Yawning Portal', personality: 'Gruff, retired adventurer, guards the entrance to Undermountain' },
      { name: 'Renaer Neverember', role: 'Noble exile', personality: 'Charming, rebellious, seeks to clear his family name', secret: 'Knows the location of half a million gold coins hidden by his father' },
      { name: 'Vajra Safahr', role: 'Blackstaff (archmage)', personality: 'Young, intense, keeper of Waterdeep\'s magical defenses' },
    ],
    landmarks: ['The Yawning Portal Inn', 'Castle Waterdeep', 'The Walking Statues (gigantic constructs)', 'Blackstaff Tower'],
    tavern: { name: 'The Yawning Portal', vibe: 'Famous inn built around a massive well that descends into Undermountain. Adventurers lower themselves in for a gold piece.' },
    rumor: 'The Xanathar — a beholder crime lord — has placed a bounty on anyone asking about a certain stone.',
  },

  neverwinter: {
    id: 'neverwinter',
    name: 'Neverwinter',
    description: 'Once called the Jewel of the North, Neverwinter was devastated by a volcanic eruption and is now being rebuilt. Half the city is ruins, the other half a booming frontier of opportunity and danger.',
    districts: ['Protector\'s Enclave (rebuilt area)', 'Blacklake District (flooded ruins)', 'River District (monster-infested)', 'Chasm (volcanic rift)'],
    keyNPCs: [
      { name: 'Lord Dagult Neverember', role: 'Self-proclaimed protector', personality: 'Ambitious, cunning, genuinely wants to rebuild but craves power', secret: 'Embezzles reconstruction funds' },
      { name: 'Seldra Tylmarande', role: 'Harper agent (half-elf)', personality: 'Secretive, driven, investigates cult activity' },
      { name: 'Elden Vargas', role: 'Tavern owner & information broker', personality: 'Smooth-talking, knows everyone, sells secrets to the highest bidder' },
      { name: 'Valindra Shadowmantle', role: 'Thayan lich (hidden antagonist)', personality: 'Patient, calculating, manipulates events from the shadows', secret: 'She caused the chasm to remain open' },
    ],
    landmarks: ['The Chasm (volcanic rift splitting the city)', 'Castle Never (haunted ruin)', 'The Cloak Tower (occupied by wererats)', 'The Wall (rebuilt fortifications)'],
    tavern: { name: 'The Driftwood Tavern', vibe: 'Rebuilt from shipwrecks, smells of salt and sawdust. A haven for adventurers and refugees alike.' },
    rumor: 'Dead things walk in the River District after dark. The city guard won\'t patrol there anymore.',
  },

  'baldurs-gate': {
    id: 'baldurs-gate',
    name: "Baldur's Gate",
    description: 'A sprawling, fog-draped port city on the Sword Coast. Corruption runs deep — from the Patriar nobles to the Guild thieves. The Flaming Fist mercenaries keep a brutal peace. Refugees flood in from abroad.',
    districts: ['Upper City (wealthy Patriars)', 'Lower City (merchants, temples)', 'Outer City (lawless slums)', 'The Wide (market plaza)'],
    keyNPCs: [
      { name: 'Grand Duke Ulder Ravengard', role: 'Military leader of the Flaming Fist', personality: 'Honorable, gruff, secretly ill', secret: 'Has been having prophetic nightmares of Baldur\'s Gate in flames' },
      { name: 'Nine-Fingers Keene', role: 'Guildmaster of thieves', personality: 'Calculating, fair in her own way, opposes the Flaming Fist' },
      { name: 'Mortlock Vanthampur', role: 'Noble thug', personality: 'Brute with a conscience, wants out of his family\'s dark dealings', secret: 'His mother works for the archdevil Zariel' },
      { name: 'Flame Zodge', role: 'Flaming Fist commander', personality: 'Paranoid, efficient, desperate for reliable agents' },
    ],
    landmarks: ['The Wide (grand marketplace)', 'Basilisk Gate', 'Sorcerous Sundries (magic shop)', 'The Elfsong Tavern'],
    tavern: { name: 'The Elfsong Tavern', vibe: 'Named for the ghostly elven voice that sings at night. Crowded, dark, the kind of place where deals are struck in whispers.' },
    rumor: 'People say the Vanthampur family is making pacts with devils. Anyone who investigates tends to disappear.',
  },

  ravenloft: {
    id: 'ravenloft',
    name: 'Ravenloft (Barovia)',
    description: 'A cursed, mist-shrouded valley ruled by the vampire lord Strahd von Zarovich. The sun never truly shines. Villagers are broken and fearful. Escape is impossible — the mists bring you back.',
    districts: ['Village of Barovia', 'Vallaki (walled town)', 'Krezk (mountain village)', 'Castle Ravenloft (Strahd\'s domain)'],
    keyNPCs: [
      { name: 'Ismark Kolyanovich', role: 'Burgomaster\'s son', personality: 'Brave, desperate, called "Ismark the Lesser" by townsfolk who think he can\'t protect them', secret: 'His sister Ireena is the target of Strahd\'s obsession' },
      { name: 'Ireena Kolyana', role: 'Noblewoman', personality: 'Brave, haunted, doesn\'t remember past lives but has been reincarnated many times' },
      { name: 'Madam Eva', role: 'Vistani fortune teller', personality: 'Ancient, powerful, knows the party\'s destiny', secret: 'She is Strahd\'s secret ally but also wishes to see him destroyed' },
      { name: 'Strahd von Zarovich', role: 'Vampire lord', personality: 'Refined, tragic, utterly deadly. Treats the party as toys to amuse himself.' },
    ],
    landmarks: ['Castle Ravenloft (looming over everything)', 'Tser Pool (Vistani camp)', 'Old Bonegrinder (hag windmill)', 'The Amber Temple (source of dark power)'],
    tavern: { name: 'Blood of the Vine Tavern', vibe: 'Almost empty. The wine is sour. The barkeep stares blankly. A fire barely warms the room. Hope is scarce here.' },
    rumor: 'The Devil Strahd has invited you. No one enters Barovia without his will. No one leaves.',
  },

  undermountain: {
    id: 'undermountain',
    name: 'Undermountain',
    description: 'The largest, deadliest dungeon in all of Faerûn — 23 levels spiraling down beneath Waterdeep. Created by the mad mage Halaster Blackcloak, who watches everything and warps reality on a whim.',
    districts: ['Level 1: Dungeon Level', 'Level 2: Arcane Chambers', 'Level 3: Sargauth Level (underground river)', 'The Yawning Portal (entrance above)'],
    keyNPCs: [
      { name: 'Halaster Blackcloak', role: 'Mad mage overlord', personality: 'Insane, brilliant, omnipresent within Undermountain. Treats adventurers as entertainment.', secret: 'He cannot leave the dungeon — it sustains his life force' },
      { name: 'Durnan', role: 'Yawning Portal proprietor', personality: 'Retired adventurer, knows more about the dungeon than he lets on' },
      { name: 'Muiral the Misshapen', role: 'Half-spider sorcerer', personality: 'Former apprentice of Halaster, now a monstrous guardian', secret: 'He wants Halaster dead and seeks allies' },
      { name: 'Jhesiyra Kestellharp', role: 'Ghost trapped in the dungeon walls', personality: 'Helpful spirit, offers cryptic guidance', secret: 'She was Halaster\'s apprentice centuries ago' },
    ],
    landmarks: ['The Yawning Portal well (entrance)', 'The Undertakers (corpse retrieval guild)', 'The Mirror of Halaster (acts as a portal)', 'The Crystal Labyrinth (Level 9)'],
    tavern: { name: 'The Yawning Portal', vibe: 'The legendary inn above the dungeon. Adventurers brag, gamble, and mourn their fallen here. The well in the center is 140 feet deep.' },
    rumor: 'They say Halaster watches through the very stones. Adventurers who go deep enough hear his laughter.',
  },

  'icewind-dale': {
    id: 'icewind-dale',
    name: 'Icewind Dale',
    description: 'A frozen wilderness of endless blizzards and perpetual twilight. Ten small towns cluster around three lakes, barely surviving. Something has stolen the sun — an eternal winter grips the Dale, and an ancient evil stirs beneath the ice.',
    districts: ['Bryn Shander (largest town)', 'Targos (fishing & militia)', 'Easthaven (lakeside)', 'Caer-Dineval (haunted keep)'],
    keyNPCs: [
      { name: 'Speaker Duvessa Shane', role: 'Leader of Bryn Shander', personality: 'Young, determined, desperate to keep her people alive through the endless winter', secret: 'She has found a fragment of an ancient map pointing to the source of the curse' },
      { name: 'Hlin Trollbane', role: 'Retired bounty hunter', personality: 'Grizzled dwarf woman, sharp eyes, knows the Dale better than anyone' },
      { name: 'Avarice', role: 'Tiefling wizard of the Arcane Brotherhood', personality: 'Calculating, ambitious, searches for a lost Netherese artifact', secret: 'She will betray anyone to claim the artifact for herself' },
      { name: 'Sephek Kaltro', role: 'Traveling merchant', personality: 'Eerily calm, never cold despite light clothing', secret: 'He is a serial killer chosen by the Frostmaiden to enforce her will' },
    ],
    landmarks: ['Kelvin\'s Cairn (frozen mountain)', 'The Reghed Glacier', 'The Black Cabin (hermit\'s shelter)', 'Sunblight Fortress (duergar stronghold)'],
    tavern: { name: 'The Northlook', vibe: 'Thick stone walls keep out the howling wind. Yak-butter candles flicker. Everyone watches the door nervously.' },
    rumor: 'The sun hasn\'t risen properly in two months. Sacrifices are being made in the dark — and no one talks about what they\'re sacrificing.',
  },

  phandalin: {
    id: 'phandalin',
    name: 'Phandalin',
    description: 'A rough-and-tumble frontier settlement built on the ruins of a much older town. Prospectors and miners seek fortune in the nearby hills, but bandits and monsters make the roads deadly. A mysterious magic pervades the old mines.',
    districts: ['Town Square', 'The Miner\'s Quarter', 'Tresendar Manor (ruined hilltop estate)', 'Cragmaw Trail (dangerous road)'],
    keyNPCs: [
      { name: 'Sildar Hallwinter', role: 'Lords\' Alliance agent', personality: 'Honorable, battle-worn, seeks to bring law to the frontier', secret: 'He is investigating the disappearance of a fellow agent' },
      { name: 'Sister Garaele', role: 'Priestess of Tymora', personality: 'Cheerful, adventurous, secretly a Harper agent' },
      { name: 'Halia Thornton', role: 'Miner\'s Exchange guildmaster', personality: 'Ambitious, shrewd, wants to control Phandalin\'s wealth', secret: 'She is a Zhentarim agent who will pay for information on rivals' },
      { name: 'Glasstaff', role: 'Mysterious wizard', personality: 'Charming when met, ruthless underneath', secret: 'He leads the Redbrand bandits from the manor basement' },
    ],
    landmarks: ['Wave Echo Cave (lost mine)', 'Tresendar Manor ruins', 'The Redbrand Hideout (beneath the manor)', 'Old Owl Well (ancient watchtower)'],
    tavern: { name: 'The Stonehill Inn', vibe: 'Cozy and packed with miners swapping stories. The ale is cheap, the food is hearty, and everyone has an opinion.' },
    rumor: 'The Redbrands have been shaking down every business in town. Someone needs to deal with them before they take over completely.',
  },

  luskan: {
    id: 'luskan',
    name: 'Luskan',
    description: 'The City of Sails — a lawless port city ruled by five rival pirate captains who each control an arcane tower. Murder and smuggling are daily affairs. The city is beautiful and deadly in equal measure.',
    districts: ['North Bank (towers & docks)', 'South Bank (slums & fighting pits)', 'Closeguard Island (Ship Rethnor)', 'Cutlass Island (gladiatorial arena)'],
    keyNPCs: [
      { name: 'High Captain Beniago Kurth', role: 'Most powerful pirate lord', personality: 'Refined, strategic, rules through charm and assassination', secret: 'He answers to a shadow council of liches' },
      { name: 'Dahlia Sin\'felle', role: 'Elf mercenary', personality: 'Fierce, unpredictable, haunted by her past', secret: 'She is hunting a specific devil who destroyed her homeland' },
      { name: 'Klauth', role: 'Ancient red dragon (secret patron)', personality: 'Manipulates events through agents, never appears directly', secret: 'He wants Luskan weakened so he can claim it' },
      { name: 'Brother Anthus', role: 'Street preacher of Ilmater', personality: 'Gentle, tireless, feeds the poor', secret: 'He keeps a coded ledger of every crime he witnesses' },
    ],
    landmarks: ['The Host Tower of the Arcane (ruined wizard tower)', 'The Throat (harbor entrance)', 'One-Eyed Jax (fighting pit)', 'Illusk (undead-haunted ruins beneath the city)'],
    tavern: { name: 'The Cutlass', vibe: 'Salt-stained, loud, and dangerous. Bar fights break out nightly. The rum is strong and the bouncer is a half-ogre named Grik.' },
    rumor: 'Ships have been vanishing in the harbor at night. Survivors babble about black tentacles rising from the water.',
  },

  calimport: {
    id: 'calimport',
    name: 'Calimport',
    description: 'The largest city in Faerûn — a baking desert metropolis of two million souls. Golden domes, labyrinthine bazaars, silk-draped palaces, and a vast underground ruled by thieves\' guilds. Genies once ruled here, and their magic lingers.',
    districts: ['The Jewel Ward (palaces & temples)', 'The Grand Bazaar (endless market)', 'The Muzad (underground city)', 'The Docks (slave trade & smuggling)'],
    keyNPCs: [
      { name: 'Syl-Pasha Ralan el Pesarkhal', role: 'Ruler of Calimport', personality: 'Paranoid, decadent, surrounded by sycophants', secret: 'A djinni has replaced him with a simulacrum, the real Syl-Pasha is imprisoned' },
      { name: 'Artemis Entreri', role: 'Legendary assassin', personality: 'Cold, efficient, the deadliest blade in the South', secret: 'He is tired of killing and seeks a worthy challenge or death' },
      { name: 'Nanda Doromath', role: 'Spice merchant & information broker', personality: 'Jovial on the surface, razor-sharp mind underneath' },
      { name: 'Aaliyah al-Karam', role: 'Young sha\'ir (genie-binder)', personality: 'Idealistic, brilliant, wants to free the enslaved genies', secret: 'Her familiar is a noble dao in disguise' },
    ],
    landmarks: ['The Calim Desert (vast sands hiding genie ruins)', 'The Jewel Palace', 'The Muzad tunnels', 'The Colosseum of the Sun'],
    tavern: { name: 'The Golden Hookah', vibe: 'Silk cushions, spiced tea, perfumed smoke. A place for quiet deals and louder music. Dancing girls distract while pickpockets work the crowd.' },
    rumor: 'They say the old genie courts still exist beneath the sand. Those who find them either return with impossible wealth or don\'t return at all.',
  },

  menzoberranzan: {
    id: 'menzoberranzan',
    name: 'Menzoberranzan',
    description: 'The great drow city, two miles beneath the surface. A cavern of impossible beauty — stalactite palaces lit by faerie fire, fungi forests, and bottomless chasms. Every smile hides a dagger. Lolth, the Spider Queen, rules through chaos.',
    districts: ['Qu\'ellarz\'orl (noble plateau)', 'Narbondellyn (merchant quarter)', 'Braeryn (slum, "The Stenchstreets")', 'Tier Breche (academy)'],
    keyNPCs: [
      { name: 'Matron Mother Quenthel Baenre', role: 'Ruler of House Baenre', personality: 'Cunning, ruthless, devout servant of Lolth', secret: 'She fears a prophecy that a surface-born will end her house' },
      { name: 'Jarlaxle Baenre', role: 'Mercenary lord of Bregan D\'aerthe', personality: 'Flamboyant, clever, plays all sides', secret: 'He is secretly working to stabilize relations with the surface' },
      { name: 'Gromph Baenre', role: 'Archmage of Menzoberranzan', personality: 'Arrogant, immensely powerful, despises Lolth\'s clergy' },
      { name: 'Kimmuriel Oblodra', role: 'Psionicist & Bregan D\'aerthe lieutenant', personality: 'Utterly emotionless, terrifyingly intelligent', secret: 'He can read thoughts without detection' },
    ],
    landmarks: ['Narbondel (giant pillar clock)', 'Arach-Tinilith (priestess school)', 'Sorcere (wizard academy)', 'The Bazaar (sprawling market)'],
    tavern: { name: 'The Jewel Box', vibe: 'A "neutral ground" establishment run by Bregan D\'aerthe. Faerie-fire lanterns, mushroom wine, and the constant feeling someone is watching you.' },
    rumor: 'Lolth has gone silent. The priestesses are terrified. Without her favor, the houses will tear each other apart within a tenday.',
  },

  saltmarsh: {
    id: 'saltmarsh',
    name: 'Saltmarsh',
    description: 'A sleepy coastal fishing town that sits at a crossroads of danger. Smugglers use the sea caves, sahuagin lurk offshore, and a new wave of merchants threatens the old way of life. The mist rolls in thick, and things wash ashore that shouldn\'t.',
    districts: ['The Docks (fishing boats & warehouses)', 'Market Street (shops & council hall)', 'Sandy Point (old lighthouse)', 'The Marsh (trackless wetland)'],
    keyNPCs: [
      { name: 'Eliander Fireborn', role: 'Town guard captain', personality: 'Disciplined, fair, former soldier with a bad leg', secret: 'He knows the council is split between loyalists and smuggler allies' },
      { name: 'Gellan Primewater', role: 'Wealthy merchant & council member', personality: 'Charming, generous, everyone\'s friend', secret: 'He runs the smuggling operation from the sea caves' },
      { name: 'Oceanus', role: 'Sea elf emissary', personality: 'Proud, wary of surface folk, desperate for allies', secret: 'The sahuagin are massing for a full assault within weeks' },
      { name: 'Krag', role: 'Dwarf priest of Procan (sea god)', personality: 'Grumpy, seafaring, surprisingly kind when drunk' },
    ],
    landmarks: ['The Haunted House (abandoned alchemist\'s manor)', 'The Sea Caves (smuggler tunnels)', 'Danger Island (lizardfolk territory)', 'The Standing Stones (druidic circle on the cliffs)'],
    tavern: { name: 'The Wicker Goat', vibe: 'Smells of fish and salt. Nets hang from the ceiling. A one-eyed cat watches from the bar. The cider is surprisingly good.' },
    rumor: 'Lights have been seen in the old haunted house on the cliff. The last person who investigated hasn\'t been seen since.',
  },
};

// ─── Story Hook Templates ────────────────────────────────────────────────────

export interface StoryHookData {
  id: string;
  name: string;
  openingSceneIngredients: string;
  questGiver: string;
  initialConflict: string;
  twist: string;
  encounters: string[];
  rewards: string[];
  villainHint: string;
}

export const STORY_HOOK_DATA: Record<string, StoryHookData> = {
  ruins: {
    id: 'ruins',
    name: 'Ruins Exploration',
    openingSceneIngredients: 'The party arrives to find a recently uncovered entrance — collapsed stones revealing a stairway carved with ancient Elvish runes that glow faintly. A cold draft rises from below. Locals say a shepherd fell in and came out babbling about golden halls and "eyes in the dark."',
    questGiver: 'A local scholar or town elder who recognizes the runes and knows the ruins may hold answers to a current threat.',
    initialConflict: 'The entrance is guarded by territorial creatures (giant spiders, stirges, or goblins who moved in). A rival adventuring party may also be heading to the ruins.',
    twist: 'The ruins are not abandoned — a sleeping entity was sealed within, and the disturbance is waking it.',
    encounters: ['Trapped corridors (poison darts, collapsing floors)', 'A puzzle room with rotating pillars that must be aligned', 'A ghostly guardian who quizzes intruders', 'A boss chamber with a wight or bound elemental'],
    rewards: ['Ancient magical weapon or focus', 'Treasure hoard (500+ gold)', 'Lore fragment revealing a larger threat', 'Alliance with the ghostly guardian'],
    villainHint: 'The real villain is whoever caused the ruins to be unsealed — perhaps a cultist seeking the sealed entity.',
  },

  dragon: {
    id: 'dragon',
    name: 'Dragon Hunt',
    openingSceneIngredients: 'The sky darkens as a massive shadow passes overhead. Livestock are being snatched from farms. Scorched fields and collapsed barns mark the dragon\'s path. The creature has made its lair somewhere in the mountains nearby. The bounty is enormous — but so is the danger.',
    questGiver: 'A desperate noble whose lands are being destroyed, offering a manor and title to whoever slays the beast.',
    initialConflict: 'The dragon has kobold servants raiding the town for treasure to add to its hoard. A group of dragonborn consider the dragon sacred and oppose the hunt.',
    twist: 'The dragon is actually a parent protecting its eggs from poachers. The real villain is the one hiring the party — they want the dragon eggs for dark rituals.',
    encounters: ['Kobold ambush on the mountain path', 'A collapsing bridge over a lava-heated chasm', 'Negotiation with the dragonborn clan', 'The dragon\'s lair — traps, minions, and the beast itself'],
    rewards: ['Dragon scales (can be forged into armor)', 'A portion of the hoard', 'Title and land from the noble', 'A dragon egg (moral dilemma)'],
    villainHint: 'The noble\'s advisor is secretly a Cult of the Dragon agent seeking to create a dracolich.',
  },

  curse: {
    id: 'curse',
    name: 'Lift the Curse',
    openingSceneIngredients: 'The town is wilting. Crops rot overnight, children have nightmares of a faceless woman, and the river runs black every full moon. A palpable dread hangs over everything. Even the birds have stopped singing.',
    questGiver: 'The town healer who has been fighting the symptoms but knows the root cause lies in a desecrated shrine in the nearby forest.',
    initialConflict: 'Some townsfolk believe the party ARE the curse-bringers and are hostile. The shrine is protected by the cursed dead who cannot rest.',
    twist: 'The curse was placed by a betrayed spirit — a woman wrongly executed for witchcraft by the town\'s ancestors. The true villain is the descendant who keeps the curse active to maintain power over the fearful town.',
    encounters: ['Hostile townsfolk mob', 'A haunted forest with will-o\'-wisps', 'The desecrated shrine and its undead guardians', 'Confrontation with the spirit for negotiation or combat'],
    rewards: ['Spirit\'s gratitude (boon or magic item)', 'Town\'s eternal gratitude and free lodging', 'Access to the shrine\'s hidden vault', 'A moral victory — peace for the dead'],
    villainHint: 'Mayor\'s family has profited from the fear for generations. They hold the key to the shrine.',
  },

  heist: {
    id: 'heist',
    name: 'The Great Heist',
    openingSceneIngredients: 'A hooded figure approaches the party in the tavern with a job: steal the **Scepter of Ages** from the vault of a tyrannical lord. The vault is beneath his fortified manor, guarded by traps, constructs, and elite soldiers. The reward? Enough gold to retire — and a tyrant dethroned.',
    questGiver: 'A resistance leader or wronged noble who lost everything to the tyrant.',
    initialConflict: 'They need a plan: go in loud or quiet? They need blueprints, inside help, and possibly a distraction.',
    twist: 'The scepter is not just valuable — it\'s an artifact that controls the city\'s magical defenses. Whoever holds it controls the city. The quest giver has their own agenda for power.',
    encounters: ['Infiltrating a masquerade ball for intel', 'Navigating trapped corridors (arcane locks, alarm glyphs)', 'A vault guardian (iron golem or bound demon)', 'The escape — pursued through the streets'],
    rewards: ['Massive gold payout', 'The scepter itself (immense power and danger)', 'Favor from the resistance', 'A secret passage network under the city'],
    villainHint: 'The quest giver may betray the party once they have the scepter. Trust no one.',
  },

  war: {
    id: 'war',
    name: 'Brewing War',
    openingSceneIngredients: 'Soldiers march through the town, requisitioning food and horses. Two kingdoms stand on the brink — insults exchanged, borders violated, diplomats found dead. A delegation from each side has arrived, and tensions in the tavern are a knife\'s edge from violence.',
    questGiver: 'A neutral diplomat who believes the war is being orchestrated by a third party and needs proof before the first battle.',
    initialConflict: 'Both sides distrust the party. An assassination attempt on one of the diplomats frames the other side.',
    twist: 'The war is being engineered by a fiend (or fiend-pact warlock) who feeds on the chaos of conflict and has agents embedded in both courts.',
    encounters: ['Tavern brawl that escalates into a street fight', 'Investigating the assassination (crime scene, witnesses, clues)', 'Infiltrating an enemy camp for evidence', 'A tense peace negotiation that could go wrong'],
    rewards: ['Diplomatic immunity and noble titles', 'Gratitude of both kingdoms', 'A magical reward from the grateful diplomat', 'Prevention of thousands of deaths (XP bonanza)'],
    villainHint: 'Both sides have an advisor who whispers the same poison — find the common thread.',
  },

  artifact: {
    id: 'artifact',
    name: 'Lost Artifact',
    openingSceneIngredients: 'A fragment of a map falls out of a book in a dusty library. It shows the location of **Oathbreaker**, a legendary sentient sword lost for centuries. Last known to be carried into battle by a paladin who fell from grace. Scholars, thieves, and cults are all searching for it.',
    questGiver: 'A sage or librarian who deciphered the map but is too old/frail to make the journey.',
    initialConflict: 'The party is not the only ones searching. A rival group (thieves\' guild, cult, or enemy adventurers) is also following the trail.',
    twist: 'The artifact is cursed — it corrupts its wielder. The fallen paladin is still "alive" as a death knight, bound to the sword. It must be destroyed, not wielded.',
    encounters: ['A race against rivals to reach the first clue', 'A trapped temple dedicated to the sword\'s original deity', 'The death knight\'s lair — undead minions and dark magic', 'A moral choice: wield the cursed sword or destroy it'],
    rewards: ['The artifact itself (dangerous but powerful)', 'Blessing from a deity for destroying it', 'The death knight\'s treasure hoard', 'Reputation as legendary heroes'],
    villainHint: 'The cult wants the sword to resurrect their dead god. The death knight will bargain — he wants freedom, not destruction.',
  },

  plague: {
    id: 'plague',
    name: 'The Spreading Plague',
    openingSceneIngredients: 'The first sign is the coughing — wet, rattling, flecked with iridescent green. Within days the afflicted develop glowing veins and speak in tongues before falling into a coma. The healers are overwhelmed. The temples have no answers. And every morning, more are infected.',
    questGiver: 'A desperate healer who has traced the plague to an unnatural source — possibly a corrupted well, a cursed artifact, or a deliberate act of biomagical warfare.',
    initialConflict: 'The town is in quarantine. Some blame outsiders (the party). A cult claims the plague is divine punishment and opposes any cure. Resources are scarce.',
    twist: 'The plague is engineered by an alchemist working for a rival power. The "cure" being sold on the black market actually accelerates the disease, creating undead thralls.',
    encounters: ['Navigating a panicked mob blocking the road', 'Investigating a plagued district (environmental hazards, maddened NPCs)', 'Raiding the alchemist\'s hidden laboratory', 'A race against time to distribute the cure before the final stage hits'],
    rewards: ['The alchemist\'s formula book (valuable recipes)', 'Eternal gratitude and free healing from the temple', 'A purified version of the plague that grants temporary poison immunity', 'Gold bounty from the ruling council'],
    villainHint: 'Follow the black-market cure supply chain — it leads straight to the alchemist\'s patron.',
  },

  portal: {
    id: 'portal',
    name: 'Rift in Reality',
    openingSceneIngredients: 'The sky splits with a sound like tearing silk. A jagged wound of purple light hangs above the town, and from it pour creatures that shouldn\'t exist — twisted, wrong, flickering between forms. The ground warps near the rift, gravity shifting, time stuttering. It\'s growing.',
    questGiver: 'A wizard who recognizes the rift as a planar breach and knows it must be sealed from the other side — someone has to go through.',
    initialConflict: 'The aberrations are attacking, the town needs defending NOW. But every hour the rift grows wider. A faction wants to harness the rift\'s power rather than close it.',
    twist: 'The rift was opened intentionally by a being on the other side — a trapped entity seeking freedom. Closing it means trapping it again; letting it through means catastrophe. There may be a third option.',
    encounters: ['Defending the town against waves of aberrations', 'Entering the rift — surviving a landscape of warped physics', 'Negotiating with the trapped entity', 'A climactic choice: seal, free, or redirect the rift'],
    rewards: ['A shard of planar energy (powerful spell component)', 'Knowledge of planar travel', 'An alliance with the entity (if freed peacefully)', 'A medal of valor from the grateful town'],
    villainHint: 'The wizard knows more than they\'re saying. Ask who was experimenting with dimensional anchors last season.',
  },

  bounty: {
    id: 'bounty',
    name: 'Monster Bounty',
    openingSceneIngredients: 'The notice board is dominated by a single parchment, written in trembling hand: "REWARD — 2,000 GOLD. Kill the beast that haunts the Whispering Moors. It took my husband. It took the miller\'s sons. No guard will hunt it. Please." Bodies have been found torn apart in ways that don\'t match any known predator.',
    questGiver: 'The grieving spouse, backed by a council pooling funds from terrified citizens.',
    initialConflict: 'No one agrees on what the monster is. Tracks are contradictory. A ranger claims it\'s a werewolf, a scholar says owlbear, a priest says demon. The truth is worse.',
    twist: 'The "monster" is actually two threats — a natural predator AND a shapechanger using the attacks as cover for targeted killings. One of the prominent citizens IS the shapechanger.',
    encounters: ['Tracking through the wilderness (survival checks, false trails)', 'A nighttime ambush by the real predator', 'Discovering the shapechanger\'s true identity in a tense social confrontation', 'A final hunt — but who is hunting whom?'],
    rewards: ['The bounty gold', 'The predator\'s pelt/trophy (valuable components)', 'A property deed from a grateful noble', 'Local fame and free drinks for life'],
    villainHint: 'Count the bodies. Some died from claws. Some died from a blade disguised to look like claws.',
  },

  rebellion: {
    id: 'rebellion',
    name: 'The Uprising',
    openingSceneIngredients: 'The streets are tense. Guards patrol in double numbers, and whispered passwords are exchanged in dark alleys. A cruel lord has taxed the people to starvation, and a masked figure called "The Ember" has been rallying the oppressed. Tonight, pamphlets appeared on every door: "Rise at dawn or kneel forever."',
    questGiver: 'The Ember\'s lieutenant, who approaches the party as useful outsiders — skilled, unknown to the lord\'s spies, and expendable.',
    initialConflict: 'The party must choose sides — or try to find a middle path. The lord has powerful allies and magic. The rebellion has numbers but poor equipment. Innocents will suffer either way.',
    twist: 'The Ember is not who they seem — they are the lord\'s exiled sibling, and this is as much a family feud as a revolution. The "people\'s cause" is real, but the leader\'s motives are personal vengeance.',
    encounters: ['Infiltrating the lord\'s manor to steal battle plans', 'A street battle between guards and rebels', 'Unmasking The Ember — confrontation and choice', 'The final assault on the keep, or a desperate negotiation'],
    rewards: ['A lordship or land grant from the new ruler', 'Gold from the lord\'s confiscated treasury', 'A legendary weapon from the lord\'s armory', 'The loyalty of the freed people'],
    villainHint: 'The lord and The Ember share the same eyes. Ask the oldest servant in the manor about the family portrait that was removed.',
  },
};

// ─── Theme Flavor per Campaign Theme ─────────────────────────────────────────

export interface ThemeData {
  id: string;
  name: string;
  tone: string;
  dmPersonality: string;
  environmentFlavor: string;
  randomEvents: string[];
  lootStyle: string;
}

export const THEME_DATA: Record<string, ThemeData> = {
  'dark-fantasy': {
    id: 'dark-fantasy',
    name: 'Dark Fantasy',
    tone: 'Grim, morally gray, gothic horror. Consequences are real and choices are rarely clean. Trust is a luxury.',
    dmPersonality: 'Ominous and atmospheric. Describe decay, dread, and beauty in equal measure. Rarely let players feel safe.',
    environmentFlavor: 'Overcast skies, twisted forests, candlelit corridors, whispering winds, crows, and the smell of damp stone.',
    randomEvents: ['A stranger offers cursed help', 'Nightmares reveal hidden truths', 'An NPC ally turns traitor', 'A child sings a nursery rhyme about a monster that\'s very real'],
    lootStyle: 'Dark and double-edged. Magic items often have a cost — a sword that heals you but hurts allies, armor that whispers paranoid thoughts.',
  },
  'epic-quest': {
    id: 'epic-quest',
    name: 'Epic Quest',
    tone: 'Heroic, hopeful, grand in scale. The party is destined for greatness. Good triumphs but at a cost.',
    dmPersonality: 'Inspiring and dramatic. Paint sweeping vistas, rousing speeches, and moments of triumph.',
    environmentFlavor: 'Sunlit valleys, towering mountains, ancient temples gleaming with gold, banners flapping in the wind.',
    randomEvents: ['A prophetic vision points the way', 'An old ally returns at a crucial moment', 'The villain sends a personal challenge', 'A festival celebrates the party\'s deeds'],
    lootStyle: 'Heroic and legendary. Glowing swords, shields blessed by gods, cloaks that billow dramatically even without wind.',
  },
  mystery: {
    id: 'mystery',
    name: 'Mystery & Intrigue',
    tone: 'Suspenseful, cerebral, full of twists. Nothing is as it seems. Every NPC could be lying.',
    dmPersonality: 'Precise and deliberate. Plant clues carefully. Reward investigation and deduction. Let silence speak.',
    environmentFlavor: 'Fog-shrouded streets, locked rooms, coded messages, shifting eyes, ink-stained fingers, and the tick of a clock.',
    randomEvents: ['A key witness goes missing', 'The party finds a coded message', 'An ally is caught in a lie', 'A new body is discovered'],
    lootStyle: 'Utilitarian and clever. Decoder rings, cloaks of disguise, gloves that detect poison, maps with hidden routes.',
  },
  'dungeon-crawl': {
    id: 'dungeon-crawl',
    name: 'Dungeon Crawl',
    tone: 'Action-packed, trap-filled, monster-heavy. Kick down the door, kill the monster, take the loot. Classic D&D.',
    dmPersonality: 'Fast-paced, exciting. Describe monsters vividly, make traps feel dangerous, and make loot satisfying.',
    environmentFlavor: 'Torchlit stone corridors, echoing footsteps, dripping water, rusted iron gates, ancient carvings, and bones.',
    randomEvents: ['A wandering monster encounter', 'A trapped chest with great loot', 'A collapsing corridor', 'A rival party of adventurers in the same dungeon'],
    lootStyle: 'Abundant and exciting. Piles of gold, glowing weapons, potions of every color, and the occasional cursed trinket.',
  },
  pirate: {
    id: 'pirate',
    name: 'Pirate Adventure',
    tone: 'Swashbuckling, tropical, freedom-loving. Sea shanties, rum, treasure maps, and naval battles.',
    dmPersonality: 'Boisterous and colorful. Describe crashing waves, creaking ships, and the thrill of the open sea.',
    environmentFlavor: 'Turquoise seas, sun-bleached docks, palm-lined islands, sea caves, coral reefs, and the cry of gulls.',
    randomEvents: ['A rival pirate ship appears on the horizon', 'A message in a bottle reveals a treasure location', 'A storm threatens to capsize the ship', 'A kraken tentacle tests the hull'],
    lootStyle: 'Plundered and nautical. Enchanted compasses, cutlasses that never rust, boots of water walking, and chests of doubloons.',
  },
  underdark: {
    id: 'underdark',
    name: 'Underdark Descent',
    tone: 'Claustrophobic, alien, survival-horror. Resources are scarce. Everything down here wants to kill you or enslave you.',
    dmPersonality: 'Unsettling and immersive. Describe bioluminescent fungi, echoing caverns, and the feeling of being watched.',
    environmentFlavor: 'Total darkness, glowing mushrooms, dripping stalactites, sulfurous vents, web-choked passages, and distant screams.',
    randomEvents: ['Drow patrol spotted — hide or fight', 'A friendly deep gnome offers to trade', 'The tunnel collapses behind you', 'A flumph warns of danger ahead'],
    lootStyle: 'Alien and precious. Drow weapons (that degrade in sunlight), bioluminescent gems, rare fungi with magical properties.',
  },
};

// ─── Story Generator ─────────────────────────────────────────────────────────

export interface GeneratedStory {
  openingNarration: string;
  storyContext: string;  // fed to the DM AI as additional system prompt context
}

export function generateStoryContext(
  themeId: string,
  townId: string,
  hookId: string
): GeneratedStory {
  const theme = THEME_DATA[themeId] || THEME_DATA['epic-quest'];
  const town = TOWN_DATA[townId] || TOWN_DATA['thornhaven'];
  const hook = STORY_HOOK_DATA[hookId] || STORY_HOOK_DATA['ruins'];

  const npcList = town.keyNPCs.map(npc =>
    `  - **${npc.name}** (${npc.role}): ${npc.personality}${npc.secret ? ` [SECRET: ${npc.secret}]` : ''}`
  ).join('\n');

  const storyContext = `
SETTING: ${town.name}
${town.description}

DISTRICTS: ${town.districts.join(', ')}
LANDMARKS: ${town.landmarks.join(', ')}
TAVERN: ${town.tavern.name} — ${town.tavern.vibe}
LOCAL RUMOR: "${town.rumor}"

KEY NPCs:
${npcList}

STORY HOOK: ${hook.name}
${hook.openingSceneIngredients}
QUEST GIVER: ${hook.questGiver}
INITIAL CONFLICT: ${hook.initialConflict}
TWIST (reveal later): ${hook.twist}
VILLAIN HINT: ${hook.villainHint}

POSSIBLE ENCOUNTERS:
${hook.encounters.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}

POSSIBLE REWARDS:
${hook.rewards.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}

CAMPAIGN TONE: ${theme.tone}
DM STYLE: ${theme.dmPersonality}
ENVIRONMENT FLAVOR: ${theme.environmentFlavor}
LOOT STYLE: ${theme.lootStyle}

RANDOM EVENT IDEAS: ${theme.randomEvents.join(' | ')}
`.trim();

  const openingNarration = `Welcome to **${town.name}**. The campaign theme is *${theme.name}* and your quest is *${hook.name}*.

${hook.openingSceneIngredients}

The **${town.tavern.name}** beckons. ${town.rumor}`;

  return { openingNarration, storyContext };
}
