// Mastermind game types and interfaces

export type PegColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange";

export interface Guess {
  colors: PegColor[];
  feedback: Feedback;
}

export interface Feedback {
  exactMatches: number; // Right color, right place (black pegs)
  colorMatches: number; // Right color, wrong place (white pegs)
}

export interface GameConfig {
  codeLength: number;
  maxGuesses: number;
  availableColors: PegColor[];
}

export const AVAILABLE_COLORS: PegColor[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
];

export const DEFAULT_CONFIG: GameConfig = {
  codeLength: 4,
  maxGuesses: 10,
  availableColors: AVAILABLE_COLORS,
};

// Color display mappings for Vuetify
export const COLOR_MAP: Record<PegColor, string> = {
  red: "red",
  blue: "blue",
  green: "green",
  yellow: "yellow",
  purple: "purple",
  orange: "orange",
};
