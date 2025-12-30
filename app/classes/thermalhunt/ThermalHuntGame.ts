import type { Cell, GameConfig, Position } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { Grid } from "./Grid";
import { HeatRenderer } from "./HeatRenderer";

export interface GameState {
  gameOver: boolean;
  won: boolean;
  revealedCount: number;
  lastDistance: number | null;
  targetPosition: Position;
}

/**
 * Main game controller for Thermal Hunt.
 */
export class ThermalHuntGame {
  private grid: Grid;
  private heatRenderer: HeatRenderer;
  private config: GameConfig;

  private _gameOver: boolean = false;
  private _won: boolean = false;
  private _lastDistance: number | null = null;
  private _bestScore: number | null = null;

  constructor(config: GameConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.grid = new Grid(config);
    this.heatRenderer = new HeatRenderer();
    this.loadBestScore();
  }

  // Getters
  get gameOver(): boolean {
    return this._gameOver;
  }

  get won(): boolean {
    return this._won;
  }

  get gridSize(): number {
    return this.grid.size;
  }

  get revealedCount(): number {
    return this.grid.revealedCount;
  }

  get lastDistance(): number | null {
    return this._lastDistance;
  }

  get bestScore(): number | null {
    return this._bestScore;
  }

  get targetPosition(): Position {
    return this.grid.targetPosition;
  }

  get cells(): Cell[][] {
    return this.grid.rawCells;
  }

  /**
   * Handle cell click
   */
  handleCellClick(row: number, col: number): boolean {
    if (this._gameOver) return false;

    const cell = this.grid.getCell(row, col);
    if (!cell || cell.isRevealed) return false;

    this.grid.revealCell(row, col);
    this._lastDistance = cell.distance;

    // Check if target was found
    if (cell.isTarget) {
      this._gameOver = true;
      this._won = true;
      this.updateBestScore();
    }

    return true;
  }

  /**
   * Get CSS class for a cell
   */
  getCellClass(row: number, col: number): string {
    const cell = this.grid.getCell(row, col);
    return this.heatRenderer.getCellClass(cell, this._gameOver);
  }

  /**
   * Get inline style for a cell (for unique heat colors)
   */
  getCellStyle(row: number, col: number): string {
    const cell = this.grid.getCell(row, col);
    return this.heatRenderer.getCellStyle(cell, this._gameOver);
  }

  /**
   * Get content for a cell
   */
  getCellContent(row: number, col: number): string {
    const cell = this.grid.getCell(row, col);
    return this.heatRenderer.getCellContent(cell, this._gameOver);
  }

  /**
   * Get temperature text for last click
   */
  getTemperatureText(): string {
    if (this._lastDistance === null) return "Click a cell to start hunting!";
    return this.heatRenderer.getTemperatureText(this._lastDistance);
  }

  /**
   * Update best score if current is better
   */
  private updateBestScore(): void {
    const current = this.grid.revealedCount;
    if (this._bestScore === null || current < this._bestScore) {
      this._bestScore = current;
      this.saveBestScore();
    }
  }

  /**
   * Load best score from localStorage
   */
  private loadBestScore(): void {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("thermalHuntBestScore");
      if (saved) {
        this._bestScore = parseInt(saved, 10);
      }
    }
  }

  /**
   * Save best score to localStorage
   */
  private saveBestScore(): void {
    if (typeof window !== "undefined" && this._bestScore !== null) {
      localStorage.setItem("thermalHuntBestScore", this._bestScore.toString());
    }
  }

  /**
   * Reset the game
   */
  reset(): void {
    this.grid.initialize();
    this._gameOver = false;
    this._won = false;
    this._lastDistance = null;
  }

  /**
   * Get current game state
   */
  getState(): GameState {
    return {
      gameOver: this._gameOver,
      won: this._won,
      revealedCount: this.grid.revealedCount,
      lastDistance: this._lastDistance,
      targetPosition: this.grid.targetPosition,
    };
  }
}
