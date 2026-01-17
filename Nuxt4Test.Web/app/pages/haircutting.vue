<template>
  <v-card class="mx-auto game-card" max-width="900">
    <v-card-title
      class="bg-gradient text-white d-flex align-center justify-space-between"
    >
      <div class="d-flex align-center ga-2">
        <span class="text-h5">✂️ Hair Salon</span>
      </div>
      <div class="d-flex align-center ga-3">
        <v-chip color="amber" variant="elevated" size="large">
          <v-icon start>mdi-star</v-icon>
          {{ score }}
        </v-chip>
        <v-chip color="purple" variant="elevated">
          Level {{ difficultyLevel }}
        </v-chip>
        <v-chip color="teal" variant="elevated">
          {{ completedGoals }} styles
        </v-chip>
      </div>
    </v-card-title>

    <v-card-text class="pa-0 position-relative">
      <!-- Tool palette -->
      <div class="tool-palette d-flex flex-column ga-1 pa-2">
        <v-tooltip
          v-for="tool in tools"
          :key="tool.type"
          :text="tool.label"
          location="end"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              :color="activeTool === tool.type ? 'primary' : 'grey-darken-3'"
              :variant="activeTool === tool.type ? 'elevated' : 'tonal'"
              icon
              size="large"
              @click="selectTool(tool.type)"
            >
              <span class="text-h6">{{ tool.icon }}</span>
            </v-btn>
          </template>
        </v-tooltip>
      </div>

      <!-- Game canvas -->
      <canvas ref="canvasEl" width="800" height="500" class="game-canvas" />

      <!-- Submit button -->
      <v-btn
        class="submit-btn"
        color="success"
        size="large"
        variant="elevated"
        @click="submitStyle"
      >
        <v-icon start>mdi-check-circle</v-icon>
        Submit Style
      </v-btn>
    </v-card-text>

    <v-card-actions class="bg-grey-darken-4 pa-3">
      <v-btn
        :color="isPaused ? 'success' : 'warning'"
        variant="tonal"
        @click="togglePause"
      >
        <v-icon start>{{ isPaused ? "mdi-play" : "mdi-pause" }}</v-icon>
        {{ isPaused ? "Resume" : "Pause" }}
      </v-btn>

      <v-btn color="error" variant="tonal" @click="resetGame">
        <v-icon start>mdi-refresh</v-icon>
        Reset
      </v-btn>

      <v-spacer />

      <div v-if="currentGoal" class="text-body-2 text-grey-lighten-1">
        <strong>Goal:</strong> {{ currentGoal.name }} —
        {{ currentGoal.description }}
        <v-chip class="ml-2" color="amber" size="small"
          >{{ currentGoal.basePoints }} pts</v-chip
        >
      </div>
    </v-card-actions>

    <!-- Result snackbar -->
    <v-snackbar
      v-model="showResult"
      :color="lastResult?.success ? 'success' : 'warning'"
      :timeout="3000"
    >
      {{ lastResult?.message }}
      <template #actions>
        <v-btn variant="text" @click="showResult = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import {
  HairCuttingGame,
  TOOLS,
  type ToolType,
  type StyleGoal,
} from "~/classes/haircutting";

// Canvas reference
const canvasEl = ref<HTMLCanvasElement | null>(null);

// Game instance
let game: HairCuttingGame | null = null;

// Reactive state version (for Vue reactivity bridge)
const stateVersion = ref(0);

// Tool list for UI
const tools = Object.values(TOOLS);

// Computed values that read from game state
const score = computed(() => {
  void stateVersion.value; // Trigger reactivity
  return game?.score ?? 0;
});

const difficultyLevel = computed(() => {
  void stateVersion.value;
  return game?.difficultyLevel ?? 1;
});

const completedGoals = computed(() => {
  void stateVersion.value;
  return game?.completedGoals ?? 0;
});

const currentGoal = computed((): StyleGoal | null => {
  void stateVersion.value;
  return game?.currentGoal ?? null;
});

const isPaused = computed(() => {
  void stateVersion.value;
  return game?.isPaused ?? false;
});

const activeTool = computed(() => {
  void stateVersion.value;
  return game?.activeTool ?? "scissors-small";
});

// Result display
const showResult = ref(false);
const lastResult = ref<{ success: boolean; message: string } | null>(null);

// Tool selection
function selectTool(tool: ToolType): void {
  game?.setTool(tool);
}

// Submit current style
function submitStyle(): void {
  if (!game) return;
  const result = game.submitStyle();
  lastResult.value = { success: result.success, message: result.message };
  showResult.value = true;
}

// Pause/resume
function togglePause(): void {
  game?.togglePause();
}

// Reset game
function resetGame(): void {
  game?.reset();
}

// Lifecycle
onMounted(() => {
  nextTick(() => {
    if (canvasEl.value) {
      game = new HairCuttingGame();
      game.setOnStateChange(() => {
        stateVersion.value++;
      });
      game.setup(canvasEl.value);
    }
  });
});

onUnmounted(() => {
  game?.cleanup();
  game = null;
});
</script>

<style scoped>
.game-card {
  background: #16213e;
}

.bg-gradient {
  background: linear-gradient(135deg, #e94560 0%, #0f3460 100%);
}

.game-canvas {
  display: block;
  width: 100%;
  height: auto;
  cursor: crosshair;
  touch-action: none;
}

.tool-palette {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
}

.submit-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 10;
}

.position-relative {
  position: relative;
}
</style>
