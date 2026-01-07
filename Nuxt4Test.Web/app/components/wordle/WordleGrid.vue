<template>
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
    <div
      v-if="!gameOver && guesses.length < 6"
      class="d-flex ga-1"
      :class="{ shake: shaking }"
    >
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
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Guess } from "~/classes/wordle";

const props = defineProps<{
  guesses: Guess[];
  currentGuess: string;
  gameOver: boolean;
  shaking: boolean;
  getLetterClass: (letter: string, index: number, word: string) => string;
}>();

const emptyRowCount = computed(() => {
  const submitted = props.guesses.length;
  const currentRow = props.gameOver ? 0 : 1;
  return Math.max(0, 6 - submitted - currentRow);
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

/* Shake animation for invalid words */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-4px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(4px);
  }
}

.shake {
  animation: shake 0.5s ease-in-out;
}
</style>
