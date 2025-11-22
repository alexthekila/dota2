import React from 'react';
import { DraftSlot, Team } from '../types';
import { getHeroImageUrl } from '../constants';
import { Sword, Shield, User } from 'lucide-react';

interface DraftBoardProps {
  radiantSlots: DraftSlot[];
  direSlots: DraftSlot[];
  selectedSlot: { team: Team, index: number } | null;
  onSlotClick: (team: Team, index: number) => void;
}

const DraftBoard: React.FC<DraftBoardProps> = ({ radiantSlots, direSlots, selectedSlot, onSlotClick }) => {

  const renderSlot = (slot: DraftSlot, isRadiant: boolean) => {
    // Check if this slot is manually selected
    const isSelected = selectedSlot?.team === slot.team && selectedSlot?.index === slot.order;

    const posLabels = ['Pos 1', 'Pos 2', 'Pos 3', 'Pos 4', 'Pos 5'];
    const posLabel = posLabels[slot.order] || `Slot ${slot.order + 1}`;

    return (
      <div 
        key={`${slot.team}-${slot.order}`}
        onClick={() => onSlotClick(slot.team, slot.order)}
        className={`
          relative bg-dota-panel border transition-all duration-300 overflow-hidden group cursor-pointer
          ${slot.hero ? 'border-gray-600' : 'border-dota-border'}
          ${isSelected ? (isRadiant ? 'border-radiant-glow shadow-[0_0_15px_rgba(74,222,128,0.3)] scale-105 z-10 ring-1 ring-radiant-glow' : 'border-dire-glow shadow-[0_0_15px_rgba(244,63,94,0.3)] scale-105 z-10 ring-1 ring-dire-glow') : 'hover:border-gray-500'}
          ${!slot.hero && !isSelected ? 'opacity-60 hover:opacity-80' : 'opacity-100'}
          h-20 sm:h-28
        `}
      >
        {slot.hero ? (
          <>
            <img 
              src={getHeroImageUrl(slot.hero.img)} 
              alt={slot.hero.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                  e.currentTarget.src = `https://via.placeholder.com/256x144/1a1a1a/4a4a4a?text=${encodeURIComponent(slot.hero?.name || '')}`;
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-1.5 pt-4">
              <p className="text-white text-[10px] sm:text-xs font-bold truncate text-center shadow-black drop-shadow-md">{slot.hero.name}</p>
            </div>
            <div className="absolute top-0 left-0 bg-black/50 text-[9px] px-1 text-gray-300 rounded-br font-mono">
               {posLabel}
            </div>
          </>
        ) : (
          <div className={`flex flex-col items-center justify-center h-full ${isSelected ? 'text-white' : 'text-gray-700'}`}>
             {isSelected ? <Sword size={20} className="animate-pulse mb-1" /> : <User size={20} className="mb-1" />}
             <span className="text-[10px] font-bold uppercase tracking-widest font-mono">{posLabel}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header with VS */}
      <div className="flex justify-between items-center px-6 py-3 bg-black/40 rounded-lg border border-dota-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-radiant-dark/20 via-transparent to-dire-dark/20 pointer-events-none"></div>
        
        {/* Radiant Label */}
        <div className="flex items-center gap-3 relative z-10">
             <div className={`w-3 h-3 rounded-sm transform rotate-45 transition-all duration-300 bg-radiant-dark ${selectedSlot?.team === Team.RADIANT ? 'bg-radiant-glow shadow-[0_0_10px_#4ade80]' : ''}`}></div>
            <h2 className={`font-bold text-xl tracking-widest uppercase transition-all duration-300 ${selectedSlot?.team === Team.RADIANT ? 'text-radiant-glow' : 'text-gray-500'}`}>Radiant</h2>
        </div>
        
        {/* VS Badge */}
        <div className="relative z-10">
            <span className="text-2xl font-black italic text-gray-700 select-none opacity-50">VS</span>
        </div>
        
        {/* Dire Label */}
        <div className="flex items-center gap-3 relative z-10">
            <h2 className={`font-bold text-xl tracking-widest uppercase transition-all duration-300 ${selectedSlot?.team === Team.DIRE ? 'text-dire-glow' : 'text-gray-500'}`}>Dire</h2>
            <div className={`w-3 h-3 rounded-sm transform rotate-45 transition-all duration-300 bg-dire-dark ${selectedSlot?.team === Team.DIRE ? 'bg-dire-glow shadow-[0_0_10px_#f43f5e]' : ''}`}></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-8">
        {/* Radiant Side */}
        <div className="space-y-4">
           <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
             {radiantSlots.map((s) => renderSlot(s, true))}
           </div>
        </div>

        {/* Dire Side */}
        <div className="space-y-4">
           <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
             {direSlots.map((s) => renderSlot(s, false))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DraftBoard;