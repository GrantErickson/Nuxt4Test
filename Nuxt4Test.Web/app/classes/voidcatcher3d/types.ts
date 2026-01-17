import type * as THREE from "three";
import type * as CANNON from "cannon-es";

export type GameMode = "endless" | "timed";

export type PowerUpType = "grow" | "shrink" | "slow" | "fast" | "magnet";

export interface VoidCatcher3DConfig {
  playAreaSize: number; // Radius of the circular play area
  voidRadius: number;
  initialSpawnRate: number;
  gameMode: GameMode;
  timedModeDuration?: number; // seconds for timed mode
}

export interface GameShape3D {
  mesh: THREE.Mesh;
  body: CANNON.Body;
  id: string;
  createdAt: number;
  caughtInAir: boolean;
  isPowerUp: boolean;
  powerUpType?: PowerUpType;
  hasLanded: boolean; // Track if shape has touched the ground
  isFalling: boolean; // Track if shape is falling into void
  fallingStartTime?: number; // When the shape started falling
  fallingStartY?: number; // Initial Y position when falling started
}

export interface VoidCatcher3DState {
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

export interface ScoreEvent3D {
  points: number;
  isPerfectCatch: boolean;
  position: THREE.Vector3;
  multiplier: number;
  timestamp: number;
}

export interface PowerUp {
  type: PowerUpType;
  duration?: number; // milliseconds, if not permanent
  activatedAt?: number;
}

export const SHAPE_TYPES_3D = [
  "sphere",
  "box",
  "cylinder",
  "cone",
  "tetrahedron",
  "octahedron",
] as const;
export type ShapeType3D = (typeof SHAPE_TYPES_3D)[number];

export const BASE_SCORE = 10;
export const PERFECT_CATCH_SCORE = 50;
export const MAX_MULTIPLIER = 5;
export const MULTIPLIER_DECAY_TIME = 2000; // milliseconds
export const POWER_UP_DURATION = 5000; // 5 seconds for negative timed power-ups
export const POSITIVE_POWER_UP_DURATION = 10000; // 10 seconds for positive power-ups (2x longer)
export const LANDING_VELOCITY_THRESHOLD = 0.5; // Velocity below this means shape has landed

// Helper to determine if a powerup is positive (beneficial to player)
export const isPositivePowerUp = (type: PowerUpType): boolean => {
  return type === "grow" || type === "slow" || type === "magnet";
};
