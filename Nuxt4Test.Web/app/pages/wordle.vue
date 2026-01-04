<template>
  <v-card class="mx-auto" max-width="600">
    <v-card-title
      class="bg-green-darken-3 text-white d-flex align-center justify-space-between"
    >
      <span>🟩 Wordle</span>
      <v-chip
        :color="gameMode === 'daily' ? 'yellow-darken-2' : 'blue-grey'"
        size="small"
        variant="flat"
      >
        {{ gameMode === "daily" ? "📅 Daily" : "🎲 Random" }}
      </v-chip>
    </v-card-title>

    <!-- Game Mode Selector -->
    <v-card-text class="bg-grey-lighten-4 py-3">
      <v-btn-toggle
        v-model="gameMode"
        mandatory
        color="green-darken-3"
        density="compact"
        class="d-flex"
        @update:model-value="onGameModeChange"
      >
        <v-btn value="daily" class="flex-grow-1">
          <v-icon start>mdi-calendar-today</v-icon>
          Word of the Day
        </v-btn>
        <v-btn value="random" class="flex-grow-1">
          <v-icon start>mdi-shuffle-variant</v-icon>
          Random Word
        </v-btn>
      </v-btn-toggle>
    </v-card-text>

    <v-card-text class="pa-6">
      <!-- Loading state -->
      <div v-if="isLoading" class="d-flex flex-column align-center pa-8">
        <v-progress-circular indeterminate color="green-darken-3" size="64" />
        <p class="mt-4 text-grey">
          {{
            gameMode === "daily"
              ? "Loading word of the day..."
              : "Getting random word..."
          }}
        </p>
      </div>

      <!-- API error message -->
      <v-alert
        v-if="apiError"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-4"
        closable
        @click:close="apiError = null"
      >
        {{ apiError }}
      </v-alert>

      <!-- Guesses grid -->
      <div v-if="!isLoading" class="d-flex flex-column align-center ga-2 mb-4">
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
        v-if="!gameOver && !isLoading"
        block
        color="green-darken-3"
        size="large"
        @click="submitGuess"
        :disabled="currentGuess.length !== 5"
        class="mb-2"
      >
        Submit Guess (or press Enter)
      </v-btn>

      <!-- Hint section -->
      <div v-if="!gameOver && !isLoading" class="mb-4">
        <v-btn
          block
          variant="outlined"
          color="blue-darken-2"
          size="large"
          @click="getHint"
          class="mb-2"
        >
          <v-icon start>mdi-lightbulb-outline</v-icon>
          Get Hint
        </v-btn>

        <v-alert
          v-if="showHint && hintWord"
          type="info"
          variant="tonal"
          density="compact"
          closable
          @click:close="showHint = false"
        >
          <div class="d-flex align-center justify-space-between">
            <div>
              <strong>Suggested word:</strong>
              <span class="text-h6 ml-2 font-weight-bold">{{
                hintWord.toUpperCase()
              }}</span>
            </div>
            <v-btn
              size="small"
              variant="text"
              color="blue-darken-2"
              @click="useHint"
            >
              Use it
            </v-btn>
          </div>
          <div class="text-caption mt-1">
            {{ possibleWordsCount }} possible words remaining
          </div>
        </v-alert>

        <v-alert
          v-if="showHint && !hintWord"
          type="warning"
          variant="tonal"
          density="compact"
          closable
          @click:close="showHint = false"
        >
          No valid words found. Check your guesses!
        </v-alert>
      </div>

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
      <div
        v-if="!gameOver && !isLoading"
        class="text-center text-caption text-grey mt-2"
      >
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
import { WordleGame, HintSolver, KEYBOARD_ROWS } from "~/classes/wordle";

// Initialize game instance
const gameInstance = new WordleGame(wordListText);

// Initialize hint solver with word list
const wordList = wordListText
  .split("\n")
  .map((w) => w.trim().toLowerCase())
  .filter((w) => w.length === 5);
const hintSolver = new HintSolver(wordList);

// Game mode: 'daily' for word of the day, 'random' for random word
type GameMode = "daily" | "random";
const gameMode = ref<GameMode>("daily");

// Hint state
const hintWord = ref<string | null>(null);
const showHint = ref(false);
const possibleWordsCount = ref(0);

// Loading state for API call
const isLoading = ref(true);
const apiError = ref<string | null>(null);

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
  // Clear hint when a guess is submitted
  showHint.value = false;
  hintWord.value = null;
}

function getHint(): void {
  const state = gameInstance.getState();
  hintWord.value = hintSolver.getHint(state.guesses, state.targetWord);
  possibleWordsCount.value = hintSolver.getPossibleWordCount(
    state.guesses,
    state.targetWord
  );
  showHint.value = true;
}

function useHint(): void {
  if (hintWord.value) {
    // Clear current guess and type in the hint
    for (let i = 0; i < gameInstance.currentGuess.length; i++) {
      gameInstance.handleKeyPress("Backspace");
    }
    for (const letter of hintWord.value) {
      gameInstance.handleKeyPress(letter);
    }
    syncState();
    showHint.value = false;
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (isLoading.value) return;
  gameInstance.handleKeyPress(event.key);
  syncState();
}

async function fetchWordOfTheDay(): Promise<string | null> {
  try {
    const response = await fetch("/api/wordle/word-of-the-day");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const word = await response.text();
    return word.trim().toLowerCase();
  } catch (error) {
    console.error("Failed to fetch word of the day:", error);
    return null;
  }
}

async function resetGame(): Promise<void> {
  isLoading.value = true;
  apiError.value = null;
  showHint.value = false;
  hintWord.value = null;

  if (gameMode.value === "daily") {
    const word = await fetchWordOfTheDay();
    if (word) {
      gameInstance.reset(word);
    } else {
      apiError.value = "Could not fetch word of the day. Using random word.";
      gameInstance.reset();
    }
  } else {
    // Random mode - use local word list
    gameInstance.reset();
  }

  isLoading.value = false;
  syncState();
}

async function onGameModeChange(): Promise<void> {
  await resetGame();
}

function clearError(): void {
  gameInstance.clearError();
  syncState();
}

// Initialize game on mount and add keyboard listener
onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);
  await resetGame();
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
