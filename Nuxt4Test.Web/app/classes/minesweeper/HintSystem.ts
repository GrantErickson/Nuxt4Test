import type { Position } from "./types";
import type { Board } from "./Board";

/**
 * Provides hint functionality by finding and revealing
 * the largest open area on the board.
 */
export class HintSystem {
  private board: Board;

  constructor(board: Board) {
    this.board = board;
  }

  /**
   * Check if there are any unrevealed open areas left
   */
  hasUnrevealedOpenArea(): boolean {
    for (let row = 0; row < this.board.size; row++) {
      for (let col = 0; col < this.board.size; col++) {
        const cell = this.board.getCell(row, col);
        if (
          cell &&
          !cell.isMine &&
          !cell.isRevealed &&
          cell.adjacentMines === 0
        ) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Find the position of the largest unrevealed open area
   */
  findLargestOpenArea(): Position | null {
    let bestPosition: Position | null = null;
    let bestSize = 0;

    for (let row = 0; row < this.board.size; row++) {
      for (let col = 0; col < this.board.size; col++) {
        const cell = this.board.getCell(row, col);
        if (
          cell &&
          !cell.isMine &&
          !cell.isRevealed &&
          cell.adjacentMines === 0
        ) {
          const size = this.calculateOpenAreaSize(row, col);
          if (size > bestSize) {
            bestSize = size;
            bestPosition = { row, col };
          }
        }
      }
    }

    return bestPosition;
  }

  /**
   * Calculate how many cells would be revealed from a starting point
   * without modifying board state
   */
  calculateOpenAreaSize(startRow: number, startCol: number): number {
    const visited = new Set<string>();
    const queue: Position[] = [{ row: startRow, col: startCol }];

    while (queue.length > 0) {
      const { row, col } = queue.shift()!;
      const key = `${row},${col}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const cell = this.board.getCell(row, col);
      if (!cell || cell.isMine) continue;

      // If this cell has no adjacent mines, explore neighbors
      if (cell.adjacentMines === 0) {
        this.board.forEachNeighbor(row, col, (_, newRow, newCol) => {
          const neighborKey = `${newRow},${newCol}`;
          if (!visited.has(neighborKey)) {
            queue.push({ row: newRow, col: newCol });
          }
        });
      }
    }

    return visited.size;
  }
}
