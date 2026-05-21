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
 * 高效隨機抽樣，時間複雜度為 O(K)，適用於超大型陣列抽樣
 */
function getRandomSample<T>(arr: T[], sampleSize: number): T[] {
  if (arr.length <= sampleSize) return [...arr];
  const sample: T[] = [];
  const usedIndices = new Set<number>();
  
  while (sample.length < sampleSize) {
    const idx = Math.floor(Math.random() * arr.length);
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      sample.push(arr[idx]);
    }
  }
  return sample;
}

/**
 * Finds the mathematically optimal next guess using Shannon Entropy (Information Gain).
 * * [Optimized Version]: Now evaluates both valid candidates AND a sample of outside combinations 
 * (if allPossibleCodes is provided) to find "sacrificial guesses" that eliminate the most wrong answers.
 */
export function getOptimalGuess(
  candidates: number[][],
  allPossibleCodes?: number[][] // 新增：可傳入遊戲初始生成的所有可能組合
): number[] {
  if (!candidates || candidates.length === 0) return [];
  if (candidates.length <= 2) return candidates[0]; // 只剩1~2個時直接猜，不浪費算力

  let bestGuess = candidates[0];
  let maxEntropy = -1;

  // 1. 建立候選池的常數時間搜尋集合 (O(1) Lookup Set)
  const candidateSet = new Set(candidates.map(c => c.join(',')));

  // 2. 準備評估池 (Evaluation Pool)
  // 限制計算量，確保前端 UI 在 TypeScript/Vite 環境中不會掉幀或卡死
  const maxEvalCandidates = 150; 
  const maxEvalOutside = 150; 
  const evalList: number[][] = [];

  // 加入剩餘的「合法候選者」
  if (candidates.length > maxEvalCandidates) {
    // 替換：秒級變毫秒級！
    evalList.push(...getRandomSample(candidates, maxEvalCandidates));
  } else {
    evalList.push(...candidates);
  }

  // 加入「全域空間」的其他組合來尋找破局點 (Information Gain 最大化)
  if (allPossibleCodes && allPossibleCodes.length > candidates.length) {
    // 替換：秒級變毫秒級！
    evalList.push(...getRandomSample(allPossibleCodes, maxEvalOutside));
  }

  const total = candidates.length;

  // 3. 評估期望熵值
  for (const guess of evalList) {
    const feedbackCounts = new Map<string, number>();

    // 將這個 guess 拿去跟所有「剩餘可能的 secret」做比對，看會產生哪些回饋分佈
    for (const secret of candidates) {
      const fb = getFeedback(guess, secret); // 共用現有的 getFeedback
      const key = `${fb.a}_${fb.b}`;
      feedbackCounts.set(key, (feedbackCounts.get(key) || 0) + 1);
    }

    // 計算夏農熵: H(X) = -sum( p(x) * log2(p(x)) )
    let entropy = 0;
    for (const count of feedbackCounts.values()) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }

    // 4. 權重微調 (Tie-breaker) - 優化為常數時間複雜度 O(1)
    const isCandidate = candidateSet.has(guess.join(','));
    const entropyWeight = isCandidate ? entropy + 0.05 : entropy;

    // 更新最佳解
    if (entropyWeight > maxEntropy) {
      maxEntropy = entropyWeight;
      bestGuess = guess;
    }
  }

  return bestGuess;
}

