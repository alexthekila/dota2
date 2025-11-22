
import React, { useState, useMemo } from 'react';
import { Hero, Attribute, MatchupStatus } from '../types';
import { HEROES, getHeroImageUrl } from '../constants';
import { Search, X, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';

interface HeroGridProps {
  onSelect: (hero: Hero) => void;
  disabledHeroes: number[]; // IDs of picked heroes
  matchupMap: Record<string, MatchupStatus>;
  suggestedHeroes?: string[];
}

const HeroGrid: React.FC<HeroGridProps> = ({ onSelect, disabledHeroes, matchupMap, suggestedHeroes = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [attributeFilter, setAttributeFilter] = useState<Attribute | 'All'>('All');

  const filteredHeroes = useMemo(() => {
    return HEROES.filter(hero => {
      const matchesSearch = hero.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAttr = attributeFilter === 'All' || hero.attribute === attributeFilter;
      return matchesSearch && matchesAttr;
    });
  }, [searchTerm, attributeFilter]);

  // Map attributes to standard Dota colors
  const getAttrBg = (attr: Attribute | 'All') => {
     if (attr === 'All') return 'bg-gray-700 text-white';
     switch (attr) {
      case Attribute.STRENGTH: return 'bg-red-900/40 text-red-400 border-red-500/50';
      case Attribute.AGILITY: return 'bg-green-900/40 text-green-400 border-green-500/50';
      case Attribute.INTELLIGENCE: return 'bg-blue-900/40 text-blue-400 border-blue-500/50';
      case Attribute.UNIVERSAL: return 'bg-yellow-900/40 text-yellow-400 border-yellow-500/50';
      default: return 'bg-gray-800';
    }
  }

  return (
    <div className="bg-dota-panel border border-dota-border p-4 rounded-lg h-full flex flex-col shadow-inner relative">
      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-4 mb-4 justify-between">
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search heroes..."
            className="w-full bg-black/40 border border-gray-700 rounded pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-900 transition-all text-gray-200 placeholder-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Attribute Buttons */}
        <div className="flex gap-1 flex-wrap">
          {['All', Attribute.STRENGTH, Attribute.AGILITY, Attribute.INTELLIGENCE, Attribute.UNIVERSAL].map((attr) => (
            <button
              key={attr}
              onClick={() => setAttributeFilter(attr as Attribute | 'All')}
              className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded border transition-all ${
                attributeFilter === attr 
                  ? `${getAttrBg(attr as Attribute | 'All')} shadow-lg` 
                  : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-800 hover:text-gray-300'
              }`}
            >
              {attr === 'All' ? 'All' : attr.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 overflow-y-auto pr-1 flex-grow custom-scrollbar content-start">
        {filteredHeroes.map(hero => {
          const isDisabled = disabledHeroes.includes(hero.id);
          const isSuggested = suggestedHeroes.includes(hero.name);
          const status = matchupMap[hero.name];
          
          let borderClass = 'border-transparent';
          let glowClass = '';
          let statusIcon = null;
          let statusLabel = null;

          if (!isDisabled) {
            if (isSuggested) {
              borderClass = 'border-blue-400 border-2';
              glowClass = 'shadow-[0_0_15px_rgba(96,165,250,0.5)] z-10 scale-[1.02] ring-1 ring-blue-400/50';
              statusIcon = <div className="absolute top-0 left-0 bg-blue-600 text-white p-1 rounded-br shadow-md z-20"><Sparkles size={14} fill="white" /></div>;
              statusLabel = <div className="absolute top-0 right-0 bg-blue-600/90 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-bl shadow-sm z-20">REC</div>;
            } else if (status === 'good') {
              borderClass = 'border-green-500 border-2';
              glowClass = 'shadow-[0_0_10px_rgba(34,197,94,0.3)] z-10';
              statusIcon = <div className="absolute top-0 left-0 bg-green-600 text-white p-1 rounded-br shadow-md z-20"><ThumbsUp size={12} /></div>;
            } else if (status === 'bad') {
              borderClass = 'border-red-600/80 border-2';
              statusIcon = <div className="absolute top-0 left-0 bg-red-600 text-white p-1 rounded-br shadow-md z-20"><ThumbsDown size={12} /></div>;
            }
          }

          return (
            <button
              key={hero.id}
              onClick={() => !isDisabled && onSelect(hero)}
              disabled={isDisabled}
              className={`relative group aspect-[16/9] overflow-hidden rounded-lg border transition-all duration-200 ${borderClass} ${glowClass} ${
                isDisabled 
                  ? 'opacity-20 grayscale cursor-not-allowed' 
                  : 'cursor-pointer hover:border-gray-300 hover:shadow-lg hover:z-30 hover:scale-105'
              }`}
            >
              <img
                src={getHeroImageUrl(hero.img)}
                alt={hero.name}
                className={`w-full h-full object-cover transition-transform ${status === 'bad' && !isDisabled ? 'grayscale-[0.5]' : ''}`}
                loading="lazy"
              />
              
              {statusIcon}
              {statusLabel}

              {/* Hero Name - Always visible gradient for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end justify-center pb-1.5">
                <span className={`text-[10px] sm:text-xs font-bold truncate px-1 w-full text-center shadow-black drop-shadow-md ${isSuggested ? 'text-blue-200' : 'text-gray-200 group-hover:text-white'}`}>
                  {hero.name}
                </span>
              </div>
              
              {/* Attribute Dot */}
              <div className={`absolute top-0 right-0 w-3 h-3 ${
                 hero.attribute === Attribute.STRENGTH ? 'bg-red-600' :
                 hero.attribute === Attribute.AGILITY ? 'bg-green-600' :
                 hero.attribute === Attribute.INTELLIGENCE ? 'bg-blue-600' : 'bg-yellow-600'
              } rounded-bl opacity-90`} />
            </button>
          );
        })}
        
        {filteredHeroes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center text-gray-500 py-10">
                <Search size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No heroes found</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default HeroGrid;
