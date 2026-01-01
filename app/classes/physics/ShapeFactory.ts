import Matter from "matter-js";
import { SHAPE_GRADIENTS } from "./types";

export interface GradientInfo {
  primary: string;
  secondary: string;
}

type BodyWithGradient = Matter.Body & { gradientColors?: GradientInfo };

export class ShapeFactory {
  private readonly minSize: number;
  private readonly maxSize: number;

  constructor(minSize = 30, maxSize = 90) {
    this.minSize = minSize;
    this.maxSize = maxSize;
  }

  createRandomShape(x: number, y: number): Matter.Body {
    const shapeType = Math.floor(Math.random() * 4);
    const gradient = this.getRandomGradient();
    const size = this.minSize + Math.random() * (this.maxSize - this.minSize);

    let body: Matter.Body;

    switch (shapeType) {
      case 0: // Circle
        body = Matter.Bodies.circle(x, y, size / 2, {
          restitution: 0.3,
          friction: 0.5,
          render: { fillStyle: "transparent" },
        });
        break;
      case 1: // Rectangle
        body = Matter.Bodies.rectangle(
          x,
          y,
          size,
          size * (0.5 + Math.random() * 0.5),
          {
            restitution: 0.3,
            friction: 0.5,
            render: { fillStyle: "transparent" },
          }
        );
        break;
      case 2: {
        // Polygon (pentagon/hexagon/heptagon)
        const sides = 5 + Math.floor(Math.random() * 3);
        body = Matter.Bodies.polygon(x, y, sides, size / 2, {
          restitution: 0.3,
          friction: 0.5,
          render: { fillStyle: "transparent" },
        });
        break;
      }
      default: // Triangle
        body = Matter.Bodies.polygon(x, y, 3, size / 2, {
          restitution: 0.3,
          friction: 0.5,
          render: { fillStyle: "transparent" },
        });
    }

    // Store gradient colors in the body's plugin data
    (body as BodyWithGradient).gradientColors = gradient;

    // Add slight random rotation
    Matter.Body.setAngle(body, Math.random() * Math.PI * 2);

    return body;
  }

  private getRandomGradient(): GradientInfo {
    const [primary, secondary] =
      SHAPE_GRADIENTS[Math.floor(Math.random() * SHAPE_GRADIENTS.length)]!;
    return { primary, secondary };
  }
}
