'use strict';

export const TANK = 'Tank'
export const HEALER = 'Healer'
export const DPS = 'DPS'
export const GATHERER = 'Gatherer'
export const CRAFTER = 'Crafter'
export const jobDictionary = {
  'AST': {
    name: 'Astrologian',
    role: HEALER,
  },
  'BLM': {
    name: 'Black Mage',
    role: DPS,
  },
  'BRD': {
    name: 'Bard',
    role: DPS,
  },
  'DNC': {
    name: 'Dancer',
    role: DPS,
  },
  'DRG': {
    name: 'Dragoon',
    role: DPS,
  },
  'DRK': {
    name: 'Dark Knight',
    role: TANK,
  },
  'GNB': {
    name: 'Gunbreaker',
    role: TANK,
  },
  'MCH': {
    name: 'Machinist',
    role: DPS,
  },
  'MNK': {
    name: 'Monk',
    role: DPS,
  },
  'NIN': {
    name: 'Ninja',
    role: DPS,
  },
  'PLD': {
    name: 'Paladin',
    role: TANK,
  },
  'RDM': {
    name: 'Red Mage',
    role: DPS,
  },
  'SAM': {
    name: 'Samurai',
    role: DPS,
  },
  'SCH': {
    name: 'Scholar',
    role: HEALER,
  },
  'SMN': {
    name: 'Summoner',
    role: DPS,
  },
  'WAR': {
    name: 'Warrior',
    role: TANK,
  },
  'WHM': {
    name: 'White Mage',
    role: HEALER,
  },
  'BLU': {
    name: 'Blue Mage',
    role: DPS,
  },
  'LMB': {
    name: 'Limit Break',
    role: 'LMB',
  },
  'PET': {
    name: 'Pet',
    role: 'PET',
  },
  'MOB': {
    name: 'Monster',
    role: 'MOB',
  },
  'ACN': {
    name: 'Arcanist',
    role: DPS,
  },
  'ARC': {
    name: 'Archer',
    role: DPS,
  },
  'CNJ': {
    name: 'Conjurer',
    role: HEALER,
  },
  'GLA': {
    name: 'Gladiator',
    role: TANK,
  },
  'LNC': {
    name: 'Lancer',
    role: DPS,
  },
  'MRD': {
    name: 'Marauder',
    role: DPS,
  },
  'PGL': {
    name: 'Pugilist',
    role: DPS,
  },
  'ROG': {
    name: 'Rogue',
    role: DPS,
  },
  'THM': {
    name: 'Thaumaturge',
    role: DPS,
  },
  'BTN': {
    name: 'Botanist',
    role: GATHERER,
  },
  'FSH': {
    name: 'Fisher',
    role: GATHERER,
  },
  'MIN': {
    name: 'Miner',
    role: GATHERER,
  },
  'ALC': {
    name: 'Alchemist',
    role: CRAFTER,
  },
  'ARM': {
    name: 'Armorer',
    role: CRAFTER,
  },
  'BSM': {
    name: 'Blacksmith',
    role: CRAFTER,
  },
  'CRP': {
    name: 'Carpenter',
    role: CRAFTER,
  },
  'CUL': {
    name: 'Culinarian',
    role: CRAFTER,
  },
  'GSM': {
    name: 'Goldsmith',
    role: CRAFTER,
  },
  'LTW': {
    name: 'Leatherworker',
    role: CRAFTER,
  },
  'WVR': {
    name: 'Weaver',
    role: CRAFTER,
  },
  'MIS': {
    name: 'Missing',
    role: 'Missing',
  },
}
export const percentFormat = '00.0'
