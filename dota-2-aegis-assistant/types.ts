
export enum Attribute {
  STRENGTH = 'Strength',
  AGILITY = 'Agility',
  INTELLIGENCE = 'Intelligence',
  UNIVERSAL = 'Universal'
}

export enum PlayerRole {
  CARRY = 'Carry (Pos 1)',
  MID = 'Mid (Pos 2)',
  OFFLANE = 'Offlane (Pos 3)',
  SOFT_SUPPORT = 'Soft Support (Pos 4)',
  HARD_SUPPORT = 'Hard Support (Pos 5)'
}

export interface Hero {
  id: number;
  name: string;
  attribute: Attribute;
  roles: string[];
  img: string;
}

export enum Team {
  RADIANT = 'Radiant',
  DIRE = 'Dire'
}

export interface DraftSlot {
  team: Team;
  hero: Hero | null;
  order: number;
}

export interface ItemRecommendation {
  itemName: string;
  itemSlug: string;
  reason: string;
}

export interface TeamStats {
  teamfight: number;
  push: number;
  lategame: number;
  laning: number;
  control: number;
}

export interface AnalysisData {
  winRatePrediction?: number;
  radiantStrengths: string[];
  direStrengths: string[];
  radiantStats?: TeamStats;
  direStats?: TeamStats;
  suggestedPicks: { heroName: string; reason: string }[];
  itemRecommendations?: ItemRecommendation[];
  laneAnalysis: string;
  personalAdvice?: string;
  thinkingProcess?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type MatchupStatus = 'good' | 'bad' | 'neutral';
