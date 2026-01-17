import Matter from "matter-js";
import type {
  VoidCatcherConfig,
  VoidCatcherState,
  PowerUp,
  GameMode,
} from "./types";
import { POWER_UP_DURATION } from "./types";
import { ShapeManager } from "./ShapeManager";
import { VoidController } from "./VoidController";
import { ScoreManager } from "./ScoreManager";

export class VoidCatcherGame {
  private engine: Matter.Engine | null = null;
  private render: Matter.Render | null = null;
  private runner: Matter.Runner | null = null;
  private world: Matter.World | null = null;
  private canvas: HTMLCanvasElement | null = null;

  private shapeManager: ShapeManager | null = null;
  private voidController: VoidController | null = null;
  private scoreManager: ScoreManager;

  private config: VoidCatcherConfig;
  private activePowerUps: PowerUp[] = [];

  private _isGameOver = false;
  private _isPaused = false;
  private _elapsed = 0;
  private _timeRemaining: number | undefined;

  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private difficultyInterval: ReturnType<typeof setInterval> | null = null;
  private lastUpdateTime = Date.now();

  private onStateChange: (() => void) | null = null;

  constructor(config?: Partial<VoidCatcherConfig>) {
    this.config = {
      canvasWidth: config?.canvasWidth ?? 600,
      canvasHeight: config?.canvasHeight ?? 700,
      wallThickness: config?.wallThickness ?? 20,
      voidRadius: config?.voidRadius ?? 40,
      initialSpawnRate: config?.initialSpawnRate ?? 1000, // milliseconds
      gameMode: config?.gameMode ?? "endless",
      timedModeDuration: config?.timedModeDuration ?? 120, // 2 minutes
    };

    if (this.config.gameMode === "timed") {
      this._timeRemaining = this.config.timedModeDuration;
    }

    this.scoreManager = new ScoreManager();
  }

  setup(canvas: HTMLCanvasElement, container: HTMLElement): void {
    this.canvas = canvas;

    // Create engine
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.world.gravity.y = 1; // Normal gravity

    // Create renderer
    this.render = Matter.Render.create({
      element: container,
      canvas: canvas,
      engine: this.engine,
      options: {
        width: this.config.canvasWidth,
        height: this.config.canvasHeight,
        wireframes: false,
        background: "#0F0F23",
      },
    });

    // Add custom rendering for void portal effect
    Matter.Events.on(this.render, "afterRender", () => {
      this.renderVoidEffect();
    });

    this.createWalls();

    // Initialize managers
    this.shapeManager = new ShapeManager(
      this.world,
      this.config.canvasWidth,
      this.config.canvasHeight,
      this.config.initialSpawnRate
    );

    this.voidController = new VoidController(
      this.world,
      this.config.canvasWidth,
      this.config.canvasHeight,
      this.config.voidRadius
    );

    this.voidController.setupEventListeners(canvas);

    // Create runner
    this.runner = Matter.Runner.create();
    Matter.Runner.run(this.runner, this.engine);

    // Start renderer
    Matter.Render.run(this.render);

    // Set up collision detection
    Matter.Events.on(this.engine, "collisionStart", (event) => {
      this.handleCollisions(event.pairs);
    });

    // Start game loop
    this.startGameLoop();

    // Increase difficulty over time
    this.difficultyInterval = setInterval(() => {
      if (!this._isPaused && !this._isGameOver) {
        this.shapeManager?.increaseDifficulty();
      }
    }, 10000); // Every 10 seconds
  }

  private createWalls(): void {
    if (!this.world) return;

    const wallOptions = {
      isStatic: true,
      render: { fillStyle: "#2A2A3E" },
    };

    const thickness = this.config.wallThickness;
    const width = this.config.canvasWidth;
    const height = this.config.canvasHeight;

    // Left wall
    const leftWall = Matter.Bodies.rectangle(
      thickness / 2,
      height / 2,
      thickness,
      height,
      wallOptions
    );

    // Right wall
    const rightWall = Matter.Bodies.rectangle(
      width - thickness / 2,
      height / 2,
      thickness,
      height,
      wallOptions
    );

    // Bottom wall
    const bottomWall = Matter.Bodies.rectangle(
      width / 2,
      height - thickness / 2,
      width,
      thickness,
      wallOptions
    );

    Matter.World.add(this.world, [leftWall, rightWall, bottomWall]);
  }

  private startGameLoop(): void {
    this.updateInterval = setInterval(() => {
      if (this._isPaused || this._isGameOver) return;

      const now = Date.now();
      const deltaTime = now - this.lastUpdateTime;
      this.lastUpdateTime = now;

      this.update(deltaTime);
    }, 16); // ~60 FPS
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
      }
    }

    // Update shape spawning
    this.shapeManager?.update(deltaTime);

    // Update void position
    this.voidController?.update();

    // Update score manager
    this.scoreManager.update(deltaTime);

    // Update power-ups
    this.updatePowerUps(deltaTime);

    // Check for game over condition (endless mode only)
    if (this.config.gameMode === "endless") {
      this.checkGameOverCondition();
    }

    // Notify state change
    this.onStateChange?.();
  }

  private handleCollisions(pairs: Matter.IPair[]): void {
    if (!this.voidController || !this.shapeManager) return;

    const voidBody = this.voidController.getBody();

    for (const pair of pairs) {
      const { bodyA, bodyB } = pair;

      // Check if one of the bodies is the void
      if (bodyA === voidBody || bodyB === voidBody) {
        const shapeBody = bodyA === voidBody ? bodyB : bodyA;

        // Find the shape in our shape manager
        const shapes = this.shapeManager.getAllShapes();
        const gameShape = shapes.find((s) => s.body === shapeBody);

        if (gameShape) {
          // Check if it's a perfect catch (shape is still falling)
          const isPerfectCatch =
            shapeBody.velocity.y > 0.5 && !gameShape.caughtInAir;

          // Mark as caught
          gameShape.caughtInAir = true;

          // Get position for score popup
          const pos = this.voidController.getPosition();

          // Handle power-up
          if (gameShape.isPowerUp && gameShape.powerUpType) {
            this.activatePowerUp(gameShape.powerUpType);
          } else {
            // Regular scoring
            this.scoreManager.catchShape(isPerfectCatch, pos.x, pos.y);
          }

          // Remove the shape
          this.shapeManager.removeShape(gameShape.id);

          // Notify state change
          this.onStateChange?.();
        }
      }
    }
  }

  private activatePowerUp(type: "grow" | "shrink" | "slow" | "clear"): void {
    this.scoreManager.playPowerUpSound(type);

    if (type === "clear") {
      // Immediate effect: clear all shapes
      this.shapeManager?.clearAllShapes();
      this.scoreManager.playClearSound();
    } else if (type === "grow") {
      this.voidController?.growVoid(15);
      this.activePowerUps.push({
        type: "grow",
        duration: POWER_UP_DURATION,
        activatedAt: Date.now(),
      });
    } else if (type === "shrink") {
      this.voidController?.shrinkVoid(10);
      this.activePowerUps.push({
        type: "shrink",
        duration: POWER_UP_DURATION,
        activatedAt: Date.now(),
      });
    } else if (type === "slow") {
      if (this.engine) {
        this.engine.timing.timeScale = 0.5;
      }
      this.activePowerUps.push({
        type: "slow",
        duration: POWER_UP_DURATION,
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
      } else if (powerUp.type === "slow") {
        if (this.engine) {
          this.engine.timing.timeScale = 1;
        }
      }

      const index = this.activePowerUps.indexOf(powerUp);
      if (index > -1) {
        this.activePowerUps.splice(index, 1);
      }
    }
  }

  private checkGameOverCondition(): void {
    if (!this.shapeManager) return;

    const density = this.shapeManager.checkScreenDensity(
      this.config.canvasHeight
    );
    const shapeCount = this.shapeManager.getShapeCount();

    // Game over if too many shapes and high density in lower screen
    if (shapeCount > 30 && density > 0.7) {
      this.endGame();
    }
  }

  private endGame(): void {
    this._isGameOver = true;
    this.scoreManager.playGameOverSound();
    this.onStateChange?.();
  }

  private renderVoidEffect(): void {
    if (!this.render?.context || !this.voidController) return;

    const ctx = this.render.context;
    const pos = this.voidController.getPosition();
    const radius = this.voidController.getRadius();

    // Draw swirling void effect
    const gradient = ctx.createRadialGradient(
      pos.x,
      pos.y,
      0,
      pos.x,
      pos.y,
      radius
    );
    gradient.addColorStop(0, "#000000");
    gradient.addColorStop(0.6, "#1a0033");
    gradient.addColorStop(1, "#8B00FF");

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Add rotating spiral effect
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate((this._elapsed * 2) % (Math.PI * 2));

    ctx.strokeStyle = "rgba(139, 0, 255, 0.3)";
    ctx.lineWidth = 2;

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const angle = (i * Math.PI * 2) / 3;
      ctx.moveTo(
        Math.cos(angle) * radius * 0.2,
        Math.sin(angle) * radius * 0.2
      );
      ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      ctx.stroke();
    }

    ctx.restore();
  }

  togglePause(): void {
    this._isPaused = !this._isPaused;
    if (this.runner) {
      this.runner.enabled = !this._isPaused;
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
    if (this.engine) {
      this.engine.timing.timeScale = 1;
    }

    this.lastUpdateTime = Date.now();
    this.onStateChange?.();
  }

  getState(): VoidCatcherState {
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

  setStateChangeCallback(callback: () => void): void {
    this.onStateChange = callback;
  }

  destroy(): void {
    // Clear intervals
    if (this.updateInterval) clearInterval(this.updateInterval);
    if (this.difficultyInterval) clearInterval(this.difficultyInterval);

    // Clean up void controller
    this.voidController?.destroy();

    // Stop engine
    if (this.runner) {
      Matter.Runner.stop(this.runner);
    }

    // Clear world
    if (this.world) {
      Matter.World.clear(this.world, false);
    }

    // Clear engine
    if (this.engine) {
      Matter.Engine.clear(this.engine);
    }

    // Stop render
    if (this.render) {
      Matter.Render.stop(this.render);
    }
  }
}
