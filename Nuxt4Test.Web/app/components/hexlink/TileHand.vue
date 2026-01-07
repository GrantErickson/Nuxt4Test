<template>
  <div class="tile-hand d-flex align-center ga-2 ga-sm-4">
    <div
      v-for="(tile, index) in tiles"
      :key="index"
      class="hand-tile-wrapper"
      :class="{ selected: selectedIndex === index }"
      @click="handleTileClick(index)"
    >
      <HexTile
        :tile-type-id="tile.typeId"
        :rotation="tile.rotation"
        :size="tileSize ?? 80"
        :show-edge-indicators="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HandTile } from "~/classes/hexlink/types";
import HexTile from "./HexTile.vue";

const props = defineProps<{
  tiles: HandTile[];
  selectedIndex: number | null;
  tileSize?: number;
}>();

const emit = defineEmits<{
  select: [index: number];
  rotate: [index: number];
}>();

function handleTileClick(index: number) {
  if (props.selectedIndex === index) {
    // Already selected - rotate it
    emit('rotate', index);
  } else {
    // Select this tile
    emit('select', index);
  }
}
</script>

<style scoped>
.tile-hand {
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
}

@media (min-width: 600px) {
  .tile-hand {
    padding: 16px;
  }
}

.hand-tile-wrapper {
  padding: 4px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
}

@media (min-width: 600px) {
  .hand-tile-wrapper {
    padding: 8px;
  }
}

.hand-tile-wrapper:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #666;
}

.hand-tile-wrapper.selected {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}
</style>
