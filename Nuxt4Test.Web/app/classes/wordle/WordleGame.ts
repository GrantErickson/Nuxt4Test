import type { Guess } from "./types";
import { WORD_LENGTH, MAX_GUESSES } from "./types";
import { WordList } from "./WordList";
import { KeyboardState } from "./KeyboardState";
import { LetterEvaluator } from "./LetterEvaluator";

export interface GameState {
  targetWord: string;
  currentGuess: string;
  guesses: Guess[];
  gameOver: boolean;
  won: boolean;
  errorMessage: string;
}

export interface GuessResult {
  success: boolean;
  errorMessage?: string;
  gameOver?: boolean;
  won?: boolean;
}

/**
 * Main Wordle game logic class.
 * Manages game state, guess validation, and win/lose conditions.
 */
export class WordleGame {
  private wordList: WordList;
  private keyboardState: KeyboardState;
  private letterEvaluator: LetterEvaluator | null = null;

  private _targetWord: string = "";
  private _currentGuess: string = "";
  private _guesses: Guess[] = [];
  private _gameOver: boolean = false;
  private _won: boolean = false;
  private _errorMessage: string = "";

  constructor(wordListText: string) {
    this.wordList = new WordList(wordListText);
    this.keyboardState = new KeyboardState();
    this.reset();
  }

  // Getters for reactive state
  get targetWord(): string {
    return this._targetWord;
  }

  get currentGuess(): string {
    return this._currentGuess;
  }

  get guesses(): Guess[] {
    return this._guesses;
  }

  get gameOver(): boolean {
    return this._gameOver;
  }

  get won(): boolean {
    return this._won;
  }

  get errorMessage(): string {
    return this._errorMessage;
  }

  get emptyRowCount(): number {
    const submitted = this._guesses.length;
    const currentRow = this._gameOver ? 0 : 1;
    return Math.max(0, MAX_GUESSES - submitted - currentRow);
  }

  /**
   * Reset the game to initial state with a new target word
   */
  reset(): void {
    this._targetWord = this.wordList.getRandomWord();
    this._currentGuess = "";
    this._guesses = [];
    this._gameOver = false;
    this._won = false;
    this._errorMessage = "";
    this.keyboardState.reset();
    this.letterEvaluator = new LetterEvaluator(this._targetWord);
  }

  /**
   * Add a letter to the current guess
   */
  addLetter(letter: string): boolean {
    if (this._gameOver) return false;
    if (this._currentGuess.length >= WORD_LENGTH) return false;
    if (!/^[a-zA-Z]$/.test(letter)) return false;

    this._currentGuess += letter.toLowerCase();
    this._errorMessage = "";
    return true;
  }

  /**
   * Remove the last letter from the current guess
   */
  removeLetter(): boolean {
    if (this._gameOver) return false;
    if (this._currentGuess.length === 0) return false;

    this._currentGuess = this._currentGuess.slice(0, -1);
    this._errorMessage = "";
    return true;
  }

  /**
   * Submit the current guess
   */
  submitGuess(): GuessResult {
    if (this._gameOver) {
      return { success: false, errorMessage: "Game is already over" };
    }

    const guess = this._currentGuess.toLowerCase().trim();

    // Validate length
    if (guess.length !== WORD_LENGTH) {
      this._errorMessage = `Please enter a ${WORD_LENGTH}-letter word`;
      return { success: false, errorMessage: this._errorMessage };
    }

    // Validate characters
    if (!/^[a-zA-Z]+$/.test(guess)) {
      this._errorMessage = "Only letters are allowed";
      return { success: false, errorMessage: this._errorMessage };
    }

    // Validate word exists
    if (!this.wordList.isValidWord(guess)) {
      this._errorMessage = "Not a valid word";
      return { success: false, errorMessage: this._errorMessage };
    }

    // Clear error and add guess
    this._errorMessage = "";
    this._guesses.push({
      word: guess,
      letters: guess.split(""),
    });

    // Update keyboard states
    this.keyboardState.updateFromGuess(guess, this._targetWord);

    // Check win/lose conditions
    if (guess === this._targetWord.toLowerCase()) {
      this._gameOver = true;
      this._won = true;
    } else if (this._guesses.length >= MAX_GUESSES) {
      this._gameOver = true;
      this._won = false;
    }

    this._currentGuess = "";

    return {
      success: true,
      gameOver: this._gameOver,
      won: this._won,
    };
  }

  /**
   * Handle keyboard key click (physical or virtual)
   */
  handleKeyPress(key: string): void {
    if (this._gameOver) return;

    if (key === "ENTER" || key === "Enter") {
      if (this._currentGuess.length === WORD_LENGTH) {
        this.submitGuess();
      }
    } else if (key === "BACK" || key === "Backspace") {
      this.removeLetter();
    } else if (/^[a-zA-Z]$/.test(key)) {
      this.addLetter(key);
    }
  }

  /**
   * Get CSS class for a letter in a submitted guess
   */
  getLetterClass(letter: string, index: number, word: string): string {
    if (!this.letterEvaluator) return "";
    return this.letterEvaluator.getLetterClass(letter, index, word);
  }

  /**
   * Get CSS class for a keyboard key
   */
  getKeyClass(key: string): string {
    return this.keyboardState.getKeyClass(key);
  }

  /**
   * Clear the error message
   */
  clearError(): void {
    this._errorMessage = "";
  }

  /**
   * Get the full game state (for reactivity)
   */
  getState(): GameState {
    return {
      targetWord: this._targetWord,
      currentGuess: this._currentGuess,
      guesses: [...this._guesses],
      gameOver: this._gameOver,
      won: this._won,
      errorMessage: this._errorMessage,
    };
  }
}
