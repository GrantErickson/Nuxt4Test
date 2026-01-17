import * as THREE from "three";
import type { ScoreEvent3D, PowerUpType } from "./types";
import {
  BASE_SCORE,
  PERFECT_CATCH_SCORE,
  MAX_MULTIPLIER,
  MULTIPLIER_DECAY_TIME,
} from "./types";

export class ScoreManager3D {
  private score = 0;
  private highScore = 0;
  private perfectCatchStreak = 0;
  private multiplier = 1;
  private lastPerfectCatchTime = 0;
  private scoreEvents: ScoreEvent3D[] = [];

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
    const saved = localStorage.getItem("voidcatcher3d-highscore");
    if (saved) {
      this.highScore = parseInt(saved, 10);
    }
  }

  private saveHighScore(): void {
    localStorage.setItem("voidcatcher3d-highscore", this.highScore.toString());
  }

  addScore(
    points: number,
    isPerfectCatch: boolean,
    position: THREE.Vector3
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
      position: position.clone(),
      multiplier: this.multiplier,
      timestamp: Date.now(),
    });

    // Play sound
    this.playScoreSound(isPerfectCatch);
  }

  catchShape(isPerfectCatch: boolean, position: THREE.Vector3): void {
    const points = isPerfectCatch ? PERFECT_CATCH_SCORE : BASE_SCORE;
    this.addScore(points, isPerfectCatch, position);
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
    this.scoreEvents = this.scoreEvents.filter(
      (event) => now - event.timestamp < 2000
    );
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

  getScoreEvents(): ScoreEvent3D[] {
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
      if (isPerfectCatch) {
        // Perfect catch: celebratory multi-tone chord sound
        this.playPerfectCatchSound();
      } else {
        // Regular catch: simple lower pitch
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = 400;
        oscillator.type = "sine";
        gainNode.gain.value = 0.2;

        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + 0.2
        );

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
      }
    } catch (e) {
      console.warn("Error playing sound", e);
    }
  }

  private playPerfectCatchSound(): void {
    if (!this.audioContext) return;

    // Play a celebratory chord progression (C major arpeggio)
    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.audioContext.currentTime;

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.value = freq;
      oscillator.type = "sine";

      // Stagger the notes slightly for arpeggio effect
      const startTime = now + index * 0.05;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.35);
    });

    // Add a shimmer/sparkle effect with higher frequency noise
    const shimmer = this.audioContext.createOscillator();
    const shimmerGain = this.audioContext.createGain();
    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.audioContext.destination);

    shimmer.frequency.value = 2000;
    shimmer.frequency.exponentialRampToValueAtTime(4000, now + 0.15);
    shimmer.type = "sine";
    shimmerGain.gain.setValueAtTime(0.08, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    shimmer.start(now);
    shimmer.stop(now + 0.25);
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
          oscillator.type = "sine";
          break;
        case "shrink":
          // Warning sound for negative powerup
          oscillator.frequency.value = 600;
          oscillator.frequency.exponentialRampToValueAtTime(
            200,
            this.audioContext.currentTime + 0.2
          );
          oscillator.type = "sawtooth";
          break;
        case "slow":
          oscillator.frequency.value = 400;
          oscillator.frequency.exponentialRampToValueAtTime(
            600,
            this.audioContext.currentTime + 0.2
          );
          oscillator.type = "triangle";
          break;
        case "fast":
          // Warning sound for negative powerup
          oscillator.frequency.value = 500;
          oscillator.frequency.exponentialRampToValueAtTime(
            150,
            this.audioContext.currentTime + 0.2
          );
          oscillator.type = "sawtooth";
          break;
        case "magnet":
          // Positive humming magnetic sound
          oscillator.frequency.value = 200;
          oscillator.frequency.exponentialRampToValueAtTime(
            400,
            this.audioContext.currentTime + 0.15
          );
          oscillator.frequency.exponentialRampToValueAtTime(
            300,
            this.audioContext.currentTime + 0.3
          );
          oscillator.type = "sine";
          break;
        default:
          oscillator.frequency.value = 500;
          oscillator.type = "triangle";
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

  playFallingSound(progress: number): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Whoosh sound with descending pitch as shape falls
      // Start at 400Hz and decrease to 100Hz based on progress
      const startFreq = 400;
      const endFreq = 100;
      const frequency = startFreq - (startFreq - endFreq) * progress;

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      // Volume decreases as shape falls deeper
      gainNode.gain.value = 0.15 * (1 - progress * 0.5);

      // Quick fade
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.08
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.08);
    } catch (e) {
      console.warn("Error playing falling sound", e);
    }
  }

  playAbsorptionSound(): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Deep bass sound for final absorption
      oscillator.frequency.value = 80;
      oscillator.type = "sine";
      gainNode.gain.value = 0.25;

      // Quick pulse
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.15
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.15);
    } catch (e) {
      console.warn("Error playing absorption sound", e);
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
