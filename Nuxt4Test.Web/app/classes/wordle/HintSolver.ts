import type { Guess, LetterState } from "./types";
import { WORD_LENGTH } from "./types";

interface LetterConstraint {
  // Letters that must be at specific positions (green)
  mustBeAt: Map<number, string>;
  // Letters that must exist but not at specific positions (yellow)
  mustExistNotAt: Map<string, Set<number>>;
  // Letters that are completely absent (gray)
  absent: Set<string>;
  // Minimum count of each letter that must exist
  minLetterCounts: Map<string, number>;
}

/**
 * Analyzes game state and suggests optimal next guesses.
 * Uses constraint-based filtering and letter frequency scoring.
 */
export class HintSolver {
  private allWords: string[];

  // Letter frequency scores (based on common English letter frequency)
  private static readonly LETTER_FREQUENCY: Record<string, number> = {
    e: 12.7,
    t: 9.1,
    a: 8.2,
    o: 7.5,
    i: 7.0,
    n: 6.7,
    s: 6.3,
    h: 6.1,
    r: 6.0,
    d: 4.3,
    l: 4.0,
    c: 2.8,
    u: 2.8,
    m: 2.4,
    w: 2.4,
    f: 2.2,
    g: 2.0,
    y: 2.0,
    p: 1.9,
    b: 1.5,
    v: 1.0,
    k: 0.8,
    j: 0.15,
    x: 0.15,
    q: 0.1,
    z: 0.07,
  };

  constructor(wordList: string[]) {
    this.allWords = wordList.filter((w) => w.length === WORD_LENGTH);
  }

  /**
   * Get the best hint word based on current game state
   */
  getHint(guesses: Guess[], targetWord: string): string | null {
    const constraints = this.buildConstraints(guesses, targetWord);
    const possibleWords = this.filterWords(constraints);

    if (possibleWords.length === 0) {
      return null;
    }

    if (possibleWords.length === 1) {
      return possibleWords[0] ?? null;
    }

    // Score words and return the best one
    const scoredWords = possibleWords.map((word) => ({
      word,
      score: this.scoreWord(word, possibleWords, constraints),
    }));

    scoredWords.sort((a, b) => b.score - a.score);

    return scoredWords[0]?.word ?? null;
  }

  /**
   * Get the number of possible words remaining
   */
  getPossibleWordCount(guesses: Guess[], targetWord: string): number {
    const constraints = this.buildConstraints(guesses, targetWord);
    return this.filterWords(constraints).length;
  }

  /**
   * Build constraints from previous guesses
   */
  private buildConstraints(
    guesses: Guess[],
    targetWord: string
  ): LetterConstraint {
    const constraints: LetterConstraint = {
      mustBeAt: new Map(),
      mustExistNotAt: new Map(),
      absent: new Set(),
      minLetterCounts: new Map(),
    };

    for (const guess of guesses) {
      const results = this.evaluateGuess(guess.word, targetWord);

      // Count letters in the guess that are correct or present
      const letterCountsInGuess = new Map<string, number>();

      for (let i = 0; i < WORD_LENGTH; i++) {
        const letter = guess.word[i];
        if (!letter) continue;

        const state = results[i];

        if (state === "correct") {
          constraints.mustBeAt.set(i, letter);
          letterCountsInGuess.set(
            letter,
            (letterCountsInGuess.get(letter) || 0) + 1
          );
        } else if (state === "present") {
          if (!constraints.mustExistNotAt.has(letter)) {
            constraints.mustExistNotAt.set(letter, new Set());
          }
          constraints.mustExistNotAt.get(letter)!.add(i);
          letterCountsInGuess.set(
            letter,
            (letterCountsInGuess.get(letter) || 0) + 1
          );
        } else {
          // Only mark as absent if this letter doesn't appear as correct/present elsewhere
          const hasCorrectOrPresent = results.some(
            (r, idx) =>
              guess.word[idx] === letter && (r === "correct" || r === "present")
          );
          if (!hasCorrectOrPresent) {
            constraints.absent.add(letter);
          }
        }
      }

      // Update minimum letter counts
      for (const [letter, count] of letterCountsInGuess) {
        const currentMin = constraints.minLetterCounts.get(letter) || 0;
        if (count > currentMin) {
          constraints.minLetterCounts.set(letter, count);
        }
      }
    }

    return constraints;
  }

  /**
   * Evaluate a guess against the target word
   */
  private evaluateGuess(guess: string, target: string): LetterState[] {
    const results: LetterState[] = new Array(WORD_LENGTH).fill("absent");
    const targetLetters = target.split("");
    const usedIndices = new Set<number>();

    // First pass: find exact matches (green)
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guess[i] === target[i]) {
        results[i] = "correct";
        usedIndices.add(i);
      }
    }

    // Second pass: find present letters (yellow)
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (results[i] === "correct") continue;

      for (let j = 0; j < WORD_LENGTH; j++) {
        if (!usedIndices.has(j) && guess[i] === targetLetters[j]) {
          results[i] = "present";
          usedIndices.add(j);
          break;
        }
      }
    }

    return results;
  }

  /**
   * Filter words based on constraints
   */
  private filterWords(constraints: LetterConstraint): string[] {
    return this.allWords.filter((word) => {
      // Check must-be-at constraints (green letters)
      for (const [pos, letter] of constraints.mustBeAt) {
        if (word[pos] !== letter) return false;
      }

      // Check must-exist-not-at constraints (yellow letters)
      for (const [letter, positions] of constraints.mustExistNotAt) {
        // Letter must exist in word
        if (!word.includes(letter)) return false;
        // But not at these positions
        for (const pos of positions) {
          if (word[pos] === letter) return false;
        }
      }

      // Check absent letters (gray)
      for (const letter of constraints.absent) {
        if (word.includes(letter)) return false;
      }

      // Check minimum letter counts
      for (const [letter, minCount] of constraints.minLetterCounts) {
        const count = word.split("").filter((l) => l === letter).length;
        if (count < minCount) return false;
      }

      return true;
    });
  }

  /**
   * Score a word based on how good it is as a guess
   * Higher score = better guess
   */
  private scoreWord(
    word: string,
    possibleWords: string[],
    constraints: LetterConstraint
  ): number {
    let score = 0;

    // 1. Letter frequency score - prefer common letters
    const uniqueLetters = new Set(word.split(""));
    for (const letter of uniqueLetters) {
      score += HintSolver.LETTER_FREQUENCY[letter] || 0;
    }

    // 2. Unique letter bonus - prefer words with more unique letters
    score += uniqueLetters.size * 5;

    // 3. Position frequency score - prefer letters common at each position
    const positionFrequency = this.calculatePositionFrequency(possibleWords);
    for (let i = 0; i < WORD_LENGTH; i++) {
      const letter = word[i];
      const freqMap = positionFrequency[i];
      if (letter && freqMap) {
        score += (freqMap.get(letter) || 0) * 2;
      }
    }

    // 4. Information gain - prefer words that would eliminate more possibilities
    // This is a simplified heuristic
    const newLetters = new Set<string>();
    for (const letter of word) {
      if (
        !constraints.mustBeAt.has(
          [...constraints.mustBeAt.entries()].find(
            ([_, l]) => l === letter
          )?.[0] ?? -1
        ) &&
        !constraints.mustExistNotAt.has(letter)
      ) {
        newLetters.add(letter);
      }
    }
    score += newLetters.size * 3;

    return score;
  }

  /**
   * Calculate letter frequency at each position
   */
  private calculatePositionFrequency(words: string[]): Map<string, number>[] {
    const frequency: Map<string, number>[] = [];

    for (let i = 0; i < WORD_LENGTH; i++) {
      frequency[i] = new Map();
      for (const word of words) {
        const letter = word[i];
        if (letter) {
          const freqMap = frequency[i]!;
          freqMap.set(letter, (freqMap.get(letter) || 0) + 1);
        }
      }
      // Normalize
      const freqMap = frequency[i]!;
      for (const [letter, count] of freqMap) {
        freqMap.set(letter, count / words.length);
      }
    }

    return frequency;
  }
}
