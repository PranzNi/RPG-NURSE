import React from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  colorClass: string;
  label?: string;
  showValue?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  max, 
  colorClass, 
  label, 
  showValue = true 
}) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <div className="w-full mb-2">
      <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1 text-gray-400">
        {label && <span>{label}</span>}
        {showValue && <span>{Math.floor(current)} / {Math.floor(max)}</span>}
      </div>
      <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700 shadow-inner relative">
        <div 
          className={`h-full ${colorClass} transition-all duration-500 ease-out flex items-center justify-end pr-1`}
          style={{ width: `${percentage}%` }}
        >
             <div className="h-full w-full bg-gradient-to-b from-white/20 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};
