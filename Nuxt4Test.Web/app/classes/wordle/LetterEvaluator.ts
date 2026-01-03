import type { LetterResult, LetterState } from "./types";

/**
 * Evaluates letter positions in a guess against the target word.
 * Handles the complex logic of duplicate letters correctly.
 */
export class LetterEvaluator {
  private targetWord: string;

  constructor(targetWord: string) {
    this.targetWord = targetWord.toLowerCase();
  }

  /**
   * Evaluate all letters in a guess
   */
  evaluateGuess(guess: string): LetterResult[] {
    const lowerGuess = guess.toLowerCase();
    const results: LetterResult[] = [];

    for (let i = 0; i < lowerGuess.length; i++) {
      const letter = lowerGuess[i] ?? "";
      results.push({
        letter,
        state: this.evaluateLetter(letter, i, lowerGuess),
      });
    }

    return results;
  }

  /**
   * Evaluate a single letter at a specific position
   */
  evaluateLetter(
    letter: string,
    index: number,
    fullGuess: string
  ): LetterState {
    const lowerLetter = letter.toLowerCase();

    // Green: correct letter in correct position
    if (this.targetWord[index] === lowerLetter) {
      return "correct";
    }

    // Count how many times this letter appears in target
    const targetLetterCount = this.targetWord
      .split("")
      .filter((l) => l === lowerLetter).length;

    // Count correct positions (greens) for this letter in the guess
    const correctPositions = fullGuess
      .toLowerCase()
      .split("")
      .filter(
        (l, i) => l === lowerLetter && this.targetWord[i] === lowerLetter
      ).length;

    // Count yellows before this position
    const yellowsBeforeThis = fullGuess
      .toLowerCase()
      .split("")
      .slice(0, index)
      .filter(
        (l, i) =>
          l === lowerLetter &&
          this.targetWord[i] !== lowerLetter &&
          this.targetWord.includes(lowerLetter)
      ).length;

    // Yellow: letter exists but we haven't exceeded the count
    if (
      this.targetWord.includes(lowerLetter) &&
      correctPositions + yellowsBeforeThis < targetLetterCount
    ) {
      return "present";
    }

    // Grey: letter not in word or all instances accounted for
    return "absent";
  }

  /**
   * Get CSS class for a letter based on its evaluation
   */
  getLetterClass(letter: string, index: number, fullGuess: string): string {
    const state = this.evaluateLetter(letter, index, fullGuess);

    switch (state) {
      case "correct":
        return "bg-green text-white";
      case "present":
        return "bg-yellow-darken-2 text-white";
      case "absent":
        return "bg-grey-darken-1 text-white";
    }
  }
}
