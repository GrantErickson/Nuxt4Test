import { WORD_LENGTH } from "./types";

/**
 * Manages the word lists for Wordle game.
 * Uses a smaller list of common words for target selection,
 * and a larger list of all valid words for guess validation.
 */
export class WordList {
  /** Common words used for selecting the target/hidden word */
  private targetWords: string[];
  /** All valid words that can be guessed (includes target words) */
  private validWordsSet: Set<string>;

  /**
   * @param targetWordList - Raw text of common words (one per line) used for target selection
   * @param validGuessesText - Optional raw text of all valid guesses. If not provided, uses targetWordList.
   */
  constructor(targetWordList: string, validGuessesText?: string) {
    this.targetWords = this.parseWordList(targetWordList);
    
    // Build valid words set from both lists
    const validGuesses = validGuessesText 
      ? this.parseWordList(validGuessesText)
      : [];
    
    // Combine target words and valid guesses into the valid set
    this.validWordsSet = new Set([...this.targetWords, ...validGuesses]);
  }

  /**
   * Parse raw word list text into array of valid words
   */
  private parseWordList(rawText: string): string[] {
    return rawText
      .split("\n")
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length === WORD_LENGTH);
  }

  /**
   * Check if a word is valid (exists in valid words set)
   */
  isValidWord(word: string): boolean {
    return this.validWordsSet.has(word.toLowerCase());
  }

  /**
   * Get a random word from the target words list (common words only)
   */
  getRandomWord(): string {
    const index = Math.floor(Math.random() * this.targetWords.length);
    return this.targetWords[index] ?? this.targetWords[0] ?? "apple";
  }

  /**
   * Get total count of target words
   */
  get count(): number {
    return this.targetWords.length;
  }

  /**
   * Get total count of valid guessable words
   */
  get validWordCount(): number {
    return this.validWordsSet.size;
  }

  /**
   * Get all valid words as an array (for hint solver)
   */
  getAllValidWords(): string[] {
    return Array.from(this.validWordsSet);
  }

  /**
   * Get target words array (common words only, for hint solver)
   */
  getTargetWords(): string[] {
    return [...this.targetWords];
  }
}
