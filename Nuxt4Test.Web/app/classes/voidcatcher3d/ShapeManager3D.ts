import * as THREE from "three";
import * as CANNON from "cannon-es";
import type { GameShape3D, ShapeType3D, PowerUpType } from "./types";
import { SHAPE_TYPES_3D, LANDING_VELOCITY_THRESHOLD } from "./types";
import type { PhysicsEngine3D } from "./PhysicsEngine3D";
import { PhysicsEngine3D as PhysicsEngine3DClass } from "./PhysicsEngine3D";
import type { RenderEngine } from "./RenderEngine";

export class ShapeManager3D {
  private shapes: Map<string, GameShape3D> = new Map();
  private physicsEngine: PhysicsEngine3D;
  private renderEngine: RenderEngine;
  private playAreaSize: number;
  private nextShapeId = 0;
  private spawnRate: number;
  private lastSpawnTime = 0;
  private difficultyLevel = 1;

  // Colors for shapes
  private readonly shapeColors = [
    0xff6b6b, // red
    0x4ecdc4, // teal
    0x45b7d1, // blue
    0xffa07a, // orange
    0x98d8c8, // mint
    0xf7dc6f, // yellow
    0xbb8fce, // purple
  ];

  // Powerup colors - positive powerups are inviting colors, negative are red
  private readonly powerUpColors: Record<
    string,
    { color: number; emissive: number }
  > = {
    grow: { color: 0x00ff88, emissive: 0x00aa55 }, // Green - positive
    shrink: { color: 0xff3333, emissive: 0xaa0000 }, // Red - negative
    slow: { color: 0x4488ff, emissive: 0x2255aa }, // Blue - positive
    fast: { color: 0xff4444, emissive: 0xcc0000 }, // Red - negative
    magnet: { color: 0x00ffff, emissive: 0x00aaaa }, // Cyan - positive
  };
  private readonly defaultPowerUpColor = {
    color: 0xffd700,
    emissive: 0xffaa00,
  };

  constructor(
    physicsEngine: PhysicsEngine3D,
    renderEngine: RenderEngine,
    playAreaSize: number,
    initialSpawnRate: number
  ) {
    this.physicsEngine = physicsEngine;
    this.renderEngine = renderEngine;
    this.playAreaSize = playAreaSize;
    this.spawnRate = initialSpawnRate;
  }

  update(deltaTime: number): void {
    this.lastSpawnTime += deltaTime;

    // Spawn shapes based on effective spawn rate (affected by powerups)
    const effectiveSpawnRate = this.spawnRate * this.spawnRateMultiplier;
    if (this.lastSpawnTime >= effectiveSpawnRate) {
      this.spawnShape();
      this.lastSpawnTime = 0;
    }

    // Update mesh positions from physics bodies & check landing status
    for (const shape of this.shapes.values()) {
      // Sync mesh with physics body
      shape.mesh.position.copy(shape.body.position as any);
      shape.mesh.quaternion.copy(shape.body.quaternion as any);

      // Shrink shapes as they fall into the void (below ground level)
      if (shape.body.position.y < 0) {
        // Calculate scale based on depth - shrink quickly as it falls
        // At y=0: scale=1, at y=-25: scale approaches 0
        const depth = -shape.body.position.y;
        const maxDepth = 25;
        const shrinkFactor = Math.max(0.05, 1 - (depth / maxDepth) * 1.5); // Shrink faster with 1.5x multiplier
        shape.mesh.scale.setScalar(shrinkFactor);
      } else {
        // Reset scale when above ground
        shape.mesh.scale.setScalar(1);
      }

      // Check if shape has landed
      if (
        !shape.hasLanded &&
        shape.body.velocity.length() < LANDING_VELOCITY_THRESHOLD
      ) {
        shape.hasLanded = true;
      }

      // Rotate power-ups for visual effect
      if (shape.isPowerUp) {
        shape.mesh.rotation.y += deltaTime * 0.002;
      }
    }
  }

  spawnShape(forcePowerUp = false): void {
    // 5% chance of spawning a power-up
    const isPowerUp = forcePowerUp || Math.random() < 0.05;
    const powerUpType = isPowerUp ? this.getRandomPowerUpType() : undefined;

    const shapeType = this.getRandomShapeType();
    const size = this.getRandomSize();

    // Spawn from edge of play area at random angle
    const angle = Math.random() * Math.PI * 2;
    const spawnDistance = this.playAreaSize * 0.9;
    const x = Math.cos(angle) * spawnDistance;
    const z = Math.sin(angle) * spawnDistance;
    const y = 50 + Math.random() * 20; // Spawn above the play area

    // Create mesh and physics body based on shape type
    const { mesh, body } = this.createShapeMeshAndBody(
      shapeType,
      size,
      x,
      y,
      z,
      isPowerUp,
      powerUpType
    );

    const id = `shape3d-${this.nextShapeId++}`;

    const gameShape: GameShape3D = {
      mesh,
      body,
      id,
      createdAt: Date.now(),
      caughtInAir: false,
      isPowerUp,
      powerUpType,
      hasLanded: false,
      isFalling: false,
    };

    this.shapes.set(id, gameShape);
    this.physicsEngine.addBody(body);
    this.renderEngine.addToScene(mesh);

    // Add initial velocity toward center
    const directionToCenter = new CANNON.Vec3(-x, -5, -z).unit();
    const speed = 5 + Math.random() * 5;
    body.velocity.set(
      directionToCenter.x * speed,
      directionToCenter.y * speed,
      directionToCenter.z * speed
    );

    // Add random angular velocity for tumbling
    body.angularVelocity.set(
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 5
    );
  }

  private createShapeMeshAndBody(
    type: ShapeType3D,
    size: number,
    x: number,
    y: number,
    z: number,
    isPowerUp: boolean,
    powerUpType?: PowerUpType
  ): { mesh: THREE.Mesh; body: CANNON.Body } {
    let geometry: THREE.BufferGeometry;
    let shape: CANNON.Shape;

    // Get color based on powerup type or random for regular shapes
    let color: number;
    let emissiveColor: number;
    if (isPowerUp && powerUpType) {
      const powerUpStyle =
        this.powerUpColors[powerUpType] || this.defaultPowerUpColor;
      color = powerUpStyle.color;
      emissiveColor = powerUpStyle.emissive;
    } else {
      color = this.getRandomColor();
      emissiveColor = 0x000000;
    }

    switch (type) {
      case "sphere":
        geometry = new THREE.SphereGeometry(size, 16, 16);
        shape = new CANNON.Sphere(size);
        break;

      case "box":
        geometry = new THREE.BoxGeometry(size, size, size);
        shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
        break;

      case "cylinder":
        geometry = new THREE.CylinderGeometry(
          size * 0.7,
          size * 0.7,
          size * 1.5,
          16
        );
        shape = new CANNON.Cylinder(size * 0.7, size * 0.7, size * 1.5, 8);
        break;

      case "cone":
        geometry = new THREE.ConeGeometry(size, size * 1.5, 16);
        shape = new CANNON.Cylinder(0, size, size * 1.5, 8);
        break;

      case "tetrahedron":
        geometry = new THREE.TetrahedronGeometry(size);
        shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2)); // Approximate
        break;

      case "octahedron":
        geometry = new THREE.OctahedronGeometry(size);
        shape = new CANNON.Sphere(size); // Approximate with sphere
        break;

      default:
        geometry = new THREE.BoxGeometry(size, size, size);
        shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
    }

    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: isPowerUp ? 0.2 : 0.5,
      metalness: isPowerUp ? 0.8 : 0.3,
      emissive: emissiveColor,
      emissiveIntensity: isPowerUp ? 0.7 : 0, // Stronger glow for powerups
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(x, y, z);

    const body = new CANNON.Body({
      mass: size * 0.5, // Mass based on size
      shape: shape,
      position: new CANNON.Vec3(x, y, z),
      material: new CANNON.Material({ friction: 0.3, restitution: 0.6 }),
      collisionFilterGroup: PhysicsEngine3DClass.GROUP_SHAPES,
      collisionFilterMask:
        PhysicsEngine3DClass.GROUP_GROUND |
        PhysicsEngine3DClass.GROUP_SHAPES |
        PhysicsEngine3DClass.GROUP_WALLS,
    });

    return { mesh, body };
  }

  removeShape(id: string): GameShape3D | undefined {
    const shape = this.shapes.get(id);
    if (shape) {
      this.physicsEngine.removeBody(shape.body);
      this.renderEngine.removeFromScene(shape.mesh);
      shape.mesh.geometry.dispose();
      (shape.mesh.material as THREE.Material).dispose();
      this.shapes.delete(id);
    }
    return shape;
  }

  getShape(id: string): GameShape3D | undefined {
    return this.shapes.get(id);
  }

  getAllShapes(): GameShape3D[] {
    return Array.from(this.shapes.values());
  }

  getShapeCount(): number {
    return this.shapes.size;
  }

  clearAllShapes(): void {
    for (const shape of this.shapes.values()) {
      this.physicsEngine.removeBody(shape.body);
      this.renderEngine.removeFromScene(shape.mesh);
      shape.mesh.geometry.dispose();
      (shape.mesh.material as THREE.Material).dispose();
    }
    this.shapes.clear();
  }

  // Spawn rate modifiers for powerups
  private baseSpawnRate: number = this.spawnRate;
  private spawnRateMultiplier: number = 1;

  setSpawnRateMultiplier(multiplier: number): void {
    this.spawnRateMultiplier = multiplier;
  }

  resetSpawnRateMultiplier(): void {
    this.spawnRateMultiplier = 1;
  }

  getEffectiveSpawnRate(): number {
    return this.spawnRate * this.spawnRateMultiplier;
  }

  increaseDifficulty(): void {
    this.difficultyLevel++;
    // Decrease spawn rate (spawn faster)
    this.spawnRate = Math.max(300, this.spawnRate * 0.92);
  }

  getDifficultyLevel(): number {
    return this.difficultyLevel;
  }

  checkOverflow(): number {
    // Count shapes that are piled up (low y velocity and high position)
    let overflowCount = 0;

    for (const shape of this.shapes.values()) {
      if (
        shape.body.position.y > 5 &&
        shape.body.velocity.length() < LANDING_VELOCITY_THRESHOLD * 2
      ) {
        overflowCount++;
      }
    }

    return overflowCount / Math.max(1, this.shapes.size);
  }

  private getRandomShapeType(): ShapeType3D {
    return SHAPE_TYPES_3D[Math.floor(Math.random() * SHAPE_TYPES_3D.length)];
  }

  private getRandomSize(): number {
    // Size ranges from 2 to 4 units
    return 2 + Math.random() * 2;
  }

  private getRandomColor(): number {
    return this.shapeColors[
      Math.floor(Math.random() * this.shapeColors.length)
    ];
  }

  private getRandomPowerUpType(): PowerUpType {
    // Positive powerups appear more frequently (approximately 2:1 ratio)
    // Positive: grow, slow, magnet (each appears twice in pool)
    // Negative: shrink, fast (each appears once in pool)
    const types: PowerUpType[] = [
      "grow",
      "grow", // positive - more common
      "slow",
      "slow", // positive - more common
      "magnet",
      "magnet", // positive - more common
      "shrink", // negative - less common
      "fast", // negative - less common
    ];
    return types[Math.floor(Math.random() * types.length)];
  }
}
