/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GameSettings {
  positions: number;
  maxVal: number;
  allowDuplicates: boolean;
}

export interface Feedback {
  a: number; // Correct value, correct position
  b: number; // Correct value, wrong position
}

export interface GuessRecord {
  guess: number[];
  feedback: Feedback;
}

/**
 * Calculates the A and B feedback for a guess relative to a secret code.
 */
export function getFeedback(guess: number[], secret: number[]): Feedback {
  let a = 0;
  let b = 0;

  const secretUsed = new Array(secret.length).fill(false);
  const guessUsed = new Array(guess.length).fill(false);

  // First pass: Find A
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) {
      a++;
      secretUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  // Second pass: Find B
  for (let i = 0; i < guess.length; i++) {
    if (guessUsed[i]) continue;
    for (let j = 0; j < secret.length; j++) {
      if (!secretUsed[j] && guess[i] === secret[j]) {
        b++;
        secretUsed[j] = true;
        break;
      }
    }
  }

  return { a, b };
}

/**
 * Generates a random secret code based on settings.
 */
export function generateSecret(settings: GameSettings): number[] {
  const { positions, maxVal, allowDuplicates } = settings;
  const secret: number[] = [];

  if (!allowDuplicates) {
    const pool = Array.from({ length: maxVal + 1 }, (_, i) => i);
    for (let i = 0; i < positions; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      secret.push(pool.splice(idx, 1)[0]);
    }
  } else {
    for (let i = 0; i < positions; i++) {
      secret.push(Math.floor(Math.random() * (maxVal + 1)));
    }
  }

  return secret;
}

/**
 * Checks if a candidate code is compatible with a guess and its feedback.
 */
export function isCompatible(
  candidate: number[],
  guess: number[],
  feedback: Feedback
): boolean {
  const result = getFeedback(guess, candidate);
  return result.a === feedback.a && result.b === feedback.b;
}

/**
 * Filters a list of candidates based on a history of guesses.
 */
export function filterCandidates(
  candidates: number[][],
  history: GuessRecord[]
): number[][] {
  return candidates.filter((candidate) =>
    history.every((record) =>
      isCompatible(candidate, record.guess, record.feedback)
    )
  );
}

/**
 * Generates all possible candidate combinations.
 * Warning: Can be slow/memory intensive for large ranges.
 */
export function generateAllCandidates(settings: GameSettings): number[][] {
  const { positions, maxVal, allowDuplicates } = settings;
  const results: number[][] = [];

  function backtrack(current: number[]) {
    if (current.length === positions) {
      results.push([...current]);
      return;
    }

    for (let v = 0; v <= maxVal; v++) {
      if (!allowDuplicates && current.includes(v)) continue;
      current.push(v);
      backtrack(current);
      current.pop();
    }
  }

  // Safety cap for extremely large combinations
  const estimatedSize: number = (allowDuplicates 
    ? Math.pow(maxVal + 1, positions)
    : Array.from({ length: positions }).reduce((acc: number, _, i) => acc * (maxVal + 1 - i), 1 as number)) as number;
  
  if (estimatedSize > 2000000) {
    throw new Error("Combination space too large for brute force solver.");
  }

  backtrack([]);
  return results;
}

/**
 * Finds the mathematically optimal next guess using Shannon Entropy (Information Gain).
 * For each evaluated guess, it computes the probability distribution of feedback outcomes (A, B)
 * across the remaining candidates, and selects the guess that maximizes expected entropy.
 */
export function getOptimalGuess(candidates: number[][]): number[] {
  if (!candidates || candidates.length === 0) return [];
  if (candidates.length <= 2) return candidates[0];

  let bestGuess = candidates[0];
  let maxEntropy = -1;

  // Optimizing performance: limit sample size of guesses evaluated to keep computations under ~10ms.
  // Shannon Entropy will run over all remaining candidates to ensure correct weight.
  const maxEvalCandidates = Math.min(candidates.length, 150);
  const evalList = [...candidates];

  // Quick Durstenfeld shuffle to get a random subset if we have more candidates than maxEvalCandidates
  if (candidates.length > maxEvalCandidates) {
    for (let i = evalList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = evalList[i];
      evalList[i] = evalList[j];
      evalList[j] = temp;
    }
  }

  const sampleGuesses = evalList.slice(0, maxEvalCandidates);

  for (const guess of sampleGuesses) {
    const feedbackCounts = new Map<string, number>();

    // Calculate feedback distribution against all candidates in the remaining pool
    for (const secret of candidates) {
      const fb = getFeedback(guess, secret);
      const key = `${fb.a}_${fb.b}`;
      feedbackCounts.set(key, (feedbackCounts.get(key) || 0) + 1);
    }

    // Compute expected entropy: H(X) = -sum( p(x) * log2(p(x)) )
    let entropy = 0;
    const total = candidates.length;
    for (const count of feedbackCounts.values()) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }

    if (entropy > maxEntropy) {
      maxEntropy = entropy;
      bestGuess = guess;
    }
  }

  return bestGuess;
}

