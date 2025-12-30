import type { Board } from "./Board";

export interface RevealResult {
  hitMine: boolean;
  cellsRevealed: number;
}

/**
 * Handles cell revealing logic including flood-fill for empty areas,
 * chording (revealing neighbors when flags match), and auto-flagging.
 */
export class CellRevealer {
  private board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  /**
   * Reveal a single cell and handle cascading reveals
   */
  revealCell(row: number, col: number): RevealResult {
    const cell = this.board.getCell(row, col);
    if (!cell || cell.isRevealed || cell.isFlagged) {
      return { hitMine: false, cellsRevealed: 0 };
    }

    cell.isRevealed = true;

    if (cell.isMine) {
      this.board.revealAllMines();
      return { hitMine: true, cellsRevealed: 1 };
    }

    let cellsRevealed = 1;

    // If no adjacent mines, reveal neighbors recursively
    if (cell.adjacentMines === 0) {
      cellsRevealed += this.revealNeighbors(row, col);
    }

    return { hitMine: false, cellsRevealed };
  }

  /**
   * Recursively reveal all neighbors for empty cells
   */
  revealNeighbors(row: number, col: number): number {
    let revealed = 0;

    this.board.forEachNeighbor(row, col, (neighbor, newRow, newCol) => {
      if (!neighbor.isRevealed && !neighbor.isMine && !neighbor.isFlagged) {
        neighbor.isRevealed = true;
        revealed++;
        if (neighbor.adjacentMines === 0) {
          revealed += this.revealNeighbors(newRow, newCol);
        }
      }
    });

    return revealed;
  }

  /**
   * Chord reveal: reveal all unflagged neighbors when flag count matches number
   */
  chordReveal(row: number, col: number): RevealResult {
    const cell = this.board.getCell(row, col);
    if (!cell || !cell.isRevealed || cell.adjacentMines === 0) {
      return { hitMine: false, cellsRevealed: 0 };
    }

    const adjacentFlags = this.board.countAdjacentFlags(row, col);
    if (adjacentFlags !== cell.adjacentMines) {
      return { hitMine: false, cellsRevealed: 0 };
    }

    let cellsRevealed = 0;
    let hitMine = false;

    this.board.forEachNeighbor(row, col, (neighbor, newRow, newCol) => {
      if (!neighbor.isRevealed && !neighbor.isFlagged) {
        neighbor.isRevealed = true;
        cellsRevealed++;

        if (neighbor.isMine) {
          hitMine = true;
          this.board.revealAllMines();
          return;
        }

        if (neighbor.adjacentMines === 0) {
          cellsRevealed += this.revealNeighbors(newRow, newCol);
        }
      }
    });

    return { hitMine, cellsRevealed };
  }

  /**
   * Auto-flag: flag all unrevealed neighbors when count matches number
   */
  autoFlagAdjacent(row: number, col: number): boolean {
    const cell = this.board.getCell(row, col);
    if (!cell || !cell.isRevealed || cell.adjacentMines === 0) {
      return false;
    }

    const adjacentUnrevealed = this.board.countAdjacentUnrevealed(row, col);
    if (adjacentUnrevealed !== cell.adjacentMines) {
      return false;
    }

    this.board.forEachNeighbor(row, col, (neighbor) => {
      if (!neighbor.isRevealed && !neighbor.isFlagged) {
        neighbor.isFlagged = true;
      }
    });

    return true;
  }

  /**
   * Toggle flag on a cell
   */
  toggleFlag(row: number, col: number): boolean {
    const cell = this.board.getCell(row, col);
    if (!cell || cell.isRevealed) {
      return false;
    }

    cell.isFlagged = !cell.isFlagged;
    return true;
  }
}
