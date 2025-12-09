
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Heart, Shield, Zap, Brain, Sword, Skull, 
  Activity, Play, CheckCircle2, XCircle, ChevronRight, RotateCcw,
  LogIn, UserPlus, Save, LogOut, Menu, DollarSign,
  Syringe, Stethoscope, ShieldAlert, Timer, Map, Lock, ArrowLeft
} from 'lucide-react';
import { GameState, Player, Monster, Question, CombatLog, Stats, Item, Ability, Dungeon } from './types';
import { generateMonster, generateNursingQuestion } from './services/geminiService';
import { authService } from './services/authService';
import { soundService } from './services/soundService';
import { ProgressBar } from './components/ProgressBar';
import { CombatEffects, CombatEffect, EffectType } from './components/CombatEffects';
import { GameMenu } from './components/GameMenu';
import { StatusBadges, VisualStatus } from './components/StatusBadges';

// --- Constants & Helper Configs ---
const INITIAL_STATS: Stats = {
  physique: 5,
  defense: 5,
  stamina: 5,
  intellect: 5,
};

const DUNGEONS: Dungeon[] = [
  {
    id: 'foundation',
    name: 'Hall of Foundations',
    topic: 'Theoretical Foundations in Nursing',
    description: 'Where nursing history and theories come alive to haunt you.',
    recommendedLevel: 1,
    icon: 'scroll'
  },
  {
    id: 'biochem',
    name: 'Biochem Lab',
    topic: 'Biochemistry for Nursing',
    description: 'Mutated enzymes and unstable compounds abound.',
    recommendedLevel: 2,
    icon: 'flask'
  },
  {
    id: 'assessment',
    name: 'Assessment Wing',
    topic: 'Health Assessment',
    description: 'Test your observation skills against hidden threats.',
    recommendedLevel: 3,
    icon: 'eye'
  },
  {
    id: 'fundamentals',
    name: 'Fundamentals Ward',
    topic: 'Fundamentals of Nursing Practice',
    description: 'The core procedures. Master the basics or perish.',
    recommendedLevel: 5,
    icon: 'clipboard'
  },
  {
    id: 'health_ed',
    name: 'Education Center',
    topic: 'Health Education',
    description: 'Teaching is the best way to learn... and fight.',
    recommendedLevel: 6,
    icon: 'book'
  },
  {
    id: 'microbio',
    name: 'Petri Dish Pits',
    topic: 'Microbiology & Parasitology',
    description: 'Face the microscopic monsters at macro scale.',
    recommendedLevel: 8,
    icon: 'microscope'
  },
  {
    id: 'community',
    name: 'Community Outpost',
    topic: 'Community Health Nursing I (Individual and Family)',
    description: 'Public health crises manifesting as physical foes.',
    recommendedLevel: 10,
    icon: 'users'
  },
  {
    id: 'nutrition',
    name: 'Dietary Kitchen',
    topic: 'Nutrition and Diet Therapy',
    description: 'You are what you eat. Don\'t get eaten.',
    recommendedLevel: 12,
    icon: 'apple'
  },
  {
    id: 'mcn',
    name: 'Maternal & Child Ward',
    topic: 'Care of Mother, Child, Adolescent (Well Clients)',
    description: 'Protect the vulnerable from complex complications.',
    recommendedLevel: 15,
    icon: 'baby'
  }
];

const ABILITIES: Ability[] = [
  {
    id: 'triage',
    name: 'Triage',
    description: 'Stun monster for 1 turn (Prevents next attack).',
    mpCost: 15,
    cooldown: 4,
    levelReq: 3,
    statReq: { stat: 'intellect', value: 10 },
    icon: 'triage'
  },
  {
    id: 'barrier',
    name: 'Barrier Cream',
    description: 'Reduce incoming damage by 50% for 3 turns.',
    mpCost: 20,
    cooldown: 5,
    levelReq: 2,
    statReq: { stat: 'defense', value: 8 },
    icon: 'barrier'
  },
  {
    id: 'adrenaline',
    name: 'Adrenaline',
    description: 'Next attack deals 200% damage.',
    mpCost: 25,
    cooldown: 3,
    levelReq: 5,
    statReq: { stat: 'physique', value: 12 },
    icon: 'adrenaline'
  }
];

const GAME_ITEMS: Item[] = [
  { 
    id: 'coffee', 
    name: 'Stale Hospital Coffee', 
    description: 'Restores 30 Mana. Tastes like mud.', 
    cost: 50, 
    effectType: 'heal_mp', 
    effectValue: 30, 
    icon: 'coffee' 
  },
  { 
    id: 'saline', 
    name: 'Sterile Saline', 
    description: 'Restores 50 HP. Basic hydration.', 
    cost: 30, 
    effectType: 'heal_hp', 
    effectValue: 50, 
    icon: 'droplet' 
  },
  { 
    id: 'textbook', 
    name: 'NCLEX Review Book', 
    description: '+50% XP for next 5 victories.', 
    cost: 100, 
    effectType: 'buff_xp', 
    effectValue: 5, 
    icon: 'book' 
  }
];

const BASE_HP = 50;
const BASE_MP = 20;

const MANA_COST_HEAL = 30;
const HEAL_AMOUNT_BASE = 25;

const calculateMaxHp = (stamina: number) => BASE_HP + (stamina * 10);
const calculateMaxMp = (intellect: number) => BASE_MP + (intellect * 5);
const calculateDamage = (physique: number) => 10 + (physique * 2);
const calculateCritChance = (intellect: number) => Math.min(50, intellect * 2); // Cap at 50%

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(GameState.LOGIN);
  const [currentUser, setCurrentUser] = useState<string | null>(null); // This is now the Display Name
  
  // Auth Form State
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState(''); // For registration
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settings, setSettings] = useState({
    lowMotion: false,
    soundEnabled: true
  });

  const [player, setPlayer] = useState<Player>({
    name: "Nurse Novice",
    level: 1,
    xp: 0,
    xpToNext: 100,
    hp: calculateMaxHp(INITIAL_STATS.stamina),
    maxHp: calculateMaxHp(INITIAL_STATS.stamina),
    mp: calculateMaxMp(INITIAL_STATS.intellect),
    maxMp: calculateMaxMp(INITIAL_STATS.intellect),
    stats: { ...INITIAL_STATS },
    statPoints: 0,
    gold: 50,
    inventory: {},
    activeBuffs: { xpBoost: 0, barrier: 0, adrenaline: false },
    activeDebuffs: { poison: 0, burn: 0 },
    cooldowns: {}
  });

  const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(null);
  const [monster, setMonster] = useState<Monster | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [logs, setLogs] = useState<CombatLog[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(false);

  // Visual Effects State
  const [monsterEffects, setMonsterEffects] = useState<CombatEffect[]>([]);
  const [playerEffects, setPlayerEffects] = useState<CombatEffect[]>([]);
  const [shake, setShake] = useState<'player' | 'monster' | null>(null);
  const [screenFlash, setScreenFlash] = useState<'red' | 'green' | null>(null);
  
  // Ref for auto-scrolling logs
  const logsEndRef = useRef<HTMLDivElement>(null);
  // Ref to debounce save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Effects ---
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Sync sound settings
  useEffect(() => {
    soundService.setMuted(!settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Auto-save when player state changes meaningfully (Debounced)
  useEffect(() => {
    if (currentUser && player && gameState !== GameState.LOGIN && gameState !== GameState.REGISTER) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(() => {
        authService.saveProgress(player);
      }, 2000); // Save after 2 seconds of inactivity
    }
    
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    }
  }, [player.level, player.xp, player.statPoints, player.stats, player.gold, player.inventory, player.cooldowns, player.activeBuffs, player.activeDebuffs, currentUser]); 

  // --- Helpers ---
  const addLog = (message: string, type: CombatLog['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-4), { id: crypto.randomUUID(), message, type }]);
  };

  const createNewPlayer = (name: string): Player => ({
    name: name,
    level: 1,
    xp: 0,
    xpToNext: 100,
    hp: calculateMaxHp(INITIAL_STATS.stamina),
    maxHp: calculateMaxHp(INITIAL_STATS.stamina),
    mp: calculateMaxMp(INITIAL_STATS.intellect),
    maxMp: calculateMaxMp(INITIAL_STATS.intellect),
    stats: { ...INITIAL_STATS },
    statPoints: 0,
    gold: 50, // Starter money
    inventory: {},
    activeBuffs: { xpBoost: 0, barrier: 0, adrenaline: false },
    activeDebuffs: { poison: 0, burn: 0 },
    cooldowns: {}
  });

  const getPlayerVisualStatuses = (p: Player): VisualStatus[] => {
    const statuses: VisualStatus[] = [];
    if (p.activeBuffs.barrier > 0) {
      statuses.push({ 
        id: 'barrier', label: 'Barrier', icon: 'shield', type: 'buff', 
        value: `${p.activeBuffs.barrier}t`, description: 'Reduces damage by 50%' 
      });
    }
    if (p.activeBuffs.adrenaline) {
      statuses.push({ 
        id: 'adrenaline', label: 'Adrenaline', icon: 'zap', type: 'buff', 
        description: 'Next attack deals 200% damage' 
      });
    }
    if (p.activeBuffs.xpBoost > 0) {
      statuses.push({ 
        id: 'xp', label: 'Study Buff', icon: 'book', type: 'buff', 
        value: `${p.activeBuffs.xpBoost}`, description: '+50% XP Gain' 
      });
    }
    if (p.activeDebuffs.poison > 0) {
      statuses.push({
        id: 'poison', label: 'Poison', icon: 'skull', type: 'debuff',
        value: `${p.activeDebuffs.poison}t`, description: 'Taking damage over time'
      });
    }
    if (p.activeDebuffs.burn > 0) {
      statuses.push({
        id: 'burn', label: 'Burn', icon: 'flame', type: 'debuff',
        value: `${p.activeDebuffs.burn}t`, description: 'Taking fire damage'
      });
    }
    return statuses;
  };

  const getMonsterVisualStatuses = (m: Monster | null): VisualStatus[] => {
    if (!m) return [];
    const statuses: VisualStatus[] = [];
    
    // Check both legacy flag and new structure for backward compatibility
    if (m.isStunned || (m.activeDebuffs?.stunned || 0) > 0) {
      statuses.push({ 
        id: 'stun', label: 'Stunned', icon: 'stun', type: 'debuff', 
        description: 'Cannot attack next turn' 
      });
    }
    if ((m.activeDebuffs?.poison || 0) > 0) {
      statuses.push({ 
        id: 'm_poison', label: 'Poisoned', icon: 'skull', type: 'debuff', 
        value: `${m.activeDebuffs.poison}t`, description: 'Taking damage each turn' 
      });
    }
    return statuses;
  };

  // --- Visual Effects Helpers ---
  const triggerMonsterEffect = (text: string, type: EffectType) => {
    const id = crypto.randomUUID();
    setMonsterEffects(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMonsterEffects(prev => prev.filter(e => e.id !== id));
    }, 1000);
  };

  const triggerPlayerEffect = (text: string, type: EffectType) => {
    const id = crypto.randomUUID();
    setPlayerEffects(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setPlayerEffects(prev => prev.filter(e => e.id !== id));
    }, 1000);
  };

  const triggerShake = (target: 'player' | 'monster') => {
    if (settings.lowMotion) return;
    setShake(target);
    setTimeout(() => setShake(null), 500);
  };

  const triggerFlash = (color: 'red' | 'green') => {
    if (settings.lowMotion) return;
    setScreenFlash(color);
    setTimeout(() => setScreenFlash(null), 500);
  };

  // --- Auth Actions ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError('');
    
    const result = await authService.login(authUsername, authPassword);
    
    if (result.success) {
      const displayName = result.username || authUsername;
      setCurrentUser(displayName);
      
      if (result.data) {
        // Migration check/Safety check for loaded data
        const loadedPlayer = result.data;
        if (loadedPlayer.gold === undefined) loadedPlayer.gold = 50;
        if (!loadedPlayer.inventory) loadedPlayer.inventory = {};
        if (!loadedPlayer.activeBuffs) loadedPlayer.activeBuffs = { xpBoost: 0, barrier: 0, adrenaline: false };
        if (!loadedPlayer.activeDebuffs) loadedPlayer.activeDebuffs = { poison: 0, burn: 0 };
        if (!loadedPlayer.cooldowns) loadedPlayer.cooldowns = {};
        setPlayer(loadedPlayer);
      } else {
        const newP = createNewPlayer(displayName);
        setPlayer(newP);
        authService.saveProgress(newP);
      }
      setGameState(GameState.START_MENU);
      soundService.playClick();
    } else {
      setAuthError(result.message);
      soundService.playError();
    }
    setIsAuthLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername || !authPassword || !authDisplayName) {
        setAuthError("Please fill in all fields");
        soundService.playError();
        return;
    }
    
    setIsAuthLoading(true);
    setAuthError('');
    
    const result = await authService.register(authUsername, authPassword, authDisplayName);
    
    if (result.success) {
      setAuthError(''); // Clear error
      setGameState(GameState.LOGIN);
      addLog("Registration successful. Please login.", 'success');
      soundService.playClick();
    } else {
      setAuthError(result.message);
      soundService.playError();
    }
    setIsAuthLoading(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsMenuOpen(false);
    setCurrentUser(null);
    setAuthUsername('');
    setAuthPassword('');
    setAuthDisplayName('');
    setGameState(GameState.LOGIN);
    soundService.playClick();
  };

  const handleManualSave = () => {
    if (currentUser) {
        authService.saveProgress(player);
        addLog("Game Saved to Cloud.", 'success');
        setIsMenuOpen(false);
        soundService.playHeal(); // Success sound
    }
  };

  // --- Game Loop Actions ---
  const goToDungeonSelect = () => {
    soundService.playClick();
    if (player.hp <= 0) {
        setPlayer(prev => ({ ...prev, hp: prev.maxHp, mp: prev.maxMp }));
    }
    setGameState(GameState.DUNGEON_SELECT);
  };

  const selectDungeon = (dungeon: Dungeon) => {
    if (player.level < dungeon.recommendedLevel) {
        soundService.playError();
        return;
    }
    soundService.playClick();
    setSelectedDungeon(dungeon);
    setLogs([]);
    startEncounter(dungeon);
  };

  const startEncounter = async (dungeon: Dungeon) => {
    setGameState(GameState.LOADING_ENCOUNTER);
    setLoading(true);
    setMonster(null);
    setQuestion(null);
    setIsAnswered(false);
    setSelectedOption(null);
    setMonsterEffects([]);
    setPlayerEffects([]);

    // Reset combat temporary buffs (but keep XP boost)
    setPlayer(prev => ({
        ...prev,
        activeBuffs: { ...prev.activeBuffs, barrier: 0, adrenaline: false },
        activeDebuffs: { poison: 0, burn: 0 }
    }));

    try {
      // Pass the dungeon topic to generation services
      const newMonster = await generateMonster(player.level, dungeon.topic);
      // Ensure new monster has activeDebuffs initialized
      newMonster.activeDebuffs = { stunned: 0, poison: 0, burn: 0 };
      
      const newQuestion = await generateNursingQuestion(player.level, dungeon.topic);
      
      setMonster(newMonster);
      setQuestion(newQuestion);
      setGameState(GameState.BATTLE);
      addLog(`Entering ${dungeon.name}...`, 'info');
      addLog(`A wild ${newMonster.name} appeared!`, 'danger');
    } catch (e) {
      addLog("Something went wrong summoning the encounter...", 'error');
      setGameState(GameState.DUNGEON_SELECT);
    } finally {
      setLoading(false);
    }
  };

  const tickCooldowns = () => {
    setPlayer(prev => {
      const nextCooldowns = { ...prev.cooldowns };
      Object.keys(nextCooldowns).forEach(key => {
        if (nextCooldowns[key] > 0) nextCooldowns[key] -= 1;
      });
      
      // Tick buffs
      const nextBuffs = { ...prev.activeBuffs };
      if (nextBuffs.barrier > 0) nextBuffs.barrier -= 1;

      // Tick Debuffs
      const nextDebuffs = { ...prev.activeDebuffs };
      if (nextDebuffs.poison > 0) nextDebuffs.poison -= 1;
      if (nextDebuffs.burn > 0) nextDebuffs.burn -= 1;

      return {
        ...prev,
        cooldowns: nextCooldowns,
        activeBuffs: nextBuffs,
        activeDebuffs: nextDebuffs
      };
    });

    // Tick Monster Debuffs
    setMonster(prev => {
      if (!prev) return null;
      const nextDebuffs = { ...prev.activeDebuffs };
      if (nextDebuffs.stunned > 0) nextDebuffs.stunned -= 1;
      // Sync legacy flag
      const isStunned = nextDebuffs.stunned > 0;
      
      return { ...prev, activeDebuffs: nextDebuffs, isStunned };
    });
  };

  const handleAnswer = (index: number) => {
    if (isAnswered || !monster || !question) return;
    
    setSelectedOption(index);
    setIsAnswered(true);
    tickCooldowns(); // Turns progress on answer

    const isCorrect = index === question.correctIndex;

    if (isCorrect) {
      handlePlayerAttack();
    } else {
      // Check stun logic using new structure
      if ((monster.activeDebuffs?.stunned || 0) > 0 || monster.isStunned) {
        addLog(`${monster.name} is STUNNED and cannot attack!`, 'success');
        triggerMonsterEffect("STUNNED", 'damage');
        soundService.playClick(); // Small click for turn skip
        // Consume stun charge
        setMonster(prev => {
            if (!prev) return null;
            return {
                ...prev,
                isStunned: false,
                activeDebuffs: { ...prev.activeDebuffs, stunned: 0 }
            }
        });
        setTimeout(nextRound, 2000);
      } else {
        addLog("Incorrect! The monster counter-attacks!", 'danger');
        soundService.playError();
        handleMonsterAttack();
      }
    }
  };

  const handlePlayerAttack = () => {
    if (!monster) return;

    let baseDmg = calculateDamage(player.stats.physique);
    const critChance = calculateCritChance(player.stats.intellect);
    const isCrit = Math.random() * 100 < critChance;
    
    // Adrenaline Check
    if (player.activeBuffs.adrenaline) {
        baseDmg *= 2;
        addLog("Adrenaline Surge! Damage doubled!", 'ability');
        triggerPlayerEffect("ADRENALINE", 'crit');
        // Consume Adrenaline
        setPlayer(prev => ({ ...prev, activeBuffs: { ...prev.activeBuffs, adrenaline: false } }));
    }

    let finalDmg = isCrit ? baseDmg * 2 : baseDmg;
    finalDmg = Math.floor(finalDmg);

    setMonster(prev => prev ? { ...prev, hp: Math.max(0, prev.hp - finalDmg) } : null);
    
    // Visual Effects
    triggerMonsterEffect(`-${finalDmg}`, isCrit ? 'crit' : 'damage');
    triggerPlayerEffect("+5 MP", 'mana');
    
    // Sound Effects
    if (isCrit) {
        soundService.playCrit();
        triggerShake('monster');
    } else {
        soundService.playAttack();
    }
    
    // Mana Gain on hit
    setPlayer(prev => ({ ...prev, mp: Math.min(prev.maxMp, prev.mp + 5) }));

    if (isCrit) {
      addLog(`CRITICAL HIT! You dealt ${finalDmg} damage to ${monster.name}!`, 'crit');
    } else {
      addLog(`Correct! You dealt ${finalDmg} damage.`, 'damage');
    }

    if (monster.hp - finalDmg <= 0) {
      setTimeout(handleVictory, 1000);
    } else {
      setTimeout(nextRound, 2000);
    }
  };

  const handleMonsterAttack = () => {
    if (!monster) return;

    // Mitigation
    let defense = player.stats.defense;
    const rawDmg = monster.damage;
    let mitigatedDmg = Math.max(1, rawDmg - Math.floor(defense / 2));

    // Barrier Check
    if (player.activeBuffs.barrier > 0) {
        mitigatedDmg = Math.floor(mitigatedDmg * 0.5);
        addLog("Barrier absorbed 50% damage!", 'ability');
        triggerPlayerEffect("BLOCKED", 'mana');
    }

    setPlayer(prev => ({ ...prev, hp: Math.max(0, prev.hp - mitigatedDmg) }));
    addLog(`${monster.name} hits you for ${mitigatedDmg} damage!`, 'danger');

    // Effects
    soundService.playDamage();
    triggerPlayerEffect(`-${mitigatedDmg}`, 'damage');
    triggerShake('player');
    triggerFlash('red');

    if (player.hp - mitigatedDmg <= 0) {
      setTimeout(() => setGameState(GameState.GAME_OVER), 1000);
    } else {
      setTimeout(nextRound, 2000);
    }
  };

  const useAbility = (abilityId: string) => {
    if (gameState !== GameState.BATTLE || isAnswered || !monster) return;

    if (abilityId === 'heal') {
        return; 
    }

    const ability = ABILITIES.find(a => a.id === abilityId);
    if (!ability) return;

    // Checks
    if (player.mp < ability.mpCost) {
        addLog("Not enough Mana!", 'error');
        soundService.playError();
        return;
    }
    if ((player.cooldowns[abilityId] || 0) > 0) {
        addLog(`${ability.name} is on cooldown!`, 'error');
        soundService.playError();
        return;
    }

    // Apply Cost
    setPlayer(prev => ({
        ...prev,
        mp: prev.mp - ability.mpCost,
        cooldowns: { ...prev.cooldowns, [abilityId]: ability.cooldown }
    }));

    // Apply Effects
    soundService.playMana(); // Ability sound
    switch (abilityId) {
        case 'triage':
            setMonster(prev => {
                if(!prev) return null;
                return {
                    ...prev,
                    isStunned: true,
                    activeDebuffs: { ...prev.activeDebuffs, stunned: 1 }
                }
            });
            addLog(`You used Triage! ${monster.name} is Stunned for 1 turn.`, 'ability');
            triggerMonsterEffect("STUNNED", 'damage');
            break;
        case 'barrier':
            setPlayer(prev => ({
                ...prev,
                activeBuffs: { ...prev.activeBuffs, barrier: 3 }
            }));
            addLog("Barrier Cream applied! Defense up for 3 turns.", 'ability');
            triggerPlayerEffect("BARRIER UP", 'heal');
            break;
        case 'adrenaline':
            setPlayer(prev => ({
                ...prev,
                activeBuffs: { ...prev.activeBuffs, adrenaline: true }
            }));
            addLog("Adrenaline injection! Next attack doubled.", 'ability');
            triggerPlayerEffect("SURGE", 'crit');
            break;
    }
  };

  const useHeal = () => {
    if (gameState !== GameState.BATTLE || isAnswered) return;
    if (player.mp >= MANA_COST_HEAL) {
      const healAmt = HEAL_AMOUNT_BASE + (player.stats.intellect * 2);
      setPlayer(prev => ({
        ...prev,
        mp: prev.mp - MANA_COST_HEAL,
        hp: Math.min(prev.maxHp, prev.hp + healAmt)
      }));
      addLog(`You healed for ${healAmt} HP.`, 'heal');
      
      soundService.playHeal();
      triggerPlayerEffect(`+${healAmt}`, 'heal');
      triggerPlayerEffect(`-${MANA_COST_HEAL} MP`, 'mana');
      triggerFlash('green');
    } else {
      addLog("Not enough Mana!", 'error');
      triggerPlayerEffect("No Mana!", 'damage');
      soundService.playError();
    }
  };

  const nextRound = async () => {
    if (gameState === GameState.GAME_OVER) return;

    setLoading(true);
    setIsAnswered(false);
    setSelectedOption(null);
    try {
        // Continue with current dungeon topic
        const topic = selectedDungeon?.topic || "General Nursing";
        const newQuestion = await generateNursingQuestion(player.level, topic);
        setQuestion(newQuestion);
    } catch (e) {
        addLog("Failed to fetch next question.", 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleVictory = () => {
    if (!monster) return;
    
    // XP Calculation with Buffs
    let xpGain = 40 + (monster.level * 10);
    let wasBuffed = false;

    if (player.activeBuffs.xpBoost > 0) {
        xpGain = Math.floor(xpGain * 1.5);
        wasBuffed = true;
    }

    const newXp = player.xp + xpGain;
    
    // Gold Calculation
    const goldGain = 20 + (monster.level * 5);

    // Update state once
    setPlayer(prev => {
        const nextBuffs = { ...prev.activeBuffs };
        if (nextBuffs.xpBoost > 0) nextBuffs.xpBoost -= 1;
        // Reset combat buffs on victory
        nextBuffs.barrier = 0;
        nextBuffs.adrenaline = false;
        
        // Reset Debuffs
        const nextDebuffs = { ...prev.activeDebuffs };
        nextDebuffs.poison = 0;
        nextDebuffs.burn = 0;

        const isLevelUp = newXp >= prev.xpToNext;
        let newState = {
            ...prev,
            xp: newXp,
            gold: prev.gold + goldGain,
            activeBuffs: nextBuffs,
            activeDebuffs: nextDebuffs,
            cooldowns: {} // Reset cooldowns on victory
        };

        if (isLevelUp) {
            newState = {
                ...newState,
                xp: newXp - prev.xpToNext,
                xpToNext: Math.floor(prev.xpToNext * 1.5),
                level: prev.level + 1,
                statPoints: prev.statPoints + 3,
                hp: calculateMaxHp(prev.stats.stamina), // Full heal on lvl up
                mp: calculateMaxMp(prev.stats.intellect)
            };
        }
        return newState;
    });
    
    addLog(`Victory!`, 'success');
    addLog(`Found ${goldGain} Gold.`, 'loot');
    addLog(`Gained ${xpGain} XP${wasBuffed ? ' (Buffed!)' : ''}.`, 'success');
    
    triggerPlayerEffect(`+${xpGain} XP`, 'xp');
    triggerPlayerEffect(`+$${goldGain}`, 'xp'); 

    if (newXp >= player.xpToNext) {
       addLog(`LEVEL UP! You are now level ${player.level + 1}!`, 'success');
       triggerPlayerEffect("LEVEL UP!", 'xp');
       soundService.playLevelUp();
    } else {
       soundService.playVictory();
    }
    
    setGameState(GameState.VICTORY);
  };

  const handleStatAllocate = (stat: keyof Stats) => {
    if (player.statPoints > 0) {
      soundService.playHeal();
      setPlayer(prev => {
        const newStats = { ...prev.stats, [stat]: prev.stats[stat] + 1 };
        const newMaxHp = calculateMaxHp(newStats.stamina);
        const newMaxMp = calculateMaxMp(newStats.intellect);
        
        const hpDiff = newMaxHp - prev.maxHp;
        const mpDiff = newMaxMp - prev.maxMp;

        return {
          ...prev,
          stats: newStats,
          statPoints: prev.statPoints - 1,
          maxHp: newMaxHp,
          hp: prev.hp + hpDiff, 
          maxMp: newMaxMp,
          mp: prev.mp + mpDiff
        };
      });
    }
  };

  const handleBuyItem = (item: Item) => {
    if (player.gold >= item.cost) {
      soundService.playClick();
      setPlayer(prev => {
        const newInv = { ...prev.inventory };
        newInv[item.id] = (newInv[item.id] || 0) + 1;
        return {
          ...prev,
          gold: prev.gold - item.cost,
          inventory: newInv
        };
      });
    } else {
        soundService.playError();
    }
  };

  const handleUseItem = (item: Item) => {
    if ((player.inventory[item.id] || 0) > 0) {
      let used = false;
      setPlayer(prev => {
        const next = { ...prev };
        
        if (item.effectType === 'heal_hp') {
            if (next.hp >= next.maxHp) return prev; 
            next.hp = Math.min(next.maxHp, next.hp + item.effectValue);
            used = true;
        } else if (item.effectType === 'heal_mp') {
            if (next.mp >= next.maxMp) return prev;
            next.mp = Math.min(next.maxMp, next.mp + item.effectValue);
            used = true;
        } else if (item.effectType === 'buff_xp') {
            next.activeBuffs = { ...next.activeBuffs, xpBoost: next.activeBuffs.xpBoost + item.effectValue };
            used = true;
        }

        if (used) {
            const newInv = { ...next.inventory };
            newInv[item.id] -= 1;
            if (newInv[item.id] <= 0) delete newInv[item.id];
            next.inventory = newInv;
            return next;
        }
        return prev;
      });

      if (used) {
          addLog(`Used ${item.name}.`, 'heal');
          triggerFlash('green');
          soundService.playHeal();
      } else {
          soundService.playError();
      }
    }
  };

  const renderAbilityIcon = (iconName: string, size = 18) => {
    switch (iconName) {
        case 'triage': return <Stethoscope size={size} />;
        case 'barrier': return <ShieldAlert size={size} />;
        case 'adrenaline': return <Syringe size={size} />;
        default: return <Zap size={size} />;
    }
  };

  const renderDungeonIcon = (iconName: string, size = 24) => {
    switch(iconName) {
        case 'scroll': return <Map size={size} />;
        case 'flask': return <Syringe size={size} />; // Reuse syringe for lab
        case 'eye': return <Stethoscope size={size} />; // Reuse scope
        case 'clipboard': return <CheckCircle2 size={size} />;
        case 'book': return <Map size={size} />;
        case 'microscope': return <Skull size={size} />;
        case 'users': return <Activity size={size} />;
        case 'apple': return <Heart size={size} />;
        case 'baby': return <UserPlus size={size} />;
        default: return <Map size={size} />;
    }
  };

  const renderAuthContainer = (title: string, onSubmit: (e: React.FormEvent) => void, submitText: string, switchView: () => void, switchText: string, isRegister = false) => (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80')] bg-cover bg-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full max-w-md bg-rpg-card p-8 rounded-2xl border border-gray-700 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-rpg-primary/20 rounded-full border border-rpg-primary">
             <LogIn size={40} className="text-rpg-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-retro text-center text-white mb-6 text-shadow">{title}</h2>
        
        {authError && (
          <div className="mb-4 p-3 bg-rpg-danger/20 border border-rpg-danger rounded text-rpg-danger text-sm text-center font-bold">
            {authError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Username</label>
            <input 
              type="text" 
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-rpg-primary focus:ring-1 focus:ring-rpg-primary outline-none transition-colors"
              placeholder="nurse_hero_123"
              required
            />
          </div>
          
          {isRegister && (
             <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">Character Name</label>
                <input 
                  type="text" 
                  value={authDisplayName}
                  onChange={(e) => setAuthDisplayName(e.target.value)}
                  className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-rpg-primary focus:ring-1 focus:ring-rpg-primary outline-none transition-colors"
                  placeholder="Nurse Joy"
                  required
                />
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Password</label>
            <input 
              type="password" 
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-rpg-primary focus:ring-1 focus:ring-rpg-primary outline-none transition-colors"
              placeholder="Enter password"
              required
              minLength={6}
            />
          </div>
          <button 
            type="submit"
            disabled={isAuthLoading}
            className={`w-full py-3 mt-4 bg-rpg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition-transform active:scale-95 shadow-lg shadow-blue-500/20 flex justify-center items-center ${isAuthLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isAuthLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : submitText}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={switchView}
            className="text-gray-400 hover:text-white text-sm underline decoration-gray-500 hover:decoration-white transition-colors"
          >
            {switchText}
          </button>
        </div>
      </div>
    </div>
  );

  if (gameState === GameState.LOGIN) {
    return renderAuthContainer(
      "Login", 
      handleLogin, 
      "Enter World", 
      () => { setAuthError(''); setGameState(GameState.REGISTER); }, 
      "New recruit? Register here"
    );
  }

  if (gameState === GameState.REGISTER) {
    return renderAuthContainer(
      "Register", 
      handleRegister, 
      "Create Account", 
      () => { setAuthError(''); setGameState(GameState.LOGIN); }, 
      "Already have an account? Login",
      true
    );
  }

  if (gameState === GameState.START_MENU) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
        <div className="relative z-10 text-center p-8 max-w-2xl mx-4">
          <div className="mb-6 inline-block p-4 bg-rpg-primary/20 rounded-full border border-rpg-primary animate-pulse">
            <Activity size={64} className="text-rpg-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-retro text-white mb-4 leading-tight text-shadow">
            NURSE RPG
            <span className="block text-xl md:text-3xl text-rpg-accent mt-2 font-sans font-bold tracking-widest">CLINICAL COMBAT</span>
          </h1>
          <p className="text-gray-300 text-base md:text-lg mb-8 max-w-lg mx-auto">
            Welcome back, <span className="text-rpg-primary font-bold">{player.name}</span>. Level {player.level}.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
             <button 
                onClick={goToDungeonSelect}
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-rpg-primary font-lg rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:scale-105 shadow-lg shadow-blue-500/30 w-full md:w-auto"
            >
                <Play className="mr-2 group-hover:animate-bounce" />
                START GAME
            </button>
            <button 
                onClick={handleLogout}
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-gray-300 transition-all duration-200 bg-gray-800 font-lg rounded-lg hover:bg-gray-700 hover:text-white border border-gray-600 w-full md:w-auto"
            >
                <LogOut className="mr-2" />
                LOGOUT
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Dungeon Select Screen ---
  if (gameState === GameState.DUNGEON_SELECT) {
    return (
        <div className="min-h-screen bg-rpg-bg p-4 md:p-8 flex flex-col">
            <header className="flex justify-between items-center mb-8 bg-rpg-card p-4 rounded-xl border border-gray-700 shadow-lg">
                <button 
                    onClick={() => setGameState(GameState.START_MENU)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} /> Back
                </button>
                <h2 className="text-xl md:text-2xl font-retro text-white">Select Mission</h2>
                <div className="bg-gray-800 px-3 py-1 rounded-lg border border-gray-600">
                    <span className="text-xs font-bold text-gray-400">YOUR LEVEL</span>
                    <span className="block text-lg font-retro text-rpg-primary text-center">{player.level}</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
                {DUNGEONS.map((dungeon) => {
                    const isLocked = player.level < dungeon.recommendedLevel;
                    return (
                        <button
                            key={dungeon.id}
                            onClick={() => selectDungeon(dungeon)}
                            disabled={isLocked}
                            className={`
                                relative group overflow-hidden rounded-xl border-2 text-left p-6 transition-all duration-300 h-full
                                ${isLocked 
                                    ? 'bg-gray-900/50 border-gray-800 opacity-70 cursor-not-allowed' 
                                    : 'bg-rpg-card border-gray-600 hover:border-rpg-primary hover:shadow-[0_0_20px_rgba(122,162,247,0.2)] hover:-translate-y-1'
                                }
                            `}
                        >
                            {/* Icon Background Element */}
                            <div className={`absolute top-0 right-0 p-6 opacity-10 transition-transform duration-500 ${!isLocked ? 'group-hover:scale-125 group-hover:rotate-12' : ''}`}>
                                {renderDungeonIcon(dungeon.icon, 100)}
                            </div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg ${isLocked ? 'bg-gray-800 text-gray-500' : 'bg-rpg-primary/20 text-rpg-primary'}`}>
                                        {renderDungeonIcon(dungeon.icon, 28)}
                                    </div>
                                    {isLocked && <Lock className="text-gray-500" size={24} />}
                                </div>
                                
                                <h3 className={`text-xl font-bold mb-2 ${isLocked ? 'text-gray-500' : 'text-white'}`}>
                                    {dungeon.name}
                                </h3>
                                <p className="text-sm text-gray-400 mb-4 flex-grow">
                                    {dungeon.description}
                                </p>
                                
                                <div className="pt-4 border-t border-gray-700/50 flex justify-between items-center mt-auto">
                                    <span className={`text-xs font-bold uppercase tracking-wider ${isLocked ? 'text-rpg-danger' : 'text-rpg-success'}`}>
                                        Req Lvl {dungeon.recommendedLevel}
                                    </span>
                                    {!isLocked && (
                                        <span className="flex items-center gap-1 text-sm font-bold text-rpg-primary group-hover:translate-x-1 transition-transform">
                                            Enter <ChevronRight size={16} />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
  }

  if (gameState === GameState.VICTORY) {
     return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {/* Menu Overlay capable in Victory screen too */}
        <GameMenu 
            isOpen={isMenuOpen} 
            onClose={() => setIsMenuOpen(false)}
            player={player}
            onLogout={handleLogout}
            onSave={handleManualSave}
            settings={settings}
            onToggleSetting={(key) => setSettings(prev => ({...prev, [key]: !prev[key]}))}
            onAllocate={handleStatAllocate}
            items={GAME_ITEMS}
            onBuyItem={handleBuyItem}
            onUseItem={handleUseItem}
        />
        
        <div className="text-center bg-rpg-card p-8 rounded-2xl border-2 border-rpg-success shadow-2xl animate-in zoom-in max-w-sm md:max-w-md w-full relative">
            <button 
                    onClick={() => setIsMenuOpen(true)} 
                    className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors" 
                    title="Menu"
            >
                <div className="relative">
                    <Menu size={20} />
                    {player.statPoints > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rpg-danger rounded-full border-2 border-gray-800"></span>}
                </div>
            </button>

            <CheckCircle2 size={80} className="text-rpg-success mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-retro text-white mb-2">Monster Defeated!</h2>
            <p className="text-gray-400 mb-6">The patient is stabilized... for now.</p>
            {player.statPoints > 0 && <p className="text-rpg-warning text-sm mb-4 animate-pulse">You have {player.statPoints} stat points available!</p>}
            <button 
                onClick={selectedDungeon ? () => startEncounter(selectedDungeon) : goToDungeonSelect}
                className="bg-rpg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full flex items-center justify-center mx-auto gap-2 transition-transform hover:scale-105 w-full md:w-auto mb-3"
            >
                Next Patient <ChevronRight />
            </button>
            
            <button
                onClick={goToDungeonSelect}
                className="text-gray-400 hover:text-white text-sm underline decoration-gray-500"
            >
                Return to Mission Select
            </button>
        </div>
      </div>
     )
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center bg-rpg-card p-10 rounded-2xl border-2 border-rpg-danger shadow-2xl max-w-sm md:max-w-md w-full">
            <Skull size={80} className="text-rpg-danger mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-retro text-white mb-2">GAME OVER</h2>
            <p className="text-gray-400 mb-8">You have succumbed to the workload.</p>
            <div className="flex flex-col gap-2 mb-6">
                <span className="text-lg">Final Level: <span className="text-rpg-accent font-bold">{player.level}</span></span>
            </div>
            <button 
                onClick={() => setGameState(GameState.DUNGEON_SELECT)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full flex items-center justify-center mx-auto gap-2 w-full md:w-auto"
            >
                <RotateCcw size={18} /> Retry Mission
            </button>
        </div>
      </div>
    );
  }

  // --- Main Battle View ---

  return (
    <div className={`min-h-screen flex flex-col max-w-7xl mx-auto p-2 md:p-4 gap-3 md:gap-4 pb-10 transition-colors duration-200 ${
        shake === 'player' ? 'animate-shake' : ''
    }`}>
      {/* Menu Overlay */}
      <GameMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        player={player}
        onLogout={handleLogout}
        onSave={handleManualSave}
        settings={settings}
        onToggleSetting={(key) => setSettings(prev => ({...prev, [key]: !prev[key]}))}
        onAllocate={handleStatAllocate}
        items={GAME_ITEMS}
        onBuyItem={handleBuyItem}
        onUseItem={handleUseItem}
      />

      {/* Full Screen Flash Overlays */}
      <div className={`fixed inset-0 pointer-events-none z-50 transition-colors duration-500 ${
          screenFlash === 'red' ? 'animate-flash-red' : 
          screenFlash === 'green' ? 'animate-flash-green' : ''
      }`}></div>

      {/* Player Effects Layer (Fixed Bottom Center) */}
      <div className="fixed bottom-32 left-0 right-0 z-40 flex justify-center pointer-events-none">
           <div className="relative w-full max-w-md h-0 flex items-center justify-center">
              <CombatEffects effects={playerEffects} />
           </div>
      </div>

      {/* Sticky Mobile Header / Standard Desktop Header */}
      <header className="bg-rpg-card p-3 md:p-4 rounded-xl border border-gray-700 shadow-lg sticky top-0 z-20 md:static">
        <div className="flex justify-between items-center">
            {/* Left: Player Info */}
            <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-gray-800 p-2 rounded-lg border border-gray-600 min-w-[3.5rem] text-center relative">
                    <div className="text-[10px] md:text-xs text-gray-400 uppercase font-bold">Lvl</div>
                    <div className="text-xl md:text-2xl font-retro text-white">{player.level}</div>
                </div>
                <div>
                    <h2 className="text-sm md:text-lg font-bold text-white truncate max-w-[120px] md:max-w-none flex items-center gap-2">
                      {player.name}
                      {/* Player Statuses (Mobile/Header) */}
                      <div className="hidden md:flex">
                        <StatusBadges statuses={getPlayerVisualStatuses(player)} />
                      </div>
                    </h2>
                    <div className="w-24 md:w-48">
                        <ProgressBar current={player.xp} max={player.xpToNext} colorClass="bg-rpg-xp" showValue={false} />
                        <div className="text-[10px] md:text-xs text-right text-rpg-accent mt-1">XP {player.xp}/{player.xpToNext}</div>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex gap-2 items-center">
                <div className="hidden sm:flex items-center gap-1 bg-gray-900 px-3 py-1 rounded-full border border-gray-700 text-rpg-warning">
                    <DollarSign size={14} />
                    <span className="text-sm font-bold">{player.gold}</span>
                </div>

                <div className="w-px h-8 bg-gray-700 mx-1"></div>
                
                {/* Menu Toggle */}
                <button 
                    onClick={() => setIsMenuOpen(true)} 
                    className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors relative" 
                    title="Menu"
                >
                    <Menu size={24} />
                    {player.statPoints > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-rpg-danger rounded-full border-2 border-gray-800 animate-pulse"></span>
                    )}
                </button>
            </div>
        </div>
        
        {/* Mobile Statuses Bar */}
        <div className="md:hidden mt-2 flex justify-start">
             <StatusBadges statuses={getPlayerVisualStatuses(player)} />
        </div>

        {/* Mobile Only Vitals Bar (Visible < md) */}
        <div className="md:hidden grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-700">
           <ProgressBar current={player.hp} max={player.maxHp} colorClass="bg-rpg-health" label="HP" />
           <ProgressBar current={player.mp} max={player.maxMp} colorClass="bg-rpg-mana" label="MP" />
        </div>
      </header>

      <main className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 flex-grow">
        
        {/* Left Col: Player Stats */}
        <div className="order-3 md:order-1 md:col-span-3 space-y-4">
            <div className="bg-rpg-card p-4 rounded-xl border border-gray-700 h-full">
                {/* Desktop Vitals (Hidden on mobile) */}
                <div className="hidden md:block">
                  <div className="mb-6 text-center">
                       <div className="w-24 h-24 mx-auto bg-gray-800 rounded-full flex items-center justify-center border-4 border-rpg-primary mb-3 shadow-[0_0_15px_rgba(122,162,247,0.3)]">
                          <Activity size={40} className="text-rpg-primary" />
                       </div>
                       <div className="font-bold text-white mb-2">Vitals</div>
                       {/* Desktop Player Statuses (Under Avatar) */}
                       <div className="flex justify-center mb-2">
                           <StatusBadges statuses={getPlayerVisualStatuses(player)} />
                       </div>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                      <ProgressBar current={player.hp} max={player.maxHp} colorClass="bg-rpg-health" label="Health" />
                      <ProgressBar current={player.mp} max={player.maxMp} colorClass="bg-rpg-mana" label="Mana" />
                  </div>
                </div>

                <div className="md:mt-0 space-y-3">
                    <div className="text-xs font-bold text-gray-500 uppercase md:hidden mb-2">Attributes</div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
                        <span className="flex items-center gap-2 text-gray-400"><Sword size={14}/> Physique</span>
                        <span className="font-retro text-rpg-warning">{player.stats.physique}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
                        <span className="flex items-center gap-2 text-gray-400"><Shield size={14}/> Defense</span>
                        <span className="font-retro text-gray-300">{player.stats.defense}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
                        <span className="flex items-center gap-2 text-gray-400"><Brain size={14}/> Intellect</span>
                        <span className="font-retro text-rpg-mana">{player.stats.intellect}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pb-2">
                        <span className="flex items-center gap-2 text-gray-400"><Heart size={14}/> Stamina</span>
                        <span className="font-retro text-rpg-health">{player.stats.stamina}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-700">
                        <span className="flex items-center gap-2 text-rpg-warning font-bold"><DollarSign size={14}/> Budget</span>
                        <span className="font-retro text-rpg-warning">${player.gold}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Center: Arena / Question */}
        <div className="order-1 md:order-2 md:col-span-6 flex flex-col gap-3 md:gap-4">
            {/* Monster Visual */}
            <div className={`bg-rpg-card rounded-xl border border-gray-700 p-4 md:p-6 flex flex-col items-center justify-center min-h-[160px] md:min-h-[200px] relative overflow-hidden transition-all ${
                shake === 'monster' ? 'animate-shake' : ''
            }`}>
                {monster && (
                    <>
                    <CombatEffects effects={monsterEffects} />
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 text-[10px] md:text-xs font-bold text-rpg-danger border border-rpg-danger px-2 py-1 rounded">LVL {monster.level}</div>
                    
                    {/* Monster Status Badges Overlay */}
                    <div className="absolute top-2 left-2 z-10">
                        <StatusBadges statuses={getMonsterVisualStatuses(monster)} />
                    </div>

                    <div className={`transition-all duration-500 ${isAnswered && selectedOption !== question?.correctIndex ? 'translate-x-[-10px]' : ''}`}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-rpg-danger blur-2xl opacity-20 animate-pulse"></div>
                            <Skull size={64} className="text-gray-200 relative z-10 drop-shadow-xl md:w-20 md:h-20" />
                        </div>
                    </div>
                    <h3 className="mt-3 text-lg md:text-xl font-bold text-white font-retro tracking-wide text-center">{monster.name}</h3>
                    <div className="w-full md:w-2/3 mt-3">
                        <ProgressBar current={monster.hp} max={monster.maxHp} colorClass="bg-rpg-danger" showValue={true} />
                    </div>
                    </>
                )}
                 {(!monster && loading) && <div className="text-rpg-accent animate-pulse text-sm">Summoning Case Study...</div>}
            </div>
            
            {/* PROTOCOLS BAR (Abilities) */}
            <div className="bg-rpg-card p-2 rounded-xl border border-gray-700 flex gap-2 overflow-x-auto no-scrollbar">
                {/* Standard Heal Button (Left Aligned) */}
                <button 
                    onClick={useHeal}
                    disabled={player.mp < MANA_COST_HEAL || player.hp === player.maxHp || isAnswered || !monster}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 transition-all min-w-[100px] justify-center ${
                        player.mp >= MANA_COST_HEAL && !isAnswered && monster
                        ? 'bg-gray-800 hover:bg-gray-700 hover:border-rpg-success cursor-pointer active:scale-95' 
                        : 'bg-gray-900 opacity-50 cursor-not-allowed'
                    }`}
                >
                    <Heart size={18} className="text-rpg-health" />
                    <div className="flex flex-col leading-none text-left">
                        <span className="text-xs font-bold text-white">Heal</span>
                        <span className="text-[10px] text-rpg-mana">{MANA_COST_HEAL} MP</span>
                    </div>
                </button>

                <div className="w-px bg-gray-700 mx-1"></div>

                {/* Protocols List */}
                {ABILITIES.map(ability => {
                    const isLocked = player.level < ability.levelReq;
                    const isOnCooldown = (player.cooldowns[ability.id] || 0) > 0;
                    const hasMana = player.mp >= ability.mpCost;
                    
                    return (
                        <button
                            key={ability.id}
                            onClick={() => useAbility(ability.id)}
                            disabled={isLocked || isOnCooldown || !hasMana || isAnswered || !monster}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all min-w-[110px] relative overflow-hidden ${
                                isLocked 
                                ? 'bg-gray-900 border-gray-800 opacity-40 cursor-not-allowed' 
                                : isOnCooldown
                                    ? 'bg-gray-900 border-gray-600 opacity-70 cursor-not-allowed'
                                    : hasMana && !isAnswered && monster
                                        ? 'bg-gray-800 border-gray-600 hover:border-rpg-primary hover:bg-gray-700 cursor-pointer active:scale-95'
                                        : 'bg-gray-900 border-gray-700 opacity-50 cursor-not-allowed'
                            }`}
                        >
                            <div className="p-1 bg-gray-900 rounded-full">
                                {renderAbilityIcon(ability.icon)}
                            </div>
                            <div className="flex flex-col leading-none text-left">
                                <span className="text-xs font-bold text-white">
                                    {isLocked ? `Lvl ${ability.levelReq}` : ability.name}
                                </span>
                                {!isLocked && (
                                    <span className="text-[10px] text-rpg-mana">
                                        {isOnCooldown ? `CD: ${player.cooldowns[ability.id]}t` : `${ability.mpCost} MP`}
                                    </span>
                                )}
                            </div>
                            {/* Visual Cooldown Overlay */}
                            {isOnCooldown && !isLocked && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Timer size={16} className="text-white animate-spin-slow" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Question Card */}
            <div className="bg-white text-gray-900 rounded-xl shadow-xl overflow-hidden flex-grow flex flex-col">
                {loading ? (
                    <div className="flex-grow flex items-center justify-center p-8 md:p-12">
                         <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-rpg-primary"></div>
                    </div>
                ) : question ? (
                    <div className="flex flex-col h-full">
                        <div className="bg-gray-100 px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 flex justify-between items-center">
                            <span className="text-[10px] md:text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded-full uppercase truncate max-w-[150px]">{question.category}</span>
                            <span className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap ml-2">Diff: {question.difficulty}</span>
                        </div>
                        <div className="p-4 md:p-6 text-base md:text-lg font-medium leading-relaxed">
                            {question.text}
                        </div>
                        <div className="flex-grow p-4 md:p-6 pt-0 space-y-2 md:space-y-3">
                            {question.options.map((opt, idx) => {
                                let btnClass = "w-full text-left p-3 md:p-4 rounded-lg border-2 transition-all duration-200 font-medium text-sm md:text-base ";
                                if (!isAnswered) {
                                    btnClass += "border-gray-200 hover:border-rpg-primary hover:bg-blue-50 cursor-pointer active:scale-[0.98] active:bg-blue-100";
                                } else {
                                    if (idx === question.correctIndex) {
                                        btnClass += "border-green-500 bg-green-50 text-green-700";
                                    } else if (idx === selectedOption) {
                                        btnClass += "border-red-500 bg-red-50 text-red-700";
                                    } else {
                                        btnClass += "border-gray-100 text-gray-400 opacity-50";
                                    }
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={isAnswered}
                                        className={btnClass}
                                    >
                                        <div className="flex">
                                            <span className="inline-block font-bold opacity-50 mr-2">{String.fromCharCode(65 + idx)}.</span>
                                            <span>{opt}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {isAnswered && (
                            <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm animate-in slide-in-from-bottom-2">
                                <span className="font-bold block mb-1">Rationale:</span>
                                {question.explanation}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>

        {/* Right Col: Combat Log */}
        <div className="order-2 md:order-3 md:col-span-3">
            <div className="bg-rpg-card rounded-xl border border-gray-700 h-32 md:h-full flex flex-col overflow-hidden">
                <div className="p-2 md:p-3 bg-gray-800 border-b border-gray-700 font-bold text-gray-300 text-xs md:text-sm">
                    Combat Log
                </div>
                <div className="flex-grow overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-3 font-mono text-[10px] md:text-xs">
                    {logs.length === 0 && <div className="text-gray-600 text-center italic mt-4 md:mt-10">Logs...</div>}
                    {logs.map((log) => (
                        <div key={log.id} className={`flex gap-2 animate-in fade-in slide-in-from-left-2 ${
                            log.type === 'danger' ? 'text-red-400' :
                            log.type === 'success' ? 'text-green-400' :
                            log.type === 'loot' ? 'text-yellow-400' :
                            log.type === 'heal' ? 'text-blue-400' :
                            log.type === 'crit' ? 'text-yellow-400 font-bold' :
                            log.type === 'ability' ? 'text-rpg-accent font-bold' :
                            'text-gray-300'
                        }`}>
                            <span>{'>'}</span>
                            <span>{log.message}</span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;