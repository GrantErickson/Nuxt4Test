import type { Cell, CellType, CaveConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";

/**
 * Generates cave systems using cellular automata.
 * Creates organic-looking cavern structures with multiple regions.
 */
export class CaveGenerator {
  private config: CaveConfig;
  private grid: Cell[][] = [];
  private regionCount: number = 0;

  constructor(config: CaveConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Generate a new cave system
   */
  generate(): Cell[][] {
    this.initializeRandom();
    this.applyCellularAutomata();
    this.identifyRegions();
    this.removeSmallRegions();
    this.addFeatures();
    return this.grid;
  }

  /**
   * Initialize grid with random walls/floors
   */
  private initializeRandom(): void {
    this.grid = [];
    for (let row = 0; row < this.config.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.config.cols; col++) {
        // Border cells are always walls
        const isBorder =
          row === 0 ||
          row === this.config.rows - 1 ||
          col === 0 ||
          col === this.config.cols - 1;

        const isWall = isBorder || Math.random() < this.config.fillProbability;
        this.grid[row]![col] = {
          type: isWall ? "wall" : "floor",
          region: 0,
        };
      }
    }
  }

  /**
   * Apply cellular automata smoothing
   */
  private applyCellularAutomata(): void {
    for (let i = 0; i < this.config.smoothingIterations; i++) {
      const newGrid: Cell[][] = [];

      for (let row = 0; row < this.config.rows; row++) {
        newGrid[row] = [];
        for (let col = 0; col < this.config.cols; col++) {
          const wallCount = this.countAdjacentWalls(row, col);

          // Rule: If 5+ adjacent walls, become wall. If 3 or fewer, become floor.
          // 4 walls = stay the same
          let newType: CellType;
          if (wallCount > 4) {
            newType = "wall";
          } else if (wallCount < 4) {
            newType = "floor";
          } else {
            newType = this.grid[row]![col]!.type === "wall" ? "wall" : "floor";
          }

          newGrid[row]![col] = { type: newType, region: 0 };
        }
      }

      this.grid = newGrid;
    }
  }

  /**
   * Count walls in the 8 adjacent cells (and self)
   */
  private countAdjacentWalls(row: number, col: number): number {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = row + dr;
        const c = col + dc;

        if (r < 0 || r >= this.config.rows || c < 0 || c >= this.config.cols) {
          count++; // Out of bounds counts as wall
        } else if (this.grid[r]![c]!.type === "wall") {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Identify connected regions using flood fill
   */
  private identifyRegions(): void {
    this.regionCount = 0;
    const visited: boolean[][] = [];

    for (let row = 0; row < this.config.rows; row++) {
      visited[row] = [];
      for (let col = 0; col < this.config.cols; col++) {
        visited[row]![col] = false;
      }
    }

    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.cols; col++) {
        const cell = this.grid[row]![col]!;
        if (!visited[row]![col] && cell.type !== "wall") {
          this.regionCount++;
          this.floodFill(row, col, this.regionCount, visited);
        }
      }
    }
  }

  /**
   * Flood fill to mark a region
   */
  private floodFill(
    row: number,
    col: number,
    region: number,
    visited: boolean[][]
  ): void {
    const stack: [number, number][] = [[row, col]];

    while (stack.length > 0) {
      const [r, c] = stack.pop()!;

      if (
        r < 0 ||
        r >= this.config.rows ||
        c < 0 ||
        c >= this.config.cols ||
        visited[r]![c] ||
        this.grid[r]![c]!.type === "wall"
      ) {
        continue;
      }

      visited[r]![c] = true;
      this.grid[r]![c]!.region = region;

      stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }
  }

  /**
   * Remove regions that are too small
   */
  private removeSmallRegions(): void {
    // Count cells in each region
    const regionSizes: Map<number, number> = new Map();

    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.cols; col++) {
        const region = this.grid[row]![col]!.region;
        if (region > 0) {
          regionSizes.set(region, (regionSizes.get(region) || 0) + 1);
        }
      }
    }

    // Find regions to remove
    const regionsToRemove = new Set<number>();
    for (const [region, size] of regionSizes) {
      if (size < this.config.minRegionSize) {
        regionsToRemove.add(region);
      }
    }

    // Convert small regions to walls
    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.cols; col++) {
        const cell = this.grid[row]![col]!;
        if (regionsToRemove.has(cell.region)) {
          cell.type = "wall";
          cell.region = 0;
        }
      }
    }

    // Update region count
    this.regionCount -= regionsToRemove.size;
  }

  /**
   * Add water pools and crystal formations
   */
  private addFeatures(): void {
    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.cols; col++) {
        const cell = this.grid[row]![col]!;

        if (cell.type === "floor") {
          // Add water in low-lying areas (surrounded by more floor)
          const floorNeighbors = this.countAdjacentType(row, col, "floor");
          if (floorNeighbors >= 6 && Math.random() < this.config.waterChance) {
            cell.type = "water";
          }
        } else if (cell.type === "wall") {
          // Add crystals on walls adjacent to floor
          const floorNeighbors = this.countAdjacentType(row, col, "floor");
          if (
            floorNeighbors >= 1 &&
            floorNeighbors <= 3 &&
            Math.random() < this.config.crystalChance
          ) {
            cell.type = "crystal";
          }
        }
      }
    }
  }

  /**
   * Count adjacent cells of a specific type
   */
  private countAdjacentType(row: number, col: number, type: CellType): number {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;

        if (
          r >= 0 &&
          r < this.config.rows &&
          c >= 0 &&
          c < this.config.cols &&
          this.grid[r]![c]!.type === type
        ) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Get the number of distinct regions
   */
  getRegionCount(): number {
    return this.regionCount;
  }
}
