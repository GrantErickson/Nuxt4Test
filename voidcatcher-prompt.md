# Void Catcher 3d - Game Prompt

## Game Name

**Void Catcher**

## Game Description

A physics-based 3D top-down game where players control a mobile "void" or "hole" at the center of the play area to catch 3D shapes that fall from the edges of the screen toward the center. Players must catch the shapes before they accumulate and fill up the play area.

## Core Mechanics

### Falling Shapes

- Random 3D shapes continuously fall from all edges of the screen toward the center play area
- Shapes have realistic 3D physics - they fall with gravity, can bounce, rotate, and collide with each other
- Shape types should vary (spheres, cubes, pyramids, cylinders, dodecahedrons, etc.)
- Different shapes have different sizes and weights affecting fall speed and rotation
- The top-down camera perspective allows players to see shapes approaching from all directions

### The Void/Hole

- Player controls a circular void/hole in 3D space using mouse or touch input
- The void moves smoothly across the play area following the cursor/finger position
- 3D shapes that touch the void fall through it and disappear from the playfield
- The void should have a 3D visual effect showing depth - appearing as a portal or black hole with swirling effects, particles, and a dark center that gives the illusion of infinite depth

### Scoring System

- **Standard Catch**: When a 3D shape falls through the void after bouncing or settling on the play area floor, player gets base points (e.g., 10 points)
- **Perfect Catch**: When a shape is caught directly while falling from the edges (before touching the floor), player gets bonus points (e.g., 50 points)
- **Combo Multiplier**: Consecutive perfect catches increase multiplier
- Score display should be prominent and update dynamically
- The 3D perspective allows players to judge depth and timing for perfect catches

### Difficulty Progression

- Shapes start spawning from the edges at a moderate pace
- Fall speed and spawn rate gradually increase over time
- More shapes spawn simultaneously from different edges as the game progresses
- Introduce larger/heavier 3D shapes at higher difficulty levels
- Shapes may spawn from more directions as difficulty increases

### Game Over Condition

- The play area fills up with 3D shapes when player can't clear them fast enough
- Game ends when shapes reach a critical density, pile up too high, or overflow the playable area
- Display final score and high score system
- The 3D view makes it visually clear when the area is becoming overwhelmed

## Technical Implementation Suggestions

### Framework

- Build as a Vue page (e.g., `voidcatcher.vue`) in the Nuxt application
- Use a 3D rendering library (like Three.js) combined with a 3D physics engine (like Cannon.js or Ammo.js) for realistic 3D physics simulation
- Implement a top-down camera view looking down at the play area
- Organize code into classes following the pattern used in other games in this project
- Use Vue components as necessary

### Class Structure

```
VoidCatcherGame
├── ShapeManager (handles spawning and managing 3D shapes)
├── VoidController (handles player input and void movement in 3D space)
├── ScoreManager (tracks score, combos, multipliers)
├── PhysicsEngine3D (wrapper for 3D physics library)
├── RenderEngine (manages Three.js rendering and camera)
└── GameState (tracks game state, difficulty, timing)
```

### Visual Design

- Clean, modern 3D aesthetic with good lighting and shadows
- The void should look like a 3D portal or black hole with depth
- 3D shapes should have distinct colors, materials (some shiny, some matte), and clear edges
- Particle effects when shapes fall through the void, spiraling into the center
- Score pop-ups for perfect catches that float in 3D space
- Visual feedback for difficulty increases
- Top-down camera angle should clearly show the entire play area and approaching shapes
- Consider subtle ambient lighting and shadows to enhance 3D depth perception

### User Interface

- Start/Restart button
- Pause functionality
- Current score display (overlaid on 3D view)
- High score display
- Difficulty indicator or timer
- Instructions overlay for first-time players explaining the 3D perspective
- Optional camera controls or fixed top-down view

## User Experience

### Controls

- **Desktop**: Mouse to move the void across the 3D play area (cursor position maps to void position in 3D space)
- **Mobile**: Touch and drag to move the void
- Simple, intuitive controls with no learning curve - the void follows the cursor/finger position from the top-down perspective

### Feedback

- Satisfying visual/audio feedback when catching 3D shapes
- Audio is a key component and should be very satisfying to users
- Different 3D particle effects for standard vs perfect catches
- Warning indicators (visual effects or color changes) when the play area is getting too full
- Smooth 3D animations and physics throughout
- Shape rotations and tumbling add to the visual appeal

### Replayability

- Quick game sessions (2-5 minutes average)
- High score tracking to encourage improvement
- Progressive difficulty makes each playthrough unique
- Simple concept but requires skill mastery

## Additional Features

- Power-ups
  - Power-ups should be special 3D shapes (e.g., glowing golden shapes) that trigger special effects
  - Larger void for a period of time
  - Shapes that either grow or shrink the void size
  - Slow-motion for a period of time (affecting physics and spawn rate)
  - Clear all shapes with a satisfying 3D implosion effect
- Special 3D shapes with different point values or unique physics properties
- Leaderboard integration
- Different game modes
  - Timed: highest score in 2 minutes
  - Endless: Game ends when play area fills up
- Sound effects and background music that complement the 3D experience

## Success Criteria

The game should be:

1. Easy to understand and start playing immediately despite the 3D perspective
2. Challenging but fair with clear skill progression
3. Visually appealing with smooth 3D physics and rendering
4. Responsive on both desktop and mobile devices (optimized 3D performance)
5. Addictive with "one more try" appeal
6. The 3D perspective should enhance gameplay, not complicate it
