import type { Cell, CaveConfig, CaveStats, Position, GameState } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { CaveGenerator } from "./CaveGenerator";

/**
 * Main controller for the Cavern Explorer game.
 */
export class CavernGame {
  private generator: CaveGenerator;
  private config: CaveConfig;
  private grid: Cell[][] = [];

  // Player state
  private _playerPos: Position = { row: 0, col: 0 };
  private _collectedGems: number = 0;
  private _totalGems: number = 0;
  private _isDead: boolean = false;
  private _hasWon: boolean = false;

  constructor(config: CaveConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.generator = new CaveGenerator(config);
    this.generate();
  }

  /**
   * Generate a new cave and place player
   */
  generate(): void {
    this.grid = this.generator.generate();
    this._collectedGems = 0;
    this._isDead = false;
    this._hasWon = false;
    this._totalGems = this.countGems();
    this.placePlayer();
  }

  /**
   * Count total gems in the cave
   */
  private countGems(): number {
    let count = 0;
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.type === "crystal") count++;
      }
    }
    return count;
  }

  /**
   * Place player on a valid floor cell
   */
  private placePlayer(): void {
    // Find the first floor cell
    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.cols; col++) {
        const cell = this.grid[row]?.[col];
        if (cell && cell.type === "floor") {
          this._playerPos = { row, col };
          return;
        }
      }
    }
  }

  /**
   * Move player in a direction
   */
  move(direction: "up" | "down" | "left" | "right"): boolean {
    if (this._isDead || this._hasWon) return false;

    const delta = {
      up: { row: -1, col: 0 },
      down: { row: 1, col: 0 },
      left: { row: 0, col: -1 },
      right: { row: 0, col: 1 },
    };

    const d = delta[direction];
    const newRow = this._playerPos.row + d.row;
    const newCol = this._playerPos.col + d.col;

    const cell = this.getCell(newRow, newCol);
    if (!cell) return false;

    // Can't walk through walls or crystals on walls
    if (cell.type === "wall") return false;

    // Move player
    this._playerPos = { row: newRow, col: newCol };

    // Check for water (death)
    if (cell.type === "water") {
      this._isDead = true;
      return true;
    }

    // Check for crystal (collect)
    if (cell.type === "crystal") {
      this._collectedGems++;
      cell.type = "floor"; // Crystal is now floor

      // Check win condition
      if (this._collectedGems >= this._totalGems) {
        this._hasWon = true;
      }
    }

    return true;
  }

  /**
   * Handle click on a cell - disintegrate adjacent walls
   */
  handleClick(row: number, col: number): boolean {
    if (this._isDead || this._hasWon) return false;

    const cell = this.getCell(row, col);
    if (!cell) return false;

    // Only walls can be disintegrated
    if (cell.type !== "wall" && cell.type !== "crystal") return false;

    // Check if adjacent to player
    const dr = Math.abs(row - this._playerPos.row);
    const dc = Math.abs(col - this._playerPos.col);

    // Must be directly adjacent (not diagonal)
    if (!((dr === 1 && dc === 0) || (dr === 0 && dc === 1))) return false;

    // Disintegrate wall
    cell.type = "floor";
    cell.region =
      this.grid[this._playerPos.row]?.[this._playerPos.col]?.region || 1;

    return true;
  }

  /**
   * Check if cell has player
   */
  hasPlayer(row: number, col: number): boolean {
    return this._playerPos.row === row && this._playerPos.col === col;
  }

  /**
   * Get current game state
   */
  getGameState(): GameState {
    return {
      playerPos: { ...this._playerPos },
      collectedGems: this._collectedGems,
      totalGems: this._totalGems,
      isDead: this._isDead,
      hasWon: this._hasWon,
    };
  }

  /**
   * Get a cell at the specified position
   */
  getCell(row: number, col: number): Cell | undefined {
    return this.grid[row]?.[col];
  }

  /**
   * Get CSS class for a cell
   */
  getCellClass(row: number, col: number): string {
    const cell = this.getCell(row, col);
    if (!cell) return "";

    const classes = [cell.type];

    // Add region class for floor and water cells to enable region coloring
    // (only floor uses it visually, but water inherits region from floor)
    if ((cell.type === "floor" || cell.type === "water") && cell.region > 0) {
      classes.push(`region-${(cell.region % 8) + 1}`);
    }

    // Add player class
    if (this.hasPlayer(row, col)) {
      classes.push("has-player");
      if (this._isDead) classes.push("dead");
    }

    // Add clickable class for adjacent walls
    if (cell.type === "wall" || cell.type === "crystal") {
      const dr = Math.abs(row - this._playerPos.row);
      const dc = Math.abs(col - this._playerPos.col);
      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        classes.push("breakable");
      }
    }

    return classes.join(" ");
  }

  /**
   * Get cell content (emoji)
   */
  getCellContent(row: number, col: number): string {
    // Show player first
    if (this.hasPlayer(row, col)) {
      return this._isDead ? "💀" : "🧙";
    }

    const cell = this.getCell(row, col);
    if (!cell) return "";

    switch (cell.type) {
      case "crystal":
        return "💎";
      case "water":
        return "";
      case "entrance":
        return "🚪";
      default:
        return "";
    }
  }

  /**
   * Get cave statistics
   */
  getStats(): CaveStats {
    let totalFloor = 0;
    let totalWall = 0;
    let totalWater = 0;
    let totalCrystals = 0;
    const regions = new Set<number>();

    for (const row of this.grid) {
      for (const cell of row) {
        switch (cell.type) {
          case "floor":
            totalFloor++;
            break;
          case "wall":
            totalWall++;
            break;
          case "water":
            totalWater++;
            break;
          case "crystal":
            totalCrystals++;
            break;
        }
        if (cell.region > 0) {
          regions.add(cell.region);
        }
      }
    }

    return {
      totalFloor,
      totalWall,
      totalWater,
      totalCrystals,
      regionCount: regions.size,
    };
  }

  /**
   * Get grid dimensions
   */
  get rows(): number {
    return this.config.rows;
  }

  get cols(): number {
    return this.config.cols;
  }

  /**
   * Reset with new config
   */
  reset(config?: Partial<CaveConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
      this.generator = new CaveGenerator(this.config);
    }
    this.generate();
  }
}
