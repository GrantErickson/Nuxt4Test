<template>
  <v-card class="mx-auto physics-card">
    <v-card-title
      class="bg-gradient text-white d-flex align-center justify-space-between flex-wrap ga-2"
    >
      <span>🎱 Physics Playground</span>
      <div class="d-flex align-center ga-2 flex-wrap">
        <v-chip color="purple-darken-1" variant="flat" size="small">
          📦 {{ shapeCount }}
        </v-chip>
        <v-chip color="blue-darken-1" variant="flat" size="small">
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
      <div class="d-flex justify-center ga-2 mt-4 flex-wrap">
        <v-btn
          color="purple-darken-2"
          prepend-icon="mdi-refresh"
          size="small"
          @click="resetSimulation"
        >
          Reset
        </v-btn>
        <v-btn
          :color="isPaused ? 'success' : 'warning'"
          :prepend-icon="isPaused ? 'mdi-play' : 'mdi-pause'"
          size="small"
          @click="togglePause"
        >
          {{ isPaused ? "Play" : "Pause" }}
        </v-btn>
        <v-btn
          color="blue-darken-2"
          prepend-icon="mdi-shape"
          size="small"
          @click="dropShape"
        >
          Drop
        </v-btn>
      </div>

      <!-- Settings -->
      <div class="d-flex justify-center ga-2 mt-4 flex-wrap align-center">
        <span class="text-caption">Rate:</span>
        <v-btn-toggle
          v-model="dropRate"
          mandatory
          color="purple"
          density="compact"
        >
          <v-btn value="slow" size="x-small">Slow</v-btn>
          <v-btn value="medium" size="x-small">Med</v-btn>
          <v-btn value="fast" size="x-small">Fast</v-btn>
        </v-btn-toggle>
      </div>

      <!-- Lifetime setting -->
      <div class="d-flex justify-center ga-2 mt-4 flex-wrap align-center slider-row">
        <span class="text-caption">Life:</span>
        <v-slider
          v-model="shapeLifetime"
          :min="5"
          :max="60"
          :step="5"
          thumb-label
          hide-details
          density="compact"
          color="purple"
          class="slider-control"
        >
          <template #thumb-label="{ modelValue }"> {{ modelValue }}s </template>
        </v-slider>
        <span class="text-caption">{{ shapeLifetime }}s</span>
      </div>

      <!-- Bounciness setting -->
      <div class="d-flex justify-center ga-2 mt-4 flex-wrap align-center slider-row">
        <span class="text-caption">Bounce:</span>
        <v-slider
          v-model="bounciness"
          :min="0"
          :max="1"
          :step="0.1"
          thumb-label
          hide-details
          density="compact"
          color="orange"
          class="slider-control"
        >
          <template #thumb-label="{ modelValue }"> {{ modelValue }} </template>
        </v-slider>
        <span class="text-caption">{{ bounciness.toFixed(1) }}</span>
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
  const _ = stateVersion.value; // Force reactivity dependency
  return game?.shapeCount ?? 0;
});
const elapsed = computed(() => {
  const _ = stateVersion.value; // Force reactivity dependency
  return game?.elapsed ?? 0;
});
const isPaused = computed(() => {
  const _ = stateVersion.value; // Force reactivity dependency
  return game?.isPaused ?? false;
});

// User-configurable settings
const dropRate = ref<DropRate>("medium");
const shapeLifetime = ref(15);
const bounciness = ref(0.3);

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

watch(bounciness, (newBounciness) => {
  if (game) {
    game.bounciness = newBounciness;
  }
});

onMounted(() => {
  nextTick(() => {
    if (!canvasEl.value || !canvasContainer.value) return;

    // Calculate canvas size based on container width (max 500px)
    const containerWidth = Math.min(canvasContainer.value.clientWidth, 500);
    const canvasHeight = Math.round(containerWidth * 1.5); // 2:3 aspect ratio (taller)

    game = new PhysicsGame({
      shapeLifetimeSeconds: shapeLifetime.value,
      dropRate: dropRate.value,
      canvasWidth: containerWidth,
      canvasHeight: canvasHeight,
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
  width: 100%;
  max-width: 500px;
}

canvas {
  display: block;
  width: 100%;
  height: auto;
}

.slider-row {
  width: 100%;
  max-width: 350px;
}

.slider-control {
  flex: 1;
  min-width: 100px;
  max-width: 180px;
}
</style>
