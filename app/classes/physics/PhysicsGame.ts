import Matter from "matter-js";
import type { PhysicsConfig, PhysicsState, DropRate } from "./types";
import { DROP_INTERVALS } from "./types";
import { ShapeFactory } from "./ShapeFactory";
import { ShapeTracker } from "./ShapeTracker";

export class PhysicsGame {
  private engine: Matter.Engine | null = null;
  private render: Matter.Render | null = null;
  private runner: Matter.Runner | null = null;
  private world: Matter.World | null = null;
  private canvas: HTMLCanvasElement | null = null;

  private readonly shapeFactory: ShapeFactory;
  private readonly shapeTracker: ShapeTracker;

  private dropInterval: ReturnType<typeof setInterval> | null = null;
  private removeInterval: ReturnType<typeof setInterval> | null = null;
  private elapsedInterval: ReturnType<typeof setInterval> | null = null;

  private _elapsed = 0;
  private _isPaused = false;
  private _dropRate: DropRate = "medium";
  private _shapeLifetimeSeconds = 15;

  private readonly config: PhysicsConfig;

  // Callback for state changes
  private onStateChange: (() => void) | null = null;

  constructor(config?: Partial<PhysicsConfig>) {
    this.config = {
      canvasWidth: config?.canvasWidth ?? 500,
      canvasHeight: config?.canvasHeight ?? 600,
      wallThickness: config?.wallThickness ?? 20,
      shapeLifetimeSeconds: config?.shapeLifetimeSeconds ?? 15,
      dropRate: config?.dropRate ?? "medium",
    };

    this._shapeLifetimeSeconds = this.config.shapeLifetimeSeconds;
    this._dropRate = this.config.dropRate;

    this.shapeFactory = new ShapeFactory();
    this.shapeTracker = new ShapeTracker();
  }

  setup(canvas: HTMLCanvasElement, container: HTMLElement): void {
    this.canvas = canvas;

    // Create engine
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;

    // Create renderer
    this.render = Matter.Render.create({
      element: container,
      canvas: canvas,
      engine: this.engine,
      options: {
        width: this.config.canvasWidth,
        height: this.config.canvasHeight,
        wireframes: false,
        background: "#1a1a2e",
      },
    });

    // Add custom gradient rendering
    Matter.Events.on(this.render, "afterRender", () => {
      this.renderGradients();
    });

    this.createWalls();

    // Create runner
    this.runner = Matter.Runner.create();
    Matter.Runner.run(this.runner, this.engine);

    // Start renderer
    Matter.Render.run(this.render);

    // Start dropping shapes
    this.startDropping();

    // Check for expired shapes every 500ms
    this.removeInterval = setInterval(() => this.removeExpiredShapes(), 500);

    // Track elapsed time
    this.elapsedInterval = setInterval(() => {
      if (!this._isPaused) {
        this._elapsed += 0.1;
        this.notifyStateChange();
      }
    }, 100);
  }

  private createWalls(): void {
    if (!this.world) return;

    const { canvasWidth, canvasHeight, wallThickness } = this.config;

    const wallOptions = {
      isStatic: true,
      render: { fillStyle: "#16213e" },
    };

    // Ground
    const ground = Matter.Bodies.rectangle(
      canvasWidth / 2,
      canvasHeight - wallThickness / 2,
      canvasWidth,
      wallThickness,
      wallOptions
    );

    // Left wall
    const leftWall = Matter.Bodies.rectangle(
      wallThickness / 2,
      canvasHeight / 2,
      wallThickness,
      canvasHeight,
      wallOptions
    );

    // Right wall
    const rightWall = Matter.Bodies.rectangle(
      canvasWidth - wallThickness / 2,
      canvasHeight / 2,
      wallThickness,
      canvasHeight,
      wallOptions
    );

    Matter.Composite.add(this.world, [ground, leftWall, rightWall]);
  }

  private renderGradients(): void {
    if (!this.canvas || !this.world) return;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    const bodies = Matter.Composite.allBodies(this.world);

    for (const body of bodies) {
      if (body.isStatic) continue;

      const gradientColors = (
        body as Matter.Body & {
          gradientColors?: { primary: string; secondary: string };
        }
      ).gradientColors;
      if (!gradientColors) continue;

      const { primary, secondary } = gradientColors;
      const bounds = body.bounds;
      const centerX = (bounds.min.x + bounds.max.x) / 2;
      const centerY = (bounds.min.y + bounds.max.y) / 2;
      const radius =
        Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y) / 2;

      // Create radial gradient from center
      const gradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        0,
        centerX,
        centerY,
        radius * 1.2
      );
      gradient.addColorStop(0, secondary);
      gradient.addColorStop(0.7, primary);
      gradient.addColorStop(1, this.darkenColor(primary, 30));

      // Draw the shape with gradient
      ctx.save();
      ctx.beginPath();
      const vertices = body.vertices;
      if (vertices.length === 0) {
        ctx.restore();
        continue;
      }
      ctx.moveTo(vertices[0]!.x, vertices[0]!.y);
      for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i]!.x, vertices[i]!.y);
      }
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add subtle border
      ctx.strokeStyle = this.darkenColor(primary, 40);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
    const B = Math.max((num & 0x0000ff) - amt, 0);
    return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  }

  dropShape(): void {
    if (!this.world || this._isPaused) return;

    const { canvasWidth, wallThickness } = this.config;
    const x =
      wallThickness +
      30 +
      Math.random() * (canvasWidth - wallThickness * 2 - 60);
    const y = -30;

    const shape = this.shapeFactory.createRandomShape(x, y);
    Matter.Composite.add(this.world, shape);
    this.shapeTracker.add(shape);
    this.notifyStateChange();
  }

  private removeExpiredShapes(): void {
    if (!this.world || this._isPaused) return;

    const lifetimeMs = this._shapeLifetimeSeconds * 1000;
    const expired = this.shapeTracker.getExpired(lifetimeMs);

    for (const body of expired) {
      Matter.Composite.remove(this.world, body);
    }

    if (expired.length > 0) {
      this.notifyStateChange();
    }
  }

  removeShapeAtPosition(x: number, y: number): boolean {
    if (!this.world) return false;

    const mousePosition = { x, y };

    const bodies = Matter.Composite.allBodies(this.world);
    for (const body of bodies) {
      if (body.isStatic) continue;

      if (Matter.Bounds.contains(body.bounds, mousePosition)) {
        if (Matter.Vertices.contains(body.vertices, mousePosition)) {
          Matter.Composite.remove(this.world, body);
          this.shapeTracker.remove(body);
          this.notifyStateChange();
          return true;
        }
      }
    }

    return false;
  }

  private startDropping(): void {
    if (this.dropInterval) clearInterval(this.dropInterval);
    this.dropInterval = setInterval(
      () => this.dropShape(),
      DROP_INTERVALS[this._dropRate]
    );
  }

  togglePause(): void {
    this._isPaused = !this._isPaused;

    if (this._isPaused) {
      if (this.runner) Matter.Runner.stop(this.runner);
      if (this.dropInterval) clearInterval(this.dropInterval);
    } else {
      if (this.runner && this.engine) {
        Matter.Runner.run(this.runner, this.engine);
      }
      this.startDropping();
    }

    this.notifyStateChange();
  }

  reset(): void {
    if (this.world) {
      const bodies = Matter.Composite.allBodies(this.world).filter(
        (body) => !body.isStatic
      );
      for (const body of bodies) {
        Matter.Composite.remove(this.world, body);
      }
    }

    this.shapeTracker.clear();
    this._elapsed = 0;
    this._isPaused = false;

    if (this.runner && this.engine) {
      Matter.Runner.run(this.runner, this.engine);
    }
    this.startDropping();
    this.notifyStateChange();
  }

  cleanup(): void {
    if (this.dropInterval) clearInterval(this.dropInterval);
    if (this.removeInterval) clearInterval(this.removeInterval);
    if (this.elapsedInterval) clearInterval(this.elapsedInterval);

    if (this.render) {
      Matter.Render.stop(this.render);
    }
    if (this.runner) {
      Matter.Runner.stop(this.runner);
    }
    if (this.engine) {
      Matter.Engine.clear(this.engine);
    }
  }

  // Setters for configurable options
  set dropRate(rate: DropRate) {
    this._dropRate = rate;
    if (!this._isPaused) {
      this.startDropping();
    }
  }

  get dropRate(): DropRate {
    return this._dropRate;
  }

  set shapeLifetimeSeconds(seconds: number) {
    this._shapeLifetimeSeconds = seconds;
  }

  get shapeLifetimeSeconds(): number {
    return this._shapeLifetimeSeconds;
  }

  // Getters for state
  get state(): PhysicsState {
    return {
      shapeCount: this.shapeCount,
      elapsed: this._elapsed,
      isPaused: this._isPaused,
    };
  }

  get shapeCount(): number {
    if (!this.world) return 0;
    return Matter.Composite.allBodies(this.world).filter(
      (body) => !body.isStatic
    ).length;
  }

  get elapsed(): number {
    return this._elapsed;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get canvasWidth(): number {
    return this.config.canvasWidth;
  }

  get canvasHeight(): number {
    return this.config.canvasHeight;
  }

  // State change callback
  setOnStateChange(callback: () => void): void {
    this.onStateChange = callback;
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }
}
