<template>
  <div class="d-flex flex-column align-center ga-1">
    <div
      v-for="(row, rowIndex) in keyboardRows"
      :key="rowIndex"
      class="d-flex ga-1"
    >
      <button
        v-for="key in row"
        :key="key"
        class="keyboard-key d-flex align-center justify-center font-weight-bold"
        :class="getKeyClass(key)"
        @click="$emit('keyClick', key)"
      >
        <template v-if="key === 'ENTER'">
          <v-icon size="small">mdi-keyboard-return</v-icon>
        </template>
        <template v-else-if="key === 'BACK'">
          <v-icon size="small">mdi-backspace-outline</v-icon>
        </template>
        <template v-else>
          {{ key }}
        </template>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { KEYBOARD_ROWS } from "~/classes/wordle";

defineProps<{
  getKeyClass: (key: string) => string;
}>();

defineEmits<{
  keyClick: [key: string];
}>();

const keyboardRows = KEYBOARD_ROWS;
</script>

<style scoped>
.keyboard-key {
  min-width: 36px;
  height: 50px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.1s ease;
  text-transform: uppercase;
}

.keyboard-key:hover {
  opacity: 0.8;
}

.keyboard-key:active {
  transform: scale(0.95);
}

.keyboard-key.special-key {
  min-width: 56px;
  background-color: #d1d5db;
}

.keyboard-key.special-key:hover {
  background-color: #9ca3af;
}
</style>
