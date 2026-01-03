import type { LetterState } from "./types";

/**
 * Tracks the visual state of keyboard letters based on guesses made.
 * Implements priority: correct (green) > present (yellow) > absent (grey)
 */
export class KeyboardState {
  private states: Map<string, LetterState> = new Map();

  /**
   * Update letter states based on a guess and target word
   */
  updateFromGuess(guess: string, targetWord: string): void {
    const lowerTarget = targetWord.toLowerCase();
    const lowerGuess = guess.toLowerCase();

    for (let i = 0; i < lowerGuess.length; i++) {
      const letter = lowerGuess[i];
      if (!letter) continue;

      const currentState = this.states.get(letter);

      // Green takes priority over everything
      if (lowerTarget[i] === letter) {
        this.states.set(letter, "correct");
      }
      // Yellow only if not already green
      else if (lowerTarget.includes(letter) && currentState !== "correct") {
        this.states.set(letter, "present");
      }
      // Grey only if not already green or yellow
      else if (!lowerTarget.includes(letter) && !currentState) {
        this.states.set(letter, "absent");
      }
    }
  }

  /**
   * Get the state of a specific letter
   */
  getState(letter: string): LetterState | undefined {
    return this.states.get(letter.toLowerCase());
  }

  /**
   * Get CSS class for a keyboard key
   */
  getKeyClass(key: string): string {
    if (key === "ENTER" || key === "BACK") {
      return "special-key";
    }

    const state = this.getState(key);
    if (state === "correct") return "bg-green text-white";
    if (state === "present") return "bg-yellow-darken-2 text-white";
    if (state === "absent") return "bg-grey-darken-1 text-white";
    return "bg-grey-lighten-1"; // Not guessed yet
  }

  /**
   * Reset all letter states
   */
  reset(): void {
    this.states.clear();
  }

  /**
   * Get all states as a plain object (for reactivity)
   */
  toRecord(): Record<string, LetterState> {
    return Object.fromEntries(this.states);
  }
}
