Physics-Based Hair Cutting Game
A continuous gameplay hair styling game using Matter.js physics. Hair grows from a head, players cut it with scissors to match target styles, earn points, and receive new style goals. Uses the existing Matter.js physics patterns from the physics classes. Additionally the user can use a comb to temporarily cause hair to stick in a position to match the style goal. Large and small combs and scissors can be used.

Steps
Create class folder app/classes/haircutting/ with types.ts (interfaces for HairStrand, StyleGoal, GameConfig), HairCuttingGame.ts (main controller), HairStrandFactory.ts (creates hair chains using Matter.js Constraint), and index.ts barrel exports.

Implement hair physics using Matter.js body chains — each strand is a series of small circle bodies connected with Matter.Constraint joints; cutting removes a constraint and applies physics to severed pieces.

Add continuous growth system — timer-based loop that incrementally adds segments to hair strands, extending them from the scalp anchor points over time.

Create style matching system — define target hairstyles as length/shape configurations; compare current hair state to goal; calculate score based on accuracy when player signals completion.

Build the Vue page haircutting.vue with canvas, Vuetify card wrapper, score display, current goal preview, and scissor cursor that follows mouse/touch input.

Add scissor cutting mechanic — detect mouse/touch drag intersections with hair constraints; sever constraints at intersection points; play satisfying visual/audio feedback.
The user should be able to select a small or large scissor.

Add a combing mechanic - detect mouse/touch drag intersections with hair constraints; cause the constraints to align with the combing motion.

The user should be able to select a small or large sized comb.

Should hair be rendered as a Custom canvas rendering over physics for a realistic look

Style goal complexity: Simple goals (e.g., "cut all hair to length X") to start with more complex patterns (e.g., "mohawk", "fade") incrementally.

Difficulty progression: should be adaptive based on player performance.
