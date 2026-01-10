<template>
  <div class="hexlink-page">
    <!-- Game Board with overlaid title and score -->
    <div class="board-container">
      <HexBoard
        :placed-tiles="placedTiles"
        :valid-placements="validPlacements"
        :connected-paths="connectedPaths"
        :longest-chain-paths="longestChainPaths"
        :hex-size="hexSize"
        :score="gameState.score"
        @cell-click="handleCellClick"
      />
    </div>

    <!-- Controls -->
    <div class="controls-container">
      <TileHand
        :tiles="gameState.hand"
        :selected-index="gameState.selectedHandIndex"
        :tile-size="tileSize"
        @select="selectTile"
        @rotate="rotateTile"
      />
    </div>

    <!-- Instructions -->
    <div class="instructions-container">
      <v-card color="surface-variant" variant="tonal">
        <v-card-text class="text-center">
          <template v-if="gameState.gameOver">
            <div class="text-h5 mb-2 text-error">Game Over!</div>
            <div class="text-body-1 mb-4">
              Final Score: <strong>{{ gameState.score }}</strong> connected
              tiles
            </div>
            <v-btn color="primary" @click="resetGame"> Play Again </v-btn>
          </template>
          <template v-else-if="gameState.selectedHandIndex === null">
            <v-icon class="mr-2">mdi-hand-pointing-up</v-icon>
            Select a tile, tap again to rotate
          </template>
          <template v-else-if="validPlacements.length === 0">
            <v-icon class="mr-2 text-warning">mdi-alert</v-icon>
            Tap tile to rotate - no valid placements
          </template>
          <template v-else>
            <v-icon class="mr-2 text-success">mdi-cursor-default-click</v-icon>
            Tap highlighted hex to place ({{ validPlacements.length }} spots)
          </template>
        </v-card-text>
      </v-card>
    </div>

    <!-- Legend -->
    <div class="legend-container">
      <v-expansion-panels variant="accordion">
        <v-expansion-panel title="How to Play">
          <v-expansion-panel-text>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>🎯 Goal</v-list-item-title>
                <v-list-item-subtitle>
                  Build the longest chain of connected tiles
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>🧩 Tiles</v-list-item-title>
                <v-list-item-subtitle>
                  Each tile has colored paths connecting different edges
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>📍 Placement</v-list-item-title>
                <v-list-item-subtitle>
                  New tiles must connect to an existing tile's path
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>🔄 Rotation</v-list-item-title>
                <v-list-item-subtitle>
                  Tap a selected tile again to rotate it clockwise
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>🏆 Scoring</v-list-item-title>
                <v-list-item-subtitle>
                  Score = longest connected chain from center
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { HexPosition, GameState } from "~/classes/hexlink/types";
import { HexLinkGame } from "~/classes/hexlink/HexLinkGame";
import HexBoard from "~/components/hexlink/HexBoard.vue";
import TileHand from "~/components/hexlink/TileHand.vue";

// Game instance
const game = ref<HexLinkGame | null>(null);
const gameState = ref<GameState>({
  board: new Map(),
  hand: [],
  score: 0,
  gameOver: false,
  selectedHandIndex: null,
  connectedPaths: new Set(),
  longestChainPaths: new Set(),
});

// Responsive hex size
const hexSize = ref(60);
const tileSize = ref(80);

// Computed properties
const placedTiles = computed(() => {
  return Array.from(gameState.value.board.values());
});

const validPlacements = computed(() => {
  if (!game.value || gameState.value.selectedHandIndex === null) {
    return [];
  }
  return game.value.getValidPlacements(gameState.value.selectedHandIndex);
});

const connectedPaths = computed(() => {
  return gameState.value.connectedPaths;
});

const longestChainPaths = computed(() => {
  return gameState.value.longestChainPaths;
});

// Initialize game
onMounted(() => {
  initGame();
  updateSizes();
  window.addEventListener("resize", updateSizes);
});

function initGame() {
  game.value = new HexLinkGame();
  updateGameState();
}

function updateGameState() {
  if (game.value) {
    gameState.value = game.value.getState();
  }
}

function updateSizes() {
  // Adjust hex size based on screen width
  const width = window.innerWidth;
  
  // Calculate max possible hex size to fit width
  // Board width formula from HexBoard: 11*r + 30 (padding)
  // r = hexSize/2 - 2
  // So width = 11*(hexSize/2 - 2) + 30
  // width - 30 = 11*(hexSize/2 - 2)
  // (width - 30)/11 = hexSize/2 - 2
  // hexSize = 2 * ((width - 30)/11 + 2)
  
  // We want some page padding too (e.g. 16px total)
  const availableWidth = width - 16;
  const maxHexSize = 2 * ((availableWidth - 30) / 11 + 2);

  // Cap at 60 (desktop size) or calculated size
  hexSize.value = Math.min(60, Math.floor(maxHexSize));
  
  // Update tile size for hand relative to hex size
  // Keep it slightly larger than hex size
  tileSize.value = Math.min(80, Math.floor(hexSize.value * 1.3));
}

function selectTile(index: number) {
  if (game.value) {
    game.value.selectHandTile(index);
    updateGameState();
  }
}

function rotateTile(_index: number) {
  if (game.value) {
    game.value.rotateSelectedTile(true);
    updateGameState();
  }
}

function handleCellClick(position: HexPosition) {
  if (!game.value || gameState.value.selectedHandIndex === null) {
    return;
  }

  const success = game.value.placeTile(
    position,
    gameState.value.selectedHandIndex
  );
  if (success) {
    updateGameState();
  }
}

function resetGame() {
  if (game.value) {
    game.value.reset();
    updateGameState();
  }
}
</script>

<style scoped>
.hexlink-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  box-sizing: border-box;
  overflow-x: hidden;
  width: 100%;
}



.board-container {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 100vw;
  padding: 0 8px;
  box-sizing: border-box;
}



.controls-container {
  display: flex;
  justify-content: center;
  margin: 8px 0;
  width: 100%;
  padding: 0 8px;
  box-sizing: border-box;
}

.instructions-container,
.legend-container {
  width: 100%;
  max-width: 400px;
  margin: 8px auto;
  padding: 0 8px;
  box-sizing: border-box;
}

@media (min-width: 600px) {
  .hexlink-page {
    padding: 16px;
  }


}
</style>
