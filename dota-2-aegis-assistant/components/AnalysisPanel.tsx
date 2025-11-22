import React from 'react';
import { AnalysisData, TeamStats } from '../types';
import { getItemImageUrl } from '../constants';
import { BrainCircuit, TrendingUp, AlertTriangle, Zap, UserCircle, Info, ShoppingBag, BarChart2, RefreshCw, AlertOctagon } from 'lucide-react';

interface AnalysisPanelProps {
  data: AnalysisData | null;
  isLoading: boolean;
  onAnalyze: () => void;
  error?: string | null;
}

// Radar Chart Component
const TeamStatsRadar: React.FC<{ radiant: TeamStats, dire: TeamStats }> = ({ radiant, dire }) => {
  const size = 200;
  const center = size / 2;
  const radius = 70;
  const axes = ['Teamfight', 'Push', 'Late Game', 'Laning', 'Control'];
  
  // Convert score (1-10) to coordinate
  const getCoord = (score: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (score / 10) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  };

  const getLabelCoord = (index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = radius + 20;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const radiantPoints = axes.map((_, i) => getCoord(radiant[Object.keys(radiant)[i] as keyof TeamStats] || 5, i, axes.length)).join(' ');
  const direPoints = axes.map((_, i) => getCoord(dire[Object.keys(dire)[i] as keyof TeamStats] || 5, i, axes.length)).join(' ');

  return (
    <div className="flex flex-col items-center justify-center bg-black/20 rounded-lg p-2 mt-2">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid */}
        {[2, 4, 6, 8, 10].map(level => (
          <polygon
            key={level}
            points={axes.map((_, i) => getCoord(level, i, axes.length)).join(' ')}
            fill="none"
            stroke="#333"
            strokeWidth="1"
          />
        ))}
        
        {/* Axes */}
        {axes.map((_, i) => {
           const end = getCoord(10, i, axes.length);
           return <line key={i} x1={center} y1={center} x2={end.split(',')[0]} y2={end.split(',')[1]} stroke="#333" strokeWidth="1" />;
        })}

        {/* Radiant Shape */}
        <polygon points={radiantPoints} fill="rgba(16, 185, 129, 0.3)" stroke="#10b981" strokeWidth="2" />
        
        {/* Dire Shape */}
        <polygon points={direPoints} fill="rgba(244, 63, 94, 0.3)" stroke="#f43f5e" strokeWidth="2" />

        {/* Labels */}
        {axes.map((label, i) => {
          const { x, y } = getLabelCoord(i, axes.length);
          return (
            <text 
              key={i} 
              x={x} 
              y={y} 
              textAnchor="middle" 
              dominantBaseline="middle" 
              fill="#888" 
              fontSize="10"
              className="uppercase font-bold tracking-tighter"
            >
              {label}
            </text>
          );
        })}
      </svg>
      <div className="flex gap-4 mt-4 text-xs font-bold">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-radiant rounded-full"></div>
          <span className="text-radiant">Radiant</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-dire rounded-full"></div>
          <span className="text-dire">Dire</span>
        </div>
      </div>
    </div>
  );
};

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ data, isLoading, onAnalyze, error }) => {
  if (!data && !isLoading) {
    return (
      <div className="bg-dota-panel border border-dota-border p-6 rounded-lg flex flex-col items-center justify-center h-full min-h-[300px] text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <BrainCircuit className="w-16 h-16 text-gray-600 mb-4 group-hover:text-blue-500 transition-colors duration-300" />
          <h3 className="text-xl font-bold text-gray-200 mb-2">Strategic Analysis</h3>
          <p className="text-gray-500 mb-6 max-w-xs text-sm">
            Unlock deep insights with Gemini 3 Pro. Analyze win probabilities, power spikes, and optimal item builds.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-300 text-xs flex items-center gap-2 max-w-xs text-left">
              <AlertOctagon size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button 
            onClick={onAnalyze}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:scale-105 active:scale-95 cursor-pointer"
          >
            Analyze Draft
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-dota-panel border border-dota-border p-6 rounded-lg flex flex-col items-center justify-center h-full min-h-[300px]">
        <div className="relative w-16 h-16 mb-6">
           <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-blue-400 animate-pulse font-mono text-sm tracking-wide">ANALYZING DRAFT DATA...</p>
        <p className="text-gray-500 text-xs mt-2">This may take a few seconds</p>
      </div>
    );
  }

  return (
    <div className="bg-dota-panel border border-dota-border rounded-lg overflow-hidden flex flex-col h-full">
      <div className="bg-gray-900/80 backdrop-blur-sm p-3 border-b border-dota-border flex justify-between items-center sticky top-0 z-10">
        <h3 className="font-bold text-sm flex items-center gap-2 text-blue-400 uppercase tracking-wider">
          <BrainCircuit size={16} /> Match Insight
        </h3>
        <button 
          onClick={onAnalyze} 
          className="flex items-center gap-1 text-[10px] font-bold bg-blue-900/20 hover:bg-blue-900/40 text-blue-300 px-3 py-1.5 rounded border border-blue-900/50 transition-all hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
        >
          <RefreshCw size={10} /> REFRESH
        </button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar flex-grow">
        
        {/* Error in Panel */}
        {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-300 text-xs flex items-center gap-2">
              <AlertOctagon size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
        )}

        {/* Win Rate Bar */}
        {data?.winRatePrediction !== undefined && (
          <div className="space-y-2 bg-black/20 p-3 rounded-lg border border-gray-800">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
              <span>Radiant</span>
              <span className="text-white">{data.winRatePrediction}% Win Prob</span>
              <span>Dire</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex relative">
              <div className="absolute inset-0 flex items-center justify-center z-10 opacity-20">
                <div className="w-0.5 h-full bg-white"></div>
              </div>
              <div 
                style={{ width: `${data.winRatePrediction}%` }} 
                className="bg-gradient-to-r from-radiant-dark to-radiant h-full transition-all duration-1000"
              />
              <div 
                style={{ width: `${100 - data.winRatePrediction}%` }} 
                className="bg-gradient-to-l from-dire-dark to-dire h-full transition-all duration-1000"
              />
            </div>
          </div>
        )}

        {/* Radar Chart */}
        {data?.radiantStats && data?.direStats && (
          <div>
             <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <BarChart2 size={12} /> Team Composition
             </div>
             <TeamStatsRadar radiant={data.radiantStats} dire={data.direStats} />
          </div>
        )}

        {/* Personal Advice */}
        {data?.personalAdvice && (
          <div className="p-4 bg-gradient-to-br from-purple-900/10 to-transparent border-l-2 border-purple-500 rounded-r-lg">
             <h4 className="text-sm font-bold text-purple-300 mb-2 flex items-center gap-2">
               <UserCircle size={16} /> Your Strategy
             </h4>
             <p className="text-xs text-gray-300 leading-relaxed font-medium">
               {data.personalAdvice}
             </p>
          </div>
        )}

        {/* Suggested Picks */}
        {data?.suggestedPicks && data.suggestedPicks.length > 0 && (
          <div className="space-y-3">
             <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
               <Zap size={12} /> Recommended Heroes
             </h4>
             <div className="flex flex-col gap-2">
               {data.suggestedPicks.map((pick, i) => (
                 <div key={i} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-blue-100">{pick.heroName}</span>
                      <span className="text-[10px] bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded">Top Pick</span>
                    </div>
                    <div className="flex gap-2 items-start">
                       <Info size={12} className="text-gray-500 mt-0.5 flex-shrink-0" />
                       <p className="text-[11px] text-gray-400 leading-relaxed">{pick.reason}</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}
        
        {/* Recommended Items */}
        {data?.itemRecommendations && data.itemRecommendations.length > 0 && (
          <div className="space-y-3">
             <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2">
               <ShoppingBag size={12} /> Key Items
             </h4>
             <div className="grid grid-cols-1 gap-2">
               {data.itemRecommendations.map((item, i) => (
                 <div key={i} className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50 flex gap-3 hover:bg-gray-800 transition-colors">
                    <div className="relative w-10 h-8 flex-shrink-0">
                      <img 
                        src={getItemImageUrl(item.itemSlug)} 
                        alt={item.itemName} 
                        className="w-full h-full object-contain bg-black rounded border border-gray-600"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                       <div className="text-xs font-bold text-yellow-100 truncate">{item.itemName}</div>
                       <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">{item.reason}</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
                <h4 className="font-bold text-radiant-glow flex items-center gap-1 uppercase tracking-wider">
                    <TrendingUp size={12} /> Radiant Pros
                </h4>
                <ul className="text-gray-400 space-y-1 list-disc pl-3 marker:text-radiant">
                    {data?.radiantStrengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
            </div>

            <div className="space-y-2">
                <h4 className="font-bold text-dire-glow flex items-center gap-1 uppercase tracking-wider">
                    <AlertTriangle size={12} /> Dire Pros
                </h4>
                <ul className="text-gray-400 space-y-1 list-disc pl-3 marker:text-dire">
                    {data?.direStrengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
            </div>
        </div>

        {/* Lane Analysis */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
           <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Lane Matchups</h4>
           <p className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap font-mono bg-black/20 p-2 rounded">
             {data?.laneAnalysis}
           </p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;