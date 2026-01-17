import * as THREE from "three";
import * as CANNON from "cannon-es";
import type {
  VoidCatcher3DConfig,
  VoidCatcher3DState,
  PowerUp,
  GameMode,
} from "./types";
import {
  POWER_UP_DURATION,
  POSITIVE_POWER_UP_DURATION,
  isPositivePowerUp,
} from "./types";
import { RenderEngine } from "./RenderEngine";
import { PhysicsEngine3D } from "./PhysicsEngine3D";
import { ShapeManager3D } from "./ShapeManager3D";
import { VoidController3D } from "./VoidController3D";
import { ScoreManager3D } from "./ScoreManager3D";

export class VoidCatcher3DGame {
  private renderEngine: RenderEngine | null = null;
  private physicsEngine: PhysicsEngine3D | null = null;
  private shapeManager: ShapeManager3D | null = null;
  private voidController: VoidController3D | null = null;
  private scoreManager: ScoreManager3D;

  private config: VoidCatcher3DConfig;
  private activePowerUps: PowerUp[] = [];

  private _isGameOver = false;
  private _isPaused = false;
  private _elapsed = 0;
  private _timeRemaining: number | undefined;

  private animationId: number | null = null;
  private difficultyInterval: ReturnType<typeof setInterval> | null = null;
  private lastUpdateTime = Date.now();

  private onStateChange: (() => void) | null = null;

  constructor(config?: Partial<VoidCatcher3DConfig>) {
    this.config = {
      playAreaSize: config?.playAreaSize ?? 50,
      voidRadius: config?.voidRadius ?? 5,
      initialSpawnRate: config?.initialSpawnRate ?? 1000,
      gameMode: config?.gameMode ?? "endless",
      timedModeDuration: config?.timedModeDuration ?? 120,
    };

    if (this.config.gameMode === "timed") {
      this._timeRemaining = this.config.timedModeDuration;
    }

    this.scoreManager = new ScoreManager3D();
  }

  setup(canvas: HTMLCanvasElement, container: HTMLElement): void {
    // Initialize engines
    this.renderEngine = new RenderEngine(
      container,
      canvas,
      this.config.playAreaSize
    );
    this.physicsEngine = new PhysicsEngine3D(this.config.playAreaSize);

    // Initialize game components
    this.shapeManager = new ShapeManager3D(
      this.physicsEngine,
      this.renderEngine,
      this.config.playAreaSize,
      this.config.initialSpawnRate
    );

    this.voidController = new VoidController3D(
      this.renderEngine,
      this.physicsEngine,
      this.config.voidRadius
    );

    this.voidController.setupEventListeners(canvas);

    // Update floor hole to match void size
    this.renderEngine.updateFloorHole(this.config.voidRadius);

    // Start game loop
    this.startGameLoop();

    // Increase difficulty over time
    this.difficultyInterval = setInterval(() => {
      if (!this._isPaused && !this._isGameOver) {
        this.shapeManager?.increaseDifficulty();
      }
    }, 10000); // Every 10 seconds
  }

  private startGameLoop(): void {
    const gameLoop = () => {
      if (!this._isPaused && !this._isGameOver) {
        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;
        this.lastUpdateTime = now;

        this.update(deltaTime);
      }

      if (this.renderEngine) {
        this.renderEngine.render();
      }

      this.animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }

  private update(deltaTime: number): void {
    // Update elapsed time
    this._elapsed += deltaTime / 1000;

    // Update time remaining for timed mode
    if (this.config.gameMode === "timed" && this._timeRemaining !== undefined) {
      this._timeRemaining -= deltaTime / 1000;
      if (this._timeRemaining <= 0) {
        this._timeRemaining = 0;
        this.endGame();
        return;
      }
    }

    // Update physics
    this.physicsEngine?.step(deltaTime);

    // Update game components
    this.shapeManager?.update(deltaTime);
    this.voidController?.update(deltaTime);
    this.scoreManager.update(deltaTime);

    // Update particle effects
    this.renderEngine?.updateParticles(deltaTime / 1000); // Convert to seconds

    // Update void position in physics engine
    if (this.voidController && this.physicsEngine) {
      const voidPos = this.voidController.getPosition();
      const voidRadius = this.voidController.getRadius();
      this.physicsEngine.updateVoidPosition(voidPos.x, voidPos.z, voidRadius);
    }

    // Update power-ups
    this.updatePowerUps(deltaTime);

    // Check for collisions with void
    this.checkVoidCollisions();

    // Check for game over condition (endless mode only)
    if (this.config.gameMode === "endless") {
      this.checkGameOverCondition();
    }

    // Notify state change
    this.onStateChange?.();
  }

  private checkVoidCollisions(): void {
    if (!this.voidController || !this.shapeManager) return;

    const voidPos = this.voidController.getPosition();
    const voidRadius = this.voidController.getRadius();
    const voidVelocity = this.voidController.getVelocity();

    const shapes = this.shapeManager.getAllShapes();

    for (const gameShape of shapes) {
      const shapePos = gameShape.body.position;
      const distance = Math.sqrt(
        Math.pow(shapePos.x - voidPos.x, 2) +
          Math.pow(shapePos.z - voidPos.z, 2)
      );

      // For shapes below ground level (falling through void), constrain them to stay within void
      // This prevents clipping through the floor when void moves away
      if (shapePos.y < 0 && gameShape.isFalling) {
        // Calculate distance from void center
        const distFromVoid = Math.sqrt(
          Math.pow(shapePos.x - voidPos.x, 2) +
            Math.pow(shapePos.z - voidPos.z, 2)
        );

        // If shape is drifting outside the void radius, snap it back inside
        const maxAllowedDistance = voidRadius * 0.7; // Stay well within void
        if (distFromVoid > maxAllowedDistance) {
          // Calculate direction from shape to void center
          const dirX = voidPos.x - shapePos.x;
          const dirZ = voidPos.z - shapePos.z;
          const dirLen = Math.sqrt(dirX * dirX + dirZ * dirZ);

          if (dirLen > 0.1) {
            // Snap position to be within allowed distance
            const targetX =
              voidPos.x - (dirX / dirLen) * maxAllowedDistance * 0.5;
            const targetZ =
              voidPos.z - (dirZ / dirLen) * maxAllowedDistance * 0.5;

            // Directly set position (teleport) to prevent clipping
            gameShape.body.position.x = targetX;
            gameShape.body.position.z = targetZ;

            // Also set velocity to match void movement direction
            gameShape.body.velocity.x = voidVelocity.x * 10;
            gameShape.body.velocity.z = voidVelocity.z * 10;
          }
        } else {
          // Shape is within void, apply carrying force to keep it moving with void
          const carryStrength = 80;
          const carryForce = new CANNON.Vec3(
            voidVelocity.x * carryStrength,
            0,
            voidVelocity.z * carryStrength
          );
          gameShape.body.applyForce(carryForce);

          // Also directly adjust position to prevent drift
          gameShape.body.position.x += voidVelocity.x * 0.9;
          gameShape.body.position.z += voidVelocity.z * 0.9;
        }
      }

      // Check if magnet powerup is active - attract ALL shapes toward void
      const magnetActive = this.activePowerUps.some((p) => p.type === "magnet");
      if (magnetActive && shapePos.y > 0 && !gameShape.isFalling) {
        // Calculate direction toward void
        const dirToVoid = new CANNON.Vec3(
          voidPos.x - shapePos.x,
          0,
          voidPos.z - shapePos.z
        );
        const distToVoid = Math.sqrt(
          dirToVoid.x * dirToVoid.x + dirToVoid.z * dirToVoid.z
        );

        if (distToVoid > 0.5) {
          // Normalize direction
          dirToVoid.x /= distToVoid;
          dirToVoid.z /= distToVoid;

          // Apply attraction force - stronger when further away
          const magnetStrength = 25;
          const magnetForce = new CANNON.Vec3(
            dirToVoid.x * magnetStrength,
            -5, // Slight downward pull
            dirToVoid.z * magnetStrength
          );
          gameShape.body.applyForce(magnetForce);
        }
      }

      // Apply gravitational pull when shape is within void radius
      // Continue applying force all the way down to create visible falling into abyss
      if (distance < voidRadius) {
        if (!gameShape.isFalling) {
          // First time entering void - check for perfect catch and scoring
          if (shapePos.y < 5) {
            const isPerfectCatch = !gameShape.hasLanded;
            const pos = new THREE.Vector3(shapePos.x, shapePos.y, shapePos.z);

            // Handle power-up
            if (gameShape.isPowerUp && gameShape.powerUpType) {
              this.activatePowerUp(gameShape.powerUpType);
              this.shapeManager.removeShape(gameShape.id);
              this.onStateChange?.();
              continue;
            } else {
              // Regular shapes: score and mark as falling
              this.scoreManager.catchShape(isPerfectCatch, pos);
              gameShape.isFalling = true;
              gameShape.fallingStartTime = Date.now();

              // Create particle effect for perfect catches
              if (isPerfectCatch) {
                this.renderEngine?.createPerfectCatchEffect(pos);
              }

              // Disable ground collision so shape can fall through
              this.physicsEngine?.disableGroundCollisionForBody(gameShape.body);

              // Add damping to reduce spinning and bouncing
              gameShape.body.linearDamping = 0.5;
              gameShape.body.angularDamping = 0.7;
            }
          }
        }

        // Calculate distance-based force scaling (stronger when closer to center)
        const normalizedDistance = Math.min(distance / voidRadius, 1);
        const forceScale = 1 - normalizedDistance; // 1.0 at center, 0.0 at edge

        // Apply gentle downward force (gravitational attraction)
        // Much gentler than before to prevent bouncing
        const baseAttractionStrength = 15; // Reduced from 50
        const downwardForce = baseAttractionStrength * (1 + forceScale);

        // Small inward pull toward center (horizontal)
        const directionToCenter = new CANNON.Vec3(
          voidPos.x - shapePos.x,
          0,
          voidPos.z - shapePos.z
        );
        const centerPullStrength = 3; // Reduced from 10

        // Normalize direction to center
        const centerDistance = Math.sqrt(
          directionToCenter.x * directionToCenter.x +
            directionToCenter.z * directionToCenter.z
        );
        if (centerDistance > 0.1) {
          directionToCenter.x /= centerDistance;
          directionToCenter.z /= centerDistance;
        }

        // Combine forces
        const force = new CANNON.Vec3(
          directionToCenter.x * centerPullStrength * forceScale,
          -downwardForce,
          directionToCenter.z * centerPullStrength * forceScale
        );

        // Apply force at center of mass (not at a specific point) to avoid spinning
        gameShape.body.applyForce(force);
      }

      // Remove shapes that have fallen deep into the void
      // Shapes fall to Y = -25 to create visible sense of depth and abyss
      if (shapePos.y < -25) {
        if (gameShape.isFalling) {
          // Play absorption sound when removing
          this.scoreManager.playAbsorptionSound();
        }
        this.shapeManager.removeShape(gameShape.id);
        this.onStateChange?.();
      }
    }
  }

  private activatePowerUp(
    type: "grow" | "shrink" | "slow" | "fast" | "magnet"
  ): void {
    this.scoreManager.playPowerUpSound(type);

    // Get the appropriate duration based on whether the powerup is positive or negative
    const duration = isPositivePowerUp(type)
      ? POSITIVE_POWER_UP_DURATION
      : POWER_UP_DURATION;

    if (type === "grow") {
      this.voidController?.growVoid(2);
      this.activePowerUps.push({
        type: "grow",
        duration,
        activatedAt: Date.now(),
      });
    } else if (type === "shrink") {
      this.voidController?.shrinkVoid(1.5);
      this.activePowerUps.push({
        type: "shrink",
        duration,
        activatedAt: Date.now(),
      });
    } else if (type === "slow") {
      // Slow down spawn rate (fewer shapes)
      this.shapeManager?.setSpawnRateMultiplier(2.0); // Double the time between spawns
      this.activePowerUps.push({
        type: "slow",
        duration,
        activatedAt: Date.now(),
      });
    } else if (type === "fast") {
      // Speed up spawn rate (more shapes - negative effect)
      this.shapeManager?.setSpawnRateMultiplier(0.5); // Half the time between spawns
      this.activePowerUps.push({
        type: "fast",
        duration,
        activatedAt: Date.now(),
      });
    } else if (type === "magnet") {
      // Attract all shapes toward the void
      this.activePowerUps.push({
        type: "magnet",
        duration,
        activatedAt: Date.now(),
      });
    }
  }

  private updatePowerUps(deltaTime: number): void {
    const now = Date.now();
    const expiredPowerUps: PowerUp[] = [];

    for (const powerUp of this.activePowerUps) {
      if (powerUp.duration && powerUp.activatedAt) {
        if (now - powerUp.activatedAt >= powerUp.duration) {
          expiredPowerUps.push(powerUp);
        }
      }
    }

    // Remove expired power-ups and reverse their effects
    for (const powerUp of expiredPowerUps) {
      if (powerUp.type === "grow" || powerUp.type === "shrink") {
        this.voidController?.resetRadius();
      } else if (powerUp.type === "slow" || powerUp.type === "fast") {
        this.shapeManager?.resetSpawnRateMultiplier();
      }

      const index = this.activePowerUps.indexOf(powerUp);
      if (index > -1) {
        this.activePowerUps.splice(index, 1);
      }
    }
  }

  private checkGameOverCondition(): void {
    if (!this.shapeManager) return;

    const overflowRatio = this.shapeManager.checkOverflow();
    const shapeCount = this.shapeManager.getShapeCount();

    // Game over if too many shapes are piled up
    if (shapeCount > 40 && overflowRatio > 0.5) {
      this.endGame();
    }
  }

  private endGame(): void {
    this._isGameOver = true;
    this.scoreManager.playGameOverSound();
    this.onStateChange?.();
  }

  togglePause(): void {
    this._isPaused = !this._isPaused;
    if (!this._isPaused) {
      this.lastUpdateTime = Date.now();
    }
  }

  reset(): void {
    this._isGameOver = false;
    this._isPaused = false;
    this._elapsed = 0;

    if (this.config.gameMode === "timed") {
      this._timeRemaining = this.config.timedModeDuration;
    }

    // Clear shapes
    this.shapeManager?.clearAllShapes();

    // Reset score
    this.scoreManager.reset();

    // Reset void
    this.voidController?.resetRadius();

    // Clear power-ups
    this.activePowerUps = [];

    this.lastUpdateTime = Date.now();
    this.onStateChange?.();
  }

  getState(): VoidCatcher3DState {
    return {
      score: this.scoreManager.getScore(),
      highScore: this.scoreManager.getHighScore(),
      isGameOver: this._isGameOver,
      isPaused: this._isPaused,
      elapsed: this._elapsed,
      shapeCount: this.shapeManager?.getShapeCount() ?? 0,
      perfectCatchStreak: this.scoreManager.getPerfectCatchStreak(),
      multiplier: this.scoreManager.getMultiplier(),
      voidRadius: this.voidController?.getRadius() ?? this.config.voidRadius,
      timeRemaining: this._timeRemaining,
    };
  }

  getActivePowerUps(): { type: string; progress: number }[] {
    const now = Date.now();
    return this.activePowerUps.map((powerUp) => {
      const elapsed = now - (powerUp.activatedAt ?? now);
      const duration = powerUp.duration ?? POWER_UP_DURATION;
      const progress = Math.max(0, 1 - elapsed / duration);
      return { type: powerUp.type, progress };
    });
  }

  setStateChangeCallback(callback: () => void): void {
    this.onStateChange = callback;
  }

  destroy(): void {
    // Clear intervals
    if (this.difficultyInterval) clearInterval(this.difficultyInterval);
    if (this.animationId) cancelAnimationFrame(this.animationId);

    // Clean up components
    this.voidController?.destroy();
    this.shapeManager?.clearAllShapes();

    // Clean up engines
    this.renderEngine?.dispose();

    // Clear references
    this.renderEngine = null;
    this.physicsEngine = null;
    this.shapeManager = null;
    this.voidController = null;
  }
}
