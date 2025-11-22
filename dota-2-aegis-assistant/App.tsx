
import React, { useState, useEffect, useCallback } from 'react';
import HeroGrid from './components/HeroGrid';
import DraftBoard from './components/DraftBoard';
import AnalysisPanel from './components/AnalysisPanel';
import ChatAssistant from './components/ChatAssistant';
import ImageAnalyzer from './components/ImageAnalyzer';
import LiveStats from './components/LiveStats';
import { Hero, Team, DraftSlot, AnalysisData, PlayerRole, MatchupStatus } from './types';
import { analyzeDraft, getBatchMatchups } from './services/geminiService';
import { RefreshCw, ChevronRight, Trash2, User, Settings, MousePointerClick, RotateCcw } from 'lucide-react';

// Initialize empty draft (5 slots per team)
const INITIAL_SLOTS = (team: Team) => 
  Array(5).fill(null).map((_, i) => ({
    team,
    hero: null,
    order: i
  }));

const App: React.FC = () => {
  const [radiantPicks, setRadiantPicks] = useState<DraftSlot[]>(INITIAL_SLOTS(Team.RADIANT));
  const [direPicks, setDirePicks] = useState<DraftSlot[]>(INITIAL_SLOTS(Team.DIRE));
  
  // Selection State - Default to Radiant Pos 1
  const [selectedSlot, setSelectedSlot] = useState<{ team: Team, index: number } | null>({ team: Team.RADIANT, index: 0 });
  
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [matchupMap, setMatchupMap] = useState<Record<string, MatchupStatus>>({});

  // User Context State
  const [userSide, setUserSide] = useState<Team>(Team.RADIANT);
  const [userRole, setUserRole] = useState<PlayerRole>(PlayerRole.CARRY);

  // History for Undo
  const [history, setHistory] = useState<{radiant: DraftSlot[], dire: DraftSlot[]}[]>([]);

  // Calculate disabled heroes
  const pickedHeroIds = [
    ...radiantPicks, ...direPicks
  ].map(s => s.hero?.id).filter((id): id is number => id !== undefined);

  // Derived lists for Live Stats
  const radiantHeroes = radiantPicks.map(s => s.hero).filter((h): h is Hero => h !== null);
  const direHeroes = direPicks.map(s => s.hero).filter((h): h is Hero => h !== null);

  // --- Effect: Fetch Batch Matchups when Enemy Team Changes ---
  useEffect(() => {
    const fetchMatchups = async () => {
      // If user is Radiant, we care about counters to Dire, and vice versa
      const enemyHeroes = userSide === Team.RADIANT ? direHeroes : radiantHeroes;

      if (enemyHeroes.length === 0) {
        setMatchupMap({});
        return;
      }

      try {
        const result = await getBatchMatchups(enemyHeroes);
        // Defensive checks in case response is malformed
        const goodList = result?.goodAgainst || [];
        const badList = result?.badAgainst || [];
        
        const newMap: Record<string, MatchupStatus> = {};
        goodList.forEach(name => newMap[name] = 'good');
        badList.forEach(name => newMap[name] = 'bad');
        setMatchupMap(newMap);
      } catch (e) {
        console.error("Matchup fetch failed", e);
      }
    };

    const timeoutId = setTimeout(fetchMatchups, 1000); // Debounce API calls
    return () => clearTimeout(timeoutId);
  }, [radiantHeroes.length, direHeroes.length, userSide]); // Re-run when hero counts change


  const handleSlotClick = (team: Team, index: number) => {
    setSelectedSlot({ team, index });
  };

  const pushHistory = () => {
    setHistory(prev => [...prev, { radiant: JSON.parse(JSON.stringify(radiantPicks)), dire: JSON.parse(JSON.stringify(direPicks)) }]);
  };

  const handleHeroSelect = async (hero: Hero) => {
    if (!selectedSlot) return;

    pushHistory(); // Save state before change

    const targetSet = selectedSlot.team === Team.RADIANT ? radiantPicks : direPicks;
    const setFunction = selectedSlot.team === Team.RADIANT ? setRadiantPicks : setDirePicks;

    const newSet = targetSet.map((slot) => 
      slot.order === selectedSlot.index ? { ...slot, hero: hero } : slot
    );
    
    setFunction(newSet);
    
    // Auto-advance
    const nextIndex = newSet.findIndex((s, i) => i > selectedSlot.index && s.hero === null);
    if (nextIndex !== -1) {
       setSelectedSlot({ team: selectedSlot.team, index: nextIndex });
    } else {
        const anyEmpty = newSet.findIndex(s => s.hero === null);
        if (anyEmpty !== -1) {
            setSelectedSlot({ team: selectedSlot.team, index: anyEmpty });
        }
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setRadiantPicks(lastState.radiant);
    setDirePicks(lastState.dire);
    setHistory(prev => prev.slice(0, -1));
  };

  const handleReset = () => {
    setRadiantPicks(INITIAL_SLOTS(Team.RADIANT));
    setDirePicks(INITIAL_SLOTS(Team.DIRE));
    setAnalysisData(null);
    setAnalysisError(null);
    setSelectedSlot({ team: Team.RADIANT, index: 0 });
    setMatchupMap({});
    setHistory([]);
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await analyzeDraft(radiantHeroes, direHeroes, userSide, userRole);
      setAnalysisData(result);
    } catch (e) {
      console.error(e);
      setAnalysisError("Analysis failed. Please check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans flex flex-col">
      
      {/* Navbar */}
      <header className="bg-dota-panel border-b border-dota-border p-3 lg:p-4 flex items-center justify-between sticky top-0 z-40 shadow-lg relative">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-red-600 to-orange-600 p-2 rounded-lg shadow-lg">
             <span className="font-bold text-white tracking-tighter text-lg">AEGIS</span>
          </div>
          <h1 className="hidden sm:block font-bold text-xl text-gray-100 tracking-wide">Dota 2 Assistant</h1>
        </div>

        {/* Game Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Undo last pick"
          >
             <RotateCcw size={16} />
             <span className="hidden sm:inline text-xs font-bold">UNDO</span>
          </button>

          <div className="h-6 w-[1px] bg-gray-700 mx-1"></div>

          <button 
            onClick={handleReset}
            className="p-2 bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400 rounded border border-gray-700 hover:border-red-500 transition-all"
            title="Reset Draft"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* Enhanced Player Settings Bar */}
      <div className="bg-[#151515] border-b border-dota-border py-2 px-4 flex flex-col sm:flex-row justify-center items-center gap-4 shadow-inner">
           <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
              <Settings size={14} />
              <span>PLAYER SETTINGS:</span>
           </div>
           
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-black/40 rounded px-2 py-1 border border-gray-800">
                <span className="text-xs text-gray-500 uppercase font-bold">My Side</span>
                <div className="flex gap-1">
                    <button 
                      onClick={() => setUserSide(Team.RADIANT)}
                      className={`px-3 py-0.5 rounded text-xs font-bold transition-all ${userSide === Team.RADIANT ? 'bg-radiant text-white shadow-[0_0_10px_rgba(16,128,67,0.4)]' : 'text-gray-500 hover:bg-gray-800'}`}
                    >
                      RADIANT
                    </button>
                    <button 
                      onClick={() => setUserSide(Team.DIRE)}
                      className={`px-3 py-0.5 rounded text-xs font-bold transition-all ${userSide === Team.DIRE ? 'bg-dire text-white shadow-[0_0_10px_rgba(166,30,77,0.4)]' : 'text-gray-500 hover:bg-gray-800'}`}
                    >
                      DIRE
                    </button>
                </div>
             </div>

             <div className="flex items-center gap-2 bg-black/40 rounded px-2 py-1 border border-gray-800">
                <span className="text-xs text-gray-500 uppercase font-bold">My Role</span>
                <div className="relative">
                  <select 
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as PlayerRole)}
                    className="bg-transparent text-xs text-blue-300 font-bold focus:outline-none border-none cursor-pointer appearance-none pr-4"
                  >
                    {Object.values(PlayerRole).map((role) => (
                      <option key={role} value={role} className="bg-gray-900 text-gray-300">
                        {role}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-0 top-1/2 transform -translate-y-1/2 rotate-90 text-gray-500 w-3 h-3 pointer-events-none" />
                </div>
             </div>
           </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-130px)]">
        
        {/* Left Column: Draft Board & Stats */}
        <div className="lg:col-span-8 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
          {/* Real-time Composition Stats Row */}
          <div className="grid grid-cols-2 gap-4">
             <LiveStats heroes={radiantHeroes} teamName="Radiant" color="#10b981" />
             <LiveStats heroes={direHeroes} teamName="Dire" color="#f43f5e" />
          </div>

          <DraftBoard 
            radiantSlots={radiantPicks}
            direSlots={direPicks}
            selectedSlot={selectedSlot}
            onSlotClick={handleSlotClick}
          />
          
          <div className="flex-grow min-h-[400px]">
             <HeroGrid 
               onSelect={handleHeroSelect} 
               disabledHeroes={pickedHeroIds}
               matchupMap={matchupMap} 
               suggestedHeroes={analysisData?.suggestedPicks.map(p => p.heroName) || []}
             />
          </div>
        </div>

        {/* Right Column: Analysis */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <AnalysisPanel 
            data={analysisData} 
            isLoading={isAnalyzing} 
            onAnalyze={runAnalysis} 
            error={analysisError}
          />
        </div>
      </main>

      <ChatAssistant />
      <ImageAnalyzer />
    </div>
  );
};

export default App;
