<template>
  <v-card class="mx-auto wilderness-card" max-width="750">
    <v-card-title
      class="bg-green-darken-4 text-white d-flex align-center justify-space-between"
    >
      <span>🏕️ Wilderness Bear Patrol 🌲</span>
      <div class="d-flex align-center ga-4">
        <v-chip color="brown-darken-1" variant="flat">
          🐻 {{ mineCount - flagCount }} bears
        </v-chip>
        <v-chip color="amber-darken-2" variant="flat">
          🔥 {{ flagCount }} campfires
        </v-chip>
        <v-chip color="blue-grey" variant="flat"> ⏱️ {{ timer }}s </v-chip>
      </div>
    </v-card-title>

    <v-card-text class="pa-4 position-relative">
      <!-- Wilderness header decoration -->
      <div class="text-center mb-2 wilderness-header">
        🌲🌳🌲 {{ getRandomTreeLine() }} 🌲🌳🌲
      </div>

      <!-- Game board -->
      <div class="d-flex flex-column align-center position-relative">
        <!-- Game status overlay -->
        <v-alert
          v-if="gameOver"
          :type="won ? 'success' : 'error'"
          class="game-over-overlay"
          :icon="false"
        >
          <template v-if="won">
            🎉🏕️ You safely navigated the wilderness! The campsite is secure! ⛺
          </template>
          <template v-else> 🐻💥 You wandered into a bear's den! 🌲 </template>
        </v-alert>

        <div v-for="row in boardSize" :key="'row-' + row" class="d-flex">
          <div
            v-for="col in boardSize"
            :key="'cell-' + row + '-' + col"
            class="cell d-flex align-center justify-center"
            :class="getCellClass(row - 1, col - 1)"
            @click="revealCell(row - 1, col - 1)"
            @contextmenu.prevent="toggleFlag(row - 1, col - 1)"
          >
            {{ getCellContent(row - 1, col - 1) }}
          </div>
        </div>
      </div>

      <!-- Wilderness footer decoration -->
      <div class="text-center mt-2 wilderness-footer">🌿🍂🌿🍃🌿🍂🌿</div>

      <!-- Controls -->
      <div class="d-flex justify-center ga-4 mt-4">
        <v-btn
          color="green-darken-3"
          prepend-icon="mdi-tent"
          @click="resetGame"
        >
          New Expedition
        </v-btn>
        <v-btn
          :color="flagMode ? 'orange-darken-2' : 'grey'"
          :variant="flagMode ? 'flat' : 'outlined'"
          @click="flagMode = !flagMode"
        >
          🔥 Campfire Mode {{ flagMode ? "ON" : "OFF" }}
        </v-btn>
        <v-btn
          color="blue-darken-1"
          variant="flat"
          :disabled="gameOver || !hasUnrevealedOpenArea()"
          @click="revealLargestOpenArea"
        >
          🧭 Hint
        </v-btn>
      </div>

      <!-- Instructions -->
      <div class="text-center text-caption text-brown-darken-2 mt-4">
        🧭 Left-click to explore. Right-click (or use Campfire Mode) to mark
        bear dens with campfires to scare them away!
      </div>
    </v-card-text>

    <!-- Legend -->
    <v-card-text class="bg-brown-lighten-5">
      <div class="text-subtitle-2 mb-2">🗺️ Wilderness Survival Guide:</div>
      <ul class="text-body-2">
        <li>🥾 Explore the forest without stumbling into bear dens 🐻</li>
        <li>
          🔢 Numbers reveal how many bears are lurking nearby in the shadows
        </li>
        <li>
          🔥 Place campfires to mark where you think bears are hiding - fire
          keeps them away!
        </li>
        <li>
          🌲 The forest hides many secrets... tread carefully, adventurer!
        </li>
        <li>⛺ Clear all safe zones to secure the campsite and win!</li>
      </ul>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

const boardSize = 15;
const mineCount = 35;

// Helper to safely get a cell
function getCell(row: number, col: number): Cell | undefined {
  return board.value[row]?.[col];
}

const board = ref<Cell[][]>([]);
const gameOver = ref(false);
const won = ref(false);
const flagMode = ref(false);
const timer = ref(0);
const gameStarted = ref(false);

let timerInterval: ReturnType<typeof setInterval> | null = null;

const flagCount = computed(() => {
  let count = 0;
  for (const row of board.value) {
    for (const cell of row) {
      if (cell.isFlagged) count++;
    }
  }
  return count;
});

const revealedCount = computed(() => {
  let count = 0;
  for (const row of board.value) {
    for (const cell of row) {
      if (cell.isRevealed) count++;
    }
  }
  return count;
});

function createBoard(): Cell[][] {
  const newBoard: Cell[][] = [];

  // Initialize empty board
  for (let row = 0; row < boardSize; row++) {
    newBoard[row] = [];
    for (let col = 0; col < boardSize; col++) {
      newBoard[row]![col] = {
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      };
    }
  }

  // Place mines randomly
  let minesPlaced = 0;
  while (minesPlaced < mineCount) {
    const row = Math.floor(Math.random() * boardSize);
    const col = Math.floor(Math.random() * boardSize);
    const cell = newBoard[row]?.[col];
    if (cell && !cell.isMine) {
      cell.isMine = true;
      minesPlaced++;
    }
  }

  // Calculate adjacent mines for each cell
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const cell = newBoard[row]?.[col];
      if (cell && !cell.isMine) {
        cell.adjacentMines = countAdjacentMines(
          newBoard,
          row,
          col
        );
      }
    }
  }

  return newBoard;
}

function countAdjacentMines(b: Cell[][], row: number, col: number): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (
        newRow >= 0 &&
        newRow < boardSize &&
        newCol >= 0 &&
        newCol < boardSize
      ) {
        const neighbor = b[newRow]?.[newCol];
        if (neighbor?.isMine) count++;
      }
    }
  }
  return count;
}

function revealCell(row: number, col: number): void {
  if (gameOver.value) return;

  const cell = getCell(row, col);
  if (!cell) return;

  // If flag mode is on, toggle flag instead
  if (flagMode.value) {
    toggleFlag(row, col);
    return;
  }

  // Chording: if clicking on revealed number with matching adjacent flags, reveal rest
  if (cell.isRevealed && cell.adjacentMines > 0) {
    const adjacentFlags = countAdjacentFlags(row, col);
    const adjacentUnrevealed = countAdjacentUnrevealed(row, col);

    // Auto-flag: if unrevealed count equals the number, flag them all
    if (adjacentUnrevealed === cell.adjacentMines) {
      autoFlagAdjacent(row, col);
      return;
    }

    // Chord reveal: if flag count matches the number, reveal unflagged neighbors
    if (adjacentFlags === cell.adjacentMines) {
      chordReveal(row, col);
    }
    return;
  }

  if (cell.isRevealed || cell.isFlagged) return;

  // Start timer on first click
  if (!gameStarted.value) {
    gameStarted.value = true;
    startTimer();
  }

  cell.isRevealed = true;

  if (cell.isMine) {
    // Game over - reveal all mines
    gameOver.value = true;
    won.value = false;
    revealAllMines();
    stopTimer();
    return;
  }

  // If no adjacent mines, reveal neighbors recursively
  if (cell.adjacentMines === 0) {
    revealNeighbors(row, col);
  }

  // Check for win
  checkWin();
}

function countAdjacentFlags(row: number, col: number): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (
        newRow >= 0 &&
        newRow < boardSize &&
        newCol >= 0 &&
        newCol < boardSize
      ) {
        const neighbor = getCell(newRow, newCol);
        if (neighbor?.isFlagged) count++;
      }
    }
  }
  return count;
}

function countAdjacentUnrevealed(row: number, col: number): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (
        newRow >= 0 &&
        newRow < boardSize &&
        newCol >= 0 &&
        newCol < boardSize
      ) {
        const neighbor = getCell(newRow, newCol);
        if (neighbor && !neighbor.isRevealed) count++;
      }
    }
  }
  return count;
}

function autoFlagAdjacent(row: number, col: number): void {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (
        newRow >= 0 &&
        newRow < boardSize &&
        newCol >= 0 &&
        newCol < boardSize
      ) {
        const neighbor = getCell(newRow, newCol);
        if (neighbor && !neighbor.isRevealed && !neighbor.isFlagged) {
          neighbor.isFlagged = true;
        }
      }
    }
  }
}

function chordReveal(row: number, col: number): void {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (
        newRow >= 0 &&
        newRow < boardSize &&
        newCol >= 0 &&
        newCol < boardSize
      ) {
        const neighbor = getCell(newRow, newCol);
        if (neighbor && !neighbor.isRevealed && !neighbor.isFlagged) {
          neighbor.isRevealed = true;

          if (neighbor.isMine) {
            // Hit a mine - game over (flag was wrong!)
            gameOver.value = true;
            won.value = false;
            revealAllMines();
            stopTimer();
            return;
          }

          // If no adjacent mines, reveal neighbors recursively
          if (neighbor.adjacentMines === 0) {
            revealNeighbors(newRow, newCol);
          }
        }
      }
    }
  }

  // Check for win after chord reveal
  checkWin();
}

function revealNeighbors(row: number, col: number): void {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = row + dr;
      const newCol = col + dc;
      if (
        newRow >= 0 &&
        newRow < boardSize &&
        newCol >= 0 &&
        newCol < boardSize
      ) {
        const neighbor = getCell(newRow, newCol);
        if (neighbor && !neighbor.isRevealed && !neighbor.isMine && !neighbor.isFlagged) {
          neighbor.isRevealed = true;
          if (neighbor.adjacentMines === 0) {
            revealNeighbors(newRow, newCol);
          }
        }
      }
    }
  }
}

function toggleFlag(row: number, col: number): void {
  if (gameOver.value) return;

  const cell = getCell(row, col);
  if (!cell || cell.isRevealed) return;

  cell.isFlagged = !cell.isFlagged;
}

function revealAllMines(): void {
  for (const row of board.value) {
    for (const cell of row) {
      if (cell.isMine) {
        cell.isRevealed = true;
      }
    }
  }
}

function checkWin(): void {
  const totalCells = boardSize * boardSize;
  const nonMineCells = totalCells - mineCount;

  if (revealedCount.value === nonMineCells) {
    gameOver.value = true;
    won.value = true;
    stopTimer();
  }
}

function getCellClass(row: number, col: number): string {
  const cell = board.value[row]?.[col];
  if (!cell) return "";

  const classes: string[] = [];

  if (cell.isRevealed) {
    classes.push("revealed");
    if (cell.isMine) {
      classes.push("mine");
    }
  } else {
    classes.push("hidden");
  }

  if (cell.isFlagged && !cell.isRevealed) {
    classes.push("flagged");
  }

  return classes.join(" ");
}

function getCellContent(row: number, col: number): string {
  const cell = board.value[row]?.[col];
  if (!cell) return "";

  if (cell.isFlagged && !cell.isRevealed) {
    return "🔥";
  }

  if (!cell.isRevealed) {
    return getRandomForestEmoji(row, col);
  }

  if (cell.isMine) {
    return "🐻";
  }

  if (cell.adjacentMines > 0) {
    return cell.adjacentMines.toString();
  }

  return "";
}

// Get deterministic forest emoji based on position
function getRandomForestEmoji(row: number, col: number): string {
  const emojis = ["🌲", "🌳", "🌿", "🍃", "🌲", "🌳", "🍂", "🌲"];
  const index = (row * 7 + col * 13) % emojis.length;
  return emojis[index] ?? "🌲";
}

// Get random tree line for decoration
function getRandomTreeLine(): string {
  const lines = [
    "The Forest Awaits",
    "Watch for Bears",
    "Explore Carefully",
    "Nature is Wild",
  ];
  return lines[Math.floor(Math.random() * lines.length)] ?? "The Forest Awaits";
}

function startTimer(): void {
  timerInterval = setInterval(() => {
    timer.value++;
  }, 1000);
}

function stopTimer(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetGame(): void {
  stopTimer();
  board.value = createBoard();
  gameOver.value = false;
  won.value = false;
  flagMode.value = false;
  timer.value = 0;
  gameStarted.value = false;
}

// Check if there are any unrevealed open areas left
function hasUnrevealedOpenArea(): boolean {
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const cell = getCell(row, col);
      if (cell && !cell.isMine && !cell.isRevealed && cell.adjacentMines === 0) {
        return true;
      }
    }
  }
  return false;
}

// Find and reveal the cell that exposes the largest unrevealed open area
function revealLargestOpenArea(): void {
  if (gameOver.value) return;
  
  // Start timer if not started
  if (!gameStarted.value) {
    gameStarted.value = true;
    startTimer();
  }
  
  let bestCell = { row: 0, col: 0 };
  let bestSize = 0;
  
  // Find all UNREVEALED cells with 0 adjacent mines and calculate their flood-fill size
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const cell = getCell(row, col);
      if (cell && !cell.isMine && !cell.isRevealed && cell.adjacentMines === 0) {
        const size = calculateOpenAreaSize(row, col);
        if (size > bestSize) {
          bestSize = size;
          bestCell = { row, col };
        }
      }
    }
  }
  
  // If we found an open area, reveal it
  if (bestSize > 0) {
    const targetCell = getCell(bestCell.row, bestCell.col);
    if (targetCell) {
      targetCell.isRevealed = true;
      revealNeighbors(bestCell.row, bestCell.col);
      checkWin();
    }
  }
}

// Calculate how many cells would be revealed from a starting point (without modifying state)
function calculateOpenAreaSize(startRow: number, startCol: number): number {
  const visited = new Set<string>();
  const queue: { row: number; col: number }[] = [{ row: startRow, col: startCol }];
  
  while (queue.length > 0) {
    const { row, col } = queue.shift()!;
    const key = `${row},${col}`;
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    const cell = getCell(row, col);
    if (!cell || cell.isMine) continue;
    
    // If this cell has no adjacent mines, explore neighbors
    if (cell.adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const newRow = row + dr;
          const newCol = col + dc;
          if (
            newRow >= 0 &&
            newRow < boardSize &&
            newCol >= 0 &&
            newCol < boardSize
          ) {
            const neighborKey = `${newRow},${newCol}`;
            if (!visited.has(neighborKey)) {
              queue.push({ row: newRow, col: newCol });
            }
          }
        }
      }
    }
  }
  
  return visited.size;
}

// Initialize game on mount
onMounted(() => {
  resetGame();
});

// Clean up timer on unmount
onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
.wilderness-card {
  background: linear-gradient(180deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 3px solid #2e7d32;
}

.wilderness-header {
  font-size: 14px;
  color: #1b5e20;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.wilderness-footer {
  font-size: 12px;
  letter-spacing: 2px;
}

.game-over-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  min-width: 280px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: overlayPop 0.3s ease-out;
}

@keyframes overlayPop {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.cell {
  width: 32px;
  height: 32px;
  border: 1px solid #33691e;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
  border-radius: 2px;
}

.cell.hidden {
  background: linear-gradient(145deg, #66bb6a, #43a047);
  box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.3),
    inset -2px -2px 4px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.cell.hidden:hover {
  background: linear-gradient(145deg, #81c784, #66bb6a);
  transform: scale(1.05);
  box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.4),
    inset -2px -2px 4px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.2);
}

.cell.revealed {
  background: linear-gradient(145deg, #d7ccc8, #bcaaa4);
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.1);
}

.cell.mine {
  background: linear-gradient(145deg, #a1887f, #8d6e63) !important;
  animation: bearShake 0.5s ease-in-out;
}

@keyframes bearShake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px) rotate(-5deg);
  }
  75% {
    transform: translateX(2px) rotate(5deg);
  }
}

.cell.flagged {
  background: linear-gradient(145deg, #ff9800, #f57c00);
  animation: fireGlow 1s ease-in-out infinite alternate;
}

@keyframes fireGlow {
  from {
    box-shadow: 0 0 5px #ff9800, 0 0 10px #ff5722;
  }
  to {
    box-shadow: 0 0 10px #ff9800, 0 0 20px #ff5722, 0 0 30px #ff9800;
  }
}

/* Number colors - wilderness theme */
.cell.revealed:not(.mine) {
  color: #1565c0; /* 1 - river blue */
}

/* Different colors for different numbers */
.cell.revealed:nth-child(2n):not(.mine) {
  color: #2e7d32; /* forest green */
}

.cell.revealed:nth-child(3n):not(.mine) {
  color: #c62828; /* danger red */
}

.cell.revealed:nth-child(5n):not(.mine) {
  color: #6a1b9a; /* mysterious purple */
}
</style>
