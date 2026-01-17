import type Matter from "matter-js";

// Tool types
export type ToolType =
  | "scissors-small"
  | "scissors-large"
  | "comb-small"
  | "comb-large";

export interface Tool {
  type: ToolType;
  size: number; // Cutting/combing radius
  label: string;
  icon: string;
}

export const TOOLS: Record<ToolType, Tool> = {
  "scissors-small": {
    type: "scissors-small",
    size: 15,
    label: "Small Scissors",
    icon: "✂️",
  },
  "scissors-large": {
    type: "scissors-large",
    size: 30,
    label: "Large Scissors",
    icon: "✂️",
  },
  "comb-small": {
    type: "comb-small",
    size: 20,
    label: "Small Comb",
    icon: "🪥",
  },
  "comb-large": {
    type: "comb-large",
    size: 40,
    label: "Large Comb",
    icon: "🪥",
  },
};

// Hair segment - individual physics body in a strand
export interface HairSegment {
  body: Matter.Body;
  constraint: Matter.Constraint | null; // Constraint connecting to next segment (null for tip)
}

// Hair strand - chain of connected segments
export interface HairStrand {
  id: number;
  rootX: number; // Anchor point on scalp
  rootY: number;
  segments: HairSegment[];
  anchorConstraint: Matter.Constraint; // Anchors root to scalp
  color: string;
  isCombed: boolean; // Whether currently held by comb
  combAngle: number; // Target angle when combed
  isStyled: boolean; // Whether hair has been styled with comb
  styledAngle: number; // Persistent styled direction (radians)
}

// Style goal definitions
export type StyleType =
  | "uniform"
  | "mohawk"
  | "fade-left"
  | "fade-right"
  | "bald"
  | "long";

export interface StyleGoal {
  type: StyleType;
  name: string;
  description: string;
  targetLengths: number[]; // Target segment count per strand position (left to right)
  difficulty: number; // 1-5
  timeBonus: number; // Seconds to complete for bonus
  basePoints: number;
}

export const STYLE_GOALS: StyleGoal[] = [
  {
    type: "uniform",
    name: "Buzz Cut",
    description: "Cut all hair to 2 segments",
    targetLengths: Array(81).fill(2),
    difficulty: 1,
    timeBonus: 30,
    basePoints: 100,
  },
  {
    type: "bald",
    name: "Clean Shave",
    description: "Cut all hair as short as possible",
    targetLengths: Array(81).fill(1),
    difficulty: 1,
    timeBonus: 20,
    basePoints: 80,
  },
  {
    type: "long",
    name: "Let It Grow",
    description: "Grow hair to at least 8 segments",
    targetLengths: Array(81).fill(8),
    difficulty: 2,
    timeBonus: 60,
    basePoints: 150,
  },
  {
    type: "mohawk",
    name: "Mohawk",
    description: "Short sides, tall middle",
    targetLengths: Array.from({ length: 81 }, (_, i) => {
      const center = 40;
      const dist = Math.abs(i - center);
      if (dist <= 5) return 10;
      if (dist <= 10) return 8;
      if (dist <= 15) return 5;
      if (dist <= 20) return 3;
      if (dist <= 25) return 2;
      return 1;
    }),
    difficulty: 3,
    timeBonus: 45,
    basePoints: 250,
  },
  {
    type: "fade-left",
    name: "Left Fade",
    description: "Gradual fade from left to right",
    targetLengths: Array.from({ length: 81 }, (_, i) =>
      Math.floor(1 + (i / 80) * 13)
    ),
    difficulty: 4,
    timeBonus: 50,
    basePoints: 300,
  },
  {
    type: "fade-right",
    name: "Right Fade",
    description: "Gradual fade from right to left",
    targetLengths: Array.from({ length: 81 }, (_, i) =>
      Math.floor(14 - (i / 80) * 13)
    ),
    difficulty: 4,
    timeBonus: 50,
    basePoints: 300,
  },
];

// Game configuration
export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  headCenterX: number;
  headCenterY: number;
  headRadius: number;
  strandCount: number;
  segmentRadius: number;
  segmentLength: number;
  maxSegments: number;
  growthIntervalMs: number;
  gravity: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  canvasWidth: 800,
  canvasHeight: 600,
  headCenterX: 400,
  headCenterY: 350,
  headRadius: 80,
  strandCount: 81,
  segmentRadius: 2,
  segmentLength: 8,
  maxSegments: 15,
  growthIntervalMs: 2000,
  gravity: 0.5,
};

// Game state
export interface GameState {
  score: number;
  currentGoal: StyleGoal | null;
  goalStartTime: number;
  completedGoals: number;
  averageAccuracy: number;
  difficultyLevel: number;
  isPaused: boolean;
  isGameOver: boolean;
}

// Mouse/touch position
export interface Point {
  x: number;
  y: number;
}
