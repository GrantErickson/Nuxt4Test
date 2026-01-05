// Crossword puzzle generator
import type { Cell, Clue, PlacedWord, WordClue, CrosswordState } from "./types";
import { getAllWords } from "./WordBank";

export class CrosswordGenerator {
  private gridSize: number = 7;
  private grid: (string | null)[][];
  private placedWords: PlacedWord[] = [];
  private wordBank: WordClue[] = [];
  private usedWords: Set<string> = new Set();
  private initialized: boolean = false;

  constructor() {
    this.grid = this.createEmptyGrid();
  }

  // Initialize the word bank asynchronously
  async init(): Promise<void> {
    if (this.initialized) return;
    this.wordBank = await getAllWords();
    this.initialized = true;
  }

  // Static factory method to create and initialize the generator
  static async create(): Promise<CrosswordGenerator> {
    const generator = new CrosswordGenerator();
    await generator.init();
    return generator;
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
    const wordUpper = word.toUpperCase();

    // Check bounds
    if (startRow < 0 || startCol < 0) return false;
    if (direction === "across") {
      if (startCol + len > this.gridSize) return false;
    } else {
      if (startRow + len > this.gridSize) return false;
    }

    let hasIntersection = this.placedWords.length === 0; // First word doesn't need intersection

    // Check each cell of the word
    for (let i = 0; i < len; i++) {
      const row = direction === "across" ? startRow : startRow + i;
      const col = direction === "across" ? startCol + i : startCol;
      const letterChar = wordUpper[i];
      if (!letterChar) return false;
      
      const existing = this.getGridCell(row, col);

      if (existing !== null && existing !== undefined) {
        // Cell is occupied - must match our letter
        if (existing !== letterChar) {
          return false;
        }
        hasIntersection = true; // This is a valid intersection
      } else {
        // Cell is empty - check adjacent cells in parallel direction
        // to avoid creating unintended adjacent words
        if (direction === "across") {
          // For horizontal word, check cells above and below
          const above = this.getGridCell(row - 1, col);
          const below = this.getGridCell(row + 1, col);
          if ((above !== null && above !== undefined) || 
              (below !== null && below !== undefined)) {
            // There's an adjacent letter - only allow if it's part of a perpendicular word
            // that intersects at this position
            const isPartOfVerticalWord = this.placedWords.some(
              (pw) =>
                pw.direction === "down" &&
                pw.startCol === col &&
                pw.startRow <= row &&
                pw.startRow + pw.word.length > row
            );
            if (!isPartOfVerticalWord) return false;
          }
        } else {
          // For vertical word, check cells left and right
          const left = this.getGridCell(row, col - 1);
          const right = this.getGridCell(row, col + 1);
          if ((left !== null && left !== undefined) || 
              (right !== null && right !== undefined)) {
            const isPartOfHorizontalWord = this.placedWords.some(
              (pw) =>
                pw.direction === "across" &&
                pw.startRow === row &&
                pw.startCol <= col &&
                pw.startCol + pw.word.length > col
            );
            if (!isPartOfHorizontalWord) return false;
          }
        }
      }
    }

    // Word must intersect with existing words (unless it's the first word)
    if (!hasIntersection && this.placedWords.length > 0) {
      return false;
    }

    // Check cell immediately before the word start
    if (direction === "across") {
      if (startCol > 0) {
        const before = this.getGridCell(startRow, startCol - 1);
        if (before !== null && before !== undefined) return false;
      }
    } else {
      if (startRow > 0) {
        const before = this.getGridCell(startRow - 1, startCol);
        if (before !== null && before !== undefined) return false;
      }
    }

    // Check cell immediately after the word end
    if (direction === "across") {
      if (startCol + len < this.gridSize) {
        const after = this.getGridCell(startRow, startCol + len);
        if (after !== null && after !== undefined) return false;
      }
    } else {
      if (startRow + len < this.gridSize) {
        const after = this.getGridCell(startRow + len, startCol);
        if (after !== null && after !== undefined) return false;
      }
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
    // Try multiple times and pick the best result
    let bestGrid: (string | null)[][] = [];
    let bestPlacedWords: PlacedWord[] = [];
    let bestFilledCells = 0;

    const numAttempts = 5; // Try 5 different puzzles

    for (let attempt = 0; attempt < numAttempts; attempt++) {
      this.grid = this.createEmptyGrid();
      this.placedWords = [];
      this.usedWords.clear();

      this.generateSingleAttempt();

      // Count filled cells
      let filledCells = 0;
      for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
          if (this.getGridCell(r, c) !== null) filledCells++;
        }
      }

      if (filledCells > bestFilledCells) {
        bestFilledCells = filledCells;
        bestGrid = this.grid.map(row => [...row]);
        bestPlacedWords = [...this.placedWords];
      }
    }

    // Use the best result
    this.grid = bestGrid;
    this.placedWords = bestPlacedWords;

    return this.buildState();
  }

  private generateSingleAttempt(): void {
    // Sort words by how many common letters they have (prioritize E, A, R, S, T, O, N, I, L)
    const commonLetters = new Set(['E', 'A', 'R', 'S', 'T', 'O', 'N', 'I', 'L', 'C', 'U', 'D']);
    
    const scoredWords = this.wordBank
      .filter(w => w.word.length >= 3 && w.word.length <= this.gridSize)
      .map(w => {
        const upper = w.word.toUpperCase();
        let score = 0;
        for (const char of upper) {
          if (commonLetters.has(char)) score++;
        }
        // Prefer medium-length words (4-6 letters)
        if (upper.length >= 4 && upper.length <= 6) score += 3;
        return { wordClue: w, score };
      })
      .sort((a, b) => b.score - a.score);

    const prioritizedWords = scoredWords.map(s => s.wordClue);
    
    // Place first word - pick a good starting word (5-7 letters, lots of common letters)
    const firstWordCandidates = prioritizedWords.filter(
      (w) => w.word.length >= 5 && w.word.length <= this.gridSize
    );

    for (const wordClue of firstWordCandidates) {
      const startCol = Math.floor((this.gridSize - wordClue.word.length) / 2);
      const startRow = Math.floor(this.gridSize / 2);
      if (this.canPlaceWord(wordClue.word, startRow, startCol, "across")) {
        this.placeWord(wordClue, startRow, startCol, "across");
        break;
      }
    }

    // Now aggressively try to place more words
    const maxRounds = 20;
    for (let round = 0; round < maxRounds; round++) {
      const beforeCount = this.placedWords.length;
      
      // Shuffle for variety but keep some prioritization
      const wordsToTry = this.shuffleArray([...prioritizedWords]);

      for (const wordClue of wordsToTry) {
        if (this.usedWords.has(wordClue.word.toUpperCase())) continue;

        // Try to place this word
        const placed = this.tryPlaceWord(wordClue);
        if (placed && this.placedWords.length >= 15) break; // Good enough
      }

      // If no progress, break
      if (this.placedWords.length === beforeCount) break;
    }
  }

  private tryPlaceWord(wordClue: WordClue): boolean {
    const directions: ("across" | "down")[] = 
      Math.random() < 0.5 ? ["across", "down"] : ["down", "across"];

    for (const direction of directions) {
      // Get all possible intersection points
      const intersections = this.findIntersections(wordClue.word, direction);
      
      // Sort intersections by how central they are (prefer middle of grid)
      const center = this.gridSize / 2;
      intersections.sort((a, b) => {
        const distA = Math.abs(a.row - center) + Math.abs(a.col - center);
        const distB = Math.abs(b.row - center) + Math.abs(b.col - center);
        return distA - distB;
      });

      for (const intersection of intersections) {
        if (this.canPlaceWord(wordClue.word, intersection.row, intersection.col, direction)) {
          this.placeWord(wordClue, intersection.row, intersection.col, direction);
          return true;
        }
      }
    }
    return false;
  }

  // Check if a word intersects with existing letters
  private wordIntersectsExisting(
    word: string,
    startRow: number,
    startCol: number,
    direction: "across" | "down"
  ): boolean {
    const wordUpper = word.toUpperCase();
    for (let i = 0; i < wordUpper.length; i++) {
      const row = direction === "across" ? startRow : startRow + i;
      const col = direction === "across" ? startCol + i : startCol;
      const existing = this.getGridCell(row, col);
      if (existing !== null && existing !== undefined) {
        return true; // Has at least one intersection
      }
    }
    return false;
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
