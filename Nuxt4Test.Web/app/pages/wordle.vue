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
        style="cursor: pointer"
        @click="toggleGameMode"
      >
        {{ gameMode === "daily" ? "📅 Daily" : "🎲 Random" }}
      </v-chip>
    </v-card-title>

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
      <WordleGrid
        v-if="!isLoading"
        :guesses="guesses"
        :current-guess="currentGuess"
        :game-over="gameOver"
        :shaking="shaking"
        :get-letter-class="getLetterClass"
      />

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

        <!-- Word definition -->
        <v-card
          v-if="definitionLoading || wordDefinitions.length > 0"
          variant="tonal"
          class="mb-4 text-left"
        >
          <v-card-text>
            <div class="d-flex align-center mb-1">
              <strong class="text-h6">{{ targetWord.toUpperCase() }}</strong>
              <v-progress-circular
                v-if="definitionLoading"
                indeterminate
                size="16"
                width="2"
                class="ml-2"
              />
            </div>
            <div v-if="wordDefinitions.length > 0">
              <p
                v-for="(def, index) in wordDefinitions"
                :key="index"
                class="text-body-2 mb-1"
              >
                {{ index + 1 }}. {{ def }}
              </p>
            </div>
            <p
              v-else-if="!definitionLoading"
              class="text-body-2 text-grey mb-0"
            >
              Definition not available
            </p>
          </v-card-text>
        </v-card>

        <v-btn color="primary" @click="resetGame">Play Again</v-btn>
      </div>
    </v-card-text>

    <!-- On-screen Keyboard -->
    <v-card-text class="bg-grey-lighten-3 pa-4">
      <WordleKeyboard
        :get-key-class="getKeyClass"
        @key-click="handleKeyClick"
      />

      <!-- Hint section -->
      <WordleHint
        v-if="!gameOver && !isLoading"
        :loading="hintLoading"
        :show-hint="showHint"
        :hint-word="hintWord"
        :possible-words-count="possibleWordsCount"
        @get-hint="getHint"
        @use-hint="useHint"
      />
    </v-card-text>

    <!-- Legend -->
    <v-card-text class="bg-grey-lighten-4">
      <WordleLegend />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import wordListText from "~/data/words.txt?raw";
import validGuessesText from "~/data/valid-guesses.txt?raw";
import { WordleGame, HintSolver } from "~/classes/wordle";

// Initialize game instance with common words for targets and full list for valid guesses
const gameInstance = new WordleGame(wordListText, validGuessesText);

// Initialize hint solver with target words only (common words that could be the answer)
const hintSolver = new HintSolver(gameInstance.getTargetWords());

// Game mode: 'daily' for word of the day, 'random' for random word
type GameMode = "daily" | "random";
const gameMode = ref<GameMode>("daily");
const dailyPlayedToday = ref(false);

// Get today's date key for localStorage
function getTodayKey(): string {
  const today = new Date();
  return `wordle-daily-${today.getFullYear()}-${
    today.getMonth() + 1
  }-${today.getDate()}`;
}

// Check if daily was already played today
function checkDailyPlayed(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(getTodayKey()) === "played";
}

// Mark daily as played today
function markDailyPlayed(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(getTodayKey(), "played");
  dailyPlayedToday.value = true;
}

// Hint state
const hintWord = ref<string | null>(null);
const showHint = ref(false);
const hintLoading = ref(false);
const possibleWordsCount = ref(0);

// Shake animation state
const shaking = ref(false);

// Loading state for API call
const isLoading = ref(true);
const apiError = ref<string | null>(null);

// Word definition state
const wordDefinitions = ref<string[]>([]);
const definitionLoading = ref(false);

// Reactive state - we use refs that sync with the game instance
const targetWord = ref(gameInstance.targetWord);
const currentGuess = ref(gameInstance.currentGuess);
const guesses = ref(gameInstance.guesses);
const gameOver = ref(gameInstance.gameOver);
const won = ref(gameInstance.won);

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
  // Increment to trigger keyboard re-render
  stateVersion.value++;
}

function getLetterClass(letter: string, index: number, word: string): string {
  return gameInstance.getLetterClass(letter, index, word);
}

function getKeyClass(key: string): string {
  // Access stateVersion to create reactive dependency
  void stateVersion.value;
  return gameInstance.getKeyClass(key);
}

function handleKeyClick(key: string): void {
  // Handle Enter key specially to trigger shake animation for invalid words
  if (key === "ENTER") {
    submitGuess();
    return;
  }

  gameInstance.handleKeyPress(key);
  syncState();
}

function submitGuess(): void {
  // Don't do anything if no characters entered
  if (currentGuess.value.length === 0) {
    return;
  }

  const result = gameInstance.submitGuess();
  syncState();

  // If the guess was invalid, shake the row
  if (!result.success && result.errorMessage) {
    // Reset to false first to ensure animation restarts
    shaking.value = false;
    // Use nextTick to ensure Vue updates the DOM before setting to true
    nextTick(() => {
      shaking.value = true;
      setTimeout(() => {
        shaking.value = false;
      }, 500);
    });
    return;
  }

  // Clear hint when a guess is submitted
  showHint.value = false;
  hintWord.value = null;

  // If game ended and it was daily mode, mark as played
  if (gameOver.value && gameMode.value === "daily") {
    markDailyPlayed();
  }
}

async function getHint(): Promise<void> {
  hintLoading.value = true;
  showHint.value = false;
  // Use setTimeout to allow UI to update before calculation
  await new Promise((resolve) => setTimeout(resolve, 50));
  const state = gameInstance.getState();
  hintWord.value = hintSolver.getHint(state.guesses, state.targetWord);
  possibleWordsCount.value = hintSolver.getPossibleWordCount(
    state.guesses,
    state.targetWord
  );
  hintLoading.value = false;
  showHint.value = true;
}

function useHint(): void {
  if (hintWord.value) {
    // Check if current guess is empty (all blanks)
    const wasEmpty = gameInstance.currentGuess.length === 0;

    // Clear current guess and type in the hint
    for (let i = 0; i < gameInstance.currentGuess.length; i++) {
      gameInstance.handleKeyPress("Backspace");
    }
    for (const letter of hintWord.value) {
      gameInstance.handleKeyPress(letter);
    }
    syncState();
    showHint.value = false;

    // If the guess was empty, automatically submit the word
    if (wasEmpty) {
      submitGuess();
    }
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (isLoading.value) return;

  // Handle Enter key specially to trigger shake animation for invalid words
  if (event.key === "Enter") {
    submitGuess();
    return;
  }

  gameInstance.handleKeyPress(event.key);
  syncState();
}

// Get runtime config for API base URL
const config = useRuntimeConfig();

/**
 * Fetch word definition from Free Dictionary API
 */
async function fetchWordDefinition(word: string): Promise<void> {
  definitionLoading.value = true;
  wordDefinitions.value = [];
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    if (response.ok) {
      const data = await response.json();
      const definitions: string[] = [];

      // Collect up to 3 definitions from different meanings
      for (const entry of data) {
        for (const meaning of entry.meanings || []) {
          for (const def of meaning.definitions || []) {
            if (def.definition && definitions.length < 3) {
              const partOfSpeech = meaning.partOfSpeech || "";
              definitions.push(
                partOfSpeech
                  ? `(${partOfSpeech}) ${def.definition}`
                  : def.definition
              );
            }
            if (definitions.length >= 3) break;
          }
          if (definitions.length >= 3) break;
        }
        if (definitions.length >= 3) break;
      }

      wordDefinitions.value = definitions;
    }
  } catch (error) {
    console.error("Failed to fetch word definition:", error);
  } finally {
    definitionLoading.value = false;
  }
}

async function fetchWordOfTheDay(): Promise<string | null> {
  try {
    // In development, use the proxy (/api/). In production, use the configured API base URL.
    const isDev = import.meta.dev;
    const url = isDev
      ? "/api/wordle/word-of-the-day"
      : `${config.public.apiBaseUrl}/wordle/word-of-the-day`;
    const response = await fetch(url);
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
  wordDefinitions.value = [];

  // If daily was already played today, switch to random mode
  if (gameMode.value === "daily" && checkDailyPlayed()) {
    gameMode.value = "random";
  }

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

  // Fetch the word definition asynchronously (don't await - let it load in background)
  fetchWordDefinition(gameInstance.targetWord);
}

async function toggleGameMode(): Promise<void> {
  gameMode.value = gameMode.value === "daily" ? "random" : "daily";
  await resetGame();
}

// Initialize game on mount and add keyboard listener
onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);

  // Check if daily was already played today
  dailyPlayedToday.value = checkDailyPlayed();
  if (dailyPlayedToday.value) {
    gameMode.value = "random";
  }

  await resetGame();
});

// Clean up keyboard listener
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>
