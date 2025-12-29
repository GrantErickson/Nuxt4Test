import type { Cell } from "./types";
import { FOREST_EMOJIS, TREE_LINES } from "./types";

/**
 * Handles visual theming for the wilderness-themed minesweeper game.
 * Provides cell content, CSS classes, and decorative elements.
 */
export class ThemeRenderer {
  /**
   * Get CSS class for a cell based on its state
   */
  getCellClass(cell: Cell | undefined): string {
    if (!cell) return "";

    const classes: string[] = [];

    if (cell.isRevealed) {
      classes.push("revealed");
      if (cell.isMine) {
        classes.push("mine");
      }
    } else {
      classes.push("hidden");
    }

    if (cell.isFlagged && !cell.isRevealed) {
      classes.push("flagged");
    }

    return classes.join(" ");
  }

  /**
   * Get the display content for a cell
   */
  getCellContent(cell: Cell | undefined, row: number, col: number): string {
    if (!cell) return "";

    // Flagged cell shows campfire
    if (cell.isFlagged && !cell.isRevealed) {
      return "🔥";
    }

    // Unrevealed cell shows forest emoji
    if (!cell.isRevealed) {
      return this.getForestEmoji(row, col);
    }

    // Revealed mine shows bear
    if (cell.isMine) {
      return "🐻";
    }

    // Revealed cell with adjacent mines shows number
    if (cell.adjacentMines > 0) {
      return cell.adjacentMines.toString();
    }

    // Empty revealed cell
    return "";
  }

  /**
   * Get deterministic forest emoji based on position
   */
  getForestEmoji(row: number, col: number): string {
    const index = (row * 7 + col * 13) % FOREST_EMOJIS.length;
    return FOREST_EMOJIS[index] ?? "🌲";
  }

  /**
   * Get a random tree line for decoration
   */
  getRandomTreeLine(): string {
    const index = Math.floor(Math.random() * TREE_LINES.length);
    return TREE_LINES[index] ?? "The Forest Awaits";
  }
}
