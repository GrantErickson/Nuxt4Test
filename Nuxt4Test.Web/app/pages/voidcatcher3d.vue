<template>
  <v-card class="mx-auto voidcatcher3d-card">
    <v-card-title
      class="bg-gradient text-white d-flex align-center justify-space-between flex-wrap ga-2"
    >
      <span>🌌 Void Catcher 3D</span>
      <div class="d-flex align-center ga-2 flex-wrap">
        <v-chip color="purple-darken-1" variant="flat" size="small">
          💎 {{ state.score }}
        </v-chip>
        <v-chip color="blue-darken-1" variant="flat" size="small">
          🏆 {{ state.highScore }}
        </v-chip>
        <v-chip
          v-if="state.multiplier > 1"
          color="orange-darken-1"
          variant="flat"
          size="small"
        >
          🔥 {{ state.multiplier }}x
        </v-chip>
      </div>
    </v-card-title>

    <v-card-text class="pa-4">
      <div class="d-flex flex-column align-center">
        <!-- Game canvas -->
        <div ref="canvasContainer" class="canvas-container">
          <canvas ref="canvasEl" width="800" height="600" />

          <!-- Game Over Overlay -->
          <div v-if="state.isGameOver" class="game-over-overlay">
            <div class="game-over-content">
              <h2 class="text-h3 mb-4">Game Over!</h2>
              <div class="text-h5 mb-2">Final Score: {{ state.score }}</div>
              <div
                v-if="state.score === state.highScore"
                class="text-h6 mb-4 text-orange"
              >
                🏆 New High Score! 🏆
              </div>
              <v-btn
                color="purple-darken-2"
                size="large"
                prepend-icon="mdi-refresh"
                @click="handleReset"
              >
                Play Again
              </v-btn>
            </div>
          </div>

          <!-- Instructions Overlay -->
          <div v-if="showInstructions" class="instructions-overlay">
            <div class="instructions-content">
              <h2 class="text-h4 mb-4">How to Play - 3D Edition</h2>
              <div class="text-body-1 mb-3">
                🖱️ <strong>Move your mouse</strong> or <strong>touch</strong> to
                control the void
              </div>
              <div class="text-body-1 mb-3">
                🌀 3D shapes fall from the edges toward the center
              </div>
              <div class="text-body-1 mb-3">
                🎯 Catch shapes by positioning the void under them as they fall
              </div>
              <div class="text-body-1 mb-3">
                ⭐ <strong>Perfect Catch</strong> (50 pts): Catch shapes before
                they touch the ground
              </div>
              <div class="text-body-1 mb-3">
                💎 <strong>Standard Catch</strong> (10 pts): Catch shapes after
                they land
              </div>
              <div class="text-body-1 mb-3">
                🔥 Chain perfect catches to build your multiplier (max 5x)!
              </div>
              <div class="text-body-1 mb-4">
                ✨ <strong>Golden shapes</strong> are power-ups with special
                effects!
              </div>
              <v-btn
                color="purple-darken-2"
                size="large"
                @click="showInstructions = false"
              >
                Got it!
              </v-btn>
            </div>
          </div>

          <!-- Active Power-ups Display -->
          <div v-if="activePowerUps.length > 0" class="powerups-overlay">
            <div
              v-for="powerUp in activePowerUps"
              :key="powerUp.type"
              class="powerup-bar"
            >
              <div class="powerup-label">
                {{ getPowerUpIcon(powerUp.type) }}
                {{ getPowerUpName(powerUp.type) }}
              </div>
              <v-progress-linear
                :model-value="powerUp.progress * 100"
                :color="getPowerUpColor(powerUp.type)"
                height="8"
                rounded
              />
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-row mt-3">
          <v-chip color="indigo" variant="outlined" size="small">
            📦 Shapes: {{ state.shapeCount }}
          </v-chip>
          <v-chip color="indigo" variant="outlined" size="small">
            ⏱️ Time: {{ Math.floor(state.elapsed) }}s
          </v-chip>
          <v-chip
            v-if="state.perfectCatchStreak > 0"
            color="orange"
            variant="flat"
            size="small"
          >
            🎯 Streak: {{ state.perfectCatchStreak }}
          </v-chip>
          <v-chip
            v-if="gameMode === 'timed' && state.timeRemaining !== undefined"
            :color="state.timeRemaining < 10 ? 'red' : 'green'"
            variant="flat"
            size="small"
          >
            ⏰ {{ Math.ceil(state.timeRemaining) }}s
          </v-chip>
        </div>
      </div>

      <!-- Controls -->
      <div class="d-flex justify-center ga-2 mt-4 flex-wrap">
        <v-btn
          v-if="!state.isGameOver"
          :color="state.isPaused ? 'success' : 'warning'"
          :prepend-icon="state.isPaused ? 'mdi-play' : 'mdi-pause'"
          size="small"
          @click="handleTogglePause"
        >
          {{ state.isPaused ? "Resume" : "Pause" }}
        </v-btn>
        <v-btn
          color="purple-darken-2"
          prepend-icon="mdi-refresh"
          size="small"
          @click="handleReset"
        >
          New Game
        </v-btn>
        <v-btn
          color="blue-darken-2"
          prepend-icon="mdi-information"
          size="small"
          @click="showInstructions = true"
        >
          Help
        </v-btn>
      </div>

      <!-- Game Mode Selection -->
      <div class="d-flex justify-center ga-2 mt-4 flex-wrap align-center">
        <span class="text-caption">Mode:</span>
        <v-btn-toggle
          v-model="gameMode"
          mandatory
          color="purple"
          density="compact"
          @update:model-value="handleModeChange"
        >
          <v-btn value="endless" size="x-small">Endless</v-btn>
          <v-btn value="timed" size="x-small">Timed (2m)</v-btn>
        </v-btn-toggle>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from "vue";
import { VoidCatcher3DGame } from "~/classes/voidcatcher3d";
import type { VoidCatcher3DState, GameMode } from "~/classes/voidcatcher3d";

const canvasEl = ref<HTMLCanvasElement | null>(null);
const canvasContainer = ref<HTMLElement | null>(null);
const showInstructions = ref(true);
const gameMode = ref<GameMode>("endless");

let game: VoidCatcher3DGame | null = null;

const state = reactive<VoidCatcher3DState>({
  score: 0,
  highScore: 0,
  isGameOver: false,
  isPaused: false,
  elapsed: 0,
  shapeCount: 0,
  perfectCatchStreak: 0,
  multiplier: 1,
  voidRadius: 5,
  timeRemaining: undefined,
});

const updateState = () => {
  if (game) {
    const newState = game.getState();
    Object.assign(state, newState);
    // Update active powerups
    activePowerUps.value = game.getActivePowerUps();
  }
};

// Active powerups tracking
const activePowerUps = ref<{ type: string; progress: number }[]>([]);

const getPowerUpIcon = (type: string): string => {
  const icons: Record<string, string> = {
    grow: "⬆️",
    shrink: "⬇️",
    slow: "🐢",
    fast: "🐇",
    magnet: "🧲",
  };
  return icons[type] || "✨";
};

const getPowerUpName = (type: string): string => {
  const names: Record<string, string> = {
    grow: "Big Void",
    shrink: "Small Void",
    slow: "Slow Spawn",
    fast: "Fast Spawn",
    magnet: "Magnet",
  };
  return names[type] || type;
};

const getPowerUpColor = (type: string): string => {
  // Positive powerups get inviting colors, negative get red/warning colors
  const colors: Record<string, string> = {
    grow: "green", // positive
    shrink: "red", // negative
    slow: "blue", // positive
    fast: "red-darken-2", // negative
    magnet: "cyan", // positive
  };
  return colors[type] || "purple";
};

const handleTogglePause = () => {
  game?.togglePause();
  updateState();
};

const handleReset = () => {
  game?.reset();
  updateState();
};

const handleModeChange = (newMode: GameMode) => {
  // Recreate game with new mode
  if (game) {
    game.destroy();
  }
  initGame(newMode);
};

const initGame = (mode: GameMode = "endless") => {
  if (!canvasEl.value || !canvasContainer.value) return;

  game = new VoidCatcher3DGame({
    playAreaSize: 50,
    voidRadius: 5,
    initialSpawnRate: 1000,
    gameMode: mode,
    timedModeDuration: 120,
  });

  game.setup(canvasEl.value, canvasContainer.value);
  game.setStateChangeCallback(updateState);
  updateState();
};

onMounted(() => {
  initGame(gameMode.value);
});

onUnmounted(() => {
  if (game) {
    game.destroy();
    game = null;
  }
});
</script>

<style scoped>
.voidcatcher3d-card {
  max-width: 900px;
}

.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.canvas-container {
  position: relative;
  display: inline-block;
  border: 3px solid #667eea;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.stats-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.game-over-content {
  text-align: center;
  color: white;
  padding: 2rem;
}

.instructions-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 26, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  padding: 2rem;
  overflow-y: auto;
}

.instructions-content {
  text-align: center;
  color: white;
  max-width: 500px;
}

.powerups-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 5;
  min-width: 150px;
}

.powerup-bar {
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  padding: 8px 12px;
  backdrop-filter: blur(4px);
}

.powerup-label {
  font-size: 12px;
  color: white;
  margin-bottom: 4px;
  font-weight: 500;
}

.text-orange {
  color: #ffa726;
}

canvas {
  display: block;
  touch-action: none;
}
</style>
