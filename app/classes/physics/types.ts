import type Matter from "matter-js";

export type DropRate = "slow" | "medium" | "fast";

export interface TrackedShape {
  body: Matter.Body;
  createdAt: number;
}

export interface PhysicsConfig {
  canvasWidth: number;
  canvasHeight: number;
  wallThickness: number;
  shapeLifetimeSeconds: number;
  dropRate: DropRate;
}

export interface PhysicsState {
  shapeCount: number;
  elapsed: number;
  isPaused: boolean;
}

export const DROP_INTERVALS: Record<DropRate, number> = {
  slow: 1500,
  medium: 800,
  fast: 400,
};

export const SHAPE_GRADIENTS: [string, string][] = [
  ["#e91e63", "#f48fb1"], // Pink
  ["#9c27b0", "#ce93d8"], // Purple
  ["#673ab7", "#b39ddb"], // Deep Purple
  ["#3f51b5", "#9fa8da"], // Indigo
  ["#2196f3", "#90caf9"], // Blue
  ["#00bcd4", "#80deea"], // Cyan
  ["#009688", "#80cbc4"], // Teal
  ["#4caf50", "#a5d6a7"], // Green
  ["#ff9800", "#ffcc80"], // Orange
  ["#ff5722", "#ffab91"], // Deep Orange
  ["#e040fb", "#ea80fc"], // Purple Accent
  ["#00e5ff", "#84ffff"], // Cyan Accent
  ["#76ff03", "#ccff90"], // Light Green Accent
  ["#ffea00", "#ffff8d"], // Yellow Accent
];

// Keep single colors for compatibility
export const SHAPE_COLORS = SHAPE_GRADIENTS.map(([primary]) => primary);
