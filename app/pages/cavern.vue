<template>
  <v-card class="mx-auto cavern-card">
    <v-card-title
      class="bg-gradient text-white d-flex align-center justify-space-between flex-wrap ga-2"
    >
      <span>🏔️ Cavern Explorer</span>
      <div class="d-flex align-center ga-2 flex-wrap">
        <v-chip color="purple-darken-1" variant="flat">
          💎 {{ gameState.collectedGems }} / {{ gameState.totalGems }}
        </v-chip>
        <v-chip v-if="gameState.hasWon" color="success" variant="flat">
          🎉 Victory!
        </v-chip>
        <v-chip v-if="gameState.isDead" color="error" variant="flat">
          💀 Drowned!
        </v-chip>
      </div>
    </v-card-title>

    <v-card-text class="pa-4">
      <!-- Game status alerts -->
      <v-alert v-if="gameState.hasWon" type="success" class="mb-3" :icon="false">
        🎉 You collected all {{ gameState.totalGems }} gems! Press Enter or click New Game.
      </v-alert>
      <v-alert v-else-if="gameState.isDead" type="error" class="mb-3" :icon="false">
        💀 You fell into the water! Press Enter or click New Game.
      </v-alert>
      <div v-else class="text-center text-caption text-grey-lighten-1 mb-2">
        Use <strong>WASD</strong> to move. Click adjacent walls to break them.
      </div>

      <!-- Cave grid -->
      <div class="d-flex flex-column align-center">
        <div v-for="row in gridRows" :key="'row-' + row" class="d-flex">
          <div
            v-for="col in gridCols"
            :key="'cell-' + row + '-' + col"
            class="cell d-flex align-center justify-center"
            :class="getCellClass(row - 1, col - 1)"
            @click="handleCellClick(row - 1, col - 1)"
          >
            {{ getCellContent(row - 1, col - 1) }}
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="d-flex justify-center ga-4 mt-4 flex-wrap">
        <v-btn color="brown-darken-2" prepend-icon="mdi-refresh" @click="regenerate">
          New Game
        </v-btn>
        <v-btn-toggle v-model="caveStyle" mandatory color="brown">
          <v-btn value="sparse" size="small">Sparse</v-btn>
          <v-btn value="normal" size="small">Normal</v-btn>
          <v-btn value="dense" size="small">Dense</v-btn>
        </v-btn-toggle>
      </div>

      <!-- Legend -->
      <div class="d-flex justify-center ga-4 mt-4 flex-wrap text-caption">
        <span class="d-flex align-center ga-1">🧙 You</span>
        <span class="d-flex align-center ga-1">💎 Gem</span>
        <span class="d-flex align-center ga-1">
          <span class="legend-box water"></span> Water (deadly!)
        </span>
        <span class="d-flex align-center ga-1">
          <span class="legend-box wall"></span> Wall (click to break)
        </span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { CavernGame, type CaveStats, type GameState } from "~/classes/cavern";

// Constants for grid sizing
const MIN_SIZE = 15;
const MAX_SIZE = 60;
const CELL_SIZE = 16; // pixels per cell
const HEADER_FOOTER_HEIGHT = 400;
const SIDE_PADDING = 48;

// Calculate grid dimensions based on screen size
function calculateGridDimensions(): { rows: number; cols: number } {
  if (typeof window === "undefined") return { rows: 30, cols: 50 };

  const availableWidth = window.innerWidth - SIDE_PADDING;
  const availableHeight = window.innerHeight - HEADER_FOOTER_HEIGHT;

  const cols = Math.max(
    MIN_SIZE,
    Math.min(MAX_SIZE, Math.floor(availableWidth / CELL_SIZE))
  );
  const rows = Math.max(
    MIN_SIZE,
    Math.min(MAX_SIZE, Math.floor(availableHeight / CELL_SIZE))
  );

  return { rows, cols };
}

// Reactive grid dimensions
const gridRows = ref(30);
const gridCols = ref(50);

// Cave style presets
const caveStyle = ref<"sparse" | "normal" | "dense">("normal");

const fillProbabilities = {
  sparse: 0.38,
  normal: 0.45,
  dense: 0.52,
};

// Game instance
let gameInstance = new CavernGame({
  rows: gridRows.value,
  cols: gridCols.value,
  fillProbability: fillProbabilities[caveStyle.value],
  smoothingIterations: 5,
  minRegionSize: 15,
  waterChance: 0.06,
  crystalChance: 0.04,
});

// Reactive state
const stats = ref<CaveStats>({
  totalFloor: 0,
  totalWall: 0,
  totalWater: 0,
  totalCrystals: 0,
  regionCount: 0,
});

const gameState = ref<GameState>({
  playerPos: { row: 0, col: 0 },
  collectedGems: 0,
  totalGems: 0,
  isDead: false,
  hasWon: false,
});

// Version counter for reactivity
const stateVersion = ref(0);

// Sync state from game instance
function syncState(): void {
  stats.value = gameInstance.getStats();
  gameState.value = gameInstance.getGameState();
  stateVersion.value++;
}

// Initialize with calculated size
function initializeGame(): void {
  const { rows, cols } = calculateGridDimensions();
  gridRows.value = rows;
  gridCols.value = cols;
  gameInstance = new CavernGame({
    rows,
    cols,
    fillProbability: fillProbabilities[caveStyle.value],
    smoothingIterations: 5,
    minRegionSize: 15,
    waterChance: 0.06,
    crystalChance: 0.04,
  });
  syncState();
}

function regenerate(): void {
  gameInstance.reset({
    fillProbability: fillProbabilities[caveStyle.value],
  });
  syncState();
}

function handleKeydown(event: KeyboardEvent): void {
  // Restart on Enter if game over
  if (event.key === "Enter" && (gameState.value.isDead || gameState.value.hasWon)) {
    regenerate();
    return;
  }

  // WASD movement
  const keyMap: Record<string, "up" | "down" | "left" | "right"> = {
    w: "up",
    W: "up",
    ArrowUp: "up",
    s: "down",
    S: "down",
    ArrowDown: "down",
    a: "left",
    A: "left",
    ArrowLeft: "left",
    d: "right",
    D: "right",
    ArrowRight: "right",
  };

  const direction = keyMap[event.key];
  if (direction) {
    event.preventDefault();
    gameInstance.move(direction);
    syncState();
  }
}

function handleCellClick(row: number, col: number): void {
  if (gameInstance.handleClick(row, col)) {
    syncState();
  }
}

function getCellClass(row: number, col: number): string {
  void stateVersion.value;
  return gameInstance.getCellClass(row, col);
}

function getCellContent(row: number, col: number): string {
  void stateVersion.value;
  return gameInstance.getCellContent(row, col);
}

// Watch cave style changes
watch(caveStyle, () => {
  regenerate();
});

// Initialize on mount
onMounted(() => {
  initializeGame();
  window.addEventListener("keydown", handleKeydown);
});

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.cavern-card {
  background: linear-gradient(180deg, #3e2723 0%, #4e342e 100%);
  border: 3px solid #5d4037;
  outline: none;
}

.cavern-card:focus {
  border-color: #ffab00;
}

.bg-gradient {
  background: linear-gradient(90deg, #3e2723 0%, #5d4037 50%, #6d4c41 100%);
}

.cell {
  width: 16px;
  height: 16px;
  font-size: 10px;
  transition: all 0.1s ease;
}

/* Wall styles - very distinct dark gray */
.cell.wall {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  box-shadow: inset 1px 1px 2px rgba(255, 255, 255, 0.05),
    inset -1px -1px 2px rgba(0, 0, 0, 0.3);
  border: 1px solid #0f0f1a;
}

/* Breakable walls glow */
.cell.breakable {
  cursor: pointer;
  animation: breakable-pulse 1s ease-in-out infinite alternate;
}

@keyframes breakable-pulse {
  from { box-shadow: 0 0 2px #ff9800; }
  to { box-shadow: 0 0 6px #ff9800, 0 0 10px #ff5722; }
}

.cell.breakable:hover {
  transform: scale(1.2);
  z-index: 10;
}

/* Floor styles with region colors */
.cell.floor {
  background: #8d6e63;
}

.cell.floor.region-1 { background: #8d6e63; }
.cell.floor.region-2 { background: #a1887f; }
.cell.floor.region-3 { background: #795548; }
.cell.floor.region-4 { background: #6d4c41; }
.cell.floor.region-5 { background: #8b7355; }
.cell.floor.region-6 { background: #9e8b7d; }
.cell.floor.region-7 { background: #7b6b5a; }
.cell.floor.region-8 { background: #a08070; }

/* Player on floor */
.cell.has-player {
  font-size: 14px;
  z-index: 5;
}

.cell.has-player.dead {
  animation: death-shake 0.5s ease-in-out;
}

@keyframes death-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px) rotate(-5deg); }
  75% { transform: translateX(3px) rotate(5deg); }
}

/* Water styles */
.cell.water {
  background: linear-gradient(180deg, #1976d2 0%, #0d47a1 100%);
  animation: water-shimmer 2s ease-in-out infinite;
}

@keyframes water-shimmer {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

/* Crystal styles */
.cell.crystal {
  background: linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%);
  animation: crystal-glow 1.5s ease-in-out infinite alternate;
}

@keyframes crystal-glow {
  from { box-shadow: 0 0 3px #e1bee7; }
  to { box-shadow: 0 0 8px #ce93d8, 0 0 12px #ba68c8; }
}

/* Legend boxes */
.legend-box {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.legend-box.wall {
  background: linear-gradient(135deg, #37474f 0%, #263238 100%);
}

.legend-box.floor {
  background: #8d6e63;
}

.legend-box.water {
  background: linear-gradient(180deg, #1976d2 0%, #0d47a1 100%);
}
</style>
