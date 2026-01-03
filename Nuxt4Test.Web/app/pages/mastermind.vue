<template>
  <v-card class="mx-auto mastermind-card" max-width="600">
    <v-card-title
      class="bg-deep-purple-darken-2 text-white d-flex align-center justify-space-between"
    >
      <span>🎯 Mastermind</span>
      <div class="d-flex align-center ga-4">
        <v-chip color="deep-purple-lighten-1" variant="flat">
          {{ remainingGuesses }} guesses left
        </v-chip>
      </div>
    </v-card-title>

    <v-card-text class="pa-4">
      <!-- Game status -->
      <v-alert
        v-if="gameOver"
        :type="won ? 'success' : 'error'"
        class="mb-4"
        :icon="false"
      >
        <template v-if="won">
          🎉 You cracked the code in {{ guesses.length }} guesses! 🧠
        </template>
        <template v-else>
          😢 Out of guesses! The code was:
          <div class="d-flex ga-1 mt-2">
            <div
              v-for="(color, i) in secretCode"
              :key="'secret-' + i"
              class="peg"
              :class="'bg-' + color"
            ></div>
          </div>
        </template>
      </v-alert>

      <!-- Previous guesses -->
      <div class="guesses-container mb-4">
        <div
          v-for="(guess, guessIndex) in guesses"
          :key="'guess-' + guessIndex"
          class="guess-row d-flex align-center justify-center ga-4 mb-2"
        >
          <!-- Guess pegs -->
          <div class="d-flex ga-1">
            <div
              v-for="(color, pegIndex) in guess.colors"
              :key="'peg-' + guessIndex + '-' + pegIndex"
              class="peg"
              :class="'bg-' + color"
            ></div>
          </div>

          <!-- Feedback -->
          <div class="feedback-container d-flex flex-wrap" style="width: 52px">
            <div
              v-for="n in guess.feedback.exactMatches"
              :key="'exact-' + guessIndex + '-' + n"
              class="feedback-peg bg-black"
              title="Right color, right place"
            ></div>
            <div
              v-for="n in guess.feedback.colorMatches"
              :key="'color-' + guessIndex + '-' + n"
              class="feedback-peg bg-white"
              title="Right color, wrong place"
            ></div>
            <div
              v-for="n in codeLength -
              guess.feedback.exactMatches -
              guess.feedback.colorMatches"
              :key="'empty-' + guessIndex + '-' + n"
              class="feedback-peg bg-grey-lighten-2"
              title="Wrong color"
            ></div>
          </div>
        </div>
      </div>

      <!-- Current guess row -->
      <div
        v-if="!gameOver"
        class="current-guess-row d-flex align-center justify-center ga-4 mb-4"
      >
        <div class="d-flex ga-1">
          <div
            v-for="n in codeLength"
            :key="'current-' + n"
            class="peg peg-slot"
            :class="
              currentGuess[n - 1]
                ? 'bg-' + currentGuess[n - 1]
                : 'bg-grey-darken-1'
            "
            @click="removeColorAt(n - 1)"
          >
            {{ currentGuess[n - 1] ? "" : "?" }}
          </div>
        </div>

        <!-- Placeholder for feedback alignment -->
        <div style="width: 52px"></div>
      </div>

      <!-- Color picker -->
      <div
        v-if="!gameOver"
        class="color-picker d-flex justify-center ga-2 mb-4"
      >
        <v-btn
          v-for="color in availableColors"
          :key="color"
          :color="color"
          size="large"
          icon
          @click="addColor(color)"
        >
          <v-icon size="small">mdi-circle</v-icon>
        </v-btn>
      </div>

      <!-- Action buttons -->
      <div class="d-flex justify-center ga-4">
        <v-btn
          v-if="!gameOver"
          color="deep-purple"
          :disabled="!isGuessComplete"
          @click="submitGuess"
        >
          Submit Guess
        </v-btn>
        <v-btn
          v-if="!gameOver"
          color="grey"
          variant="outlined"
          :disabled="currentGuess.length === 0"
          @click="clearGuess"
        >
          Clear
        </v-btn>
        <v-btn color="deep-purple-darken-2" @click="resetGame">
          {{ gameOver ? "Play Again" : "New Game" }}
        </v-btn>
      </div>

      <!-- Legend -->
      <v-divider class="my-4"></v-divider>
      <div class="text-caption text-grey-darken-1">
        <div class="d-flex align-center ga-2 mb-1">
          <div class="feedback-peg bg-black"></div>
          <span>= Right color, right place</span>
        </div>
        <div class="d-flex align-center ga-2 mb-1">
          <div class="feedback-peg bg-white"></div>
          <span>= Right color, wrong place</span>
        </div>
        <div class="d-flex align-center ga-2">
          <div class="feedback-peg bg-grey-lighten-2"></div>
          <span>= Wrong color</span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import {
  MastermindGame,
  type PegColor,
  type Guess,
} from "~/classes/mastermind";

// Initialize game instance
const gameInstance = new MastermindGame();

// Reactive state
const guesses = ref<Guess[]>([]);
const currentGuess = ref<PegColor[]>([]);
const gameOver = ref(false);
const won = ref(false);
const secretCode = ref<PegColor[]>([]);

// Constants from game
const codeLength = gameInstance.codeLength;
const availableColors = gameInstance.availableColors;

// Computed
const remainingGuesses = computed(
  () => gameInstance.maxGuesses - guesses.value.length
);
const isGuessComplete = computed(
  () => currentGuess.value.length === codeLength
);

// Sync state from game instance
function syncState(): void {
  const state = gameInstance.getState();
  guesses.value = [...state.guesses];
  currentGuess.value = [...state.currentGuess];
  gameOver.value = state.gameOver;
  won.value = state.won;
  secretCode.value = [...state.secretCode];
}

function addColor(color: PegColor): void {
  gameInstance.addColor(color);
  syncState();
}

function removeColorAt(index: number): void {
  if (index < currentGuess.value.length) {
    // Remove color at index by rebuilding the guess
    const newGuess = currentGuess.value.filter((_, i) => i !== index);
    gameInstance.clearCurrentGuess();
    newGuess.forEach((c) => gameInstance.addColor(c));
    syncState();
  }
}

function clearGuess(): void {
  gameInstance.clearCurrentGuess();
  syncState();
}

function submitGuess(): void {
  gameInstance.submitGuess();
  syncState();
}

function resetGame(): void {
  gameInstance.reset();
  syncState();
}

// Initialize on mount
onMounted(() => {
  syncState();
});
</script>

<style scoped>
.mastermind-card {
  background: linear-gradient(180deg, #f3e5f5 0%, #e1bee7 100%);
  border: 3px solid #7b1fa2;
}

.peg {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.7);
  box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.3),
    inset -2px -2px 4px rgba(0, 0, 0, 0.2);
}

.peg-slot {
  cursor: pointer;
  transition: transform 0.15s ease;
}

.peg-slot:hover {
  transform: scale(1.1);
}

.feedback-container {
  gap: 2px;
}

.feedback-peg {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.3);
}

.guess-row {
  padding: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.current-guess-row {
  padding: 12px;
  background: rgba(123, 31, 162, 0.1);
  border-radius: 8px;
  border: 2px dashed #7b1fa2;
}

.color-picker .v-btn {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>
