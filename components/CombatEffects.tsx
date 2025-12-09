import React from 'react';

export type EffectType = 'damage' | 'crit' | 'heal' | 'mana' | 'xp';

export interface CombatEffect {
  id: string;
  text: string;
  type: EffectType;
}

interface CombatEffectsProps {
  effects: CombatEffect[];
}

export const CombatEffects: React.FC<CombatEffectsProps> = ({ effects }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-visible flex items-center justify-center">
      {effects.map((effect) => (
        <div
          key={effect.id}
          className={`
            absolute
            font-retro font-bold text-shadow-sm whitespace-nowrap
            animate-float-up
            ${effect.type === 'damage' ? 'text-white text-3xl' : ''}
            ${effect.type === 'crit' ? 'text-yellow-400 text-5xl z-20' : ''}
            ${effect.type === 'heal' ? 'text-green-400 text-3xl' : ''}
            ${effect.type === 'mana' ? 'text-blue-400 text-xl' : ''}
            ${effect.type === 'xp' ? 'text-purple-400 text-2xl' : ''}
          `}
        >
          {effect.text}
        </div>
      ))}
    </div>
  );
};