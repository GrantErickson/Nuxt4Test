import Matter from "matter-js";

export class VoidController {
  private voidBody: Matter.Body;
  private world: Matter.World;
  private targetX: number;
  private targetY: number;
  private radius: number;
  private baseRadius: number;
  private canvas: HTMLCanvasElement | null = null;

  // Movement smoothing
  private readonly smoothingFactor = 0.2;

  constructor(
    world: Matter.World,
    canvasWidth: number,
    canvasHeight: number,
    radius: number
  ) {
    this.world = world;
    this.radius = radius;
    this.baseRadius = radius;
    this.targetX = canvasWidth / 2;
    this.targetY = canvasHeight / 2;

    // Create the void as a sensor (doesn't collide physically)
    this.voidBody = Matter.Bodies.circle(this.targetX, this.targetY, radius, {
      isStatic: true,
      isSensor: true,
      render: {
        fillStyle: "#000000",
        strokeStyle: "#8B00FF",
        lineWidth: 3,
      },
    });

    Matter.World.add(world, this.voidBody);
  }

  setupEventListeners(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    // Mouse events
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
    this.targetX = e.clientX - rect.left;
    this.targetY = e.clientY - rect.top;
  };

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (!this.canvas || e.touches.length === 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    this.targetX = touch.clientX - rect.left;
    this.targetY = touch.clientY - rect.top;
  };

  update(): void {
    // Smooth movement toward target
    const currentX = this.voidBody.position.x;
    const currentY = this.voidBody.position.y;

    const newX = currentX + (this.targetX - currentX) * this.smoothingFactor;
    const newY = currentY + (this.targetY - currentY) * this.smoothingFactor;

    Matter.Body.setPosition(this.voidBody, { x: newX, y: newY });
  }

  getPosition(): { x: number; y: number } {
    return {
      x: this.voidBody.position.x,
      y: this.voidBody.position.y,
    };
  }

  getRadius(): number {
    return this.radius;
  }

  setRadius(newRadius: number): void {
    this.radius = newRadius;

    // Remove old body
    Matter.World.remove(this.world, this.voidBody);

    // Create new body with new radius
    const currentPos = this.voidBody.position;
    this.voidBody = Matter.Bodies.circle(
      currentPos.x,
      currentPos.y,
      newRadius,
      {
        isStatic: true,
        isSensor: true,
        render: {
          fillStyle: "#000000",
          strokeStyle: "#8B00FF",
          lineWidth: 3,
        },
      }
    );

    Matter.World.add(this.world, this.voidBody);
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

  getBody(): Matter.Body {
    return this.voidBody;
  }

  destroy(): void {
    this.removeEventListeners();
    Matter.World.remove(this.world, this.voidBody);
  }
}
