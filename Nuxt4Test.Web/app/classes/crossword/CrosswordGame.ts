// Crossword puzzle game logic
import type { Clue, CrosswordState } from "./types";
import { CrosswordGenerator } from "./CrosswordGenerator";

export class CrosswordGame {
  private state: CrosswordState;
  private generator: CrosswordGenerator;

  constructor() {
    this.generator = new CrosswordGenerator();
    this.state = this.generator.generate();
  }

  getState(): CrosswordState {
    return this.state;
  }

  newGame(): void {
    // Create a fresh generator to ensure clean state
    this.generator = new CrosswordGenerator();
    this.state = this.generator.generate();
  }

  selectCell(row: number, col: number): void {
    const cell = this.state.grid[row]?.[col];
    if (!cell || cell.isBlack) {
      this.state.selectedCell = null;
      return;
    }

    // If clicking the same cell, toggle direction
    if (
      this.state.selectedCell?.row === row &&
      this.state.selectedCell?.col === col
    ) {
      this.state.selectedDirection =
        this.state.selectedDirection === "across" ? "down" : "across";
    } else {
      this.state.selectedCell = { row, col };
    }
  }

  setDirection(direction: "across" | "down"): void {
    this.state.selectedDirection = direction;
  }

  inputLetter(letter: string): void {
    if (!this.state.selectedCell) return;

    const { row, col } = this.state.selectedCell;
    const cell = this.state.grid[row]?.[col];
    if (!cell || cell.isBlack) return;

    cell.userInput = letter.toUpperCase();
    this.moveToNextCell();
    this.checkCompletion();
  }

  deleteLetter(): void {
    if (!this.state.selectedCell) return;

    const { row, col } = this.state.selectedCell;
    const cell = this.state.grid[row]?.[col];
    if (!cell || cell.isBlack) return;

    if (cell.userInput) {
      cell.userInput = "";
    } else {
      // Move to previous cell
      this.moveToPrevCell();
      const newCell =
        this.state.grid[this.state.selectedCell.row]?.[
          this.state.selectedCell.col
        ];
      if (newCell && !newCell.isBlack) {
        newCell.userInput = "";
      }
    }
    this.checkCompletion();
  }

  private moveToNextCell(): void {
    if (!this.state.selectedCell) return;

    let { row, col } = this.state.selectedCell;

    if (this.state.selectedDirection === "across") {
      col++;
    } else {
      row++;
    }

    // Check if new position is valid
    if (row < 6 && col < 6) {
      const cell = this.state.grid[row]?.[col];
      if (cell && !cell.isBlack) {
        this.state.selectedCell = { row, col };
      }
    }
  }

  private moveToPrevCell(): void {
    if (!this.state.selectedCell) return;

    let { row, col } = this.state.selectedCell;

    if (this.state.selectedDirection === "across") {
      col--;
    } else {
      row--;
    }

    // Check if new position is valid
    if (row >= 0 && col >= 0) {
      const cell = this.state.grid[row]?.[col];
      if (cell && !cell.isBlack) {
        this.state.selectedCell = { row, col };
      }
    }
  }

  selectClue(clue: Clue): void {
    this.state.selectedCell = { row: clue.startRow, col: clue.startCol };
    this.state.selectedDirection = clue.direction;
  }

  revealCell(): void {
    if (!this.state.selectedCell) return;

    const { row, col } = this.state.selectedCell;
    const cell = this.state.grid[row]?.[col];
    if (!cell || cell.isBlack) return;

    cell.userInput = cell.letter || "";
    cell.revealed = true;
    this.checkCompletion();
  }

  revealAll(): void {
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const cell = this.state.grid[row]?.[col];
        if (cell && !cell.isBlack && cell.letter) {
          cell.userInput = cell.letter;
          cell.revealed = true;
        }
      }
    }
    this.state.completed = true;
  }

  clearAll(): void {
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const cell = this.state.grid[row]?.[col];
        if (cell && !cell.isBlack) {
          cell.userInput = "";
          cell.revealed = false;
        }
      }
    }
    this.state.completed = false;
  }

  checkCompletion(): void {
    let allFilled = true;
    let allCorrect = true;

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const cell = this.state.grid[row]?.[col];
        if (cell && !cell.isBlack) {
          if (!cell.userInput) {
            allFilled = false;
          }
          if (cell.userInput !== cell.letter) {
            allCorrect = false;
          }
        }
      }
    }

    this.state.completed = allFilled && allCorrect;
  }

  isWordComplete(clue: Clue): boolean {
    for (let i = 0; i < clue.length; i++) {
      const row =
        clue.direction === "across" ? clue.startRow : clue.startRow + i;
      const col =
        clue.direction === "across" ? clue.startCol + i : clue.startCol;
      const cell = this.state.grid[row]?.[col];
      if (!cell || cell.userInput !== cell.letter) {
        return false;
      }
    }
    return true;
  }

  isCellInSelectedWord(row: number, col: number): boolean {
    if (!this.state.selectedCell) return false;

    // Find the word that contains the selected cell
    const clues =
      this.state.selectedDirection === "across"
        ? this.state.acrossClues
        : this.state.downClues;

    for (const clue of clues) {
      // Check if selected cell is in this word
      let containsSelected = false;
      let containsTarget = false;

      for (let i = 0; i < clue.length; i++) {
        const r =
          clue.direction === "across" ? clue.startRow : clue.startRow + i;
        const c =
          clue.direction === "across" ? clue.startCol + i : clue.startCol;

        if (
          r === this.state.selectedCell.row &&
          c === this.state.selectedCell.col
        ) {
          containsSelected = true;
        }
        if (r === row && c === col) {
          containsTarget = true;
        }
      }

      if (containsSelected && containsTarget) {
        return true;
      }
    }

    return false;
  }

  getSelectedClue(): Clue | null {
    if (!this.state.selectedCell) return null;

    const clues =
      this.state.selectedDirection === "across"
        ? this.state.acrossClues
        : this.state.downClues;

    for (const clue of clues) {
      for (let i = 0; i < clue.length; i++) {
        const row =
          clue.direction === "across" ? clue.startRow : clue.startRow + i;
        const col =
          clue.direction === "across" ? clue.startCol + i : clue.startCol;
        if (
          row === this.state.selectedCell.row &&
          col === this.state.selectedCell.col
        ) {
          return clue;
        }
      }
    }

    return null;
  }
}
