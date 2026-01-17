import * as THREE from "three";

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class RenderEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private playAreaSize: number;
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private floorMesh: THREE.Mesh | null = null;

  // Particle system for effects
  private particles: Particle[] = [];
  private particleGeometry: THREE.SphereGeometry;
  private particleMaterials: Map<number, THREE.MeshBasicMaterial> = new Map();

  // Lights
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private pointLight: THREE.PointLight;

  constructor(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    playAreaSize: number
  ) {
    this.container = container;
    this.canvas = canvas;
    this.playAreaSize = playAreaSize;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.Fog(
      0x0a0a1a,
      playAreaSize * 2,
      playAreaSize * 4
    );

    // Create camera - top-down view
    const aspect = canvas.width / canvas.height;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.camera.position.set(0, playAreaSize * 1.5, 0);
    this.camera.lookAt(0, 0, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Setup lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(
      playAreaSize,
      playAreaSize * 2,
      playAreaSize
    );
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.camera.left = -playAreaSize * 2;
    this.directionalLight.shadow.camera.right = playAreaSize * 2;
    this.directionalLight.shadow.camera.top = playAreaSize * 2;
    this.directionalLight.shadow.camera.bottom = -playAreaSize * 2;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(this.directionalLight);

    // Add a point light at the void position (will be updated)
    this.pointLight = new THREE.PointLight(0x8b00ff, 1, playAreaSize);
    this.pointLight.position.set(0, 5, 0);
    this.scene.add(this.pointLight);

    // Initialize particle system
    this.particleGeometry = new THREE.SphereGeometry(0.15, 8, 8);

    // Create play area floor
    this.createPlayArea();

    // Create boundary walls
    this.createBoundaryWalls();
  }

  private createPlayArea(): void {
    // Ring-shaped floor with hole in center for void
    // Start with a larger inner radius that will be updated when void is created
    const floorGeometry = new THREE.RingGeometry(5, this.playAreaSize, 64, 1);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide,
    });
    this.floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = -0.02; // Slightly below ground to prevent clipping
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Add circular boundary ring
    const ringGeometry = new THREE.RingGeometry(
      this.playAreaSize - 2,
      this.playAreaSize,
      64
    );
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x667eea,
      emissive: 0x667eea,
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    this.scene.add(ring);
  }

  private createBoundaryWalls(): void {
    // Create invisible cylindrical wall at the edge
    const wallHeight = 100;
    const wallGeometry = new THREE.CylinderGeometry(
      this.playAreaSize,
      this.playAreaSize,
      wallHeight,
      32,
      1,
      true
    );
    const wallMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
      color: 0x667eea,
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = wallHeight / 2;
    this.scene.add(wall);
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.Camera {
    return this.camera;
  }

  addToScene(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  removeFromScene(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  updateFloorHole(voidRadius: number): void {
    // Update the floor ring geometry to match void size
    // Make hole slightly larger than void to prevent any overlap/clipping
    if (this.floorMesh) {
      const newGeometry = new THREE.RingGeometry(
        voidRadius * 1.02, // 2% larger than void
        this.playAreaSize,
        64,
        1
      );
      this.floorMesh.geometry.dispose();
      this.floorMesh.geometry = newGeometry;
    }
  }

  updateFloorHolePosition(x: number, z: number): void {
    // Move the floor mesh so the hole follows the void position
    if (this.floorMesh) {
      this.floorMesh.position.x = x;
      this.floorMesh.position.z = z;
    }
  }

  updateVoidLightPosition(x: number, z: number): void {
    this.pointLight.position.set(x, 5, z);
  }

  // Create a dramatic particle explosion effect for perfect catches
  createPerfectCatchEffect(position: THREE.Vector3): void {
    const particleCount = 30;
    const colors = [0xffd700, 0xffaa00, 0xff6600, 0xffff00, 0xffffff]; // Gold/orange/white

    for (let i = 0; i < particleCount; i++) {
      const colorIndex = Math.floor(Math.random() * colors.length);
      const color = colors[colorIndex] ?? 0xffffff;

      // Get or create material for this color
      if (!this.particleMaterials.has(color)) {
        this.particleMaterials.set(
          color,
          new THREE.MeshBasicMaterial({ color })
        );
      }
      const material = this.particleMaterials.get(color)!;

      const mesh = new THREE.Mesh(this.particleGeometry, material);
      mesh.position.copy(position);

      // Random upward and outward velocity with spiral motion
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 8 + Math.random() * 12;
      const upwardSpeed = 5 + Math.random() * 10;

      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        upwardSpeed,
        Math.sin(angle) * speed
      );

      const particle: Particle = {
        mesh,
        velocity,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4, // 0.8-1.2 seconds
      };

      this.particles.push(particle);
      this.scene.add(mesh);
    }

    // Add a central burst of particles going down into the void
    for (let i = 0; i < 15; i++) {
      const color = 0x8b00ff; // Purple for void
      if (!this.particleMaterials.has(color)) {
        this.particleMaterials.set(
          color,
          new THREE.MeshBasicMaterial({ color })
        );
      }
      const material = this.particleMaterials.get(color)!;

      const mesh = new THREE.Mesh(this.particleGeometry, material);
      mesh.position.copy(position);

      // Spiral downward velocity
      const angle = (i / 15) * Math.PI * 2;
      const spiralSpeed = 2 + Math.random() * 3;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * spiralSpeed,
        -15 - Math.random() * 10, // Downward into void
        Math.sin(angle) * spiralSpeed
      );

      const particle: Particle = {
        mesh,
        velocity,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.3,
      };

      this.particles.push(particle);
      this.scene.add(mesh);
    }
  }

  // Update particles each frame
  updateParticles(deltaTime: number): void {
    const particlesToRemove: Particle[] = [];

    for (const particle of this.particles) {
      particle.life += deltaTime;

      if (particle.life >= particle.maxLife) {
        particlesToRemove.push(particle);
        continue;
      }

      // Update position
      particle.mesh.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime)
      );

      // Apply gravity to upward particles
      if (particle.velocity.y > -20) {
        particle.velocity.y -= 25 * deltaTime;
      }

      // Fade out and shrink based on life
      const lifeRatio = particle.life / particle.maxLife;
      const scale = 1 - lifeRatio * 0.8; // Shrink to 20%
      particle.mesh.scale.setScalar(scale);

      // Add spiral motion for downward particles
      if (particle.velocity.y < 0) {
        const spiralSpeed = 3;
        particle.velocity.x +=
          Math.cos(particle.life * 10) * spiralSpeed * deltaTime;
        particle.velocity.z +=
          Math.sin(particle.life * 10) * spiralSpeed * deltaTime;
      }
    }

    // Remove dead particles
    for (const particle of particlesToRemove) {
      this.scene.remove(particle.mesh);
      const index = this.particles.indexOf(particle);
      if (index > -1) {
        this.particles.splice(index, 1);
      }
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    // Dispose of all geometries and materials
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.renderer.dispose();
  }

  handleResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
