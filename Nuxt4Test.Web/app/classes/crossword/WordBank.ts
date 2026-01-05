// Word bank with clues for crossword puzzles
// Re-exports word arrays from separate files organized by word length
import type { WordClue } from "./types";

// Import word arrays from separate files
import { threeLetterWords } from "./words3";
import { fourLetterWords } from "./words4";
import { fiveLetterWords } from "./words5";
import { sixLetterWords } from "./words6";

// Re-export word arrays for convenience
export { threeLetterWords, fourLetterWords, fiveLetterWords, sixLetterWords };

// Get all words combined
export function getAllWords(): WordClue[] {
  return [
    ...threeLetterWords,
    ...fourLetterWords,
    ...fiveLetterWords,
    ...sixLetterWords,
  ];
}

// Get words by length
export function getWordsByLength(length: number): WordClue[] {
  switch (length) {
    case 3:
      return threeLetterWords;
    case 4:
      return fourLetterWords;
    case 5:
      return fiveLetterWords;
    case 6:
      return sixLetterWords;
    default:
      return [];
  }
}

// Get a random word of a specific length
export function getRandomWord(length: number): WordClue | null {
  const words = getWordsByLength(length);
  if (words.length === 0) return null;
  const word = words[Math.floor(Math.random() * words.length)];
  return word ?? null;
}
