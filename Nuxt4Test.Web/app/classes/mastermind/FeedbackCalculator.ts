import type { PegColor, Feedback } from "./types";

/**
 * Calculates feedback for guesses in Mastermind.
 * Determines exact matches (right color, right place) and
 * color matches (right color, wrong place).
 */
export class FeedbackCalculator {
  /**
   * Calculate feedback for a guess against the secret code
   */
  calculate(guess: PegColor[], secret: PegColor[]): Feedback {
    let exactMatches = 0;
    let colorMatches = 0;

    // Track which positions have been matched
    const secretUsed: boolean[] = new Array(secret.length).fill(false);
    const guessUsed: boolean[] = new Array(guess.length).fill(false);

    // First pass: find exact matches (right color, right place)
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === secret[i]) {
        exactMatches++;
        secretUsed[i] = true;
        guessUsed[i] = true;
      }
    }

    // Second pass: find color matches (right color, wrong place)
    for (let i = 0; i < guess.length; i++) {
      if (guessUsed[i]) continue;

      for (let j = 0; j < secret.length; j++) {
        if (secretUsed[j]) continue;

        if (guess[i] === secret[j]) {
          colorMatches++;
          secretUsed[j] = true;
          break;
        }
      }
    }

    return { exactMatches, colorMatches };
  }

  /**
   * Check if the guess is a perfect match
   */
  isPerfectMatch(feedback: Feedback, codeLength: number): boolean {
    return feedback.exactMatches === codeLength;
  }
}
