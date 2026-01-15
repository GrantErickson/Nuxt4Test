import Matter from "matter-js";
import type { HairStrand, HairSegment, GameConfig } from "./types";

// Hair color palette
const HAIR_COLORS = [
  "#2C1810", // Dark brown
  "#4A3728", // Medium brown
  "#8B4513", // Saddle brown
  "#654321", // Dark brown
  "#3D2314", // Espresso
];

export class HairStrandFactory {
  private config: GameConfig;
  private world: Matter.World;
  private strandIdCounter: number = 0;

  constructor(config: GameConfig, world: Matter.World) {
    this.config = config;
    this.world = world;
  }

  /**
   * Create a new hair strand anchored at a position on the scalp
   */
  createStrand(
    rootX: number,
    rootY: number,
    initialSegments: number = 3
  ): HairStrand {
    const strandId = this.strandIdCounter++;
    const color =
      HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)] ?? "#4A3728";
    const segments: HairSegment[] = [];

    // Calculate the angle from head center to root (hair grows outward)
    const angleFromCenter = Math.atan2(
      rootY - this.config.headCenterY,
      rootX - this.config.headCenterX
    );

    // Create initial segments
    let prevBody: Matter.Body | null = null;
    for (let i = 0; i < initialSegments; i++) {
      const segment = this.createSegment(
        rootX,
        rootY,
        i,
        angleFromCenter,
        strandId,
        prevBody
      );
      segments.push(segment);
      prevBody = segment.body;
    }

    // Create anchor constraint to fix root to scalp
    const firstSegment = segments[0];
    if (!firstSegment) {
      throw new Error("Failed to create hair strand: no segments");
    }
    const anchorConstraint = Matter.Constraint.create({
      pointA: { x: rootX, y: rootY },
      bodyB: firstSegment.body,
      pointB: { x: 0, y: 0 },
      stiffness: 0.9,
      length: 0,
      render: { visible: false },
    });
    Matter.Composite.add(this.world, anchorConstraint);

    return {
      id: strandId,
      rootX,
      rootY,
      segments,
      anchorConstraint,
      color,
      isCombed: false,
      combAngle: 0,
      isStyled: false,
      styledAngle: angleFromCenter, // Default to natural growth direction
    };
  }

  /**
   * Create a single hair segment (physics body)
   */
  private createSegment(
    rootX: number,
    rootY: number,
    index: number,
    growthAngle: number,
    strandId: number,
    prevBody: Matter.Body | null
  ): HairSegment {
    // Position segment along the growth direction
    const distance = index * this.config.segmentLength;
    const x = rootX + Math.cos(growthAngle) * distance;
    const y = rootY + Math.sin(growthAngle) * distance;

    // Create the physics body
    const body = Matter.Bodies.circle(x, y, this.config.segmentRadius, {
      friction: 0.3,
      frictionAir: 0.15,
      restitution: 0.1,
      density: 0.001,
      collisionFilter: {
        group: -strandId - 1, // Negative group means no collision within strand
        category: 0x0002,
        mask: 0x0001, // Only collide with head/ground
      },
      render: {
        visible: false, // We'll custom render
      },
      label: `hair-${strandId}-${index}`,
    });
    Matter.Composite.add(this.world, body);

    // Create constraint to previous segment
    let constraint: Matter.Constraint | null = null;
    if (prevBody) {
      constraint = Matter.Constraint.create({
        bodyA: prevBody,
        bodyB: body,
        stiffness: 0.9,
        damping: 0.3,
        length: this.config.segmentLength,
        render: { visible: false },
      });
      Matter.Composite.add(this.world, constraint);
    }

    return { body, constraint };
  }

  /**
   * Add a new segment to the tip of an existing strand (hair growth)
   */
  growStrand(strand: HairStrand): boolean {
    if (strand.segments.length >= this.config.maxSegments) {
      return false; // Max length reached
    }

    const lastSegment = strand.segments[strand.segments.length - 1];
    if (!lastSegment) {
      return false;
    }
    const lastPos = lastSegment.body.position;

    // Use styled angle if hair has been styled, otherwise follow natural direction
    let growthAngle: number;
    if (strand.isStyled) {
      // Grow in the styled direction
      growthAngle = strand.styledAngle;
    } else if (strand.segments.length > 1) {
      const prevSegment = strand.segments[strand.segments.length - 2];
      if (prevSegment) {
        const prevPos = prevSegment.body.position;
        growthAngle = Math.atan2(lastPos.y - prevPos.y, lastPos.x - prevPos.x);
      } else {
        growthAngle = Math.atan2(
          lastPos.y - strand.rootY,
          lastPos.x - strand.rootX
        );
      }
    } else {
      growthAngle = Math.atan2(
        lastPos.y - strand.rootY,
        lastPos.x - strand.rootX
      );
    }

    // Create new segment at the tip
    const newX = lastPos.x + Math.cos(growthAngle) * this.config.segmentLength;
    const newY = lastPos.y + Math.sin(growthAngle) * this.config.segmentLength;

    const newBody = Matter.Bodies.circle(
      newX,
      newY,
      this.config.segmentRadius,
      {
        friction: 0.3,
        frictionAir: 0.15,
        restitution: 0.1,
        density: 0.001,
        collisionFilter: {
          group: -strand.id - 1,
          category: 0x0002,
          mask: 0x0001,
        },
        render: { visible: false },
        label: `hair-${strand.id}-${strand.segments.length}`,
      }
    );
    Matter.Composite.add(this.world, newBody);

    // Create constraint connecting to previous tip
    const newConstraint = Matter.Constraint.create({
      bodyA: lastSegment.body,
      bodyB: newBody,
      stiffness: 0.9,
      damping: 0.3,
      length: this.config.segmentLength,
      render: { visible: false },
    });
    Matter.Composite.add(this.world, newConstraint);

    // Update previous segment's constraint reference
    lastSegment.constraint = newConstraint;

    // Add new segment to strand
    strand.segments.push({
      body: newBody,
      constraint: null, // Tip has no forward constraint
    });

    return true;
  }

  /**
   * Cut a strand at a specific segment index, removing segments beyond the cut
   * Returns the removed bodies for cleanup
   */
  cutStrand(strand: HairStrand, cutIndex: number): Matter.Body[] {
    if (cutIndex < 1 || cutIndex >= strand.segments.length) {
      return []; // Can't cut at root or beyond strand
    }

    const removedBodies: Matter.Body[] = [];

    // Remove the constraint connecting to the cut point
    const segmentBeforeCut = strand.segments[cutIndex - 1];
    if (segmentBeforeCut && segmentBeforeCut.constraint) {
      Matter.Composite.remove(this.world, segmentBeforeCut.constraint);
      segmentBeforeCut.constraint = null;
    }

    // Remove all segments from cut point onward
    for (let i = cutIndex; i < strand.segments.length; i++) {
      const segment = strand.segments[i];
      if (!segment) continue;
      removedBodies.push(segment.body);

      // Remove constraint if exists
      if (segment.constraint) {
        Matter.Composite.remove(this.world, segment.constraint);
      }

      // Apply downward velocity to falling hair
      Matter.Body.setVelocity(segment.body, {
        x: (Math.random() - 0.5) * 2,
        y: 2 + Math.random() * 3,
      });
    }

    // Trim the segments array
    strand.segments = strand.segments.slice(0, cutIndex);

    // Schedule removal of cut bodies after they fall
    setTimeout(() => {
      removedBodies.forEach((body) => {
        if (Matter.Composite.get(this.world, body.id, "body")) {
          Matter.Composite.remove(this.world, body);
        }
      });
    }, 2000);

    return removedBodies;
  }

  /**
   * Remove an entire strand from the world
   */
  removeStrand(strand: HairStrand): void {
    // Remove anchor
    Matter.Composite.remove(this.world, strand.anchorConstraint);

    // Remove all segments and constraints
    for (const segment of strand.segments) {
      if (segment.constraint) {
        Matter.Composite.remove(this.world, segment.constraint);
      }
      Matter.Composite.remove(this.world, segment.body);
    }
  }

  /**
   * Generate hair strands distributed across the top of the head
   */
  generateInitialHair(strandCount: number): HairStrand[] {
    const strands: HairStrand[] = [];
    const arcStart = -Math.PI * 0.85; // Start angle on head
    const arcEnd = -Math.PI * 0.15; // End angle on head
    const arcStep = (arcEnd - arcStart) / (strandCount - 1);

    for (let i = 0; i < strandCount; i++) {
      const angle = arcStart + i * arcStep;
      const rootX =
        this.config.headCenterX + Math.cos(angle) * this.config.headRadius;
      const rootY =
        this.config.headCenterY + Math.sin(angle) * this.config.headRadius;

      const strand = this.createStrand(rootX, rootY, 3);
      strands.push(strand);
    }

    return strands;
  }
}
