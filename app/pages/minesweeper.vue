<template>
  <v-card class="mx-auto wilderness-card" max-width="750">
    <v-card-title
      class="bg-green-darken-4 text-white d-flex align-center justify-space-between flex-wrap ga-2"
    >
      <span>🏕️ Bear Patrol 🌲</span>
      <div class="d-flex align-center ga-2 flex-wrap">
        <v-chip color="brown-darken-1" variant="flat" size="small">
          🐻 {{ mineCount - flagCount }}
        </v-chip>
        <v-chip color="amber-darken-2" variant="flat" size="small">
          🔥 {{ flagCount }}
        </v-chip>
        <v-chip color="blue-grey" variant="flat" size="small"> ⏱️ {{ timer }}s </v-chip>
      </div>
    </v-card-title>

    <v-card-text class="pa-4 position-relative">
      <!-- Wilderness header decoration -->
      <div class="text-center mb-2 wilderness-header">
        🌲🌳🌲 {{ getRandomTreeLine() }} 🌲🌳🌲
      </div>

      <!-- Game board -->
      <div class="board-container">
        <div class="game-board position-relative" :style="{ '--cols': boardSize }">
          <!-- Game status overlay -->
          <v-alert
            v-if="gameOver"
            :type="won ? 'success' : 'error'"
            class="game-over-overlay"
            :icon="false"
          >
            <template v-if="won">
              🎉 Campsite secured! ⛺
            </template>
            <template v-else> 🐻💥 Bear attack! 🌲 </template>
          </v-alert>

          <template v-for="row in boardSize" :key="'row-' + row">
            <div
              v-for="col in boardSize"
              :key="'cell-' + row + '-' + col"
              class="cell d-flex align-center justify-center"
              :class="getCellClass(row - 1, col - 1)"
              @click="revealCell(row - 1, col - 1)"
              @contextmenu.prevent="toggleFlag(row - 1, col - 1)"
              @touchstart.passive="handleTouchStart(row - 1, col - 1, $event)"
              @touchend="handleTouchEnd"
              @touchmove.passive="handleTouchMove"
            >
              {{ getCellContent(row - 1, col - 1) }}
            </div>
          </template>
        </div>
      </div>

      <!-- Wilderness footer decoration -->
      <div class="text-center mt-2 wilderness-footer">🌿🍂🌿🍃🌿🍂🌿</div>

      <!-- Controls -->
      <div class="d-flex justify-center ga-2 mt-4 flex-wrap">
        <v-btn
          color="green-darken-3"
          prepend-icon="mdi-tent"
          size="small"
          @click="resetGame"
        >
          New Game
        </v-btn>
        <v-btn
          :color="flagMode ? 'orange-darken-2' : 'grey'"
          :variant="flagMode ? 'flat' : 'outlined'"
          size="small"
          @click="toggleFlagMode"
        >
          🔥 Flag {{ flagMode ? "ON" : "OFF" }}
        </v-btn>
        <v-btn
          color="blue-darken-1"
          variant="flat"
          size="small"
          :disabled="gameOver || !hasUnrevealedOpenArea()"
          @click="revealLargestOpenArea"
        >
          🧭 Hint
        </v-btn>
      </div>

      <!-- Instructions -->
      <div class="text-center text-caption text-brown-darken-2 mt-4">
        🧭 Tap to explore. Long-press to mark bear dens with campfires!
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

// Touch handling for press-and-hold flagging
let touchTimer: ReturnType<typeof setTimeout> | null = null;
let touchStartPos: { x: number; y: number } | null = null;
let longPressTriggered = false;
const LONG_PRESS_DURATION = 400; // ms
const TOUCH_MOVE_THRESHOLD = 10; // pixels

function handleTouchStart(row: number, col: number, event: TouchEvent): void {
  longPressTriggered = false;
  const touch = event.touches[0];
  if (touch) {
    touchStartPos = { x: touch.clientX, y: touch.clientY };
  }

  touchTimer = setTimeout(() => {
    longPressTriggered = true;
    toggleFlag(row, col);
    // Vibrate if available for haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, LONG_PRESS_DURATION);
}

function handleTouchEnd(event: TouchEvent): void {
  if (touchTimer) {
    clearTimeout(touchTimer);
    touchTimer = null;
  }
  // Prevent click from firing after long press
  if (longPressTriggered) {
    event.preventDefault();
  }
  touchStartPos = null;
}

function handleTouchMove(event: TouchEvent): void {
  // Cancel long press if finger moves too much
  if (touchTimer && touchStartPos) {
    const touch = event.touches[0];
    if (touch) {
      const dx = Math.abs(touch.clientX - touchStartPos.x);
      const dy = Math.abs(touch.clientY - touchStartPos.y);
      if (dx > TOUCH_MOVE_THRESHOLD || dy > TOUCH_MOVE_THRESHOLD) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
    }
  }
}

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
  // Don't reveal if long press just triggered a flag
  if (longPressTriggered) {
    longPressTriggered = false;
    return;
  }
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

.board-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.game-board {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  gap: 1px;
  width: 100%;
  max-width: min(100%, calc(var(--cols) * 32px));
  aspect-ratio: 1;
}

.cell {
  aspect-ratio: 1;
  border: 1px solid #33691e;
  font-size: clamp(10px, 2.5vw, 14px);
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
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
