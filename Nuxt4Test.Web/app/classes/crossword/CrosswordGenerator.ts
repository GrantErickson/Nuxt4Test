// Crossword puzzle generator
import type { Cell, Clue, PlacedWord, WordClue, CrosswordState } from "./types";
import { getAllWords } from "./WordBank";

export class CrosswordGenerator {
  private gridSize: number = 6;
  private grid: (string | null)[][];
  private placedWords: PlacedWord[] = [];
  private wordBank: WordClue[];
  private usedWords: Set<string> = new Set();

  constructor() {
    this.grid = this.createEmptyGrid();
    this.wordBank = getAllWords();
  }

  private createEmptyGrid(): (string | null)[][] {
    return Array(this.gridSize)
      .fill(null)
      .map(() => Array<string | null>(this.gridSize).fill(null));
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j]!;
      shuffled[j] = temp!;
    }
    return shuffled;
  }

  private getGridCell(row: number, col: number): string | null | undefined {
    return this.grid[row]?.[col];
  }

  private setGridCell(row: number, col: number, value: string | null): void {
    const gridRow = this.grid[row];
    if (gridRow) {
      gridRow[col] = value;
    }
  }

  private canPlaceWord(
    word: string,
    startRow: number,
    startCol: number,
    direction: "across" | "down"
  ): boolean {
    const len = word.length;

    // Check bounds
    if (direction === "across") {
      if (startCol + len > this.gridSize) return false;
    } else {
      if (startRow + len > this.gridSize) return false;
    }

    // Check each cell
    for (let i = 0; i < len; i++) {
      const row = direction === "across" ? startRow : startRow + i;
      const col = direction === "across" ? startCol + i : startCol;
      const letterChar = word[i];
      if (!letterChar) return false;
      const letter = letterChar.toUpperCase();
      const existing = this.getGridCell(row, col);

      // If cell is empty or has the same letter, it's ok
      if (existing !== null && existing !== undefined && existing !== letter) {
        return false;
      }

      // Check for adjacent parallel words (avoid creating invalid words)
      if (direction === "across") {
        // Check above and below
        if (existing === null || existing === undefined) {
          const aboveCell = this.getGridCell(row - 1, col);
          if (row > 0 && aboveCell !== null && aboveCell !== undefined) {
            // There's a letter above, need to check if this creates a valid crossing
            const hasVerticalWord = this.placedWords.some(
              (pw) =>
                pw.direction === "down" &&
                pw.startCol === col &&
                pw.startRow <= row &&
                pw.startRow + pw.word.length > row
            );
            if (!hasVerticalWord) return false;
          }
          const belowCell = this.getGridCell(row + 1, col);
          if (
            row < this.gridSize - 1 &&
            belowCell !== null &&
            belowCell !== undefined
          ) {
            const hasVerticalWord = this.placedWords.some(
              (pw) =>
                pw.direction === "down" &&
                pw.startCol === col &&
                pw.startRow <= row &&
                pw.startRow + pw.word.length > row
            );
            if (!hasVerticalWord) return false;
          }
        }
      } else {
        // Check left and right
        if (existing === null || existing === undefined) {
          const leftCell = this.getGridCell(row, col - 1);
          if (col > 0 && leftCell !== null && leftCell !== undefined) {
            const hasHorizontalWord = this.placedWords.some(
              (pw) =>
                pw.direction === "across" &&
                pw.startRow === row &&
                pw.startCol <= col &&
                pw.startCol + pw.word.length > col
            );
            if (!hasHorizontalWord) return false;
          }
          const rightCell = this.getGridCell(row, col + 1);
          if (
            col < this.gridSize - 1 &&
            rightCell !== null &&
            rightCell !== undefined
          ) {
            const hasHorizontalWord = this.placedWords.some(
              (pw) =>
                pw.direction === "across" &&
                pw.startRow === row &&
                pw.startCol <= col &&
                pw.startCol + pw.word.length > col
            );
            if (!hasHorizontalWord) return false;
          }
        }
      }
    }

    // Check before and after the word
    if (direction === "across") {
      const beforeCell = this.getGridCell(startRow, startCol - 1);
      if (startCol > 0 && beforeCell !== null && beforeCell !== undefined)
        return false;
      const afterCell = this.getGridCell(startRow, startCol + len);
      if (
        startCol + len < this.gridSize &&
        afterCell !== null &&
        afterCell !== undefined
      )
        return false;
    } else {
      const beforeCell = this.getGridCell(startRow - 1, startCol);
      if (startRow > 0 && beforeCell !== null && beforeCell !== undefined)
        return false;
      const afterCell = this.getGridCell(startRow + len, startCol);
      if (
        startRow + len < this.gridSize &&
        afterCell !== null &&
        afterCell !== undefined
      )
        return false;
    }

    return true;
  }

  private placeWord(
    wordClue: WordClue,
    startRow: number,
    startCol: number,
    direction: "across" | "down"
  ): void {
    const word = wordClue.word.toUpperCase();
    for (let i = 0; i < word.length; i++) {
      const row = direction === "across" ? startRow : startRow + i;
      const col = direction === "across" ? startCol + i : startCol;
      const letter = word[i];
      if (letter) {
        this.setGridCell(row, col, letter);
      }
    }
    this.placedWords.push({
      word: word,
      clue: wordClue.clue,
      startRow,
      startCol,
      direction,
      number: 0, // Will be assigned later
    });
    this.usedWords.add(word);
  }

  private findIntersections(
    word: string,
    direction: "across" | "down"
  ): { row: number; col: number; letterIndex: number }[] {
    const intersections: { row: number; col: number; letterIndex: number }[] =
      [];
    const wordUpper = word.toUpperCase();

    for (const placed of this.placedWords) {
      if (placed.direction === direction) continue; // Only check perpendicular words

      for (let i = 0; i < wordUpper.length; i++) {
        for (let j = 0; j < placed.word.length; j++) {
          if (wordUpper[i] === placed.word[j]) {
            let row: number, col: number;
            if (direction === "across") {
              row = placed.startRow + j;
              col = placed.startCol - i;
            } else {
              row = placed.startRow - i;
              col = placed.startCol + j;
            }

            if (
              row >= 0 &&
              col >= 0 &&
              row < this.gridSize &&
              col < this.gridSize
            ) {
              intersections.push({ row, col, letterIndex: i });
            }
          }
        }
      }
    }

    return this.shuffleArray(intersections);
  }

  generate(): CrosswordState {
    this.grid = this.createEmptyGrid();
    this.placedWords = [];
    this.usedWords.clear();

    const shuffledWords = this.shuffleArray(this.wordBank);
    let attempts = 0;
    const maxAttempts = 100;

    // Try to place the first word (preferably 5-6 letters)
    const firstWordCandidates = shuffledWords.filter(
      (w) => w.word.length >= 4 && w.word.length <= 6
    );

    for (const wordClue of firstWordCandidates) {
      if (wordClue.word.length <= this.gridSize) {
        // Place first word horizontally in the middle-ish
        const startCol = Math.floor((this.gridSize - wordClue.word.length) / 2);
        const startRow = Math.floor(this.gridSize / 2) - 1;
        if (this.canPlaceWord(wordClue.word, startRow, startCol, "across")) {
          this.placeWord(wordClue, startRow, startCol, "across");
          break;
        }
      }
    }

    // Try to place more words
    let lastPlacedCount = 0;
    while (attempts < maxAttempts && this.placedWords.length < 8) {
      attempts++;

      for (const wordClue of shuffledWords) {
        if (
          this.usedWords.has(wordClue.word.toUpperCase()) ||
          wordClue.word.length > this.gridSize
        ) {
          continue;
        }

        // Alternate directions
        const direction: "across" | "down" =
          this.placedWords.length % 2 === 0 ? "down" : "across";

        // Find intersections with existing words
        const intersections = this.findIntersections(wordClue.word, direction);

        for (const intersection of intersections) {
          if (
            this.canPlaceWord(
              wordClue.word,
              intersection.row,
              intersection.col,
              direction
            )
          ) {
            this.placeWord(
              wordClue,
              intersection.row,
              intersection.col,
              direction
            );
            break;
          }
        }

        if (this.usedWords.has(wordClue.word.toUpperCase())) break;
      }

      // Break if we haven't placed any new words
      if (this.placedWords.length === lastPlacedCount) {
        // Try to place words without intersection (if grid is empty or stuck)
        for (const wordClue of shuffledWords) {
          if (
            this.usedWords.has(wordClue.word.toUpperCase()) ||
            wordClue.word.length > this.gridSize
          ) {
            continue;
          }

          const direction: "across" | "down" =
            this.placedWords.length % 2 === 0 ? "across" : "down";

          for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
              if (this.canPlaceWord(wordClue.word, row, col, direction)) {
                this.placeWord(wordClue, row, col, direction);
                break;
              }
            }
            if (this.usedWords.has(wordClue.word.toUpperCase())) break;
          }
          if (this.usedWords.has(wordClue.word.toUpperCase())) break;
        }
      }
      lastPlacedCount = this.placedWords.length;
    }

    return this.buildState();
  }

  private buildState(): CrosswordState {
    // Assign clue numbers
    const numberPositions = new Map<string, number>();
    let clueNumber = 1;

    // Sort placed words by position
    const sortedWords = [...this.placedWords].sort((a, b) => {
      if (a.startRow !== b.startRow) return a.startRow - b.startRow;
      return a.startCol - b.startCol;
    });

    for (const word of sortedWords) {
      const key = `${word.startRow},${word.startCol}`;
      if (!numberPositions.has(key)) {
        numberPositions.set(key, clueNumber++);
      }
      word.number = numberPositions.get(key) ?? 0;
    }

    // Build grid cells
    const cells: Cell[][] = Array(this.gridSize)
      .fill(null)
      .map(() =>
        Array(this.gridSize)
          .fill(null)
          .map(() => ({
            letter: null as string | null,
            userInput: "",
            revealed: false,
            isBlack: true,
          }))
      );

    // Fill in letters and mark non-black cells
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const gridCell = this.getGridCell(row, col);
        const cell = cells[row]?.[col];
        if (gridCell !== null && gridCell !== undefined && cell) {
          cell.letter = gridCell;
          cell.isBlack = false;
        }
      }
    }

    // Add clue numbers
    for (const word of sortedWords) {
      const key = `${word.startRow},${word.startCol}`;
      const cell = cells[word.startRow]?.[word.startCol];
      if (cell) {
        cell.number = numberPositions.get(key);
      }
    }

    // Build clue lists
    const acrossClues: Clue[] = sortedWords
      .filter((w) => w.direction === "across")
      .map((w) => ({
        number: w.number,
        clue: w.clue,
        direction: "across" as const,
        answer: w.word,
        startRow: w.startRow,
        startCol: w.startCol,
        length: w.word.length,
      }));

    const downClues: Clue[] = sortedWords
      .filter((w) => w.direction === "down")
      .map((w) => ({
        number: w.number,
        clue: w.clue,
        direction: "down" as const,
        answer: w.word,
        startRow: w.startRow,
        startCol: w.startCol,
        length: w.word.length,
      }));

    return {
      grid: cells,
      acrossClues,
      downClues,
      completed: false,
      selectedCell: null,
      selectedDirection: "across",
    };
  }
}
