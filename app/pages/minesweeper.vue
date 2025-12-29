<template>
  <v-card class="mx-auto wilderness-card" max-width="750">
    <v-card-title
      class="bg-green-darken-4 text-white d-flex align-center justify-space-between"
    >
      <span>🏕️ Wilderness Bear Patrol 🌲</span>
      <div class="d-flex align-center ga-4">
        <v-chip color="brown-darken-1" variant="flat">
          🐻 {{ mineCount - flagCount }} bears
        </v-chip>
        <v-chip color="amber-darken-2" variant="flat">
          🔥 {{ flagCount }} campfires
        </v-chip>
        <v-chip color="blue-grey" variant="flat"> ⏱️ {{ timer }}s </v-chip>
      </div>
    </v-card-title>

    <v-card-text class="pa-4 position-relative">
      <!-- Wilderness header decoration -->
      <div class="text-center mb-2 wilderness-header">
        🌲🌳🌲 {{ getRandomTreeLine() }} 🌲🌳🌲
      </div>

      <!-- Game board -->
      <div class="d-flex flex-column align-center position-relative">
        <!-- Game status overlay -->
        <v-alert
          v-if="gameOver"
          :type="won ? 'success' : 'error'"
          class="game-over-overlay"
          :icon="false"
        >
          <template v-if="won">
            🎉🏕️ You safely navigated the wilderness! The campsite is secure! ⛺
          </template>
          <template v-else> 🐻💥 You wandered into a bear's den! 🌲 </template>
        </v-alert>

        <div v-for="row in boardSize" :key="'row-' + row" class="d-flex">
          <div
            v-for="col in boardSize"
            :key="'cell-' + row + '-' + col"
            class="cell d-flex align-center justify-center"
            :class="getCellClass(row - 1, col - 1)"
            @click="revealCell(row - 1, col - 1)"
            @contextmenu.prevent="toggleFlag(row - 1, col - 1)"
          >
            {{ getCellContent(row - 1, col - 1) }}
          </div>
        </div>
      </div>

      <!-- Wilderness footer decoration -->
      <div class="text-center mt-2 wilderness-footer">🌿🍂🌿🍃🌿🍂🌿</div>

      <!-- Controls -->
      <div class="d-flex justify-center ga-4 mt-4">
        <v-btn
          color="green-darken-3"
          prepend-icon="mdi-tent"
          @click="resetGame"
        >
          New Expedition
        </v-btn>
        <v-btn
          :color="flagMode ? 'orange-darken-2' : 'grey'"
          :variant="flagMode ? 'flat' : 'outlined'"
          @click="toggleFlagMode"
        >
          🔥 Campfire Mode {{ flagMode ? "ON" : "OFF" }}
        </v-btn>
        <v-btn
          color="blue-darken-1"
          variant="flat"
          :disabled="gameOver || !hasUnrevealedOpenArea()"
          @click="revealLargestOpenArea"
        >
          🧭 Hint
        </v-btn>
      </div>

      <!-- Instructions -->
      <div class="text-center text-caption text-brown-darken-2 mt-4">
        🧭 Left-click to explore. Right-click (or use Campfire Mode) to mark
        bear dens with campfires to scare them away!
      </div>
    </v-card-text>

    <!-- Legend -->
    <v-card-text class="bg-brown-lighten-5">
      <div class="text-subtitle-2 mb-2">🗺️ Wilderness Survival Guide:</div>
      <ul class="text-body-2">
        <li>🥾 Explore the forest without stumbling into bear dens 🐻</li>
        <li>
          🔢 Numbers reveal how many bears are lurking nearby in the shadows
        </li>
        <li>
          🔥 Place campfires to mark where you think bears are hiding - fire
          keeps them away!
        </li>
        <li>
          🌲 The forest hides many secrets... tread carefully, adventurer!
        </li>
        <li>⛺ Clear all safe zones to secure the campsite and win!</li>
      </ul>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { MinesweeperGame } from "~/classes/minesweeper";

// Initialize game instance
const gameInstance = new MinesweeperGame();

// Reactive state synced with game instance
const gameOver = ref(gameInstance.gameOver);
const won = ref(gameInstance.won);
const flagMode = ref(gameInstance.flagMode);
const timer = ref(gameInstance.timer);

// Constants from game
const boardSize = gameInstance.boardSize;
const mineCount = gameInstance.mineCount;

// Computed values
const flagCount = computed(() => gameInstance.flagCount);

// Set timer callback for reactivity
gameInstance.setTimerCallback(() => {
  timer.value = gameInstance.timer;
});

// Trigger to force template re-render
const boardVersion = ref(0);

// Sync state from game instance
function syncState(): void {
  const state = gameInstance.getState();
  gameOver.value = state.gameOver;
  won.value = state.won;
  flagMode.value = state.flagMode;
  timer.value = state.timer;
  // Force reactivity update by incrementing version
  boardVersion.value++;
}

function revealCell(row: number, col: number): void {
  gameInstance.handleCellClick(row, col);
  syncState();
}

function toggleFlag(row: number, col: number): void {
  gameInstance.handleRightClick(row, col);
  syncState();
}

function getCellClass(row: number, col: number): string {
  // Access boardVersion to create reactive dependency
  void boardVersion.value;
  return gameInstance.getCellClass(row, col);
}

function getCellContent(row: number, col: number): string {
  // Access boardVersion to create reactive dependency
  void boardVersion.value;
  return gameInstance.getCellContent(row, col);
}

function getRandomTreeLine(): string {
  return gameInstance.getRandomTreeLine();
}

function hasUnrevealedOpenArea(): boolean {
  return gameInstance.hasHint();
}

function revealLargestOpenArea(): void {
  gameInstance.useHint();
  syncState();
}

function resetGame(): void {
  gameInstance.reset();
  syncState();
}

function toggleFlagMode(): void {
  gameInstance.toggleFlagMode();
  flagMode.value = gameInstance.flagMode;
}

// Initialize game on mount
onMounted(() => {
  syncState();
});

// Clean up on unmount
onUnmounted(() => {
  gameInstance.destroy();
});
</script>

<style scoped>
.wilderness-card {
  background: linear-gradient(180deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 3px solid #2e7d32;
}

.wilderness-header {
  font-size: 14px;
  color: #1b5e20;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.wilderness-footer {
  font-size: 12px;
  letter-spacing: 2px;
}

.game-over-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  min-width: 280px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: overlayPop 0.3s ease-out;
}

@keyframes overlayPop {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.cell {
  width: 32px;
  height: 32px;
  border: 1px solid #33691e;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
  border-radius: 2px;
}

.cell.hidden {
  background: linear-gradient(145deg, #66bb6a, #43a047);
  box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.3),
    inset -2px -2px 4px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.cell.hidden:hover {
  background: linear-gradient(145deg, #81c784, #66bb6a);
  transform: scale(1.05);
  box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.4),
    inset -2px -2px 4px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.2);
}

.cell.revealed {
  background: linear-gradient(145deg, #d7ccc8, #bcaaa4);
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.1);
}

.cell.mine {
  background: linear-gradient(145deg, #a1887f, #8d6e63) !important;
  animation: bearShake 0.5s ease-in-out;
}

@keyframes bearShake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px) rotate(-5deg);
  }
  75% {
    transform: translateX(2px) rotate(5deg);
  }
}

.cell.flagged {
  background: linear-gradient(145deg, #ff9800, #f57c00);
  animation: fireGlow 1s ease-in-out infinite alternate;
}

@keyframes fireGlow {
  from {
    box-shadow: 0 0 5px #ff9800, 0 0 10px #ff5722;
  }
  to {
    box-shadow: 0 0 10px #ff9800, 0 0 20px #ff5722, 0 0 30px #ff9800;
  }
}

/* Number colors - wilderness theme */
.cell.revealed:not(.mine) {
  color: #1565c0; /* 1 - river blue */
}

/* Different colors for different numbers */
.cell.revealed:nth-child(2n):not(.mine) {
  color: #2e7d32; /* forest green */
}

.cell.revealed:nth-child(3n):not(.mine) {
  color: #c62828; /* danger red */
}

.cell.revealed:nth-child(5n):not(.mine) {
  color: #6a1b9a; /* mysterious purple */
}
</style>
