import type { Position, Cell, GameConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";

/**
 * Manages the game grid for Thermal Hunt.
 */
export class Grid {
  private cells: Cell[][] = [];
  private config: GameConfig;
  private _targetPosition: Position = { row: 0, col: 0 };

  constructor(config: GameConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize the grid with a new random target
   */
  initialize(): void {
    // Pick random target position
    this._targetPosition = {
      row: Math.floor(Math.random() * this.config.rows),
      col: Math.floor(Math.random() * this.config.cols),
    };

    // Create cells
    this.cells = [];
    for (let row = 0; row < this.config.rows; row++) {
      this.cells[row] = [];
      for (let col = 0; col < this.config.cols; col++) {
        const distance = this.calculateDistance(row, col);
        this.cells[row]![col] = {
          isRevealed: false,
          distance,
          isTarget:
            row === this._targetPosition.row &&
            col === this._targetPosition.col,
        };
      }
    }
  }

  /**
   * Calculate Manhattan distance from a cell to the target
   */
  calculateDistance(row: number, col: number): number {
    return (
      Math.abs(row - this._targetPosition.row) +
      Math.abs(col - this._targetPosition.col)
    );
  }

  /**
   * Get a cell at the specified position
   */
  getCell(row: number, col: number): Cell | undefined {
    return this.cells[row]?.[col];
  }

  /**
   * Reveal a cell
   */
  revealCell(row: number, col: number): Cell | undefined {
    const cell = this.getCell(row, col);
    if (cell && !cell.isRevealed) {
      cell.isRevealed = true;
    }
    return cell;
  }

  /**
   * Get the target position
   */
  get targetPosition(): Position {
    return this._targetPosition;
  }

  /**
   * Get row count
   */
  get rows(): number {
    return this.config.rows;
  }

  /**
   * Get column count
   */
  get cols(): number {
    return this.config.cols;
  }

  /**
   * Get the raw cells array
   */
  get rawCells(): Cell[][] {
    return this.cells;
  }

  /**
   * Count revealed cells
   */
  get revealedCount(): number {
    let count = 0;
    for (const row of this.cells) {
      for (const cell of row) {
        if (cell.isRevealed) count++;
      }
    }
    return count;
  }
}
