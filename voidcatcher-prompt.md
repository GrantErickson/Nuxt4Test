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
- The void appears as a hole in the ground plane with a visible rim and dark interior
- The void is purely a visual effect - it has no physical collision that would block shapes
- **The void area must not have ground collision** - shapes should be able to fall through freely
- The ground plane should only exist outside the void's radius, or shapes must be able to pass through it in the void area
- The void moves smoothly across the play area following the cursor/finger position
- The void does not rotate - it remains stationary except for its movement across the play area
- The void exerts a gentle, physics-based gravitational force that smoothly pulls shapes downward
- 3D shapes that enter the void's area of influence are gently pulled down without bouncing or spinning wildly
- The attraction force should be:
  - Strong enough to overcome normal gravity and pull shapes into the void
  - Gentle enough that shapes don't bounce out or spin uncontrollably
  - Applied at the center of mass to minimize unwanted rotation
  - Primarily downward (negative Y direction) with slight inward pull toward center
- Shapes physically fall into the void using the physics engine - not scripted animations
- The void should visually appear as:
  - A circular opening in the ground plane - the ground mesh must have an actual hole cut out (not just overlaid)
  - No ground surface visible inside the void area - shapes must be able to fall through unobstructed
  - Dark interior (black or very dark gradient) extending deep below to show it's a bottomless pit
  - A visible rim/edge around the hole to clearly define its boundaries (stationary, not rotating)
  - Swirling particle effects spiraling downward into the void showing gravitational pull
  - Optional glow or energy effect around the rim
  - The camera must be able to see shapes falling deep into the void (at least 25 units down)
- Shapes continue falling visibly into the abyss for a significant distance before disappearing
  - Shapes should fall deep into the void (at least 15-20 units below ground level) before being removed
  - Players should clearly see shapes descending into nothingness, getting smaller due to perspective
  - Shapes should visually shrink rapidly as they fall deeper, creating an exaggerated sense of depth and speed
  - This creates a satisfying sense of depth and makes the void feel like a true bottomless pit
- When the void moves while shapes are falling through it:
  - Shapes should NOT clip through the sides of the void hole
  - Shapes below ground level should be **strongly constrained** to the void's horizontal position
  - **Teleport/snap shapes horizontally** to match the void's position when below ground level
  - Apply both force AND direct position adjustment to ensure shapes stay within the void
  - The void's radius should be treated as a cylindrical constraint for falling shapes
  - This prevents the visual artifact of shapes appearing to pass through the floor when the void moves away
- Shapes are removed from the game only when they fall below a deep Y threshold (e.g., Y = -20 or lower)

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
- The void should look like a hole cut into the ground plane:
  - Circular opening with visible rim/border (slightly raised or outlined)
  - Black or very dark interior showing depth and emptiness
  - Optional subtle gradient from rim to center (dark purple/blue to pure black)
  - Swirling particle effects spiraling downward continuously into the void
  - Optional glow effect around the rim to make the void more visible
- 3D shapes should have distinct colors, materials (some shiny, some matte), and clear edges
- When shapes enter the void's gravitational field:
  - They are pulled downward by physics-based attraction force
  - Natural physics-based rotation and tumbling as they fall
  - Shapes shrink in visual appearance as they fall away from camera (perspective)
  - Shapes are removed when they fall below ground level threshold
- Score pop-ups for perfect catches that float in 3D space above the void
- Visual feedback for difficulty increases
- Top-down camera angle should clearly show:
  - The entire circular play area
  - Approaching shapes from all edges
  - The void as a clear opening/hole in the ground
- Subtle ambient lighting and shadows to enhance 3D depth perception
- The ground plane should be visible to contrast with the dark void

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
- Audio is a key component and should be very satisfying to users:
  - Whoosh sound as shapes enter the void's gravitational field
  - Descending pitch as shapes fall deeper
  - Satisfying impact/absorption sound when shapes are removed
  - **Special celebratory sound for perfect/direct catches** (catching a shape before it bounces)
- Different 3D particle effects for standard vs perfect catches:
  - **Perfect catches: significant, dramatic particle explosion effect** with bright colors spiraling into the void
  - Standard catches: simpler particle effect
- Physics-based falling provides natural and satisfying movement:
  - Shapes accelerate downward due to gravitational force
  - Natural rotation and tumbling from physics simulation
  - Realistic interaction with the attraction field
- Warning indicators (visual effects or color changes) when the play area is getting too full
- Smooth 3D animations and physics throughout
- Shape rotations and tumbling add to the visual appeal both when falling and when entering the void

### Replayability

- Quick game sessions (2-5 minutes average)
- High score tracking to encourage improvement
- Progressive difficulty makes each playthrough unique
- Simple concept but requires skill mastery

## Additional Features

- Power-ups
  - Power-ups should be special 3D shapes (e.g., glowing shapes) that trigger special effects
  - **Powerups should have unique visual styling**:
    - Each powerup type should have a distinct color and glow effect
    - **Positive powerups** (grow, slow spawn, magnet) should have bright, inviting colors (green, blue, cyan)
    - **Negative powerups** (shrink, fast spawn) should be colored **red** with a warning glow
    - Powerups should emit a pulsing glow to make them stand out from regular shapes
  - **Active powerups should display a countdown bar on screen** showing remaining duration
  - **Positive powerups should last twice as long** as negative ones (e.g., 10 seconds vs 5 seconds)
  - **Positive powerups should spawn more frequently** than negative ones (approximately 2:1 ratio)
  - Larger void for a period of time (grow powerup) - POSITIVE
  - Smaller void for a period of time (shrink powerup) - NEGATIVE
  - Slow spawn: reduces the number of shapes spawning at once for a period of time - POSITIVE
  - Fast spawn: increases the number of shapes spawning at once for a period of time - NEGATIVE
  - Magnet/Attract: pulls all shapes on the play area toward the void for a period of time - POSITIVE
  - Slow-motion for a period of time (affecting physics and spawn rate)
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
