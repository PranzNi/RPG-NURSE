
import React from 'react';
import { ShoppingBag, DollarSign, Coffee, Droplet, BookOpen } from 'lucide-react';
import { Item, Player } from '../types';

interface SupplyClosetProps {
  player: Player;
  items: Item[];
  onBuy: (item: Item) => void;
}

export const SupplyCloset: React.FC<SupplyClosetProps> = ({ player, items, onBuy }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'coffee': return <Coffee className="text-amber-700" size={24} />;
      case 'droplet': return <Droplet className="text-blue-400" size={24} />;
      case 'book': return <BookOpen className="text-purple-500" size={24} />;
      default: return <ShoppingBag className="text-gray-400" size={24} />;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center mb-6">
        <div>
          <h3 className="font-retro text-rpg-warning">Supply Budget</h3>
          <p className="text-xs text-gray-400">Funds allocated for supplies</p>
        </div>
        <div className="flex items-center gap-2 text-2xl font-bold text-rpg-warning">
          <DollarSign size={24} />
          {player.gold}
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between items-center transition-colors hover:border-gray-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-900 rounded-lg">
                {getIcon(item.icon)}
              </div>
              <div>
                <div className="font-bold text-white">{item.name}</div>
                <div className="text-xs text-gray-400 max-w-[180px]">{item.description}</div>
              </div>
            </div>
            <button
              onClick={() => onBuy(item)}
              disabled={player.gold < item.cost}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1 transition-all active:scale-95 ${
                player.gold >= item.cost
                  ? 'bg-rpg-success text-gray-900 hover:bg-green-400 shadow-lg shadow-green-900/20'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>${item.cost}</span>
              <span className="text-xs uppercase ml-1">Buy</span>
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-3 bg-blue-900/20 border border-blue-900/50 rounded-lg text-xs text-blue-200 text-center">
        Items purchased are added to your Inventory.
      </div>
    </div>
  );
};
