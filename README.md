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

#### 🔬 智能 AI 演算法原理解析：Donald Knuth 的 Mastermind 精神與香農熵
本演算法核心引入了 **Donald Knuth 的 Mastermind 求解演算法精神**，並結合**香農熵 (Shannon Entropy)** 資訊理論：

1. **破局點搜索（允許故意猜錯）**：
   在傳統 1A2B 求解中，很多人只限制在「剩餘的可能答案」中挑選下一個猜測。然而，Knuth 的演算法揭示了：**有時故意猜測一個「明知道是錯誤的組合」（已被淘汰的組合），反而能換取極為龐大的情報量**，從而以更少的平均步數鎖定答案。
   因此，當傳入初始完整可能組合 `allPossibleCodes` 時，我們的 AI 會同時評估「當前合法候選者（Candidates Pool）」與「全域外部組合（Outside Sample）」，找出最大預期資訊增益的「犧牲性猜測（Sacrificial Guess）」。

2. **期望熵 (Expected Entropy) 計算**：
   對於每一個評估的猜測 $g$，假設它對應某個神秘答案 $s \in C$ 會得到一個反饋 $fb$。我們計算該反饋在所有可能性中的概率：
   $$p(fb) = \frac{\text{Count}(fb)}{|C|}$$
   猜測 $g$ 所能帶來的期望熵值為：
   $$H(g) = -\sum_{fb} p(fb) \log_2 p(fb)$$
   我們希望猜測後剩下的答案池越小越好，這意味著我們需要**最大化期望熵**，以此來獲得最多的資訊量。

3. **權重微調魔法 (Tie-breaker Heuristic)**：
   如果一個「必錯的外部猜測」與一個「有可能中的合法猜測」帶來的期望熵完全相同時，AI 會給合法猜測加上 **$+0.05$** 的權重微調。這能確保 AI 在情報量一樣大時偏袒有可能直接猜中的組合，而不會變成一個只顧收集情報卻忘了直接贏得遊戲的書呆子！

4. **即時採樣效能優化 (Real-time Optimization)**：
   為確保前端 UI 在 TypeScript/Vite 環境中完全流暢、不掉幀，AI 引入了**雙重快速隨機採樣**（最多同時抽取 150 組合法候選與 150 組外部組合進行即時熵值評估），將運算時間完美控制在 **10ms 以內**。

---

## 🇺🇸 English Introduction

### 📌 Project Overview
**Cipher Mind** is a high-fidelity, cyberpunk-inspired **1A2B (Bulls and Cows) game and solver** driven by a mathematical suggestion engine. Built on **React 19 + TypeScript + Tailwind 4.0**, it features immersive audio-visual responsive aesthetics, smooth Framer Motion transitions, and multi-language localization.

### ⚙️ Rules & Specifications
- **Code Length (Positions)**: 2 to 6 slots.
- **Value Range**: Custom limits from 0 up to 100 (e.g. at 30, a code like `[25, 0, 9, 18]` is perfectly valid).
- **Duplicate Toggles**: Enable or disable duplicates. Guard rails automatically auto-adjust configs to prevent impossibility states.

---

### 🤖 Where is the "Intelligent AI" Core Located?

> [!IMPORTANT]
> The **Intelligent AI Core Algorithm** is fully self-contained in:
> 🎯 **[`src/utils/gameLogic.ts`](file:///home/toymsi/documents/projects/Github/ai-cipher-mind/src/utils/gameLogic.ts)** inside the **`getOptimalGuess`** function!

#### 🔬 How the AI Works: Donald Knuth's Mastermind Algorithm & Shannon Entropy
Our solver merges the spirit of **Donald Knuth's Mastermind strategy** with **Shannon Entropy** to locate the mathematically optimal next guess:

1. **Strategic Sacrificial Guesses (Outside Exploration)**:
   Instead of searching exclusively within surviving candidates, the AI evaluates a random sample of all theoretically possible combinations (`allPossibleCodes`). Sometimes guessing a code **known to be incorrect** partitions the remaining possibilities more evenly, leading to fewer average moves to solve the code.

2. **Shannon Entropy (Expected Information Gain)**:
   For every guess $g$, we simulate how it scores against each remaining secret candidate $s \in C$, yielding a specific feedback pattern $fb$. We compute the probability of each feedback:
   $$p(fb) = \frac{\text{Count}(fb)}{|C|}$$
   The expected entropy $H(g)$ is calculated as:
   $$H(g) = -\sum_{fb} p(fb) \log_2 p(fb)$$
   The AI selects the guess that **maximizes $H(g)$**.

3. **Tie-breaker Weight Adjustment**:
   If a "sacrificial outside guess" and a "surviving candidate guess" yield identical expected entropy, the AI adds a **$+0.05$ bonus** to the candidate. This prioritizes combinations that have a non-zero probability of winning the game immediately over purely information-gathering guesses.

4. **Real-time Performance Guard**:
   Dual random-shuffled sampling pools evaluate candidates (evaluating up to 150 candidates and 150 outside possibilities) to keep calculations under **10ms**, ensuring a zero-lag UI thread.

---

## 🛠️ 開發與部署 (Local Development & CI/CD)

### 1. 本地啟動 (Local Run)
確保您已安裝 Node.js (v18+)，然後在終端機中執行：
```bash
# 安裝依賴項目 (Install dependencies)
npm install

# 啟動開發伺服器 (Run development server)
npm run dev
```

### 2. 生產端編譯 (Production Build)
確認編譯無誤：
```bash
npm run build
```

### 3. GitHub Actions 自動化部署 (CI/CD Workflows)
本專案已完美整合 GitHub Actions。所有部署設定檔案皆儲存於 [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml)。
當有新的提交推送到 `main` 分支時，GitHub Actions 會自動執行：
1. Checkout 原始碼。
2. 設定 Node.js 環境並啟用快取以加速安裝。
3. 安裝專案依賴。
4. 編譯出生產端 Vite 靜態資源。
5. 安全上傳並將其部署至 **GitHub Pages** 服務（伺服路徑已綁定為 `/ai-cipher-mind/`）。

---

Developed with 💜 by Antigravity AI & pairs.
