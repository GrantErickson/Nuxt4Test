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
        @click:close="errorMessage = ''"
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

interface Guess {
  word: string;
  letters: string[];
}

// Parse word list from file - filter to only 5-letter words
const wordList = wordListText
  .split("\n")
  .map((w) => w.trim().toLowerCase())
  .filter((w) => w.length === 5);

// Create a Set for fast lookup when validating guesses
const validWords = new Set(wordList);

const targetWord = ref("");
const currentGuess = ref("");
const guesses = ref<Guess[]>([]);
const gameOver = ref(false);
const won = ref(false);
const errorMessage = ref("");

// Keyboard layout
const keyboardRows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
];

// Track the state of each letter: 'correct' (green), 'present' (yellow), 'absent' (grey), or undefined (not guessed)
const letterStates = ref<Record<string, "correct" | "present" | "absent">>({});

// Calculate empty rows (excluding current input row)
const emptyRowCount = computed(() => {
  const submitted = guesses.value.length;
  const currentRow = gameOver.value ? 0 : 1;
  return Math.max(0, 6 - submitted - currentRow);
});

function getRandomWord(): string {
  return wordList[Math.floor(Math.random() * wordList.length)];
}

function getLetterClass(letter: string, index: number, word: string): string {
  const lowerLetter = letter.toLowerCase();
  const lowerTarget = targetWord.value.toLowerCase();

  // Green: correct letter in correct position
  if (lowerTarget[index] === lowerLetter) {
    return "bg-green text-white";
  }

  // Yellow: letter exists in word but wrong position
  // Need to be careful about duplicate letters
  const targetLetterCount = lowerTarget
    .split("")
    .filter((l) => l === lowerLetter).length;
  const correctPositions = word
    .toLowerCase()
    .split("")
    .filter(
      (l, i) => l === lowerLetter && lowerTarget[i] === lowerLetter
    ).length;
  const yellowsBeforeThis = word
    .toLowerCase()
    .split("")
    .slice(0, index)
    .filter(
      (l, i) =>
        l === lowerLetter &&
        lowerTarget[i] !== lowerLetter &&
        lowerTarget.includes(lowerLetter)
    ).length;

  if (
    lowerTarget.includes(lowerLetter) &&
    correctPositions + yellowsBeforeThis < targetLetterCount
  ) {
    return "bg-yellow-darken-2 text-white";
  }

  // Grey: letter not in word
  return "bg-grey-darken-1 text-white";
}

function getKeyClass(key: string): string {
  if (key === "ENTER" || key === "BACK") {
    return "special-key";
  }
  const state = letterStates.value[key.toLowerCase()];
  if (state === "correct") return "bg-green text-white";
  if (state === "present") return "bg-yellow-darken-2 text-white";
  if (state === "absent") return "bg-grey-darken-1 text-white";
  return "bg-grey-lighten-1"; // Not guessed yet
}

function handleKeyClick(key: string): void {
  if (gameOver.value) return;

  if (key === "ENTER") {
    if (currentGuess.value.length === 5) {
      submitGuess();
    }
  } else if (key === "BACK") {
    if (currentGuess.value.length > 0) {
      currentGuess.value = currentGuess.value.slice(0, -1);
      errorMessage.value = "";
    }
  } else {
    if (currentGuess.value.length < 5) {
      currentGuess.value += key.toLowerCase();
      errorMessage.value = "";
    }
  }
}

function updateLetterStates(guess: string): void {
  const lowerTarget = targetWord.value.toLowerCase();

  for (let i = 0; i < guess.length; i++) {
    const letter = guess[i].toLowerCase();
    const currentState = letterStates.value[letter];

    // Green takes priority over everything
    if (lowerTarget[i] === letter) {
      letterStates.value[letter] = "correct";
    }
    // Yellow only if not already green
    else if (lowerTarget.includes(letter) && currentState !== "correct") {
      letterStates.value[letter] = "present";
    }
    // Grey only if not already green or yellow
    else if (!lowerTarget.includes(letter) && !currentState) {
      letterStates.value[letter] = "absent";
    }
  }
}

function submitGuess(): void {
  const guess = currentGuess.value.toLowerCase().trim();

  if (guess.length !== 5) {
    errorMessage.value = "Please enter a 5-letter word";
    return;
  }

  if (!/^[a-zA-Z]+$/.test(guess)) {
    errorMessage.value = "Only letters are allowed";
    return;
  }

  if (!validWords.has(guess)) {
    errorMessage.value = "Not a valid word";
    return;
  }

  errorMessage.value = "";

  guesses.value.push({
    word: guess,
    letters: guess.split(""),
  });

  // Update keyboard letter states
  updateLetterStates(guess);

  if (guess === targetWord.value.toLowerCase()) {
    gameOver.value = true;
    won.value = true;
  } else if (guesses.value.length >= 6) {
    gameOver.value = true;
    won.value = false;
  }

  currentGuess.value = "";
}

function handleKeydown(event: KeyboardEvent): void {
  if (gameOver.value) return;

  const key = event.key;

  // Handle letter input
  if (/^[a-zA-Z]$/.test(key) && currentGuess.value.length < 5) {
    currentGuess.value += key.toLowerCase();
    errorMessage.value = "";
  }
  // Handle backspace
  else if (key === "Backspace" && currentGuess.value.length > 0) {
    currentGuess.value = currentGuess.value.slice(0, -1);
    errorMessage.value = "";
  }
  // Handle enter to submit
  else if (key === "Enter" && currentGuess.value.length === 5) {
    submitGuess();
  }
}

function resetGame(): void {
  targetWord.value = getRandomWord();
  currentGuess.value = "";
  guesses.value = [];
  gameOver.value = false;
  won.value = false;
  errorMessage.value = "";
  letterStates.value = {};
}

// Initialize game on mount and add keyboard listener
onMounted(() => {
  resetGame();
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
