import React from 'react';
import { Shield, Zap, Heart, Brain, ArrowUp } from 'lucide-react';
import { Stats } from '../types';

interface StatAllocationProps {
  stats: Stats;
  pointsAvailable: number;
  onAllocate: (stat: keyof Stats) => void;
  onConfirm: () => void;
}

export const StatAllocation: React.FC<StatAllocationProps> = ({ 
  stats, 
  pointsAvailable, 
  onAllocate,
  onConfirm 
}) => {
  const renderStatRow = (key: keyof Stats, label: string, icon: React.ReactNode, desc: string) => (
    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 mb-2">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-900 rounded-md text-rpg-primary">
          {icon}
        </div>
        <div>
          <div className="font-bold text-white">{label}</div>
          <div className="text-xs text-gray-400">{desc}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xl font-retro text-rpg-accent">{stats[key]}</span>
        <button
          onClick={() => onAllocate(key)}
          disabled={pointsAvailable <= 0}
          className={`p-2 rounded-full transition-colors ${
            pointsAvailable > 0 
              ? 'bg-rpg-primary text-white hover:bg-blue-600' 
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <ArrowUp size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md w-full mx-auto bg-rpg-card p-6 rounded-xl shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-300">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-retro text-rpg-warning mb-2">Level Up!</h2>
        <p className="text-gray-400">You feel stronger...</p>
        <div className="mt-4 inline-block px-4 py-2 bg-rpg-bg rounded-full border border-rpg-warning/50">
          <span className="font-bold text-rpg-warning">{pointsAvailable}</span> Points Remaining
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {renderStatRow('physique', 'Physique', <Zap />, 'Increases Damage')}
        {renderStatRow('defense', 'Defense', <Shield />, 'Reduces Damage Taken')}
        {renderStatRow('stamina', 'Stamina', <Heart />, 'Increases Max Health')}
        {renderStatRow('intellect', 'Intellect', <Brain />, 'Crit Chance & Max Mana')}
      </div>

      <button
        onClick={onConfirm}
        disabled={pointsAvailable > 0}
        className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
          pointsAvailable === 0
            ? 'bg-rpg-success text-gray-900 hover:bg-green-400 shadow-lg shadow-green-900/20'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        {pointsAvailable > 0 ? 'Spend All Points' : 'Continue Adventure'}
      </button>
    </div>
  );
};
