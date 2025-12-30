import type { PegColor, Guess, Feedback, GameConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { CodeGenerator } from "./CodeGenerator";
import { FeedbackCalculator } from "./FeedbackCalculator";

export interface GameState {
  guesses: Guess[];
  currentGuess: PegColor[];
  gameOver: boolean;
  won: boolean;
  secretCode: PegColor[];
}

/**
 * Main game controller for Mastermind.
 * Manages game state, guesses, and win/lose conditions.
 */
export class MastermindGame {
  private codeGenerator: CodeGenerator;
  private feedbackCalculator: FeedbackCalculator;
  private config: GameConfig;

  private _secretCode: PegColor[] = [];
  private _guesses: Guess[] = [];
  private _currentGuess: PegColor[] = [];
  private _gameOver: boolean = false;
  private _won: boolean = false;

  constructor(config: GameConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.codeGenerator = new CodeGenerator(config);
    this.feedbackCalculator = new FeedbackCalculator();
    this.reset();
  }

  // Getters
  get secretCode(): PegColor[] {
    return this._secretCode;
  }

  get guesses(): Guess[] {
    return this._guesses;
  }

  get currentGuess(): PegColor[] {
    return this._currentGuess;
  }

  get gameOver(): boolean {
    return this._gameOver;
  }

  get won(): boolean {
    return this._won;
  }

  get codeLength(): number {
    return this.config.codeLength;
  }

  get maxGuesses(): number {
    return this.config.maxGuesses;
  }

  get availableColors(): PegColor[] {
    return this.config.availableColors;
  }

  get remainingGuesses(): number {
    return this.config.maxGuesses - this._guesses.length;
  }

  /**
   * Add a color to the current guess
   */
  addColor(color: PegColor): boolean {
    if (this._gameOver) return false;
    if (this._currentGuess.length >= this.config.codeLength) return false;

    this._currentGuess.push(color);
    return true;
  }

  /**
   * Remove the last color from the current guess
   */
  removeLastColor(): boolean {
    if (this._gameOver) return false;
    if (this._currentGuess.length === 0) return false;

    this._currentGuess.pop();
    return true;
  }

  /**
   * Clear the current guess
   */
  clearCurrentGuess(): void {
    this._currentGuess = [];
  }

  /**
   * Set color at a specific position
   */
  setColorAt(index: number, color: PegColor): boolean {
    if (this._gameOver) return false;
    if (index < 0 || index >= this.config.codeLength) return false;

    // Extend array if needed
    while (this._currentGuess.length <= index) {
      this._currentGuess.push(this.config.availableColors[0]!);
    }

    this._currentGuess[index] = color;
    return true;
  }

  /**
   * Submit the current guess
   */
  submitGuess(): Feedback | null {
    if (this._gameOver) return null;
    if (this._currentGuess.length !== this.config.codeLength) return null;

    const feedback = this.feedbackCalculator.calculate(
      this._currentGuess,
      this._secretCode
    );

    this._guesses.push({
      colors: [...this._currentGuess],
      feedback,
    });

    // Check for win
    if (
      this.feedbackCalculator.isPerfectMatch(feedback, this.config.codeLength)
    ) {
      this._gameOver = true;
      this._won = true;
    }
    // Check for loss
    else if (this._guesses.length >= this.config.maxGuesses) {
      this._gameOver = true;
      this._won = false;
    }

    // Clear current guess for next round
    this._currentGuess = [];

    return feedback;
  }

  /**
   * Check if current guess is complete
   */
  isGuessComplete(): boolean {
    return this._currentGuess.length === this.config.codeLength;
  }

  /**
   * Reset the game
   */
  reset(): void {
    this._secretCode = this.codeGenerator.generate();
    this._guesses = [];
    this._currentGuess = [];
    this._gameOver = false;
    this._won = false;
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return {
      guesses: this._guesses,
      currentGuess: this._currentGuess,
      gameOver: this._gameOver,
      won: this._won,
      secretCode: this._secretCode,
    };
  }
}
