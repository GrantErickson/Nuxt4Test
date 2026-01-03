import type { PegColor, GameConfig } from "./types";
import { DEFAULT_CONFIG } from "./types";

/**
 * Generates secret codes for the Mastermind game.
 */
export class CodeGenerator {
  private config: GameConfig;

  constructor(config: GameConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Generate a random secret code
   */
  generate(): PegColor[] {
    const code: PegColor[] = [];
    for (let i = 0; i < this.config.codeLength; i++) {
      const randomIndex = Math.floor(
        Math.random() * this.config.availableColors.length
      );
      code.push(
        this.config.availableColors[randomIndex] ??
          this.config.availableColors[0]!
      );
    }
    return code;
  }
}
