import type Matter from "matter-js";

export type GameMode = "endless" | "timed";

export type PowerUpType = "grow" | "shrink" | "slow" | "clear";

export interface VoidCatcherConfig {
  canvasWidth: number;
  canvasHeight: number;
  wallThickness: number;
  voidRadius: number;
  initialSpawnRate: number;
  gameMode: GameMode;
  timedModeDuration?: number; // seconds for timed mode
}

export interface GameShape {
  body: Matter.Body;
  id: string;
  createdAt: number;
  caughtInAir: boolean;
  isPowerUp: boolean;
  powerUpType?: PowerUpType;
}

export interface VoidCatcherState {
  score: number;
  highScore: number;
  isGameOver: boolean;
  isPaused: boolean;
  elapsed: number;
  shapeCount: number;
  perfectCatchStreak: number;
  multiplier: number;
  voidRadius: number;
  timeRemaining?: number; // for timed mode
}

export interface ScoreEvent {
  points: number;
  isPerfectCatch: boolean;
  x: number;
  y: number;
  multiplier: number;
}

export interface PowerUp {
  type: PowerUpType;
  duration?: number; // milliseconds, if not permanent
  activatedAt?: number;
}

export const SHAPE_TYPES = [
  "circle",
  "rectangle",
  "pentagon",
  "hexagon",
  "triangle",
] as const;
export type ShapeType = (typeof SHAPE_TYPES)[number];

export const BASE_SCORE = 10;
export const PERFECT_CATCH_SCORE = 50;
export const MAX_MULTIPLIER = 5;
export const MULTIPLIER_DECAY_TIME = 2000; // milliseconds
export const POWER_UP_DURATION = 5000; // 5 seconds for timed power-ups
