
import React from 'react';
import { Shield, Zap, Skull, Flame, BookOpen, Activity, AlertCircle } from 'lucide-react';

export interface VisualStatus {
  id: string;
  label: string;
  icon: 'shield' | 'zap' | 'skull' | 'flame' | 'book' | 'stun' | 'warn';
  value?: number | string; // e.g. "3 turns"
  type: 'buff' | 'debuff';
  description?: string;
}

interface StatusBadgesProps {
  statuses: VisualStatus[];
}

export const StatusBadges: React.FC<StatusBadgesProps> = ({ statuses }) => {
  if (statuses.length === 0) return null;

  const getIcon = (iconName: string, size = 16) => {
    switch (iconName) {
      case 'shield': return <Shield size={size} />;
      case 'zap': return <Zap size={size} />;
      case 'skull': return <Skull size={size} />;
      case 'flame': return <Flame size={size} />;
      case 'book': return <BookOpen size={size} />;
      case 'stun': return <Activity size={size} />; // Activity halted/stunned metaphor
      default: return <AlertCircle size={size} />;
    }
  };

  const getColorClass = (type: 'buff' | 'debuff', icon: string) => {
    if (type === 'buff') {
      if (icon === 'shield') return 'bg-blue-900/60 text-blue-300 border-blue-500/50';
      if (icon === 'zap') return 'bg-red-900/60 text-red-300 border-red-500/50';
      if (icon === 'book') return 'bg-purple-900/60 text-purple-300 border-purple-500/50';
      return 'bg-green-900/60 text-green-300 border-green-500/50';
    } else {
      if (icon === 'poison' || icon === 'skull') return 'bg-green-900/80 text-green-400 border-green-500';
      if (icon === 'flame') return 'bg-orange-900/80 text-orange-400 border-orange-500';
      if (icon === 'stun') return 'bg-yellow-900/80 text-yellow-400 border-yellow-500';
      return 'bg-gray-800 text-gray-400 border-gray-600';
    }
  };

  return (
    <div className="flex flex-wrap gap-2 animate-in fade-in zoom-in duration-300">
      {statuses.map((status) => (
        <div 
          key={status.id}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] md:text-xs font-bold uppercase tracking-wide
            shadow-sm backdrop-blur-sm select-none relative group cursor-help
            ${getColorClass(status.type, status.icon)}
          `}
        >
          {getIcon(status.icon)}
          <span>{status.label}</span>
          {status.value && <span className="opacity-80 ml-0.5">({status.value})</span>}
          
          {/* Tooltip */}
          {status.description && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-gray-900 text-white text-[10px] rounded border border-gray-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case text-center">
              {status.description}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
