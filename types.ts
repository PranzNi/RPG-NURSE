
export interface Stats {
  physique: number; // Damage
  defense: number;  // Damage Reduction
  stamina: number;  // Max HP
  intellect: number; // Max MP + Crit Chance
}

export interface Item {
  id: string;
  name: string;
  description: string;
  cost: number;
  effectType: 'heal_hp' | 'heal_mp' | 'buff_xp';
  effectValue: number;
  icon: string; // Using string to reference icon name for mapping or rendering
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  cooldown: number; // Turns
  levelReq: number;
  statReq?: { stat: keyof Stats; value: number }; // Optional stat requirement
  icon: string;
}

export interface Dungeon {
  id: string;
  name: string;
  topic: string; // The prompt context for Gemini
  description: string;
  recommendedLevel: number;
  icon: string;
}

export interface Player {
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stats: Stats;
  statPoints: number;
  name: string;
  gold: number;
  inventory: Record<string, number>; // ItemId -> Quantity
  activeBuffs: {
    xpBoost: number; // Number of charges (encounters) remaining
    barrier: number; // Turns remaining
    adrenaline: boolean; // Next hit
  };
  activeDebuffs: {
    poison: number; // Turns
    burn: number; // Turns
  };
  cooldowns: Record<string, number>; // AbilityId -> Turns remaining
}

export interface Monster {
  id: string;
  name: string;
  description: string;
  level: number;
  hp: number;
  maxHp: number;
  damage: number;
  imageUrl?: string;
  // Deprecated boolean in favor of activeDebuffs.stunned, but kept for safe transitions if needed
  isStunned?: boolean; 
  activeDebuffs: {
    stunned: number; // Turns
    poison: number; // Turns
    burn: number; // Turns
  };
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: number;
  category: string;
}

export enum GameState {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  START_MENU = 'START_MENU',
  DUNGEON_SELECT = 'DUNGEON_SELECT', // New State
  LOADING_ENCOUNTER = 'LOADING_ENCOUNTER',
  BATTLE = 'BATTLE',
  LEVEL_UP = 'LEVEL_UP',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY' // Round victory
}

export type LogType = 'damage' | 'heal' | 'info' | 'crit' | 'error' | 'danger' | 'success' | 'loot' | 'ability';

export interface CombatLog {
  id: string;
  message: string;
  type: LogType;
}