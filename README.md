# 🧠 Cipher Mind | 密碼心靈 — Premium 1A2B AI Solver & Codebreaker

> **Live Deployment:** [https://toydogcat.github.io/ai-cipher-mind/](https://toydogcat.github.io/ai-cipher-mind/)

---

## 🇹🇼 繁體中文介紹 (Traditional Chinese)

### 📌 專案概述
**Cipher Mind (密碼心靈)** 是一款融合極客美學與現代演算法的 **1A2B (猜數字) 遊戲與智慧求解器**。
本專案採用 **React 19 + TypeScript + Tailwind 4.0** 構建，為玩家提供科幻感十足的解密終端介面。

本系統支援兩種模式：
1. **經典猜數字模式 (Classic Mode)**：由電腦隨機出題，玩家進行猜測，系統記錄歷史猜測軌跡與 A/B 反饋。
2. **AI 陪你一起猜模式 (Co-op Solver Mode)**：玩家在外部玩猜數字時，輸入對方的 A/B 反饋，系統將實時運算並推薦最優猜測，逐步縮減答案池並列出所有符合邏輯的可能答案。

### ⚙️ 自訂規則規格
系統支援高度自由的遊戲參數配置：
- **密碼位數 (Code Positions)**：支援 2 到 6 位數。
- **每位數上限 (Max Value)**：數值上限可設定為 0 到 100（例如設定為 30，可接受的密碼為 `[25, 0, 9, 18]`）。
- **重複數字限制 (Allow Duplicates)**：可自由開啟或關閉重複數字設定，並內建**邊界防禦機制**（關閉重複時，若數值上限小於密碼位數，系統將在部署時自動修正，防止邏輯死鎖）。

---

### 🤖 我們的「智能 AI」是在哪一份檔案裡面？

> [!IMPORTANT]
> 我們的**智能 AI 核心演算法**完全實作於以下檔案中：
> 🎯 **[`src/utils/gameLogic.ts`](file:///home/toymsi/documents/projects/Github/ai-cipher-mind/src/utils/gameLogic.ts)** 中的 **`getOptimalGuess`** 函數！

#### 🔬 智能 AI 演算法原理解析：香農熵 (Shannon Entropy)
當剩餘可能答案池為 $C$ 時，AI 並非隨機挑選下一個數字，而是運用**資訊理論 (Information Theory)** 中的**香農熵 (Shannon Entropy)** 尋找**預期資訊增益最大**的猜測。

1. **反饋概率分佈**：對於每一個候選猜測 $g$，假設其對應某個神秘答案 $s \in C$ 會得到一個 $aA\,bB$ 的反饋 $fb$。我們計算該反饋在所有可能性中的概率：
   $$p(fb) = \frac{\text{Count}(fb)}{|C|}$$
2. **期望熵 (Expected Entropy)**：計算猜測 $g$ 所能帶來的熵：
   $$H(g) = -\sum_{fb} p(fb) \log_2 p(fb)$$
   熵代表不確定性。我們希望猜測後剩下的答案池越小越好，這意味著我們需要**最大化期望熵**，以此來獲得最多的資訊量。
3. **性能優化 (Real-time Optimization)**：當可能性池較大時，對數十萬種組合進行雙重迴圈運算會導致瀏覽器卡死。我們的 AI 演算法設計了**即時採樣機制**（當池子大小 $|C| > 300$ 時，隨機均勻採樣 $150$ 組樣本進行評估），將運算時間完美控制在 **10ms 以內**，達到順暢無比的即時反饋。

---

## 🇺🇸 English Introduction

### 📌 Project Overview
**Cipher Mind** is a high-fidelity, cyberpunk-inspired **1A2B (Bulls and Cows) game and solver** driven by a mathematical suggestion engine. Built on **React 19 + TypeScript + Tailwind 4.0**, it features immersive audio-visual responsive aesthetics, smooth Framer Motion transitions, and multi-language localization.

Two interactive modules are supported:
1. **Classic Mode**: The system generates a secret combination. You crack the terminal code while tracking iterations and retro-logs.
2. **Co-op Solver Mode**: Playing an external game? Simply log your guesses and input the resulting $A$ and $B$ scores. The AI calculates and displays all surviving candidates and recommends the mathematically optimal guess to solve the code in minimal moves.

### ⚙️ Rules & Specifications
- **Code Length (Positions)**: 2 to 6 slots.
- **Value Range**: Custom limits from 0 up to 100 (e.g. at 30, a code like `[25, 0, 9, 18]` is perfectly valid).
- **Duplicate Toggles**: Enable or disable duplicates. Guard rails automatically auto-adjust configs to prevent impossibility states (e.g. requiring 4 unique digits from a 0-2 range).

---

### 🤖 Where is the "Intelligent AI" Core Located?

> [!IMPORTANT]
> The **Intelligent AI Core Algorithm** is fully self-contained in:
> 🎯 **[`src/utils/gameLogic.ts`](file:///home/toymsi/documents/projects/Github/ai-cipher-mind/src/utils/gameLogic.ts)** inside the **`getOptimalGuess`** function!

#### 🔬 How the AI Works: Shannon Entropy Optimization
Rather than choosing candidates randomly, our solver utilizes **Information Theory** and **Shannon Entropy** to evaluate which guess yields the maximum expected information gain.

1. **Feedback Probability**: For every guess candidate $g$, we simulate how it scores against each potential secret $s \in C$, yielding a specific $aA\,bB$ feedback pattern $fb$. We compute the probability of each feedback:
   $$p(fb) = \frac{\text{Count}(fb)}{|C|}$$
2. **Shannon Entropy**: We calculate the information value (entropy) of guess $g$:
   $$H(g) = -\sum_{fb} p(fb) \log_2 p(fb)$$
   The optimal guess is the sequence that **maximizes $H(g)$**, narrowing down the possibility pool $C$ as rapidly as possible.
3. **Heuristic Performance Guard**: If the size of the candidates pool $|C| > 300$, evaluating all combinations takes $O(|C|^2)$ time, which can lag the UI thread. Our solver implements a Durstenfeld-shuffle sampling mechanism (capping candidate and evaluator sizes to $150$ samples), ensuring the mathematical solver updates in **under 10ms** for instantaneous gameplay response.


