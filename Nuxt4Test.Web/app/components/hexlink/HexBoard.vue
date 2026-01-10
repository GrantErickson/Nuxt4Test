<template>
  <div class="hex-board" :style="boardStyle">
    <div class="board-header-overlay">
      <span class="board-title">HexLink</span>
      <span class="board-score">Score: {{ score }}</span>
    </div>
    <!-- Base layer: tiles without edge indicators -->
    <div
      v-for="pos in allPositions"
      :key="'base-' + positionToKey(pos)"
      class="hex-cell"
      :style="getCellStyle(pos, false)"
    >
      <HexTile
        :tile-type-id="getTileAt(pos)?.typeId"
        :rotation="getTileAt(pos)?.rotation"
        :size="hexSize"
        :is-empty="!getTileAt(pos)"
        :is-highlighted="isValidPlacement(pos)"
        :connected-paths="connectedPaths"
        :longest-chain-paths="longestChainPaths"
        :position-key="positionToKey(pos)"
        :show-edge-indicators="false"
        :position-label="getPositionLabel(pos)"
        @click="handleCellClick(pos)"
      />
    </div>
    <!-- Overlay layer: edge indicators only (rendered on top) -->
    <div
      v-for="pos in placedPositions"
      :key="'indicators-' + positionToKey(pos)"
      class="hex-cell hex-indicators"
      :style="getCellStyle(pos, true)"
    >
      <HexTile
        :tile-type-id="getTileAt(pos)?.typeId"
        :rotation="getTileAt(pos)?.rotation"
        :size="hexSize"
        :is-empty="false"
        :is-highlighted="false"
        :connected-paths="connectedPaths"
        :longest-chain-paths="longestChainPaths"
        :position-key="positionToKey(pos)"
        :show-edge-indicators="true"
        :indicators-only="true"
        :position-label="''"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PlacedTile, HexPosition } from "~/classes/hexlink/types";
import {
  getAllBoardPositions,
  positionToKey,
  getRing,
} from "~/classes/hexlink/types";
import HexTile from "./HexTile.vue";

const props = defineProps<{
  placedTiles: PlacedTile[];
  validPlacements: HexPosition[];
  connectedPaths: Set<string>;
  longestChainPaths: Set<string>;
  hexSize?: number;
  score: number;
}>();

const emit = defineEmits<{
  cellClick: [position: HexPosition];
}>();

const hexSize = computed(() => props.hexSize ?? 60);
const allPositions = getAllBoardPositions();

// Get positions that have tiles placed
const placedPositions = computed(() => {
  return allPositions.filter((pos) => getTileAt(pos) !== undefined);
});

// For flat-top hexes:
// Width (point-to-point) = 2 * radius
// Height (flat-to-flat) = sqrt(3) * radius
// The hex SVG is hexSize x hexSize, with the actual hex having radius = hexSize/2 - 2
const hexRadius = computed(() => hexSize.value / 2 - 2);

// Board size calculation for 7 hexes diameter (3 rings + center)
const boardSize = computed(() => {
  const r = hexRadius.value;
  // For flat-top: width per hex column = 1.5 * r, plus half hex on each end
  // Height per hex row = sqrt(3) * r
  // Need symmetric padding for edge indicators (circles extend ~5px beyond hex edge)
  const cols = 7;
  const rows = 7;
  const padding = 15; // padding on each side
  return {
    width: r * 1.5 * (cols - 1) + r * 2 + padding * 2,
    height: r * Math.sqrt(3) * rows + padding * 2,
  };
});

const boardStyle = computed(() => ({
  width: `${boardSize.value.width}px`,
  height: `${boardSize.value.height}px`,
  position: "relative" as const,
}));

// Convert axial coordinates to pixel position for flat-top hexes
function axialToPixel(pos: HexPosition): { x: number; y: number } {
  const r = hexRadius.value;

  // Center of the board
  const centerX = boardSize.value.width / 2;
  const centerY = boardSize.value.height / 2;

  // Flat-top hex axial to pixel:
  // x = r * 3/2 * q
  // y = r * sqrt(3) * (r + q/2)
  const x = centerX + r * 1.5 * pos.q;
  const y = centerY + r * Math.sqrt(3) * (pos.r + pos.q / 2);

  return { x, y };
}

function getCellStyle(pos: HexPosition, isIndicatorLayer: boolean) {
  const pixel = axialToPixel(pos);
  // Indicator layer renders on top of all base tiles
  const zIndex = isIndicatorLayer ? 50 : 1;
  return {
    position: "absolute" as const,
    left: `${pixel.x - hexSize.value / 2}px`,
    top: `${pixel.y - hexSize.value / 2}px`,
    zIndex,
    pointerEvents: isIndicatorLayer ? ("none" as const) : ("auto" as const),
  };
}

function getTileAt(pos: HexPosition): PlacedTile | undefined {
  const key = positionToKey(pos);
  return props.placedTiles.find((t) => positionToKey(t.position) === key);
}

function isValidPlacement(pos: HexPosition): boolean {
  const key = positionToKey(pos);
  return props.validPlacements.some((p) => positionToKey(p) === key);
}

const connectedPaths = computed(() => props.connectedPaths);

function getPositionLabel(pos: HexPosition): string {
  const ring = getRing(pos);
  if (ring === 0) return "●";
  return `${ring}`;
}

function handleCellClick(pos: HexPosition) {
  emit("cellClick", pos);
}
</script>

<style scoped>
.hex-board {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  border: 2px solid #333;
  overflow: visible;
}

.hex-cell:hover {
  z-index: 100 !important;
}

.board-header-overlay {
  position: absolute;
  top: 12px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 60; /* Above base layer (1) and indicators (50) */
  pointer-events: none;
}

.board-title {
  font-size: 1.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #64b5f6 0%, #ce93d8 50%, #ffb74d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  letter-spacing: 0.05em;
}

.board-score {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4fc3f7;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

@media (min-width: 600px) {
  .board-title {
    font-size: 1.5rem;
  }

  .board-score {
    font-size: 1rem;
  }
}
</style>
