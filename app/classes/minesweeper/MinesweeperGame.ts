import type { Cell, GameConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { Board } from "./Board";
import { CellRevealer } from "./CellRevealer";
import { HintSystem } from "./HintSystem";
import { ThemeRenderer } from "./ThemeRenderer";

export interface GameState {
  gameOver: boolean;
  won: boolean;
  flagMode: boolean;
  timer: number;
  gameStarted: boolean;
}

/**
 * Main game controller for Minesweeper (Bear Patrol).
 * Orchestrates board, revealing, hints, and game state.
 */
export class MinesweeperGame {
  private board: Board;
  private revealer: CellRevealer;
  private hintSystem: HintSystem;
  private themeRenderer: ThemeRenderer;

  private _gameOver: boolean = false;
  private _won: boolean = false;
  private _flagMode: boolean = false;
  private _timer: number = 0;
  private _gameStarted: boolean = false;

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private onTimerTick?: () => void;

  constructor(config: GameConfig = DEFAULT_CONFIG) {
    this.board = new Board(config);
    this.revealer = new CellRevealer(this.board);
    this.hintSystem = new HintSystem(this.board);
    this.themeRenderer = new ThemeRenderer();
  }

  // Getters for game state
  get gameOver(): boolean {
    return this._gameOver;
  }

  get won(): boolean {
    return this._won;
  }

  get flagMode(): boolean {
    return this._flagMode;
  }

  get timer(): number {
    return this._timer;
  }

  get gameStarted(): boolean {
    return this._gameStarted;
  }

  get boardSize(): number {
    return this.board.size;
  }

  get mineCount(): number {
    return this.board.mineCount;
  }

  get flagCount(): number {
    return this.board.flagCount;
  }

  get revealedCount(): number {
    return this.board.revealedCount;
  }

  /**
   * Get the raw board cells (for Vue reactivity)
   */
  get cells(): Cell[][] {
    return this.board.rawCells;
  }

  /**
   * Set timer tick callback for Vue reactivity
   */
  setTimerCallback(callback: () => void): void {
    this.onTimerTick = callback;
  }

  /**
   * Toggle flag mode
   */
  toggleFlagMode(): void {
    this._flagMode = !this._flagMode;
  }

  /**
   * Set flag mode directly
   */
  setFlagMode(enabled: boolean): void {
    this._flagMode = enabled;
  }

  /**
   * Handle cell click
   */
  handleCellClick(row: number, col: number): void {
    if (this._gameOver) return;

    const cell = this.board.getCell(row, col);
    if (!cell) return;

    // If flag mode is on, toggle flag instead
    if (this._flagMode) {
      this.revealer.toggleFlag(row, col);
      return;
    }

    // Handle revealed cell clicks (chording and auto-flagging)
    if (cell.isRevealed && cell.adjacentMines > 0) {
      // Try auto-flag first
      if (this.revealer.autoFlagAdjacent(row, col)) {
        return;
      }
      // Try chord reveal
      const result = this.revealer.chordReveal(row, col);
      if (result.hitMine) {
        this.endGame(false);
      } else if (result.cellsRevealed > 0) {
        this.checkWin();
      }
      return;
    }

    // Normal reveal
    if (cell.isRevealed || cell.isFlagged) return;

    // Start timer on first click
    if (!this._gameStarted) {
      this._gameStarted = true;
      this.startTimer();
    }

    const result = this.revealer.revealCell(row, col);
    if (result.hitMine) {
      this.endGame(false);
    } else {
      this.checkWin();
    }
  }

  /**
   * Handle right-click to toggle flag
   */
  handleRightClick(row: number, col: number): void {
    if (this._gameOver) return;
    this.revealer.toggleFlag(row, col);
  }

  /**
   * Use hint to reveal largest open area
   */
  useHint(): void {
    if (this._gameOver) return;

    // Start timer if not started
    if (!this._gameStarted) {
      this._gameStarted = true;
      this.startTimer();
    }

    const position = this.hintSystem.findLargestOpenArea();
    if (position) {
      const result = this.revealer.revealCell(position.row, position.col);
      if (!result.hitMine) {
        this.checkWin();
      }
    }
  }

  /**
   * Check if hint is available
   */
  hasHint(): boolean {
    return this.hintSystem.hasUnrevealedOpenArea();
  }

  /**
   * Get CSS class for a cell
   */
  getCellClass(row: number, col: number): string {
    const cell = this.board.getCell(row, col);
    return this.themeRenderer.getCellClass(cell);
  }

  /**
   * Get display content for a cell
   */
  getCellContent(row: number, col: number): string {
    const cell = this.board.getCell(row, col);
    return this.themeRenderer.getCellContent(cell, row, col);
  }

  /**
   * Get random tree line for decoration
   */
  getRandomTreeLine(): string {
    return this.themeRenderer.getRandomTreeLine();
  }

  /**
   * Check if the player has won
   */
  private checkWin(): void {
    const totalCells = this.board.size * this.board.size;
    const nonMineCells = totalCells - this.board.mineCount;

    if (this.board.revealedCount === nonMineCells) {
      this.endGame(true);
    }
  }

  /**
   * End the game
   */
  private endGame(won: boolean): void {
    this._gameOver = true;
    this._won = won;
    this.stopTimer();

    if (!won) {
      this.board.revealAllMines();
    }
  }

  /**
   * Start the timer
   */
  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this._timer++;
      this.onTimerTick?.();
    }, 1000);
  }

  /**
   * Stop the timer
   */
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Reset the game
   */
  reset(): void {
    this.stopTimer();
    this.board.initialize();
    this.revealer = new CellRevealer(this.board);
    this.hintSystem = new HintSystem(this.board);
    this._gameOver = false;
    this._won = false;
    this._flagMode = false;
    this._timer = 0;
    this._gameStarted = false;
  }

  /**
   * Clean up resources (call on unmount)
   */
  destroy(): void {
    this.stopTimer();
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return {
      gameOver: this._gameOver,
      won: this._won,
      flagMode: this._flagMode,
      timer: this._timer,
      gameStarted: this._gameStarted,
    };
  }
}
