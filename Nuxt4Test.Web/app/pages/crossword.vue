<template>
  <v-card class="mx-auto" max-width="800">
    <v-card-title
      class="bg-indigo-darken-3 text-white d-flex align-center justify-space-between"
    >
      <span>📝 Crossword</span>
      <v-chip color="amber" variant="flat" size="small"> 6×6 Puzzle </v-chip>
    </v-card-title>

    <v-card-text class="pa-4">
      <!-- Game completed message -->
      <v-alert v-if="state.completed" type="success" class="mb-4" prominent>
        🎉 Congratulations! You completed the crossword!
      </v-alert>

      <!-- Selected clue display -->
      <v-alert
        v-if="selectedClue"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        <strong
          >{{ selectedClue.number }}
          {{ selectedClue.direction === "across" ? "Across" : "Down" }}:</strong
        >
        {{ selectedClue.clue }}
      </v-alert>

      <div class="d-flex flex-column flex-md-row ga-4">
        <!-- Crossword Grid -->
        <div class="crossword-container">
          <div class="crossword-grid">
            <div v-for="row in 6" :key="'row-' + row" class="crossword-row">
              <div
                v-for="col in 6"
                :key="'cell-' + row + '-' + col"
                class="crossword-cell"
                :class="getCellClass(row - 1, col - 1)"
                @click="selectCell(row - 1, col - 1)"
              >
                <span
                  v-if="getCell(row - 1, col - 1)?.number"
                  class="cell-number"
                >
                  {{ getCell(row - 1, col - 1)?.number }}
                </span>
                <span
                  v-if="!getCell(row - 1, col - 1)?.isBlack"
                  class="cell-letter"
                >
                  {{ getCell(row - 1, col - 1)?.userInput || "" }}
                </span>
              </div>
            </div>
          </div>

          <!-- Direction toggle -->
          <div class="d-flex justify-center ga-2 mt-3">
            <v-btn-toggle
              v-model="currentDirection"
              mandatory
              color="indigo-darken-3"
              density="compact"
            >
              <v-btn value="across" size="small">
                <v-icon start size="small">mdi-arrow-right</v-icon>
                Across
              </v-btn>
              <v-btn value="down" size="small">
                <v-icon start size="small">mdi-arrow-down</v-icon>
                Down
              </v-btn>
            </v-btn-toggle>
          </div>
        </div>

        <!-- Clues -->
        <div class="clues-container flex-grow-1">
          <v-row>
            <v-col cols="12" sm="6">
              <div class="text-subtitle-1 font-weight-bold mb-2">Across</div>
              <div
                v-for="clue in state.acrossClues"
                :key="'across-' + clue.number"
                class="clue-item pa-2 rounded mb-1"
                :class="{
                  'clue-selected': isClueSelected(clue),
                  'clue-complete': game.isWordComplete(clue),
                }"
                @click="selectClue(clue)"
              >
                <strong>{{ clue.number }}.</strong> {{ clue.clue }}
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-subtitle-1 font-weight-bold mb-2">Down</div>
              <div
                v-for="clue in state.downClues"
                :key="'down-' + clue.number"
                class="clue-item pa-2 rounded mb-1"
                :class="{
                  'clue-selected': isClueSelected(clue),
                  'clue-complete': game.isWordComplete(clue),
                }"
                @click="selectClue(clue)"
              >
                <strong>{{ clue.number }}.</strong> {{ clue.clue }}
              </div>
            </v-col>
          </v-row>
        </div>
      </div>

      <!-- Controls -->
      <div class="d-flex justify-center flex-wrap ga-2 mt-4">
        <v-btn
          color="indigo-darken-3"
          prepend-icon="mdi-refresh"
          @click="newGame"
        >
          New Puzzle
        </v-btn>
        <v-btn
          color="orange-darken-2"
          variant="outlined"
          prepend-icon="mdi-lightbulb-outline"
          :disabled="!state.selectedCell"
          @click="revealCell"
        >
          Reveal Cell
        </v-btn>
        <v-btn
          color="red-darken-2"
          variant="outlined"
          prepend-icon="mdi-eye"
          @click="revealAll"
        >
          Reveal All
        </v-btn>
        <v-btn
          color="grey"
          variant="outlined"
          prepend-icon="mdi-eraser"
          @click="clearAll"
        >
          Clear
        </v-btn>
      </div>

      <!-- Instructions -->
      <div class="text-center text-caption text-grey mt-4">
        Click a cell to select it. Type letters to fill in. Press Backspace to
        delete. Click the same cell to toggle direction.
      </div>
    </v-card-text>

    <!-- On-screen Keyboard -->
    <v-card-text class="bg-grey-lighten-3 pa-4">
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
            @click="handleKeyClick(key)"
          >
            <template v-if="key === 'BACK'">
              <v-icon size="small">mdi-backspace-outline</v-icon>
            </template>
            <template v-else>
              {{ key }}
            </template>
          </button>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { CrosswordGame } from "~/classes/crossword";
import type { Clue } from "~/classes/crossword/types";

// Initialize game
const game = reactive(new CrosswordGame());
const state = computed(() => game.getState());
const selectedClue = computed(() => game.getSelectedClue());

// Direction toggle synced with game state
const currentDirection = computed({
  get: () => state.value.selectedDirection,
  set: (value: "across" | "down") => game.setDirection(value),
});

// Keyboard layout
const keyboardRows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M", "BACK"],
];

function getCell(row: number, col: number) {
  return state.value.grid[row]?.[col];
}

function getCellClass(row: number, col: number): Record<string, boolean> {
  const cell = getCell(row, col);
  if (!cell) return {};

  const isSelected =
    state.value.selectedCell?.row === row &&
    state.value.selectedCell?.col === col;
  const isInWord = game.isCellInSelectedWord(row, col);
  const isCorrect = cell.userInput === cell.letter && cell.userInput !== "";
  const isRevealed = cell.revealed;

  return {
    "cell-black": cell.isBlack,
    "cell-selected": isSelected && !cell.isBlack,
    "cell-in-word": isInWord && !isSelected && !cell.isBlack,
    "cell-correct": isCorrect && !isSelected,
    "cell-revealed": isRevealed,
  };
}

function selectCell(row: number, col: number): void {
  game.selectCell(row, col);
}

function selectClue(clue: Clue): void {
  game.selectClue(clue);
}

function isClueSelected(clue: Clue): boolean {
  const selected = selectedClue.value;
  return (
    selected?.number === clue.number && selected?.direction === clue.direction
  );
}

function handleKeyClick(key: string): void {
  if (key === "BACK") {
    game.deleteLetter();
  } else {
    game.inputLetter(key);
  }
}

function newGame(): void {
  game.newGame();
}

function revealCell(): void {
  game.revealCell();
}

function revealAll(): void {
  game.revealAll();
}

function clearAll(): void {
  game.clearAll();
}

// Keyboard event handler
function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === "Backspace") {
    event.preventDefault();
    game.deleteLetter();
  } else if (event.key === "ArrowRight") {
    game.setDirection("across");
  } else if (event.key === "ArrowDown") {
    game.setDirection("down");
  } else if (/^[a-zA-Z]$/.test(event.key)) {
    game.inputLetter(event.key);
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
.crossword-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.crossword-grid {
  display: flex;
  flex-direction: column;
  border: 2px solid #1a237e;
  background: #1a237e;
  gap: 1px;
}

.crossword-row {
  display: flex;
  gap: 1px;
}

.crossword-cell {
  width: 44px;
  height: 44px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  user-select: none;
  font-size: 1.25rem;
  font-weight: bold;
}

.cell-black {
  background: #1a237e;
  cursor: default;
}

.cell-selected {
  background: #ffeb3b !important;
}

.cell-in-word {
  background: #fff9c4;
}

.cell-correct {
  color: #2e7d32;
}

.cell-revealed {
  color: #1565c0;
}

.cell-number {
  position: absolute;
  top: 2px;
  left: 3px;
  font-size: 0.6rem;
  font-weight: normal;
  color: #666;
}

.cell-letter {
  text-transform: uppercase;
}

.clues-container {
  max-height: 400px;
  overflow-y: auto;
}

.clue-item {
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.clue-item:hover {
  background: #e8eaf6;
}

.clue-selected {
  background: #c5cae9 !important;
  border-left: 3px solid #3949ab;
}

.clue-complete {
  text-decoration: line-through;
  color: #9e9e9e;
}

.keyboard-key {
  min-width: 32px;
  height: 40px;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  background: #e0e0e0;
  cursor: pointer;
  transition: background-color 0.15s;
  font-size: 0.875rem;
}

.keyboard-key:hover {
  background: #bdbdbd;
}

.keyboard-key:active {
  background: #9e9e9e;
}

@media (max-width: 600px) {
  .crossword-cell {
    width: 38px;
    height: 38px;
    font-size: 1rem;
  }

  .keyboard-key {
    min-width: 28px;
    height: 36px;
    font-size: 0.75rem;
  }
}
</style>
