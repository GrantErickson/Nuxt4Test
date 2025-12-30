export type CellType = "wall" | "floor" | "water" | "crystal" | "entrance";

export interface Cell {
  type: CellType;
  region: number; // Which cavern region this cell belongs to (0 = wall)
}

export interface CaveConfig {
  rows: number;
  cols: number;
  fillProbability: number; // Initial random fill probability (0-1)
  smoothingIterations: number; // Number of cellular automata passes
  minRegionSize: number; // Minimum cells for a region to survive
  waterChance: number; // Chance of floor becoming water (0-1)
  crystalChance: number; // Chance of wall adjacent to floor having crystal (0-1)
}

export const DEFAULT_CONFIG: CaveConfig = {
  rows: 30,
  cols: 40,
  fillProbability: 0.45,
  smoothingIterations: 5,
  minRegionSize: 20,
  waterChance: 0.08,
  crystalChance: 0.02,
};

export interface CaveStats {
  totalFloor: number;
  totalWall: number;
  totalWater: number;
  totalCrystals: number;
  regionCount: number;
}

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  playerPos: Position;
  collectedGems: number;
  totalGems: number;
  isDead: boolean;
  hasWon: boolean;
}
