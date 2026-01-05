// Crossword puzzle types

export interface WordClue {
  word: string;
  clue: string;
}

export interface PlacedWord {
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  direction: "across" | "down";
  number: number;
}

export interface Cell {
  letter: string | null; // null = black cell
  number?: number; // clue number if this is the start of a word
  userInput: string;
  revealed: boolean;
  isBlack: boolean;
}

export interface Clue {
  number: number;
  clue: string;
  direction: "across" | "down";
  answer: string;
  startRow: number;
  startCol: number;
  length: number;
}

export interface CrosswordState {
  grid: Cell[][];
  acrossClues: Clue[];
  downClues: Clue[];
  completed: boolean;
  selectedCell: { row: number; col: number } | null;
  selectedDirection: "across" | "down";
}
