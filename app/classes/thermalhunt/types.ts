// Thermal Hunt game types and interfaces

export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  isRevealed: boolean;
  distance: number; // Manhattan or Euclidean distance to target
  isTarget: boolean;
}

export interface GameConfig {
  gridSize: number;
  maxDistance: number; // For color scaling
}

export const DEFAULT_CONFIG: GameConfig = {
  gridSize: 25,
  maxDistance: 35, // Approx max Manhattan distance on 25x25 grid
};

// Temperature colors from hot (close) to cold (far)
export const HEAT_COLORS = [
  "red-darken-2", // 0-2: Very hot (closest)
  "deep-orange-darken-1", // 3-5
  "orange", // 6-8
  "amber", // 9-11
  "yellow", // 12-15
  "lime", // 16-19
  "light-green", // 20-23
  "green", // 24-27
  "teal", // 28-31
  "cyan", // 32-35
  "light-blue", // 36-40
  "blue", // 41-45
  "indigo", // 46+: Very cold (farthest)
] as const;
