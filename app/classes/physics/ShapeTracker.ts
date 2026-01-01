import type Matter from "matter-js";
import type { TrackedShape } from "./types";

export class ShapeTracker {
  private readonly shapes: TrackedShape[] = [];

  add(body: Matter.Body): void {
    this.shapes.push({
      body,
      createdAt: Date.now(),
    });
  }

  remove(body: Matter.Body): boolean {
    const index = this.shapes.findIndex((s) => s.body === body);
    if (index !== -1) {
      this.shapes.splice(index, 1);
      return true;
    }
    return false;
  }

  getExpired(lifetimeMs: number): Matter.Body[] {
    const now = Date.now();
    const expired: Matter.Body[] = [];

    while (
      this.shapes.length > 0 &&
      now - this.shapes[0]!.createdAt >= lifetimeMs
    ) {
      const shape = this.shapes.shift();
      if (shape) {
        expired.push(shape.body);
      }
    }

    return expired;
  }

  clear(): void {
    this.shapes.length = 0;
  }

  get count(): number {
    return this.shapes.length;
  }
}
