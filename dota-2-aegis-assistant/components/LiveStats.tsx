
import React, { useMemo } from 'react';
import { Hero, Attribute } from '../types';
import { Swords, Shield, Timer, MoveRight, Zap, Scale } from 'lucide-react';

interface LiveStatsProps {
  heroes: Hero[];
  teamName: string;
  color: string;
}

const LiveStats: React.FC<LiveStatsProps> = ({ heroes, teamName, color }) => {
  
  // Calculate stats completely client-side for instant feedback
  const stats = useMemo(() => {
    let fight = 0;
    let push = 0;
    let late = 0;
    let control = 0;
    let magic = 0;
    let physical = 0;

    heroes.forEach(h => {
      // Heuristic scoring based on roles and attributes
      if (h.roles.includes('Initiator')) { fight += 2.5; control += 1.5; }
      if (h.roles.includes('Carry')) { late += 3; physical += 2; push += 1; }
      if (h.roles.includes('Nuker')) { magic += 3; fight += 1; }
      if (h.roles.includes('Disabler')) { control += 3; fight += 1; }
      if (h.roles.includes('Durable')) { fight += 2; }
      if (h.roles.includes('Pusher')) { push += 3; }
      if (h.roles.includes('Support')) { control += 1; fight += 1; }
      if (h.roles.includes('Escape')) { late += 0.5; }
      
      if (h.attribute === Attribute.INTELLIGENCE) magic += 1;
      if (h.attribute === Attribute.AGILITY) physical += 1;
      if (h.attribute === Attribute.STRENGTH) fight += 1;
    });

    // Normalize roughly to 0-100 range (assuming 5 heroes max)
    const maxScore = 15; 
    const normalize = (val: number) => Math.min(100, (val / maxScore) * 100);

    // For damage type balance, we want a ratio
    const totalDmg = magic + physical || 1;
    const magicPct = (magic / totalDmg) * 100;
    const physPct = (physical / totalDmg) * 100;

    return {
      fight: normalize(fight),
      push: normalize(push),
      late: normalize(late),
      control: normalize(control),
      magicPct,
      physPct
    };
  }, [heroes]);

  const StatBar = ({ label, value, icon: Icon }: { label: string, value: number, icon: any }) => (
    <div className="flex items-center gap-2 text-xs mb-1.5">
      <div className="w-20 text-gray-400 flex items-center gap-1">
         <Icon size={12} /> {label}
      </div>
      <div className="flex-grow bg-gray-800 h-1.5 rounded-full overflow-hidden">
        <div 
          style={{ width: `${value}%`, backgroundColor: color }} 
          className="h-full rounded-full transition-all duration-500"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-black/40 border border-gray-800 rounded p-3 w-full">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 border-b border-gray-800 pb-1 flex justify-between">
        <span>{teamName} Composition</span>
        {heroes.length > 0 && <span className="text-gray-400">{heroes.length}/5 Picked</span>}
      </h4>
      
      <div className="space-y-1">
        <StatBar label="Teamfight" value={stats.fight} icon={Swords} />
        <StatBar label="Push" value={stats.push} icon={MoveRight} />
        <StatBar label="Late Game" value={stats.late} icon={Timer} />
        <StatBar label="Lockdown" value={stats.control} icon={Shield} />
      </div>

      {/* Damage Type Balance */}
      <div className="mt-3">
         <div className="flex justify-between text-[9px] text-gray-500 mb-1 uppercase font-bold">
            <span className="flex items-center gap-1"><Zap size={10} className="text-blue-400" /> Magic</span>
            <span className="flex items-center gap-1">Phys <Scale size={10} className="text-red-400" /></span>
         </div>
         <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-gray-800">
            <div style={{ width: `${stats.magicPct}%` }} className="bg-blue-500 h-full transition-all duration-500" />
            <div style={{ width: `${stats.physPct}%` }} className="bg-red-500 h-full transition-all duration-500" />
         </div>
      </div>
    </div>
  );
};

export default LiveStats;
