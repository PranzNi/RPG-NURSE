
import React, { useState } from 'react';
import { X, User, Settings, LogOut, Save, Shield, Zap, Heart, Brain, Battery, ArrowUp, Sword, ShoppingBag, Package, Volume2, VolumeX } from 'lucide-react';
import { Player, Stats, Item } from '../types';
import { SupplyCloset } from './SupplyCloset';
import { Inventory } from './Inventory';

interface GameMenuProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  onLogout: () => void;
  onSave: () => void;
  settings: {
    lowMotion: boolean;
    soundEnabled: boolean;
  };
  onToggleSetting: (key: 'lowMotion' | 'soundEnabled') => void;
  onAllocate: (stat: keyof Stats) => void;
  items: Item[];
  onBuyItem: (item: Item) => void;
  onUseItem: (item: Item) => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({ 
  isOpen, 
  onClose, 
  player, 
  onLogout, 
  onSave,
  settings,
  onToggleSetting,
  onAllocate,
  items,
  onBuyItem,
  onUseItem
}) => {
  const [activeTab, setActiveTab] = useState<'character' | 'inventory' | 'shop' | 'system'>('character');

  if (!isOpen) return null;

  const calculateDamage = (physique: number) => 10 + (physique * 2);
  const calculateCritChance = (intellect: number) => Math.min(50, intellect * 2);

  const renderStatRow = (key: keyof Stats, label: string, icon: React.ReactNode, value: number, subtext: React.ReactNode, colorClass: string) => (
    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between items-center">
        <div>
            <div className={`flex items-center gap-2 ${colorClass} mb-1 font-bold`}>
                {icon} {label} {value}
            </div>
            <div className="text-xs text-gray-400 ml-6">
                {subtext}
            </div>
        </div>
        {player.statPoints > 0 && (
            <button 
                onClick={() => onAllocate(key)}
                className="bg-rpg-primary hover:bg-blue-500 text-white p-2 rounded-lg transition-colors shadow-lg active:scale-95"
                title="Increase Stat"
            >
                <ArrowUp size={16} />
            </button>
        )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-rpg-card w-full max-w-lg rounded-2xl border border-gray-600 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-retro text-white">Main Menu</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-900/50 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('character')}
            className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors relative whitespace-nowrap ${
              activeTab === 'character' 
                ? 'text-rpg-primary border-b-2 border-rpg-primary bg-gray-800' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <User size={16} /> <span className="hidden sm:inline">Stats</span>
            {player.statPoints > 0 && (
                <span className="absolute top-2 right-2 md:right-4 w-2 h-2 bg-rpg-warning rounded-full animate-pulse"></span>
            )}
          </button>
           <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'inventory' 
                ? 'text-rpg-primary border-b-2 border-rpg-primary bg-gray-800' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <Package size={16} /> <span className="hidden sm:inline">Inv</span>
          </button>
           <button
            onClick={() => setActiveTab('shop')}
            className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'shop' 
                ? 'text-rpg-primary border-b-2 border-rpg-primary bg-gray-800' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <ShoppingBag size={16} /> <span className="hidden sm:inline">Shop</span>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'system' 
                ? 'text-rpg-primary border-b-2 border-rpg-primary bg-gray-800' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <Settings size={16} /> <span className="hidden sm:inline">Sys</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 bg-rpg-bg">
          
          {activeTab === 'character' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-block p-1 border-2 border-rpg-accent rounded-full mb-3">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                        <User size={32} className="text-rpg-accent" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-white">{player.name}</h3>
                <p className="text-rpg-primary font-retro text-sm">Level {player.level}</p>
                
                {player.statPoints > 0 && (
                    <div className="mt-4 bg-rpg-warning/10 border border-rpg-warning/50 text-rpg-warning p-2 rounded-lg text-sm font-bold animate-pulse">
                        <span className="mr-2">Points Available: {player.statPoints}</span>
                        <span className="text-xs font-normal text-gray-400 block mt-1">Use the arrows below to upgrade stats</span>
                    </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderStatRow(
                    'physique', 
                    'Physique', 
                    <Sword size={16} />, 
                    player.stats.physique, 
                    <span>Base Dmg: <span className="text-white">{calculateDamage(player.stats.physique)}</span></span>,
                    'text-rpg-warning'
                )}

                {renderStatRow(
                    'defense', 
                    'Defense', 
                    <Shield size={16} />, 
                    player.stats.defense, 
                    <span>Dmg Reduction: <span className="text-white">~{Math.floor(player.stats.defense / 2)}</span></span>,
                    'text-gray-300'
                )}

                {renderStatRow(
                    'intellect', 
                    'Intellect', 
                    <Brain size={16} />, 
                    player.stats.intellect, 
                    <span>Crit Chance: <span className="text-white">{calculateCritChance(player.stats.intellect)}%</span></span>,
                    'text-rpg-mana'
                )}

                {renderStatRow(
                    'stamina', 
                    'Stamina', 
                    <Heart size={16} />, 
                    player.stats.stamina, 
                    <span>Max HP: <span className="text-white">{player.maxHp}</span></span>,
                    'text-rpg-health'
                )}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <Inventory player={player} items={items} onUse={onUseItem} />
          )}

          {activeTab === 'shop' && (
            <SupplyCloset player={player} items={items} onBuy={onBuyItem} />
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Settings</h3>
                
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                        {settings.soundEnabled ? <Volume2 className="text-gray-400" size={20} /> : <VolumeX className="text-gray-500" size={20} />}
                        <div>
                            <div className="font-bold text-gray-200">Sound Effects</div>
                            <div className="text-xs text-gray-500">Enable retro SFX</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => onToggleSetting('soundEnabled')}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                            settings.soundEnabled ? 'bg-rpg-primary' : 'bg-gray-600'
                        }`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                            settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                    </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                        <Battery className="text-gray-400" size={20} />
                        <div>
                            <div className="font-bold text-gray-200">Reduced Motion</div>
                            <div className="text-xs text-gray-500">Disables flashing and shaking effects</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => onToggleSetting('lowMotion')}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${
                            settings.lowMotion ? 'bg-rpg-primary' : 'bg-gray-600'
                        }`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                            settings.lowMotion ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                    </button>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-700">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account</h3>
                
                <button 
                    onClick={onSave}
                    className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
                >
                    <span className="flex items-center gap-3">
                        <Save size={20} className="text-rpg-success" />
                        Save Game
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded">Auto-saving enabled</span>
                </button>

                <button 
                    onClick={onLogout}
                    className="w-full flex items-center justify-between p-4 bg-rpg-danger/10 hover:bg-rpg-danger/20 text-rpg-danger rounded-lg transition-colors border border-rpg-danger/30"
                >
                    <span className="flex items-center gap-3">
                        <LogOut size={20} />
                        Logout
                    </span>
                </button>
              </div>
              
              <div className="text-center text-xs text-gray-600 mt-8">
                Nurse RPG v1.0.3
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
