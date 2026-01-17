import type { ScoreEvent, PowerUpType } from "./types";
import {
  BASE_SCORE,
  PERFECT_CATCH_SCORE,
  MAX_MULTIPLIER,
  MULTIPLIER_DECAY_TIME,
} from "./types";

export class ScoreManager {
  private score = 0;
  private highScore = 0;
  private perfectCatchStreak = 0;
  private multiplier = 1;
  private lastPerfectCatchTime = 0;
  private scoreEvents: ScoreEvent[] = [];

  // Audio context for sound effects
  private audioContext: AudioContext | null = null;

  constructor() {
    this.loadHighScore();
    this.initAudio();
  }

  private initAudio(): void {
    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("Audio not supported", e);
    }
  }

  private loadHighScore(): void {
    const saved = localStorage.getItem("voidcatcher-highscore");
    if (saved) {
      this.highScore = parseInt(saved, 10);
    }
  }

  private saveHighScore(): void {
    localStorage.setItem("voidcatcher-highscore", this.highScore.toString());
  }

  addScore(
    points: number,
    isPerfectCatch: boolean,
    x: number,
    y: number
  ): void {
    // Update streak and multiplier for perfect catches
    if (isPerfectCatch) {
      this.perfectCatchStreak++;
      this.lastPerfectCatchTime = Date.now();

      // Increase multiplier based on streak
      this.multiplier = Math.min(
        MAX_MULTIPLIER,
        1 + Math.floor(this.perfectCatchStreak / 3)
      );
    } else {
      // Regular catch doesn't break streak immediately, but doesn't add to it
    }

    // Apply multiplier
    const finalPoints = Math.floor(points * this.multiplier);
    this.score += finalPoints;

    // Check for new high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }

    // Create score event for visual feedback
    this.scoreEvents.push({
      points: finalPoints,
      isPerfectCatch,
      x,
      y,
      multiplier: this.multiplier,
    });

    // Play sound
    this.playScoreSound(isPerfectCatch);
  }

  catchShape(isPerfectCatch: boolean, x: number, y: number): void {
    const points = isPerfectCatch ? PERFECT_CATCH_SCORE : BASE_SCORE;
    this.addScore(points, isPerfectCatch, x, y);
  }

  update(deltaTime: number): void {
    // Check if multiplier should decay
    if (
      this.perfectCatchStreak > 0 &&
      Date.now() - this.lastPerfectCatchTime > MULTIPLIER_DECAY_TIME
    ) {
      this.perfectCatchStreak = 0;
      this.multiplier = 1;
    }

    // Remove old score events (keep for 2 seconds)
    const now = Date.now();
    this.scoreEvents = this.scoreEvents.filter((event) => {
      // Events don't have timestamps, so we'll just remove the oldest ones
      return this.scoreEvents.length < 10; // Keep max 10 events
    });
  }

  getScore(): number {
    return this.score;
  }

  getHighScore(): number {
    return this.highScore;
  }

  getMultiplier(): number {
    return this.multiplier;
  }

  getPerfectCatchStreak(): number {
    return this.perfectCatchStreak;
  }

  getScoreEvents(): ScoreEvent[] {
    return this.scoreEvents;
  }

  clearScoreEvents(): void {
    this.scoreEvents = [];
  }

  reset(): void {
    this.score = 0;
    this.perfectCatchStreak = 0;
    this.multiplier = 1;
    this.scoreEvents = [];
  }

  private playScoreSound(isPerfectCatch: boolean): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      if (isPerfectCatch) {
        // Perfect catch: higher pitch, more complex sound
        oscillator.frequency.value = 800;
        oscillator.type = "sine";
        gainNode.gain.value = 0.3;

        // Quick frequency sweep up
        oscillator.frequency.exponentialRampToValueAtTime(
          1200,
          this.audioContext.currentTime + 0.1
        );
      } else {
        // Regular catch: lower pitch
        oscillator.frequency.value = 400;
        oscillator.type = "sine";
        gainNode.gain.value = 0.2;
      }

      // Fade out
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.2
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.2);
    } catch (e) {
      console.warn("Error playing sound", e);
    }
  }

  playClearSound(): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 200;
      oscillator.type = "square";
      gainNode.gain.value = 0.2;

      // Sweep down
      oscillator.frequency.exponentialRampToValueAtTime(
        50,
        this.audioContext.currentTime + 0.3
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.3
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (e) {
      console.warn("Error playing sound", e);
    }
  }

  playPowerUpSound(type: PowerUpType): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Different sounds for different power-ups
      switch (type) {
        case "grow":
          oscillator.frequency.value = 300;
          oscillator.frequency.exponentialRampToValueAtTime(
            600,
            this.audioContext.currentTime + 0.2
          );
          break;
        case "shrink":
          oscillator.frequency.value = 600;
          oscillator.frequency.exponentialRampToValueAtTime(
            300,
            this.audioContext.currentTime + 0.2
          );
          break;
        case "slow":
          oscillator.frequency.value = 500;
          oscillator.type = "triangle";
          break;
        case "clear":
          oscillator.frequency.value = 1000;
          oscillator.type = "sawtooth";
          break;
      }

      gainNode.gain.value = 0.25;
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.3
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (e) {
      console.warn("Error playing sound", e);
    }
  }

  playGameOverSound(): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 400;
      oscillator.type = "sawtooth";
      gainNode.gain.value = 0.3;

      // Downward sweep
      oscillator.frequency.exponentialRampToValueAtTime(
        100,
        this.audioContext.currentTime + 0.5
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.5
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);
    } catch (e) {
      console.warn("Error playing sound", e);
    }
  }
}
