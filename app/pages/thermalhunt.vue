<template>
  <v-card class="mx-auto thermal-card">
    <v-card-title
      class="bg-gradient text-white d-flex align-center justify-space-between flex-wrap ga-2"
    >
      <span>🌡️ Thermal Hunt</span>
      <div class="d-flex align-center ga-2 flex-wrap">
        <v-chip color="grey-darken-1" variant="flat" size="small">
          📐 {{ gridCols }}×{{ gridRows }}
        </v-chip>
        <v-chip color="orange-darken-2" variant="flat">
          🔍 {{ revealedCount }} cells
        </v-chip>
        <v-chip v-if="bestScore !== null" color="amber" variant="flat">
          🏆 Best: {{ bestScore }}
        </v-chip>
      </div>
    </v-card-title>

    <v-card-text class="pa-4">
      <!-- Temperature feedback -->
      <div class="text-center mb-3">
        <v-chip
          :color="getTemperatureChipColor()"
          size="large"
          variant="flat"
          class="text-h6 px-6"
        >
          {{ temperatureText }}
        </v-chip>
      </div>

      <!-- Game over message -->
      <v-alert v-if="gameOver" type="success" class="mb-4" :icon="false">
        🎉 You found the hidden spot in
        <strong>{{ revealedCount }}</strong> clicks!
        <template v-if="revealedCount === bestScore">
          🏆 New best score!
        </template>
      </v-alert>

      <!-- Game grid -->
      <div class="d-flex flex-column align-center">
        <div v-for="row in gridRows" :key="'row-' + row" class="d-flex">
          <div
            v-for="col in gridCols"
            :key="'cell-' + row + '-' + col"
            class="cell d-flex align-center justify-center"
            :class="getCellClass(row - 1, col - 1)"
            :style="getCellStyle(row - 1, col - 1)"
            @click="handleClick(row - 1, col - 1)"
          >
            {{ getCellContent(row - 1, col - 1) }}
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="d-flex justify-center ga-4 mt-4">
        <v-btn
          color="deep-orange"
          prepend-icon="mdi-refresh"
          @click="resetGame"
        >
          {{ gameOver ? "Play Again" : "New Game" }}
        </v-btn>
      </div>

      <!-- Instructions -->
      <div class="text-center text-caption text-grey-darken-1 mt-4">
        Click cells to reveal their heat. Each distance has a unique color!
        <br />
        🔥 Red = Very close &nbsp;|&nbsp; 🧊 Blue = Far away
      </div>
    </v-card-text>

    <!-- Legend -->
    <v-card-text class="bg-grey-lighten-4">
      <div class="text-subtitle-2 mb-2">🗺️ Heat Map Legend:</div>
      <div class="d-flex align-center ga-2">
        <span class="text-caption">🔥 Close (0)</span>
        <div class="legend-gradient"></div>
        <span class="text-caption">Far ({{ maxDistance }}) 🧊</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ThermalHuntGame } from "~/classes/thermalhunt";

// Constants for grid sizing
const MIN_SIZE = 10;
const MAX_SIZE = 40;
const CELL_SIZE = 24; // pixels per cell
const HEADER_FOOTER_HEIGHT = 450; // Reserve space for header/controls/legend/tabs
const SIDE_PADDING = 48;

// Calculate grid dimensions based on screen size
function calculateGridDimensions(): { rows: number; cols: number } {
  if (typeof window === "undefined") return { rows: 20, cols: 25 };

  const availableWidth = window.innerWidth - SIDE_PADDING;
  const availableHeight = window.innerHeight - HEADER_FOOTER_HEIGHT;

  const cols = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.floor(availableWidth / CELL_SIZE)));
  const rows = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.floor(availableHeight / CELL_SIZE)));

  return { rows, cols };
}

// Reactive grid dimensions
const gridRows = ref(20);
const gridCols = ref(25);

// Game instance (will be recreated on resize)
let gameInstance = new ThermalHuntGame({
  rows: gridRows.value,
  cols: gridCols.value,
  maxDistance: gridRows.value + gridCols.value,
});

// Reactive state
const gameOver = ref(false);
const revealedCount = ref(0);
const lastDistance = ref<number | null>(null);
const bestScore = ref<number | null>(null);

// Version counter for reactivity
const stateVersion = ref(0);

// Computed
const temperatureText = computed(() => gameInstance.getTemperatureText());
const maxDistance = computed(() => gridRows.value - 1 + gridCols.value - 1);

// Sync state from game instance
function syncState(): void {
  const state = gameInstance.getState();
  gameOver.value = state.gameOver;
  revealedCount.value = state.revealedCount;
  lastDistance.value = state.lastDistance;
  bestScore.value = gameInstance.bestScore;
  stateVersion.value++;
}

// Initialize game with calculated size
function initializeGame(): void {
  const { rows, cols } = calculateGridDimensions();
  gridRows.value = rows;
  gridCols.value = cols;
  gameInstance = new ThermalHuntGame({
    rows,
    cols,
    maxDistance: rows + cols,
  });
  syncState();
}

function handleClick(row: number, col: number): void {
  gameInstance.handleCellClick(row, col);
  syncState();
}

function getCellClass(row: number, col: number): string {
  void stateVersion.value;
  return gameInstance.getCellClass(row, col);
}

function getCellStyle(row: number, col: number): string {
  void stateVersion.value;
  return gameInstance.getCellStyle(row, col);
}

function getCellContent(row: number, col: number): string {
  void stateVersion.value;
  return gameInstance.getCellContent(row, col);
}

function getTemperatureChipColor(): string {
  if (lastDistance.value === null) return "grey";
  if (lastDistance.value === 0) return "red-darken-2";
  if (lastDistance.value <= 5) return "deep-orange";
  if (lastDistance.value <= 10) return "orange";
  if (lastDistance.value <= 15) return "amber";
  if (lastDistance.value <= 25) return "teal";
  return "blue";
}

function resetGame(): void {
  // Recalculate grid dimensions for new game
  const { rows, cols } = calculateGridDimensions();
  gridRows.value = rows;
  gridCols.value = cols;
  gameInstance = new ThermalHuntGame({
    rows,
    cols,
    maxDistance: rows + cols,
  });
  syncState();
}

// Handle window resize - only recalculate on new game
function handleResize(): void {
  // Don't interrupt active games, just update for next game
}

// Initialize on mount
onMounted(() => {
  initializeGame();
  window.addEventListener("resize", handleResize);
});

// Cleanup
onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.thermal-card {
  background: linear-gradient(180deg, #fff3e0 0%, #ffe0b2 100%);
  border: 3px solid #e65100;
}

.bg-gradient {
  background: linear-gradient(90deg, #e65100 0%, #ff6d00 50%, #ffab00 100%);
}

.cell {
  width: 24px;
  height: 24px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  font-size: 9px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}

.cell.hidden {
  background: linear-gradient(145deg, #bdbdbd, #9e9e9e);
  box-shadow: inset 1px 1px 2px rgba(255, 255, 255, 0.3),
    inset -1px -1px 2px rgba(0, 0, 0, 0.2);
}

.cell.hidden:hover {
  background: linear-gradient(145deg, #e0e0e0, #bdbdbd);
  transform: scale(1.15);
  z-index: 1;
}

.cell.revealed {
  color: rgba(0, 0, 0, 0.7);
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
}

.cell.target {
  font-size: 14px;
  animation: pulse 0.5s ease-in-out infinite alternate;
}

@keyframes pulse {
  from {
    transform: scale(1);
    box-shadow: 0 0 5px gold;
  }
  to {
    transform: scale(1.1);
    box-shadow: 0 0 15px gold, 0 0 25px orange;
  }
}

.legend-gradient {
  flex: 1;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  background: linear-gradient(
    to right,
    hsl(0, 85%, 50%),
    hsl(30, 85%, 50%),
    hsl(60, 85%, 50%),
    hsl(90, 85%, 50%),
    hsl(120, 85%, 50%),
    hsl(150, 85%, 50%),
    hsl(180, 85%, 50%),
    hsl(210, 85%, 50%),
    hsl(240, 85%, 50%)
  );
}
</style>
