<template>
  <v-card class="mx-auto physics-card">
    <v-card-title
      class="bg-gradient text-white d-flex align-center justify-space-between flex-wrap ga-2"
    >
      <span>🎱 Physics Playground</span>
      <div class="d-flex align-center ga-2 flex-wrap">
        <v-chip color="purple-darken-1" variant="flat">
          📦 {{ shapeCount }} shapes
        </v-chip>
        <v-chip color="blue-darken-1" variant="flat">
          ⏱️ {{ Math.floor(elapsed) }}s
        </v-chip>
      </div>
    </v-card-title>

    <v-card-text class="pa-4">
      <div class="d-flex flex-column align-center">
        <!-- Physics canvas -->
        <div ref="canvasContainer" class="canvas-container">
          <canvas ref="canvasEl" @click="handleCanvasClick"></canvas>
        </div>
      </div>

      <!-- Controls -->
      <div class="d-flex justify-center ga-4 mt-4 flex-wrap">
        <v-btn
          color="purple-darken-2"
          prepend-icon="mdi-refresh"
          @click="resetSimulation"
        >
          Reset
        </v-btn>
        <v-btn
          :color="isPaused ? 'success' : 'warning'"
          :prepend-icon="isPaused ? 'mdi-play' : 'mdi-pause'"
          @click="togglePause"
        >
          {{ isPaused ? "Play" : "Pause" }}
        </v-btn>
        <v-btn
          color="blue-darken-2"
          prepend-icon="mdi-shape"
          @click="dropShape"
        >
          Drop Shape
        </v-btn>
      </div>

      <!-- Settings -->
      <div class="d-flex justify-center ga-4 mt-4 flex-wrap align-center">
        <span class="text-caption">Drop Rate:</span>
        <v-btn-toggle
          v-model="dropRate"
          mandatory
          color="purple"
          density="compact"
        >
          <v-btn value="slow" size="small">Slow</v-btn>
          <v-btn value="medium" size="small">Medium</v-btn>
          <v-btn value="fast" size="small">Fast</v-btn>
        </v-btn-toggle>
      </div>

      <!-- Lifetime setting -->
      <div class="d-flex justify-center ga-4 mt-4 flex-wrap align-center">
        <span class="text-caption">Shape Lifetime:</span>
        <v-slider
          v-model="shapeLifetime"
          :min="5"
          :max="60"
          :step="5"
          thumb-label
          hide-details
          density="compact"
          color="purple"
          style="max-width: 200px"
        >
          <template #thumb-label="{ modelValue }"> {{ modelValue }}s </template>
        </v-slider>
        <span class="text-caption">{{ shapeLifetime }}s</span>
      </div>

      <div class="text-center text-caption text-grey-darken-1 mt-4">
        Shapes fall and pile up. Each shape vanishes after
        {{ shapeLifetime }} seconds!
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { PhysicsGame } from "~/classes/physics";
import type { DropRate } from "~/classes/physics";

const canvasContainer = ref<HTMLElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);

// Game instance
let game: PhysicsGame | null = null;

// Reactive state (updated via callback)
const stateVersion = ref(0);
const shapeCount = computed(() => {
  stateVersion.value; // Force reactivity
  return game?.shapeCount ?? 0;
});
const elapsed = computed(() => {
  stateVersion.value;
  return game?.elapsed ?? 0;
});
const isPaused = computed(() => {
  stateVersion.value;
  return game?.isPaused ?? false;
});

// User-configurable settings
const dropRate = ref<DropRate>("medium");
const shapeLifetime = ref(15);

function handleCanvasClick(event: MouseEvent): void {
  if (!canvasEl.value || !game) return;

  const rect = canvasEl.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  game.removeShapeAtPosition(x, y);
}

function dropShape(): void {
  game?.dropShape();
}

function togglePause(): void {
  game?.togglePause();
}

function resetSimulation(): void {
  game?.reset();
}

// Watch settings and sync to game
watch(dropRate, (newRate) => {
  if (game) {
    game.dropRate = newRate;
  }
});

watch(shapeLifetime, (newLifetime) => {
  if (game) {
    game.shapeLifetimeSeconds = newLifetime;
  }
});

onMounted(() => {
  nextTick(() => {
    if (!canvasEl.value || !canvasContainer.value) return;

    game = new PhysicsGame({
      shapeLifetimeSeconds: shapeLifetime.value,
      dropRate: dropRate.value,
    });

    // Set up state change callback to trigger Vue reactivity
    game.setOnStateChange(() => {
      stateVersion.value++;
    });

    game.setup(canvasEl.value, canvasContainer.value);
  });
});

onUnmounted(() => {
  game?.cleanup();
  game = null;
});
</script>

<style scoped>
.physics-card {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border: 3px solid #0f3460;
}

.bg-gradient {
  background: linear-gradient(90deg, #0f3460 0%, #533483 50%, #e94560 100%);
}

.canvas-container {
  border: 3px solid #0f3460;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1a2e;
}

canvas {
  display: block;
}
</style>
