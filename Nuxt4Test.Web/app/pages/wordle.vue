<template>
  <v-card class="mx-auto" max-width="600">
    <v-card-title class="bg-green-darken-3 text-white">
      🟩 Wordle Game
    </v-card-title>

    <v-card-text class="pa-6">
      <!-- Guesses grid -->
      <div class="d-flex flex-column align-center ga-2 mb-4">
        <!-- Submitted guesses -->
        <div
          v-for="(guess, guessIndex) in guesses"
          :key="guessIndex"
          class="d-flex ga-1"
        >
          <div
            v-for="(letter, letterIndex) in guess.letters"
            :key="letterIndex"
            class="letter-box d-flex align-center justify-center text-h5 font-weight-bold"
            :class="getLetterClass(letter, letterIndex, guess.word)"
          >
            {{ letter.toUpperCase() }}
          </div>
        </div>

        <!-- Current input row (if game not over) -->
        <div v-if="!gameOver && guesses.length < 6" class="d-flex ga-1">
          <div
            v-for="i in 5"
            :key="'current-' + i"
            class="letter-box current d-flex align-center justify-center text-h5 font-weight-bold"
            :class="{ 'has-letter': currentGuess[i - 1] }"
          >
            {{ currentGuess[i - 1]?.toUpperCase() || "" }}
          </div>
        </div>

        <!-- Empty rows for remaining guesses -->
        <div
          v-for="emptyRow in emptyRowCount"
          :key="'empty-' + emptyRow"
          class="d-flex ga-1"
        >
          <div
            v-for="i in 5"
            :key="i"
            class="letter-box empty d-flex align-center justify-center"
          ></div>
        </div>
      </div>

      <!-- Error message -->
      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-4"
        closable
        @click:close="clearError"
      >
        {{ errorMessage }}
      </v-alert>

      <!-- Submit button -->
      <v-btn
        v-if="!gameOver"
        block
        color="green-darken-3"
        size="large"
        @click="submitGuess"
        :disabled="currentGuess.length !== 5"
        class="mb-2"
      >
        Submit Guess (or press Enter)
      </v-btn>

      <!-- Game over message -->
      <div v-if="gameOver" class="text-center">
        <v-alert :type="won ? 'success' : 'error'" class="mb-4">
          <template v-if="won">
            🎉 Congratulations! You guessed the word in {{ guesses.length }}
            {{ guesses.length === 1 ? "try" : "tries" }}!
          </template>
          <template v-else>
            Game Over! The word was:
            <strong>{{ targetWord.toUpperCase() }}</strong>
          </template>
        </v-alert>
        <v-btn color="primary" @click="resetGame">Play Again</v-btn>
      </div>

      <!-- Instructions -->
      <div v-if="!gameOver" class="text-center text-caption text-grey mt-2">
        Type letters to fill the grid. Press Backspace to delete.
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
            :class="getKeyClass(key)"
            @click="handleKeyClick(key)"
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
    </v-card-text>

    <!-- Legend -->
    <v-card-text class="bg-grey-lighten-4">
      <div class="text-subtitle-2 mb-2">Legend:</div>
      <div class="d-flex ga-4 flex-wrap">
        <div class="d-flex align-center ga-2">
          <div class="legend-box bg-green text-white">A</div>
          <span>Correct letter & position</span>
        </div>
        <div class="d-flex align-center ga-2">
          <div class="legend-box bg-yellow-darken-2 text-white">B</div>
          <span>Correct letter, wrong position</span>
        </div>
        <div class="d-flex align-center ga-2">
          <div class="legend-box bg-grey-darken-1 text-white">C</div>
          <span>Letter not in word</span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import wordListText from "~/data/words.txt?raw";
import { WordleGame, KEYBOARD_ROWS } from "~/classes/wordle";

// Initialize game instance
const gameInstance = new WordleGame(wordListText);

// Reactive state - we use refs that sync with the game instance
const targetWord = ref(gameInstance.targetWord);
const currentGuess = ref(gameInstance.currentGuess);
const guesses = ref(gameInstance.guesses);
const gameOver = ref(gameInstance.gameOver);
const won = ref(gameInstance.won);
const errorMessage = ref(gameInstance.errorMessage);

// Keyboard layout from constants
const keyboardRows = KEYBOARD_ROWS;

// Version counter to force re-render of keyboard
const stateVersion = ref(0);

// Sync state from game instance
function syncState(): void {
  const state = gameInstance.getState();
  targetWord.value = state.targetWord;
  currentGuess.value = state.currentGuess;
  guesses.value = state.guesses;
  gameOver.value = state.gameOver;
  won.value = state.won;
  errorMessage.value = state.errorMessage;
  // Increment to trigger keyboard re-render
  stateVersion.value++;
}

// Calculate empty rows (excluding current input row)
const emptyRowCount = computed(() => {
  const submitted = guesses.value.length;
  const currentRow = gameOver.value ? 0 : 1;
  return Math.max(0, 6 - submitted - currentRow);
});

function getLetterClass(letter: string, index: number, word: string): string {
  return gameInstance.getLetterClass(letter, index, word);
}

function getKeyClass(key: string): string {
  // Access stateVersion to create reactive dependency
  void stateVersion.value;
  return gameInstance.getKeyClass(key);
}

function handleKeyClick(key: string): void {
  gameInstance.handleKeyPress(key);
  syncState();
}

function submitGuess(): void {
  gameInstance.submitGuess();
  syncState();
}

function handleKeydown(event: KeyboardEvent): void {
  gameInstance.handleKeyPress(event.key);
  syncState();
}

function resetGame(): void {
  gameInstance.reset();
  syncState();
}

function clearError(): void {
  gameInstance.clearError();
  syncState();
}

// Initialize game on mount and add keyboard listener
onMounted(() => {
  syncState();
  window.addEventListener("keydown", handleKeydown);
});

// Clean up keyboard listener
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.letter-box {
  width: 56px;
  height: 56px;
  border: 2px solid #ccc;
  border-radius: 4px;
}

.letter-box.empty {
  background-color: #f5f5f5;
}

.letter-box.current {
  border-color: #888;
  background-color: #fff;
}

.letter-box.current.has-letter {
  border-color: #333;
}

.legend-box {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: bold;
}

/* Keyboard styles */
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
