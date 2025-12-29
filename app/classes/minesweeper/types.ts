// Minesweeper (Bear Patrol) game types and interfaces

export interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export interface Position {
  row: number;
  col: number;
}

export interface GameConfig {
  boardSize: number;
  mineCount: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  boardSize: 15,
  mineCount: 35,
};

// Wilderness theme decorations
export const FOREST_EMOJIS = [
  "🌲",
  "🌳",
  "🌿",
  "🍃",
  "🌲",
  "🌳",
  "🍂",
  "🌲",
] as const;

export const TREE_LINES = [
  "The Forest Awaits",
  "Watch for Bears",
  "Explore Carefully",
  "Nature is Wild",
] as const;
