import * as CANNON from "cannon-es";

export class PhysicsEngine3D {
  private world: CANNON.World;
  private playAreaSize: number;
  private groundBody: CANNON.Body;
  private voidPosition: { x: number; z: number } = { x: 0, z: 0 };
  private voidRadius: number = 0;

  // Collision groups
  static readonly GROUP_GROUND = 1;
  static readonly GROUP_SHAPES = 2;
  static readonly GROUP_WALLS = 4;

  constructor(playAreaSize: number) {
    this.playAreaSize = playAreaSize;

    // Create physics world
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -20, 0), // Gravity pointing down
    });

    // Improve performance
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;

    // Create ground plane
    const groundShape = new CANNON.Plane();
    this.groundBody = new CANNON.Body({
      mass: 0, // Static body
      shape: groundShape,
      material: new CANNON.Material({ friction: 0.3, restitution: 0.6 }),
      collisionFilterGroup: PhysicsEngine3D.GROUP_GROUND,
      collisionFilterMask:
        PhysicsEngine3D.GROUP_SHAPES | PhysicsEngine3D.GROUP_WALLS,
    });
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(this.groundBody);

    // Create cylindrical boundary
    this.createBoundary();
  }

  private createBoundary(): void {
    // Create invisible cylindrical walls
    const segments = 32;
    const angleStep = (Math.PI * 2) / segments;

    for (let i = 0; i < segments; i++) {
      const angle = i * angleStep;
      const x = Math.cos(angle) * this.playAreaSize;
      const z = Math.sin(angle) * this.playAreaSize;

      // Create a thin box for each segment of the circle
      const wallShape = new CANNON.Box(new CANNON.Vec3(2, 50, 2));
      const wallBody = new CANNON.Body({
        mass: 0,
        shape: wallShape,
        position: new CANNON.Vec3(x, 50, z),
        collisionFilterGroup: PhysicsEngine3D.GROUP_WALLS,
        collisionFilterMask: PhysicsEngine3D.GROUP_SHAPES,
      });

      this.world.addBody(wallBody);
    }
  }

  getWorld(): CANNON.World {
    return this.world;
  }

  getGroundBody(): CANNON.Body {
    return this.groundBody;
  }

  updateVoidPosition(x: number, z: number, radius: number): void {
    this.voidPosition = { x, z };
    this.voidRadius = radius;
  }

  disableGroundCollisionForBody(body: CANNON.Body): void {
    // Remove ground collision for this shape
    body.collisionFilterMask =
      body.collisionFilterMask & ~PhysicsEngine3D.GROUP_GROUND;
  }

  enableGroundCollisionForBody(body: CANNON.Body): void {
    // Re-enable ground collision for this shape
    body.collisionFilterMask =
      body.collisionFilterMask | PhysicsEngine3D.GROUP_GROUND;
  }

  step(deltaTime: number): void {
    // Fixed time step for stable physics
    const fixedTimeStep = 1 / 60;
    this.world.step(fixedTimeStep, deltaTime / 1000, 3);
  }

  addBody(body: CANNON.Body): void {
    this.world.addBody(body);
  }

  removeBody(body: CANNON.Body): void {
    this.world.removeBody(body);
  }
}
