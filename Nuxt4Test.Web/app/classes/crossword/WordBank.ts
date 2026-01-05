// Word bank with clues for crossword puzzles
// Browser-compatible version that loads data via fetch
import type { WordClue } from "./types";

// Cache for loaded words
let wordsByLength: Record<number, WordClue[]> | null = null;
let loadingPromise: Promise<Record<number, WordClue[]>> | null = null;

// Parse TSV content into words grouped by length
function parseTsvContent(content: string): Record<number, WordClue[]> {
  const wordsMap = new Map<number, WordClue[]>();

  content
    .split("\n")
    .slice(1) // Skip the header row
    .forEach((line) => {
      const [word, clue] = line.split("\t");
      if (word && clue) {
        const length = word.length;
        if (!wordsMap.has(length)) {
          wordsMap.set(length, []);
        }
        wordsMap.get(length)!.push({ word: word.toUpperCase(), clue });
      }
    });

  return Object.fromEntries(wordsMap);
}

// Load words from TSV file (async, cached)
export async function loadWords(): Promise<Record<number, WordClue[]>> {
  // Return cached data if available
  if (wordsByLength) {
    return wordsByLength;
  }

  // Return existing promise if already loading
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  loadingPromise = (async () => {
    const response = await fetch("/clues.tsv");
    const content = await response.text();
    wordsByLength = parseTsvContent(content);
    return wordsByLength;
  })();

  return loadingPromise;
}

// Get all words combined (async)
export async function getAllWords(): Promise<WordClue[]> {
  const words = await loadWords();
  return Object.values(words).flat();
}

// Get words by length (async)
export async function getWordsByLength(length: number): Promise<WordClue[]> {
  const words = await loadWords();
  return words[length] || [];
}

// Get a random word of a specific length (async)
export async function getRandomWord(length: number): Promise<WordClue | null> {
  const words = await getWordsByLength(length);
  if (words.length === 0) return null;
  return words[Math.floor(Math.random() * words.length)] || null;
}
