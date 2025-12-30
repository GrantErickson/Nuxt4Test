import type { Cell } from "./types";

// Maximum possible Manhattan distance on a 25x25 grid
const MAX_DISTANCE = 48;

/**
 * Handles rendering colors based on distance (heat) for Thermal Hunt.
 * Each distance gets a unique color on the red-to-blue spectrum.
 */
export class HeatRenderer {
  /**
   * Get a unique HSL color for a distance value.
   * Distance 0 = red (hue 0), max distance = blue (hue 240)
   */
  getHeatColorStyle(distance: number): string {
    // Clamp distance to valid range
    const d = Math.min(distance, MAX_DISTANCE);
    
    // Map distance to hue: 0 (red) -> 240 (blue)
    // We go through orange, yellow, green, cyan, to blue
    const hue = Math.round((d / MAX_DISTANCE) * 240);
    
    // Keep saturation high and lightness at 50% for vibrant colors
    return `hsl(${hue}, 85%, 50%)`;
  }

  /**
   * Get CSS class for a cell (without color - color is inline style)
   */
  getCellClass(cell: Cell | undefined, isGameOver: boolean): string {
    if (!cell) return "";

    if (cell.isTarget && (cell.isRevealed || isGameOver)) {
      return "target revealed";
    } else if (cell.isRevealed) {
      return "revealed";
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
    }

    return "";
  }

  /**
   * Get cell content (just show star for target, empty otherwise)
   */
  getCellContent(cell: Cell | undefined, isGameOver: boolean): string {
    if (!cell) return "";

    if (cell.isTarget && (cell.isRevealed || isGameOver)) {
      return "⭐";
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
