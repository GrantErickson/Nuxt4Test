import { WORD_LENGTH } from "./types";

/**
 * Manages the word list for Wordle game.
 * Handles loading, validation, and random word selection.
 */
export class WordList {
  private words: string[];
  private validWordsSet: Set<string>;

  constructor(rawWordList: string) {
    this.words = this.parseWordList(rawWordList);
    this.validWordsSet = new Set(this.words);
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
   * Check if a word is valid (exists in word list)
   */
  isValidWord(word: string): boolean {
    return this.validWordsSet.has(word.toLowerCase());
  }

  /**
   * Get a random word from the list
   */
  getRandomWord(): string {
    const index = Math.floor(Math.random() * this.words.length);
    return this.words[index] ?? this.words[0] ?? "apple";
  }

  /**
   * Get total count of words in the list
   */
  get count(): number {
    return this.words.length;
  }
}
