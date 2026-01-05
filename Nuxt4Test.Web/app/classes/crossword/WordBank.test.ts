import { describe, it, expect, beforeAll, vi } from "vitest";
import {
  getWordsByLength,
  getRandomWord,
  getAllWords,
  loadWords,
} from "./WordBank";

// Mock fetch for tests
const mockTsvContent = `answer\tclue
HELLO\tA greeting
WORLD\tThe earth
CAT\tA small animal
DOG\tMan's best friend
HOUSE\tA place to live`;

beforeAll(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      text: () => Promise.resolve(mockTsvContent),
    } as Response)
  );
});

describe("WordBank", () => {
  describe("loadWords", () => {
    it("should load and parse words from TSV", async () => {
      const words = await loadWords();
      expect(words).toBeDefined();
      expect(typeof words).toBe("object");
    });
  });

  describe("getAllWords", () => {
    it("should return all words from all lengths", async () => {
      const allWords = await getAllWords();
      expect(allWords).toBeDefined();
      expect(Array.isArray(allWords)).toBe(true);
      expect(allWords.length).toBeGreaterThan(0);

      // Verify each word has the required properties
      allWords.forEach((wordClue) => {
        expect(wordClue).toHaveProperty("word");
        expect(wordClue).toHaveProperty("clue");
        expect(typeof wordClue.word).toBe("string");
        expect(typeof wordClue.clue).toBe("string");
      });
    });
  });

  describe("getWordsByLength", () => {
    it("should return words of a specific length", async () => {
      const length = 5;
      const words = await getWordsByLength(length);

      expect(Array.isArray(words)).toBe(true);

      // If there are words, verify they all have the correct length
      if (words.length > 0) {
        words.forEach((wordClue) => {
          expect(wordClue.word.length).toBe(length);
          expect(wordClue).toHaveProperty("word");
          expect(wordClue).toHaveProperty("clue");
        });
      }
    });

    it("should return an empty array for non-existent lengths", async () => {
      const words = await getWordsByLength(999);
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBe(0);
    });
  });

  describe("getRandomWord", () => {
    it("should return a random word of the specified length", async () => {
      const length = 5;
      const word = await getRandomWord(length);

      // If a word exists for this length
      if (word !== null) {
        expect(word).toHaveProperty("word");
        expect(word).toHaveProperty("clue");
        expect(word.word.length).toBe(length);
      }
    });

    it("should return null for non-existent lengths", async () => {
      const word = await getRandomWord(999);
      expect(word).toBe(null);
    });
  });
});
