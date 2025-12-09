
import React from 'react';
import { Package, Coffee, Droplet, BookOpen } from 'lucide-react';
import { Item, Player } from '../types';

interface InventoryProps {
  player: Player;
  items: Item[]; // Reference list to get details
  onUse: (item: Item) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ player, items, onUse }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'coffee': return <Coffee className="text-amber-700" size={24} />;
      case 'droplet': return <Droplet className="text-blue-400" size={24} />;
      case 'book': return <BookOpen className="text-purple-500" size={24} />;
      default: return <Package className="text-gray-400" size={24} />;
    }
  };

  const inventoryItems = (Object.entries(player.inventory) as [string, number][])
    .filter(([_, count]) => count > 0)
    .map(([id, count]) => {
      const itemDef = items.find(i => i.id === id);
      return itemDef ? { ...itemDef, count } : null;
    })
    .filter((i): i is (Item & { count: number }) => i !== null);

  if (inventoryItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 animate-in fade-in">
        <Package size={48} className="mb-4 opacity-50" />
        <p className="font-retro text-sm">Inventory Empty</p>
        <p className="text-xs mt-2">Visit the Supply Closet to restock.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="grid gap-3">
        {inventoryItems.map((item) => (
          <div key={item.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative p-3 bg-gray-900 rounded-lg">
                {getIcon(item.icon)}
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-gray-500">
                    {item.count}
                </span>
              </div>
              <div>
                <div className="font-bold text-white">{item.name}</div>
                <div className="text-xs text-gray-400">{item.description}</div>
              </div>
            </div>
            <button
              onClick={() => onUse(item)}
              className="px-4 py-2 bg-rpg-primary hover:bg-blue-600 text-white rounded-lg font-bold text-xs uppercase transition-colors shadow-lg active:scale-95"
            >
              Use
            </button>
          </div>
        ))}
      </div>
      
      {player.activeBuffs.xpBoost > 0 && (
         <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/50 rounded-lg flex items-center gap-3">
            <BookOpen size={16} className="text-purple-400" />
            <div className="text-xs text-purple-200">
                <span className="font-bold block text-purple-300">Textbook Active</span>
                +50% XP for {player.activeBuffs.xpBoost} more encounters.
            </div>
         </div>
      )}
    </div>
  );
};
