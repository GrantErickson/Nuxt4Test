import Matter from "matter-js";
import { HairStrandFactory } from "./HairStrandFactory";
import {
  type HairStrand,
  type GameConfig,
  type GameState,
  type StyleGoal,
  type Point,
  type ToolType,
  DEFAULT_CONFIG,
  STYLE_GOALS,
  TOOLS,
} from "./types";

export class HairCuttingGame {
  private config: GameConfig;
  private engine!: Matter.Engine;
  private world!: Matter.World;
  private render!: Matter.Render;
  private runner!: Matter.Runner;
  private canvas!: HTMLCanvasElement;
  private strandFactory!: HairStrandFactory;
  private strands: HairStrand[] = [];
  private headBody!: Matter.Body;
  private groundBody!: Matter.Body;

  private state: GameState = {
    score: 0,
    currentGoal: null,
    goalStartTime: 0,
    completedGoals: 0,
    averageAccuracy: 0,
    difficultyLevel: 1,
    isPaused: false,
    isGameOver: false,
  };

  private currentTool: ToolType = "scissors-small";
  private mousePos: Point = { x: 0, y: 0 };
  private isMouseDown: boolean = false;
  private lastCutPos: Point | null = null;

  private growthInterval: number | null = null;
  private onStateChange: (() => void) | null = null;

  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Getters for Vue reactivity
  get score(): number {
    return this.state.score;
  }
  get currentGoal(): StyleGoal | null {
    return this.state.currentGoal;
  }
  get completedGoals(): number {
    return this.state.completedGoals;
  }
  get difficultyLevel(): number {
    return this.state.difficultyLevel;
  }
  get isPaused(): boolean {
    return this.state.isPaused;
  }
  get activeTool(): ToolType {
    return this.currentTool;
  }

  setOnStateChange(callback: () => void): void {
    this.onStateChange = callback;
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  /**
   * Initialize the game with a canvas element
   */
  setup(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.config.canvasWidth = canvas.width;
    this.config.canvasHeight = canvas.height;
    this.config.headCenterX = canvas.width / 2;
    this.config.headCenterY = canvas.height * 0.55;

    // Create Matter.js engine
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.engine.world.gravity.y = this.config.gravity;

    // Create renderer
    this.render = Matter.Render.create({
      canvas: this.canvas,
      engine: this.engine,
      options: {
        width: this.config.canvasWidth,
        height: this.config.canvasHeight,
        wireframes: false,
        background: "#1a1a2e",
        pixelRatio: window.devicePixelRatio || 1,
      },
    });

    // Create runner
    this.runner = Matter.Runner.create();

    // Create static bodies
    this.createStaticBodies();

    // Initialize hair factory
    this.strandFactory = new HairStrandFactory(this.config, this.world);

    // Generate initial hair
    this.strands = this.strandFactory.generateInitialHair(
      this.config.strandCount
    );

    // Set up custom rendering
    Matter.Events.on(this.render, "afterRender", () => this.customRender());

    // Set up physics update for styled hair maintenance
    Matter.Events.on(this.engine, "beforeUpdate", () =>
      this.maintainStyledHair()
    );

    // Start physics
    Matter.Render.run(this.render);
    Matter.Runner.run(this.runner, this.engine);

    // Start hair growth
    this.startGrowth();

    // Set first goal
    this.selectNewGoal();

    // Set up input handlers
    this.setupInputHandlers();

    this.notifyStateChange();
  }

  /**
   * Create the head and ground static bodies
   */
  private createStaticBodies(): void {
    // Head (static circle)
    this.headBody = Matter.Bodies.circle(
      this.config.headCenterX,
      this.config.headCenterY,
      this.config.headRadius,
      {
        isStatic: true,
        collisionFilter: {
          category: 0x0001,
          mask: 0x0002,
        },
        render: {
          visible: false, // We'll custom render
        },
        label: "head",
      }
    );
    Matter.Composite.add(this.world, this.headBody);

    // Ground (catches falling hair)
    this.groundBody = Matter.Bodies.rectangle(
      this.config.canvasWidth / 2,
      this.config.canvasHeight + 50,
      this.config.canvasWidth,
      100,
      {
        isStatic: true,
        collisionFilter: {
          category: 0x0001,
          mask: 0x0002,
        },
        render: { visible: false },
        label: "ground",
      }
    );
    Matter.Composite.add(this.world, this.groundBody);
  }

  /**
   * Custom canvas rendering for hair, head, and UI
   */
  private customRender(): void {
    const ctx = this.render.context;
    if (!ctx) return;

    // Draw head
    this.drawHead(ctx);

    // Draw hair strands
    for (const strand of this.strands) {
      this.drawStrand(ctx, strand);
    }

    // Draw tool cursor
    this.drawToolCursor(ctx);

    // Draw goal preview
    this.drawGoalPreview(ctx);
  }

  private drawHead(ctx: CanvasRenderingContext2D): void {
    const { headCenterX, headCenterY, headRadius } = this.config;

    // Face gradient
    const faceGradient = ctx.createRadialGradient(
      headCenterX - 20,
      headCenterY - 20,
      0,
      headCenterX,
      headCenterY,
      headRadius
    );
    faceGradient.addColorStop(0, "#ffdbac");
    faceGradient.addColorStop(1, "#e0ac69");

    ctx.beginPath();
    ctx.arc(headCenterX, headCenterY, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = faceGradient;
    ctx.fill();
    ctx.strokeStyle = "#c68642";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Eyes
    const eyeY = headCenterY - 10;
    const eyeOffset = 25;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(headCenterX - eyeOffset, eyeY, 12, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(headCenterX + eyeOffset, eyeY, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4a3728";
    ctx.beginPath();
    ctx.arc(headCenterX - eyeOffset, eyeY, 5, 0, Math.PI * 2);
    ctx.arc(headCenterX + eyeOffset, eyeY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.beginPath();
    ctx.arc(headCenterX, headCenterY + 30, 15, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.strokeStyle = "#8b4513";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  private drawStrand(ctx: CanvasRenderingContext2D, strand: HairStrand): void {
    if (strand.segments.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(strand.rootX, strand.rootY);

    for (const segment of strand.segments) {
      ctx.lineTo(segment.body.position.x, segment.body.position.y);
    }

    ctx.strokeStyle = strand.color;
    ctx.lineWidth = this.config.segmentRadius * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Draw segment circles for visual interest
    for (const segment of strand.segments) {
      ctx.beginPath();
      ctx.arc(
        segment.body.position.x,
        segment.body.position.y,
        this.config.segmentRadius,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = strand.color;
      ctx.fill();
    }
  }

  private drawToolCursor(ctx: CanvasRenderingContext2D): void {
    const tool = TOOLS[this.currentTool];
    const { x, y } = this.mousePos;

    ctx.save();
    ctx.globalAlpha = 0.6;

    if (this.currentTool.startsWith("scissors")) {
      // Draw scissors indicator
      ctx.beginPath();
      ctx.arc(x, y, tool.size, 0, Math.PI * 2);
      ctx.strokeStyle = this.isMouseDown ? "#ff4444" : "#ffffff";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Scissors icon
      ctx.font = `${tool.size}px Arial`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✂️", x, y - tool.size - 10);
    } else {
      // Draw comb indicator
      ctx.beginPath();
      ctx.arc(x, y, tool.size, 0, Math.PI * 2);
      ctx.strokeStyle = this.isMouseDown ? "#44ff44" : "#ffffff";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Comb icon
      ctx.font = `${tool.size}px Arial`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🪥", x, y - tool.size - 10);
    }

    ctx.restore();
  }

  private drawGoalPreview(ctx: CanvasRenderingContext2D): void {
    if (!this.state.currentGoal) return;

    const goal = this.state.currentGoal;
    const previewX = 60;
    const previewY = 80;
    const previewScale = 0.3;

    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.roundRect(10, 10, 100, 140, 10);
    ctx.fill();

    // Title
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GOAL", previewX, 28);
    ctx.font = "10px Arial";
    ctx.fillText(goal.name, previewX, 42);

    // Mini head
    ctx.beginPath();
    ctx.arc(previewX, previewY, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#e0ac69";
    ctx.fill();

    // Mini hair preview
    const hairCount = goal.targetLengths.length;
    const arcStart = -Math.PI * 0.85;
    const arcEnd = -Math.PI * 0.15;
    const arcStep = (arcEnd - arcStart) / (hairCount - 1);

    for (let i = 0; i < hairCount; i++) {
      const angle = arcStart + i * arcStep;
      const startX = previewX + Math.cos(angle) * 20;
      const startY = previewY + Math.sin(angle) * 20;
      const targetLen = goal.targetLengths[i] ?? 0;
      const length = targetLen * 4 * previewScale;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(
        startX + Math.cos(angle) * length,
        startY + Math.sin(angle) * length
      );
      ctx.strokeStyle = "#4a3728";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Points
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 12px Arial";
    ctx.fillText(`${goal.basePoints} pts`, previewX, 130);
  }

  /**
   * Set up mouse/touch input handlers
   */
  private setupInputHandlers(): void {
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mouseup", () => this.handleMouseUp());
    this.canvas.addEventListener("mouseleave", () => this.handleMouseUp());

    // Touch events
    this.canvas.addEventListener("touchstart", (e) => this.handleTouchStart(e));
    this.canvas.addEventListener("touchmove", (e) => this.handleTouchMove(e));
    this.canvas.addEventListener("touchend", () => this.handleMouseUp());
  }

  private getCanvasPos(clientX: number, clientY: number): Point {
    const rect = this.canvas.getBoundingClientRect();
    // Account for CSS scaling and pixel ratio
    // The render options use pixelRatio which scales the internal buffer
    // but getBoundingClientRect gives us the CSS dimensions
    const scaleX = this.config.canvasWidth / rect.width;
    const scaleY = this.config.canvasHeight / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  private handleMouseDown(e: MouseEvent): void {
    this.isMouseDown = true;
    this.mousePos = this.getCanvasPos(e.clientX, e.clientY);
    this.lastCutPos = { ...this.mousePos };
  }

  private handleMouseMove(e: MouseEvent): void {
    this.mousePos = this.getCanvasPos(e.clientX, e.clientY);
    if (this.isMouseDown) {
      this.processToolAction();
    }
  }

  private handleMouseUp(): void {
    this.isMouseDown = false;
    this.lastCutPos = null;
    this.releaseCombing();
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      this.isMouseDown = true;
      this.mousePos = this.getCanvasPos(touch.clientX, touch.clientY);
      this.lastCutPos = { ...this.mousePos };
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    if (touch) {
      this.mousePos = this.getCanvasPos(touch.clientX, touch.clientY);
      if (this.isMouseDown) {
        this.processToolAction();
      }
    }
  }

  /**
   * Process the current tool action based on mouse position
   */
  private processToolAction(): void {
    const tool = TOOLS[this.currentTool];

    if (this.currentTool.startsWith("scissors")) {
      this.processCutting(tool.size);
    } else {
      this.processCombing(tool.size);
    }

    this.lastCutPos = { ...this.mousePos };
  }

  /**
   * Check for hair segments within cutting range and cut them
   */
  private processCutting(radius: number): void {
    for (const strand of this.strands) {
      for (let i = 1; i < strand.segments.length; i++) {
        const segment = strand.segments[i];
        if (!segment) continue;
        const dist = this.distance(this.mousePos, segment.body.position);

        if (dist < radius) {
          this.strandFactory.cutStrand(strand, i);
          break; // Only cut once per strand per frame
        }
      }
    }
  }

  /**
   * Apply combing force to hair segments within range and set styled direction
   */
  private processCombing(radius: number): void {
    if (!this.lastCutPos) return;

    const combDirection = {
      x: this.mousePos.x - this.lastCutPos.x,
      y: this.mousePos.y - this.lastCutPos.y,
    };

    const combMagnitude = Math.sqrt(
      combDirection.x * combDirection.x + combDirection.y * combDirection.y
    );

    if (combMagnitude < 1) return;

    // Normalize
    combDirection.x /= combMagnitude;
    combDirection.y /= combMagnitude;

    const combAngle = Math.atan2(combDirection.y, combDirection.x);

    for (const strand of this.strands) {
      let strandAffected = false;

      for (const segment of strand.segments) {
        const dist = this.distance(this.mousePos, segment.body.position);

        if (dist < radius) {
          strandAffected = true;

          // Apply gentle force in comb direction to move hair
          const force = {
            x: combDirection.x * 0.0001,
            y: combDirection.y * 0.0001,
          };
          Matter.Body.applyForce(segment.body, segment.body.position, force);

          // Also dampen velocity to reduce wild movement
          Matter.Body.setVelocity(segment.body, {
            x: segment.body.velocity.x * 0.8,
            y: segment.body.velocity.y * 0.8,
          });
        }
      }

      // If any segment was affected, set the styled direction permanently
      if (strandAffected) {
        strand.isCombed = true;
        strand.combAngle = combAngle;
        strand.isStyled = true;
        strand.styledAngle = combAngle;
      }
    }
  }

  /**
   * Apply forces to maintain styled hair direction
   */
  private maintainStyledHair(): void {
    const styleForce = 0.000005; // Very gentle force to maintain style
    const dampingFactor = 0.95; // Dampen velocity for styled hair

    for (const strand of this.strands) {
      if (!strand.isStyled) continue;

      // Apply gentle corrective forces to keep hair in styled direction
      for (let i = 1; i < strand.segments.length; i++) {
        const segment = strand.segments[i];
        const prevSegment = strand.segments[i - 1];
        if (!segment || !prevSegment) continue;

        const currentPos = segment.body.position;
        const prevPos = prevSegment.body.position;

        // Calculate where the segment should be based on styled angle
        const targetX =
          prevPos.x + Math.cos(strand.styledAngle) * this.config.segmentLength;
        const targetY =
          prevPos.y + Math.sin(strand.styledAngle) * this.config.segmentLength;

        // Calculate correction force toward target position
        const dx = targetX - currentPos.x;
        const dy = targetY - currentPos.y;

        // Apply gentle force toward the styled position
        Matter.Body.applyForce(segment.body, currentPos, {
          x: dx * styleForce,
          y: dy * styleForce,
        });

        // Dampen velocity to reduce oscillation
        Matter.Body.setVelocity(segment.body, {
          x: segment.body.velocity.x * dampingFactor,
          y: segment.body.velocity.y * dampingFactor,
        });
      }
    }
  }

  private releaseCombing(): void {
    for (const strand of this.strands) {
      strand.isCombed = false;
      // Note: isStyled and styledAngle persist - they don't reset on release
    }
  }

  private distance(p1: Point, p2: { x: number; y: number }): number {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }

  /**
   * Start the hair growth interval
   */
  private startGrowth(): void {
    this.growthInterval = window.setInterval(() => {
      if (!this.state.isPaused) {
        this.growHair();
      }
    }, this.config.growthIntervalMs);
  }

  private growHair(): void {
    for (const strand of this.strands) {
      this.strandFactory.growStrand(strand);
    }
    this.notifyStateChange();
  }

  /**
   * Select a new style goal based on difficulty
   */
  private selectNewGoal(): void {
    // Filter goals by current difficulty level (allow goals up to current level + 1)
    const availableGoals = STYLE_GOALS.filter(
      (g) => g.difficulty <= this.state.difficultyLevel + 1
    );

    // Random selection weighted toward current difficulty
    const goal =
      availableGoals[Math.floor(Math.random() * availableGoals.length)];
    this.state.currentGoal = goal ?? null;
    this.state.goalStartTime = Date.now();
    this.notifyStateChange();
  }

  /**
   * Check if current hair matches the goal and calculate score
   */
  checkGoalCompletion(): {
    matched: boolean;
    accuracy: number;
    points: number;
  } {
    if (!this.state.currentGoal) {
      return { matched: false, accuracy: 0, points: 0 };
    }

    const goal = this.state.currentGoal;
    const targetLengths = goal.targetLengths;
    let totalDiff = 0;
    let maxDiff = 0;

    // Compare each strand's length to target
    for (let i = 0; i < this.strands.length && i < targetLengths.length; i++) {
      const strand = this.strands[i];
      const actualLength = strand?.segments.length ?? 0;
      const targetLength = targetLengths[i] ?? 0;
      totalDiff += Math.abs(actualLength - targetLength);
      maxDiff += this.config.maxSegments;
    }

    const accuracy = Math.max(0, 1 - totalDiff / maxDiff);
    const matched = accuracy >= 0.7; // 70% accuracy to pass

    let points = 0;
    if (matched) {
      const timeElapsed = (Date.now() - this.state.goalStartTime) / 1000;
      const timeBonus =
        timeElapsed < goal.timeBonus
          ? Math.floor((goal.timeBonus - timeElapsed) * 2)
          : 0;
      points = Math.floor(goal.basePoints * accuracy) + timeBonus;
    }

    return { matched, accuracy, points };
  }

  /**
   * Submit the current style for scoring
   */
  submitStyle(): {
    success: boolean;
    accuracy: number;
    points: number;
    message: string;
  } {
    const result = this.checkGoalCompletion();

    if (result.matched) {
      this.state.score += result.points;
      this.state.completedGoals++;

      // Update average accuracy
      this.state.averageAccuracy =
        (this.state.averageAccuracy * (this.state.completedGoals - 1) +
          result.accuracy) /
        this.state.completedGoals;

      // Adaptive difficulty
      if (
        this.state.completedGoals % 3 === 0 &&
        this.state.averageAccuracy > 0.85
      ) {
        this.state.difficultyLevel = Math.min(
          5,
          this.state.difficultyLevel + 1
        );
      }

      // Select new goal
      this.selectNewGoal();

      this.notifyStateChange();
      return {
        success: true,
        accuracy: result.accuracy,
        points: result.points,
        message: `Great job! +${result.points} points (${Math.round(
          result.accuracy * 100
        )}% match)`,
      };
    } else {
      this.notifyStateChange();
      return {
        success: false,
        accuracy: result.accuracy,
        points: 0,
        message: `Not quite! Only ${Math.round(
          result.accuracy * 100
        )}% match. Keep styling!`,
      };
    }
  }

  /**
   * Change the active tool
   */
  setTool(tool: ToolType): void {
    this.currentTool = tool;
    this.notifyStateChange();
  }

  /**
   * Toggle pause state
   */
  togglePause(): void {
    this.state.isPaused = !this.state.isPaused;
    if (this.state.isPaused) {
      Matter.Runner.stop(this.runner);
    } else {
      Matter.Runner.run(this.runner, this.engine);
    }
    this.notifyStateChange();
  }

  /**
   * Reset the game
   */
  reset(): void {
    // Remove all strands
    for (const strand of this.strands) {
      this.strandFactory.removeStrand(strand);
    }

    // Generate new hair
    this.strands = this.strandFactory.generateInitialHair(
      this.config.strandCount
    );

    // Reset state
    this.state = {
      score: 0,
      currentGoal: null,
      goalStartTime: 0,
      completedGoals: 0,
      averageAccuracy: 0,
      difficultyLevel: 1,
      isPaused: false,
      isGameOver: false,
    };

    this.selectNewGoal();
    this.notifyStateChange();
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.growthInterval) {
      clearInterval(this.growthInterval);
    }
    Matter.Render.stop(this.render);
    Matter.Runner.stop(this.runner);
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);
  }
}
