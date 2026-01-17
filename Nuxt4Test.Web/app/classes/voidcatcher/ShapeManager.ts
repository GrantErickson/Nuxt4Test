import Matter from "matter-js";
import type { GameShape, ShapeType, PowerUpType } from "./types";
import { SHAPE_TYPES } from "./types";

export class ShapeManager {
  private shapes: Map<string, GameShape> = new Map();
  private world: Matter.World;
  private canvasWidth: number;
  private canvasHeight: number;
  private nextShapeId = 0;
  private spawnRate: number;
  private lastSpawnTime = 0;
  private difficultyLevel = 1;

  // Colors for shapes
  private readonly shapeColors = [
    "#FF6B6B", // red
    "#4ECDC4", // teal
    "#45B7D1", // blue
    "#FFA07A", // orange
    "#98D8C8", // mint
    "#F7DC6F", // yellow
    "#BB8FCE", // purple
  ];

  private readonly powerUpColor = "#FFD700"; // gold

  constructor(
    world: Matter.World,
    canvasWidth: number,
    canvasHeight: number,
    initialSpawnRate: number
  ) {
    this.world = world;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.spawnRate = initialSpawnRate;
  }

  update(deltaTime: number): void {
    this.lastSpawnTime += deltaTime;

    // Spawn shapes based on spawn rate
    if (this.lastSpawnTime >= this.spawnRate) {
      this.spawnShape();
      this.lastSpawnTime = 0;
    }
  }

  spawnShape(forcePowerUp = false): void {
    // 5% chance of spawning a power-up
    const isPowerUp = forcePowerUp || Math.random() < 0.05;

    const shapeType = this.getRandomShapeType();
    const size = this.getRandomSize();
    const x = this.getRandomX(size);
    const y = -50; // Start above the screen

    let body: Matter.Body;

    if (shapeType === "circle") {
      body = Matter.Bodies.circle(x, y, size, {
        restitution: 0.6,
        friction: 0.3,
        density: 0.001,
        render: {
          fillStyle: isPowerUp ? this.powerUpColor : this.getRandomColor(),
        },
      });
    } else if (shapeType === "rectangle") {
      const width = size * 1.5;
      const height = size;
      body = Matter.Bodies.rectangle(x, y, width, height, {
        restitution: 0.6,
        friction: 0.3,
        density: 0.001,
        render: {
          fillStyle: isPowerUp ? this.powerUpColor : this.getRandomColor(),
        },
      });
    } else if (shapeType === "pentagon") {
      body = Matter.Bodies.polygon(x, y, 5, size, {
        restitution: 0.6,
        friction: 0.3,
        density: 0.001,
        render: {
          fillStyle: isPowerUp ? this.powerUpColor : this.getRandomColor(),
        },
      });
    } else if (shapeType === "hexagon") {
      body = Matter.Bodies.polygon(x, y, 6, size, {
        restitution: 0.6,
        friction: 0.3,
        density: 0.001,
        render: {
          fillStyle: isPowerUp ? this.powerUpColor : this.getRandomColor(),
        },
      });
    } else {
      // triangle
      body = Matter.Bodies.polygon(x, y, 3, size, {
        restitution: 0.6,
        friction: 0.3,
        density: 0.001,
        render: {
          fillStyle: isPowerUp ? this.powerUpColor : this.getRandomColor(),
        },
      });
    }

    const id = `shape-${this.nextShapeId++}`;

    const gameShape: GameShape = {
      body,
      id,
      createdAt: Date.now(),
      caughtInAir: false,
      isPowerUp,
      powerUpType: isPowerUp ? this.getRandomPowerUpType() : undefined,
    };

    this.shapes.set(id, gameShape);
    Matter.World.add(this.world, body);
  }

  removeShape(id: string): GameShape | undefined {
    const shape = this.shapes.get(id);
    if (shape) {
      Matter.World.remove(this.world, shape.body);
      this.shapes.delete(id);
    }
    return shape;
  }

  getShape(id: string): GameShape | undefined {
    return this.shapes.get(id);
  }

  getAllShapes(): GameShape[] {
    return Array.from(this.shapes.values());
  }

  getShapeCount(): number {
    return this.shapes.size;
  }

  clearAllShapes(): void {
    for (const shape of this.shapes.values()) {
      Matter.World.remove(this.world, shape.body);
    }
    this.shapes.clear();
  }

  increaseDifficulty(): void {
    this.difficultyLevel++;
    // Decrease spawn rate (spawn faster)
    this.spawnRate = Math.max(300, this.spawnRate * 0.95);
  }

  getDifficultyLevel(): number {
    return this.difficultyLevel;
  }

  checkScreenDensity(canvasHeight: number): number {
    // Calculate what percentage of shapes are in the lower half of screen
    let shapesInLowerHalf = 0;

    for (const shape of this.shapes.values()) {
      if (shape.body.position.y > canvasHeight / 2) {
        shapesInLowerHalf++;
      }
    }

    return this.shapes.size > 0 ? shapesInLowerHalf / this.shapes.size : 0;
  }

  private getRandomShapeType(): ShapeType {
    return SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
  }

  private getRandomSize(): number {
    // Size ranges from 15 to 35 pixels
    return 15 + Math.random() * 20;
  }

  private getRandomX(size: number): number {
    // Ensure shape spawns fully within the canvas
    const margin = size + 20; // 20 for wall thickness
    return margin + Math.random() * (this.canvasWidth - 2 * margin);
  }

  private getRandomColor(): string {
    return this.shapeColors[
      Math.floor(Math.random() * this.shapeColors.length)
    ];
  }

  private getRandomPowerUpType(): PowerUpType {
    const types: PowerUpType[] = ["grow", "shrink", "slow", "clear"];
    return types[Math.floor(Math.random() * types.length)];
  }
}
