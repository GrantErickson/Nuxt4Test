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
    this.connectAllRegions();
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
   * Connect all separate regions by carving tunnels
   * Keeps trying until all regions are connected
   */
  private connectAllRegions(): void {
    // Keep connecting until we have only one region
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      attempts++;

      // Re-identify regions to get current state
      this.reidentifyRegions();

      // Get all cells grouped by region
      const regionCells: Map<number, { row: number; col: number }[]> = new Map();

      for (let row = 0; row < this.config.rows; row++) {
        for (let col = 0; col < this.config.cols; col++) {
          const region = this.grid[row]![col]!.region;
          if (region > 0) {
            if (!regionCells.has(region)) {
              regionCells.set(region, []);
            }
            regionCells.get(region)!.push({ row, col });
          }
        }
      }

      const regions = Array.from(regionCells.keys());
      if (regions.length <= 1) {
        this.regionCount = 1;
        return; // All connected!
      }

      // Connect the two closest regions
      const mainRegion = regions[0]!;
      let closestRegion = regions[1]!;
      let minDistance = Infinity;

      // Find the closest region to main
      for (let i = 1; i < regions.length; i++) {
        const region = regions[i]!;
        const dist = this.getRegionDistance(
          regionCells.get(mainRegion)!,
          regionCells.get(region)!
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestRegion = region;
        }
      }

      // Connect them with a wider tunnel
      this.connectTwoRegions(
        regionCells.get(mainRegion)!,
        regionCells.get(closestRegion)!,
        mainRegion
      );
    }

    this.regionCount = 1;
  }

  /**
   * Re-identify regions without resetting the grid
   */
  private reidentifyRegions(): void {
    // Reset all regions
    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.cols; col++) {
        const cell = this.grid[row]![col]!;
        if (cell.type !== "wall") {
          cell.region = 0;
        }
      }
    }

    // Re-run flood fill
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
   * Get minimum distance between two regions
   */
  private getRegionDistance(
    region1Cells: { row: number; col: number }[],
    region2Cells: { row: number; col: number }[]
  ): number {
    let minDist = Infinity;
    const sample1 = this.sampleCells(region1Cells, 30);
    const sample2 = this.sampleCells(region2Cells, 30);

    for (const cell1 of sample1) {
      for (const cell2 of sample2) {
        const dist = Math.abs(cell1.row - cell2.row) + Math.abs(cell1.col - cell2.col);
        if (dist < minDist) {
          minDist = dist;
        }
      }
    }
    return minDist;
  }

  /**
   * Connect two regions by finding closest points and carving a tunnel
   */
  private connectTwoRegions(
    region1Cells: { row: number; col: number }[],
    region2Cells: { row: number; col: number }[],
    targetRegion: number
  ): void {
    // Find the closest pair of cells between the two regions
    let minDist = Infinity;
    let bestPair: { cell1: { row: number; col: number }; cell2: { row: number; col: number } } | null = null;

    // Use more samples to find better connection points
    const sample1 = this.sampleCells(region1Cells, 100);
    const sample2 = this.sampleCells(region2Cells, 100);

    for (const cell1 of sample1) {
      for (const cell2 of sample2) {
        const dist = Math.abs(cell1.row - cell2.row) + Math.abs(cell1.col - cell2.col);
        if (dist < minDist) {
          minDist = dist;
          bestPair = { cell1, cell2 };
        }
      }
    }

    if (bestPair) {
      this.carveTunnel(bestPair.cell1, bestPair.cell2, targetRegion);
    }
  }

  /**
   * Sample up to n cells from an array
   */
  private sampleCells(
    cells: { row: number; col: number }[],
    n: number
  ): { row: number; col: number }[] {
    if (cells.length <= n) return cells;

    const sampled: { row: number; col: number }[] = [];
    const step = Math.floor(cells.length / n);
    for (let i = 0; i < cells.length && sampled.length < n; i += step) {
      sampled.push(cells[i]!);
    }
    return sampled;
  }

  /**
   * Carve a tunnel between two points (2 cells wide for reliability)
   */
  private carveTunnel(
    from: { row: number; col: number },
    to: { row: number; col: number },
    region: number
  ): void {
    let { row, col } = from;
    const targetRow = to.row;
    const targetCol = to.col;

    // Carve the starting cell
    this.carveCell(row, col, region);
    this.carveCell(row + 1, col, region); // Widen tunnel

    // Carve horizontally first, then vertically (or randomly choose)
    const horizontalFirst = Math.random() < 0.5;

    if (horizontalFirst) {
      // Move horizontally
      while (col !== targetCol) {
        col += col < targetCol ? 1 : -1;
        this.carveCell(row, col, region);
        this.carveCell(row + 1, col, region); // Widen tunnel
      }
      // Move vertically
      while (row !== targetRow) {
        row += row < targetRow ? 1 : -1;
        this.carveCell(row, col, region);
        this.carveCell(row, col + 1, region); // Widen tunnel
      }
    } else {
      // Move vertically first
      while (row !== targetRow) {
        row += row < targetRow ? 1 : -1;
        this.carveCell(row, col, region);
        this.carveCell(row, col + 1, region); // Widen tunnel
      }
      // Move horizontally
      while (col !== targetCol) {
        col += col < targetCol ? 1 : -1;
        this.carveCell(row, col, region);
        this.carveCell(row + 1, col, region); // Widen tunnel
      }
    }

    // Carve the ending cell
    this.carveCell(to.row, to.col, region);
    this.carveCell(to.row + 1, to.col, region);
  }

  /**
   * Carve a single cell (make it floor)
   */
  private carveCell(row: number, col: number, region: number): void {
    // Don't carve border cells
    if (
      row <= 0 ||
      row >= this.config.rows - 1 ||
      col <= 0 ||
      col >= this.config.cols - 1
    ) {
      return;
    }

    const cell = this.grid[row]?.[col];
    if (cell && cell.type === "wall") {
      cell.type = "floor";
      cell.region = region;
    }
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
