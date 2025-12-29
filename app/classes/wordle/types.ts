// Wordle game types and interfaces

export interface Guess {
  word: string;
  letters: string[];
}

export type LetterState = "correct" | "present" | "absent";

export interface LetterResult {
  letter: string;
  state: LetterState;
}

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
] as const;
