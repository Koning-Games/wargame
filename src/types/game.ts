export type PlayerId = "blue" | "red" | "green" | "gold";

export type Phase = "reinforce" | "attack" | "fortify" | "gameOver";

export type Continent =
  | "America do Norte"
  | "America do Sul"
  | "Europa"
  | "Africa"
  | "Asia"
  | "Oceania";

export type CardSymbol = "triangle" | "circle" | "square";

export interface Player {
  id: PlayerId;
  name: string;
  color: string;
  accent: string;
  isBot: boolean;
  cards: TerritoryCard[];
}

export interface TerritoryCard {
  territoryId: string;
  symbol: CardSymbol;
}

export interface TerritoryDefinition {
  id: string;
  name: string;
  continent: Continent;
  path: string;
  label: { x: number; y: number };
  neighbors: string[];
}

export interface TerritoryState {
  owner: PlayerId;
  troops: number;
}

export interface BattleResult {
  attackerRolls: number[];
  defenderRolls: number[];
  attackerLosses: number;
  defenderLosses: number;
  conquered: boolean;
}

export interface SelectionState {
  sourceId?: string;
  targetId?: string;
}

export interface GameLogEntry {
  id: number;
  text: string;
  tone: "info" | "success" | "danger";
}

export interface GameState {
  players: Player[];
  territories: Record<string, TerritoryState>;
  deck: TerritoryCard[];
  discard: TerritoryCard[];
  currentPlayerIndex: number;
  phase: Phase;
  reinforcements: number;
  tradedSets: number;
  selection: SelectionState;
  latestBattle?: BattleResult;
  conqueredThisTurn: boolean;
  hasFortified: boolean;
  log: GameLogEntry[];
}
