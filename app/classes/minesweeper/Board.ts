import type { Cell, GameConfig, Position } from "./types";
import { DEFAULT_CONFIG } from "./types";

/**
 * Manages the game board state and cell operations.
 * Handles board creation, mine placement, and cell queries.
 */
export class Board {
  private cells: Cell[][] = [];
  private config: GameConfig;

  constructor(config: GameConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize a new board with mines placed randomly
   */
  initialize(): void {
    this.cells = this.createEmptyBoard();
    this.placeMines();
    this.calculateAdjacentMines();
  }

  /**
   * Create an empty board with all cells initialized
   */
  private createEmptyBoard(): Cell[][] {
    const board: Cell[][] = [];
    for (let row = 0; row < this.config.boardSize; row++) {
      board[row] = [];
      for (let col = 0; col < this.config.boardSize; col++) {
        board[row]![col] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        };
      }
    }
    return board;
  }

  /**
   * Place mines randomly on the board
   */
  private placeMines(): void {
    let minesPlaced = 0;
    while (minesPlaced < this.config.mineCount) {
      const row = Math.floor(Math.random() * this.config.boardSize);
      const col = Math.floor(Math.random() * this.config.boardSize);
      const cell = this.getCell(row, col);
      if (cell && !cell.isMine) {
        cell.isMine = true;
        minesPlaced++;
      }
    }
  }

  /**
   * Calculate adjacent mine counts for all cells
   */
  private calculateAdjacentMines(): void {
    for (let row = 0; row < this.config.boardSize; row++) {
      for (let col = 0; col < this.config.boardSize; col++) {
        const cell = this.getCell(row, col);
        if (cell && !cell.isMine) {
          cell.adjacentMines = this.countAdjacentMines(row, col);
        }
      }
    }
  }

  /**
   * Count mines adjacent to a cell
   */
  private countAdjacentMines(row: number, col: number): number {
    let count = 0;
    this.forEachNeighbor(row, col, (neighbor) => {
      if (neighbor.isMine) count++;
    });
    return count;
  }

  /**
   * Get a cell at the specified position
   */
  getCell(row: number, col: number): Cell | undefined {
    return this.cells[row]?.[col];
  }

  /**
   * Check if a position is valid on the board
   */
  isValidPosition(row: number, col: number): boolean {
    return (
      row >= 0 &&
      row < this.config.boardSize &&
      col >= 0 &&
      col < this.config.boardSize
    );
  }

  /**
   * Execute a callback for each neighbor of a cell
   */
  forEachNeighbor(
    row: number,
    col: number,
    callback: (cell: Cell, row: number, col: number) => void
  ): void {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const newRow = row + dr;
        const newCol = col + dc;
        if (this.isValidPosition(newRow, newCol)) {
          const neighbor = this.getCell(newRow, newCol);
          if (neighbor) {
            callback(neighbor, newRow, newCol);
          }
        }
      }
    }
  }

  /**
   * Count flagged neighbors
   */
  countAdjacentFlags(row: number, col: number): number {
    let count = 0;
    this.forEachNeighbor(row, col, (cell) => {
      if (cell.isFlagged) count++;
    });
    return count;
  }

  /**
   * Count unrevealed neighbors
   */
  countAdjacentUnrevealed(row: number, col: number): number {
    let count = 0;
    this.forEachNeighbor(row, col, (cell) => {
      if (!cell.isRevealed) count++;
    });
    return count;
  }

  /**
   * Reveal all mines on the board
   */
  revealAllMines(): void {
    for (const row of this.cells) {
      for (const cell of row) {
        if (cell.isMine) {
          cell.isRevealed = true;
        }
      }
    }
  }

  /**
   * Count total flagged cells
   */
  get flagCount(): number {
    let count = 0;
    for (const row of this.cells) {
      for (const cell of row) {
        if (cell.isFlagged) count++;
      }
    }
    return count;
  }

  /**
   * Count total revealed cells
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

  /**
   * Get board size
   */
  get size(): number {
    return this.config.boardSize;
  }

  /**
   * Get mine count
   */
  get mineCount(): number {
    return this.config.mineCount;
  }

  /**
   * Get the raw cells array (for Vue reactivity)
   */
  get rawCells(): Cell[][] {
    return this.cells;
  }
}
