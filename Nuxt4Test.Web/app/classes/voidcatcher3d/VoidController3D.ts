import * as THREE from "three";
import * as CANNON from "cannon-es";
import type { RenderEngine } from "./RenderEngine";
import type { PhysicsEngine3D } from "./PhysicsEngine3D";

export class VoidController3D {
  private voidMesh: THREE.Mesh;
  private renderEngine: RenderEngine;
  private physicsEngine: PhysicsEngine3D;
  private canvas: HTMLCanvasElement | null = null;
  private camera: THREE.Camera;

  private targetX = 0;
  private targetZ = 0;
  private radius: number;
  private baseRadius: number;

  // Raycaster for mouse position
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private groundPlane: THREE.Plane;

  // Movement smoothing
  private readonly smoothingFactor = 0.15;

  // Velocity tracking for carrying falling shapes
  private velocityX = 0;
  private velocityZ = 0;
  private lastX = 0;
  private lastZ = 0;

  // Particle system
  private particleSystem: THREE.Points | null = null;

  constructor(
    renderEngine: RenderEngine,
    physicsEngine: PhysicsEngine3D,
    radius: number
  ) {
    this.renderEngine = renderEngine;
    this.physicsEngine = physicsEngine;
    this.radius = radius;
    this.baseRadius = radius;
    this.camera = renderEngine.getCamera();

    // Create raycaster for mouse picking
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Create void visual
    this.voidMesh = this.createVoidMesh();
    renderEngine.addToScene(this.voidMesh);

    // Create particle effect
    this.createParticleSystem();
  }

  private createVoidMesh(): THREE.Mesh {
    // Create a group to hold multiple parts of the void
    const voidGroup = new THREE.Group();

    // No need for a shaft mesh - the absence of floor creates the hole effect
    // The dark background visible through the hole in the floor creates the void appearance

    // Create the rim (torus/ring around the hole)
    const rimGeometry = new THREE.TorusGeometry(
      this.radius,
      this.radius * 0.08,
      16,
      32
    );
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x4b0082, // Indigo/purple
      emissive: 0x8b00ff,
      emissiveIntensity: 0.6,
      metalness: 0.5,
      roughness: 0.3,
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.05; // Slightly raised above ground
    voidGroup.add(rim);

    // Wrap group in a mesh-like object for compatibility
    // We'll treat the group as our "mesh"
    return voidGroup as any;
  }

  private createParticleSystem(): void {
    const particleCount = 200; // More particles for better effect
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * this.radius * 0.8; // Keep within hole radius
      positions[i * 3] = Math.cos(angle) * distance;
      positions[i * 3 + 1] = Math.random() * 3; // Particles above hole
      positions[i * 3 + 2] = Math.sin(angle) * distance;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x8b00ff,
      size: 0.2,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.particleSystem.position.y = 0.5; // Just above ground level
    this.renderEngine.addToScene(this.particleSystem);
  }

  setupEventListeners(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    canvas.addEventListener("mousemove", this.handleMouseMove);
    canvas.addEventListener("touchmove", this.handleTouchMove);
    canvas.addEventListener("touchstart", this.handleTouchMove);
  }

  removeEventListeners(): void {
    if (this.canvas) {
      this.canvas.removeEventListener("mousemove", this.handleMouseMove);
      this.canvas.removeEventListener("touchmove", this.handleTouchMove);
      this.canvas.removeEventListener("touchstart", this.handleTouchMove);
    }
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.updateTargetPosition();
  };

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (!this.canvas || e.touches.length === 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

    this.updateTargetPosition();
  };

  private updateTargetPosition(): void {
    // Cast ray from camera through mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Intersect with ground plane
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, intersection);

    if (intersection) {
      this.targetX = intersection.x;
      this.targetZ = intersection.z;
    }
  }

  update(deltaTime: number): void {
    // Smooth movement toward target
    const currentX = this.voidMesh.position.x;
    const currentZ = this.voidMesh.position.z;

    const newX = currentX + (this.targetX - currentX) * this.smoothingFactor;
    const newZ = currentZ + (this.targetZ - currentZ) * this.smoothingFactor;

    // Calculate velocity (change in position)
    this.velocityX = newX - this.lastX;
    this.velocityZ = newZ - this.lastZ;
    this.lastX = newX;
    this.lastZ = newZ;

    // Update void mesh position
    this.voidMesh.position.x = newX;
    this.voidMesh.position.z = newZ;

    // Update light position
    this.renderEngine.updateVoidLightPosition(newX, newZ);

    // Update floor hole position to follow void
    this.renderEngine.updateFloorHolePosition(newX, newZ);

    // Update particles
    if (this.particleSystem) {
      this.particleSystem.position.set(newX, 0.5, newZ);
      this.particleSystem.rotation.y += deltaTime * 0.003; // Rotate for spiral effect

      // Animate particles spiraling downward into the hole
      const positions = this.particleSystem.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];

        // Move down
        positions[i + 1] -= deltaTime * 0.002;

        // Spiral inward as they fall
        const distance = Math.sqrt(x * x + z * z);
        if (distance > 0.1) {
          const angle = Math.atan2(z, x);
          const newAngle = angle + deltaTime * 0.002;
          const newDistance = distance * (1 - deltaTime * 0.0001);
          positions[i] = Math.cos(newAngle) * newDistance;
          positions[i + 2] = Math.sin(newAngle) * newDistance;
        }

        // Reset at top when falling below ground
        if (positions[i + 1] < 0) {
          const resetAngle = Math.random() * Math.PI * 2;
          const resetDistance = Math.random() * this.radius * 0.8;
          positions[i] = Math.cos(resetAngle) * resetDistance;
          positions[i + 1] = 2.5;
          positions[i + 2] = Math.sin(resetAngle) * resetDistance;
        }
      }
      this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }
  }

  getPosition(): { x: number; z: number } {
    return {
      x: this.voidMesh.position.x,
      z: this.voidMesh.position.z,
    };
  }

  getVelocity(): { x: number; z: number } {
    return {
      x: this.velocityX,
      z: this.velocityZ,
    };
  }

  getRadius(): number {
    return this.radius;
  }

  setRadius(newRadius: number): void {
    this.radius = newRadius;

    // Remove old mesh
    this.renderEngine.removeFromScene(this.voidMesh);

    const currentPos = this.voidMesh.position;

    // Dispose old mesh
    if (this.voidMesh.children) {
      this.voidMesh.children.forEach((child: any) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }

    // Create new mesh
    this.voidMesh = this.createVoidMesh();
    this.voidMesh.position.copy(currentPos);
    this.renderEngine.addToScene(this.voidMesh);

    // Update floor hole to match new void size
    this.renderEngine.updateFloorHole(newRadius);
  }

  growVoid(amount: number): void {
    this.setRadius(Math.min(this.radius + amount, this.baseRadius * 2));
  }

  shrinkVoid(amount: number): void {
    this.setRadius(Math.max(this.radius - amount, this.baseRadius * 0.5));
  }

  resetRadius(): void {
    this.setRadius(this.baseRadius);
  }

  destroy(): void {
    this.removeEventListeners();
    this.renderEngine.removeFromScene(this.voidMesh);

    if (this.particleSystem) {
      this.renderEngine.removeFromScene(this.particleSystem);
      this.particleSystem.geometry.dispose();
      (this.particleSystem.material as THREE.Material).dispose();
    }

    // Dispose void mesh and its children
    if (this.voidMesh.children) {
      this.voidMesh.children.forEach((child: any) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
  }
}
