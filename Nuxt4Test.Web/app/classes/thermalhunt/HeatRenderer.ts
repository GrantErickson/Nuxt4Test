import type { Cell } from "./types";

/**
 * Handles rendering colors based on distance (heat) for Thermal Hunt.
 * Each distance gets a unique color on the red-to-blue spectrum.
 */
export class HeatRenderer {
  private maxDistance: number;

  constructor(maxDistance: number = 48) {
    this.maxDistance = maxDistance;
  }

  /**
   * Update the max distance (for dynamic grid sizes)
   */
  setMaxDistance(maxDistance: number): void {
    this.maxDistance = maxDistance;
  }

  /**
   * Get a unique HSL color for a distance value.
   * Distance 0 = red (hue 0), max distance = blue (hue 240)
   */
  getHeatColorStyle(distance: number): string {
    // Clamp distance to valid range
    const d = Math.min(distance, this.maxDistance);

    // Map distance to hue: 0 (red) -> 240 (blue)
    // We go through orange, yellow, green, cyan, to blue
    const hue = Math.round((d / this.maxDistance) * 240);

    // Keep saturation high and lightness at 50% for vibrant colors
    return `hsl(${hue}, 85%, 50%)`;
  }

  /**
   * Get CSS class for a cell (without color - color is inline style)
   */
  getCellClass(cell: Cell | undefined, isGameOver: boolean): string {
    if (!cell) return "";

    if (cell.isTarget && (cell.isRevealed || isGameOver)) {
      return "target revealed clicked";
    } else if (cell.isRevealed && cell.isClicked) {
      return "revealed clicked";
    } else if (cell.isRevealed) {
      return "revealed auto-revealed";
    } else if (isGameOver && !cell.isRevealed) {
      // Cells that will be animated on reveal
      return "hidden animating";
    } else {
      return "hidden";
    }
  }

  /**
   * Get inline style for cell background color
   */
  getCellStyle(cell: Cell | undefined, isGameOver: boolean): string {
    if (!cell) return "";

    if (cell.isTarget && (cell.isRevealed || isGameOver)) {
      return `background-color: ${this.getHeatColorStyle(0)}`;
    } else if (cell.isRevealed) {
      return `background-color: ${this.getHeatColorStyle(cell.distance)}`;
    } else if (isGameOver) {
      // Show all cells when game is over
      return `background-color: ${this.getHeatColorStyle(cell.distance)}`;
    }

    return "";
  }

  /**
   * Get cell content - shows distance number when revealed, star for target
   */
  getCellContent(cell: Cell | undefined, isGameOver: boolean): string {
    if (!cell) return "";

    if (cell.isTarget && (cell.isRevealed || isGameOver)) {
      return "⭐";
    }

    // Show distance number when cell is revealed (clicked by user)
    if (cell.isRevealed && cell.isClicked) {
      return cell.distance.toString();
    }

    return "";
  }

  /**
   * Get temperature description for distance
   */
  getTemperatureText(distance: number): string {
    if (distance === 0) return "🔥 FOUND IT!";
    if (distance <= 2) return "🔥 Burning hot!";
    if (distance <= 5) return "🌡️ Very warm!";
    if (distance <= 10) return "☀️ Warm";
    if (distance <= 15) return "🌤️ Lukewarm";
    if (distance <= 25) return "❄️ Cool";
    if (distance <= 35) return "🧊 Cold";
    return "🥶 Freezing!";
  }
}
