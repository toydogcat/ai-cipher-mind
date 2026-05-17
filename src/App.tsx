/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Gamepad2, 
  Cpu, 
  RotateCcw, 
  X, 
  Check, 
  Trophy, 
  ChevronRight,
  Info,
  History as HistoryIcon,
  Trash2,
  Plus,
  Minus
} from 'lucide-react';
import { 
  GameSettings, 
  GuessRecord, 
  generateSecret, 
  getFeedback, 
  generateAllCandidates, 
  filterCandidates,
  Feedback,
  getOptimalGuess
} from './utils/gameLogic';

type Language = 'en' | 'zh';

const translations = {
  en: {
    title: "Cipher Mind",
    classicMode: "Classic",
    solverMode: "Solver",
    settingsMode: "Config",
    classicGameTitle: "Classic Game",
    classicGameDesc: "Test your pattern recognition. Can you break the secret code?",
    solverTitle: "Co-op Solver",
    solverDesc: "Running an external game? Input feedback and let the AI find the answer.",
    initiateSystem: "Initiate System",
    syncTerminal: "Sync Terminal",
    terminalConfig: "Terminal Configuration",
    codePositions: "Code Positions",
    maxValue: "Max Value (0 to N)",
    allowDuplicates: "Allow Duplicates",
    deploySettings: "Deploy Settings",
    codeDecryption: "Code Decryption",
    patternSolver: "Pattern Solver",
    slots: "SLOTS",
    range: "RANGE",
    dupes: "DUPES",
    dupesOn: "DUPES:ON",
    dupesOff: "DUPES:OFF",
    terminalCracked: "Terminal Cracked",
    authSuccessful: "Authorization successful in {count} cycles",
    restartSession: "Restart Session",
    aiRecommendation: "AI Recommendation",
    optimalSequenceDesc: "Based on your feedback, this is the most optimal sequence to narrow down remaining patterns using Shannon Entropy.",
    logicErrorInconsistent: "Logic Error: Inconsistent Feedback",
    executeGuess: "Execute Guess",
    provideFeedback: "Provide Feedback for Suggestion",
    posCorrect: "Pos Correct (A)",
    numCorrect: "Num Correct (B)",
    submitFeedback: "SUBMIT FEEDBACK",
    remainingPool: "Remaining Pool",
    possibilities: "Possibilities",
    matchesDisplayed: "Partial matrix displayed",
    noValidPatterns: "No valid patterns detected in the current stream",
    sessionLog: "Session Log",
    iterations: "ITERATIONS",
    awaitingInput: "Awaiting Input Data...",
    cycle: "Cycle_#{count}",
    linkEstablished: "LINK_ESTABLISHED",
    target: "TARGET",
    stableBuild: "STABLE_BUILD_V2.0.0_PROD",
    settingsWarning: "⚠️ Max value must be at least {min} since duplicates are disabled. System will auto-adjust upon deployment.",
    congratsTitle: "🎯 Code Uniquely Solved!",
    congratsDesc: "The Shannon Entropy AI has successfully narrowed down the secret code. The only possible answer is:",
    partialMatches: "前 100 組可能性"
  },
  zh: {
    title: "密碼心靈",
    classicMode: "經典模式",
    solverMode: "陪你一起猜",
    settingsMode: "規格設定",
    classicGameTitle: "經典猜數字",
    classicGameDesc: "測試你的邏輯推理。你能破解電腦產生的神秘數字嗎？",
    solverTitle: "AI 陪你猜",
    solverDesc: "自己在外面玩？輸入對方的 A 和 B，讓 AI 計算並推薦最優猜測。",
    initiateSystem: "啟動系統",
    syncTerminal: "同步終端",
    terminalConfig: "終端規格配置",
    codePositions: "密碼位數",
    maxValue: "數值範圍 (0 到 N)",
    allowDuplicates: "允許重複數字",
    deploySettings: "部署並保存設定",
    codeDecryption: "密碼解密中",
    patternSolver: "AI 規律分析儀",
    slots: "位數",
    range: "範圍",
    dupes: "重複值",
    dupesOn: "允許重複",
    dupesOff: "不重複",
    terminalCracked: "終端破解成功",
    authSuccessful: "已於 {count} 次嘗試中完成授權解密",
    restartSession: "重新啟動會話",
    aiRecommendation: "AI 最優猜測推薦",
    optimalSequenceDesc: "基於您的回饋，此為 AI 運用香農熵（Shannon Entropy）計算出能最大化篩選剩餘可能性的數值序列。",
    logicErrorInconsistent: "邏輯謬誤：回饋條件相互矛盾",
    executeGuess: "執行猜測",
    provideFeedback: "為當前推薦輸入 A、B 回饋",
    posCorrect: "位置與數字皆對 (A)",
    numCorrect: "數字對但位置不對 (B)",
    submitFeedback: "提交回饋數據",
    remainingPool: "剩餘可能性答案池",
    possibilities: "種可能性",
    matchesDisplayed: "僅顯示前 100 組可能解",
    noValidPatterns: "當前篩選流中未檢測到任何合法的答案",
    sessionLog: "會話記錄日誌",
    iterations: "次嘗試歷程",
    awaitingInput: "等待數據輸入中...",
    cycle: "第 {count} 次嘗試",
    linkEstablished: "連線已建立",
    target: "目標規格",
    stableBuild: "穩定版本_V2.0.0_生產端",
    settingsWarning: "⚠️ 由於不允許重複數字，數值上限至少要為 {min}。系統會在保存時自動修正。",
    congratsTitle: "🎯 密碼已唯一鎖定！",
    congratsDesc: "香農熵 AI 已成功鎖定唯一可能的神秘密碼：",
    partialMatches: "僅顯示前 100 組可能解"
  }
};

// --- Sub-components ---

const NumberInput = ({ 
  value, 
  onChange, 
  max, 
  label 
}: { 
  value: number; 
  onChange: (val: number) => void; 
  max: number; 
  label?: string;
  key?: any;
}) => (
  <div className="flex flex-col items-center gap-1.5 focus-within:scale-105 transition-transform">
    {label && <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{label}</span>}
    <div className="flex items-center tech-panel overflow-hidden border-slate-800 shadow-xl">
      <button 
        onClick={() => onChange(Math.max(0, value - 1))}
        className="px-3 py-4 hover:bg-slate-800 transition-colors border-r border-slate-800 text-slate-400 hover:text-indigo-400"
      >
        <Minus size={14} />
      </button>
      <input 
        type="number" 
        value={value}
        min={0}
        max={max}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          if (!isNaN(v)) onChange(Math.min(max, Math.max(0, v)));
        }}
        className="w-14 text-center bg-transparent py-3 font-mono text-xl font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-indigo-300"
      />
      <button 
        onClick={() => onChange(Math.min(max, value + 1))}
        className="px-3 py-4 hover:bg-slate-800 transition-colors border-l border-slate-800 text-slate-400 hover:text-indigo-400"
      >
        <Plus size={14} />
      </button>
    </div>
  </div>
);

const FeedbackBadge = ({ feedback }: { feedback: Feedback }) => (
  <div className="flex gap-2">
    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center">
      <span className="text-lg font-bold text-emerald-400 leading-none">{feedback.a}</span>
      <span className="text-[8px] text-emerald-500 uppercase font-black">Pos</span>
    </div>
    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center">
      <span className="text-lg font-bold text-amber-400 leading-none">{feedback.b}</span>
      <span className="text-[8px] text-amber-500 uppercase font-black">Num</span>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [lang, setLang] = useState<Language>('zh');
  const [mode, setMode] = useState<'menu' | 'classic' | 'solver' | 'settings'>('menu');
  const [settings, setSettings] = useState<GameSettings>({
    positions: 4,
    maxVal: 9,
    allowDuplicates: false
  });

  const [gameId, setGameId] = useState(0); // For resetting games
  const [secret, setSecret] = useState<number[]>([]);
  const [history, setHistory] = useState<GuessRecord[]>([]);
  const [currentGuess, setCurrentGuess] = useState<number[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);

  // Solver specific
  const [candidates, setCandidates] = useState<number[][]>([]);
  const [allPossibleCodes, setAllPossibleCodes] = useState<number[][]>([]);
  const [isSolverReady, setIsSolverReady] = useState(false);
  const [solverError, setSolverError] = useState<string | null>(null);

  const t = (key: string, variables?: Record<string, any>) => {
    const text = translations[lang][key as keyof typeof translations['en']] || key;
    if (variables) {
      let temp = text;
      Object.keys(variables).forEach(k => {
        temp = temp.replace(`{${k}}`, variables[k].toString());
      });
      return temp;
    }
    return text;
  };

  const hasSettingsWarning = !settings.allowDuplicates && settings.maxVal < settings.positions - 1;

  const handleDeploySettings = () => {
    let finalMaxVal = settings.maxVal;
    if (!settings.allowDuplicates && settings.maxVal < settings.positions - 1) {
      finalMaxVal = settings.positions - 1;
      setSettings(prev => ({ ...prev, maxVal: finalMaxVal }));
    }
    setMode('menu');
  };

  useEffect(() => {
    if (mode === 'classic') {
      const s = generateSecret(settings);
      setSecret(s);
      setHistory([]);
      setCurrentGuess(new Array(settings.positions).fill(0));
      setIsGameOver(false);
      setAllPossibleCodes([]);
    } else if (mode === 'solver') {
      try {
        const c = generateAllCandidates(settings);
        setCandidates(c);
        setAllPossibleCodes(c);
        setHistory([]);
        setSolverError(null);
        setIsSolverReady(true);
        setCurrentGuess(new Array(settings.positions).fill(0));
      } catch (e: any) {
        setSolverError(e.message);
        setIsSolverReady(false);
        setAllPossibleCodes([]);
      }
    }
  }, [mode, gameId, settings]);

  const handleGuess = () => {
    if (mode === 'classic') {
      const feedback = getFeedback(currentGuess, secret);
      const newHistory = [...history, { guess: [...currentGuess], feedback }];
      setHistory(newHistory);
      if (feedback.a === settings.positions) {
        setIsGameOver(true);
      }
    } else if (mode === 'solver') {
      // For solver, currentGuess is what the AI suggests or user inputs
      // Then user provides feedback. This is handled separately.
    }
  };

  const handleSolverUpdate = (feedback: Feedback) => {
    const lastGuess = solverSuggestion || currentGuess;
    const newRecord = { guess: lastGuess, feedback };
    const newHistory = [...history, newRecord];
    const newCandidates = filterCandidates(candidates, [newRecord]);
    
    setHistory(newHistory);
    setCandidates(newCandidates);
  };

  const solverSuggestion = useMemo(() => {
    if (mode !== 'solver' || candidates.length === 0) return null;
    return getOptimalGuess(candidates, allPossibleCodes); // Use our Knuth-inspired Mastermind resolution engine
  }, [candidates, allPossibleCodes, mode]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <header className="flex items-center justify-between px-8 py-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-50 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">
            <Gamepad2 size={18} />
          </div>
          <h1 className="text-xl font-black tracking-tight uppercase text-slate-200">
            {lang === 'zh' ? '密碼' : 'Cipher'} <span className="text-indigo-400">{lang === 'zh' ? '心靈' : 'Mind'}</span>
          </h1>
        </div>
        
        <nav className="flex gap-1 p-1 bg-slate-950 rounded-full border border-slate-800">
          <button 
            onClick={() => setMode('classic')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${mode === 'classic' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t('classicMode')}
          </button>
          <button 
            onClick={() => setMode('solver')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${mode === 'solver' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t('solverMode')}
          </button>
          <button 
            onClick={() => setMode('settings')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${mode === 'settings' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t('settingsMode')}
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors shadow-inner cursor-pointer"
          >
            {lang === 'en' ? '繁中' : 'EN'}
          </button>
          {mode !== 'menu' && (
            <button onClick={() => setMode('menu')} className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800 cursor-pointer">
              <X size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {mode === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mt-4"
            >
              <button 
                onClick={() => setMode('classic')}
                className="tech-panel p-10 rounded-2xl flex flex-col items-center gap-6 group transition-all hover:bg-slate-900/50 hover:border-indigo-500/30 relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-600/10 transition-colors" />
                <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xl shadow-indigo-600/5">
                  <Gamepad2 size={40} />
                </div>
                <div className="text-center z-10">
                  <h3 className="text-2xl font-bold text-slate-100 mb-2">{t('classicGameTitle')}</h3>
                  <p className="text-slate-400 leading-relaxed max-w-[240px] text-sm">{t('classicGameDesc')}</p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                  {t('initiateSystem')} <ChevronRight size={14} />
                </div>
              </button>

              <button 
                onClick={() => setMode('solver')}
                className="tech-panel p-10 rounded-2xl flex flex-col items-center gap-6 group transition-all hover:bg-slate-900/50 hover:border-indigo-500/30 relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-600/10 transition-colors" />
                <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xl shadow-indigo-600/5">
                  <Cpu size={40} />
                </div>
                <div className="text-center z-10">
                  <h3 className="text-2xl font-bold text-slate-100 mb-2">{t('solverTitle')}</h3>
                  <p className="text-slate-400 leading-relaxed max-w-[240px] text-sm">{t('solverDesc')}</p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                  {t('syncTerminal')} <ChevronRight size={14} />
                </div>
              </button>
            </motion.div>
          )}

          {mode === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="tech-panel p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                <Settings size={20} className="text-indigo-400" />
                {t('terminalConfig')}
              </h2>

              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 mb-4 block tracking-widest">{t('codePositions')}</label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map(num => (
                      <button 
                        key={num}
                        onClick={() => setSettings({ ...settings, positions: num })}
                        className={`flex-1 py-3 rounded-lg border font-mono font-bold transition-all cursor-pointer ${settings.positions === num ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block tracking-widest">{t('maxValue')}</label>
                    <p className="text-[10px] text-slate-600 font-mono mt-1">SYSTEM_LIMIT: 100</p>
                  </div>
                  <NumberInput 
                    value={settings.maxVal} 
                    onChange={(val) => setSettings({ ...settings, maxVal: val })} 
                    max={100} 
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 block tracking-widest">{t('allowDuplicates')}</label>
                    <p className="text-[10px] text-slate-600 font-mono mt-1">DUPE_COLLISION_LOGIC</p>
                  </div>
                  <button 
                    onClick={() => setSettings({ ...settings, allowDuplicates: !settings.allowDuplicates })}
                    className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${settings.allowDuplicates ? 'bg-indigo-600' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${settings.allowDuplicates ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {hasSettingsWarning && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-lg leading-relaxed font-medium"
                  >
                    {t('settingsWarning', { min: settings.positions - 1 })}
                  </motion.div>
                )}

                <div className="pt-4">
                  <button 
                    onClick={handleDeploySettings}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <Check size={20} /> {t('deploySettings')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {(mode === 'classic' || mode === 'solver') && (
            <motion.div 
              key={mode} 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="w-full flex md:flex-row flex-col gap-6"
            >
              {/* Left Column: Game Interaction */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="tech-panel p-8 shadow-2xl">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-3">
                        {mode === 'classic' ? <Gamepad2 className="text-indigo-400" size={24} /> : <Cpu className="text-indigo-400" size={24} />}
                        {mode === 'classic' ? t('codeDecryption') : t('patternSolver')}
                      </h2>
                      <div className="flex gap-3 mt-2">
                        <span className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-500 rounded font-mono uppercase tracking-tighter">{t('slots')}:{settings.positions}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-500 rounded font-mono uppercase tracking-tighter">{t('range')}:0-{settings.maxVal}</span>
                        <span className={`text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono uppercase tracking-tighter ${settings.allowDuplicates ? 'text-indigo-400' : 'text-slate-600'}`}>{settings.allowDuplicates ? t('dupesOn') : t('dupesOff')}</span>
                      </div>
                    </div>
                    <button onClick={() => setGameId(id => id + 1)} className="p-3 hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-indigo-400 bg-slate-900 border border-slate-800 shadow-inner cursor-pointer">
                      <RotateCcw size={20} />
                    </button>
                  </div>

                  {mode === 'solver' && solverError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-xl mb-6 text-sm flex items-start gap-4">
                      <X className="shrink-0 mt-0.5" size={18} />
                      <p className="font-medium leading-relaxed font-mono">{solverError}</p>
                    </div>
                  )}

                  {mode === 'classic' && isGameOver && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 p-8 rounded-2xl mb-8 text-center relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full scale-150" />
                      <div className="relative z-10">
                        <Trophy size={64} className="mx-auto mb-4 text-emerald-500 filter drop-shadow-lg" />
                        <h3 className="text-2xl font-black tracking-tight mb-2 uppercase">{t('terminalCracked')}</h3>
                        <p className="text-sm opacity-60 mb-6 font-mono uppercase tracking-widest">{t('authSuccessful', { count: history.length })}</p>
                        <div className="flex justify-center gap-3">
                          {secret.map((n, i) => (
                            <div key={i} className="w-12 h-14 flex items-center justify-center bg-emerald-500 text-slate-950 rounded-xl font-black text-xl mono shadow-lg shadow-emerald-500/20 border-b-4 border-emerald-700">
                              {n}
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={() => setGameId(id => id + 1)}
                          className="mt-8 btn-primary bg-emerald-600 hover:bg-emerald-500 px-10 border-none shadow-xl shadow-emerald-900/20 transition-all font-black cursor-pointer"
                        >
                          {t('restartSession')}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Input Interface */}
                  {!isGameOver && (mode === 'classic' || isSolverReady) && (
                    <div className="flex flex-col items-center gap-10">
                      {mode === 'solver' && (
                        <div className="w-full bg-indigo-500/5 p-6 rounded-2xl border border-indigo-500/10 relative overflow-hidden">
                          <div className="flex items-center gap-2 mb-6 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            {t('aiRecommendation')}
                          </div>

                          {candidates.length === 1 ? (
                            <motion.div 
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-center z-10 relative py-2"
                            >
                              <h4 className="text-emerald-400 font-black text-lg tracking-tight mb-2 uppercase">{t('congratsTitle')}</h4>
                              <p className="text-slate-400 text-xs mb-4">{t('congratsDesc')}</p>
                              <div className="flex justify-center gap-3 my-4">
                                {candidates[0].map((n, i) => (
                                  <div key={i} className="w-12 h-14 flex items-center justify-center bg-emerald-500 text-slate-950 rounded-xl font-black text-xl mono shadow-lg shadow-emerald-500/20 border-b-4 border-emerald-700">
                                    {n}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          ) : (
                            <>
                              <div className="flex justify-center gap-4">
                                {solverSuggestion ? solverSuggestion.map((n, i) => (
                                  <div key={i} className="w-14 h-16 flex flex-col items-center justify-center bg-slate-950 border border-indigo-500/30 text-indigo-400 rounded-xl text-2xl font-black mono shadow-inner relative group">
                                    <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
                                    <span className="relative z-10">{n}</span>
                                    <span className="text-[8px] opacity-30 mt-0.5 relative z-10 font-bold">P{i+1}</span>
                                  </div>
                                )) : (
                                  <div className="text-red-400 text-sm font-bold bg-red-400/10 px-4 py-2 rounded border border-red-400/20 uppercase tracking-widest italic flex items-center gap-2 font-mono">
                                    <Info size={14} /> {t('logicErrorInconsistent')}
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-600 mt-6 text-center font-bold uppercase tracking-widest leading-relaxed">
                                {t('optimalSequenceDesc')}
                              </p>
                            </>
                          )}
                        </div>
                      )}

                      {mode === 'classic' && (
                        <div className="flex flex-wrap justify-center gap-4 p-2">
                          {currentGuess.map((val, i) => (
                            <NumberInput 
                              key={i} 
                              label={`${lang === 'zh' ? '第 ' + (i+1) + ' 位' : 'SLOT ' + (i+1)}`}
                              value={val} 
                              max={settings.maxVal} 
                              onChange={(v: number) => {
                                const next = [...currentGuess];
                                next[i] = v;
                                setCurrentGuess(next);
                              }} 
                            />
                          ))}
                        </div>
                      )}

                      <div className="w-full pt-4 border-t border-slate-800">
                        {mode === 'classic' ? (
                          <button 
                            disabled={!settings.allowDuplicates && new Set(currentGuess).size !== currentGuess.length}
                            onClick={handleGuess}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-4 text-lg tracking-widest uppercase italic cursor-pointer"
                          >
                            {t('executeGuess')}
                          </button>
                        ) : (
                          <div className="space-y-6">
                            <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest bg-indigo-500/5 py-2 rounded">{t('provideFeedback')}</div>
                            
                            {/* Full feedback for solver */}
                            <div className="grid grid-cols-2 gap-6">
                               <div className="space-y-3">
                                 <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                   {t('posCorrect')}
                                 </label>
                                 <select 
                                   id="a-select"
                                   className="tech-input w-full text-center text-lg font-bold mono h-12 bg-slate-900 border-slate-800 text-slate-100 rounded focus:border-indigo-500 outline-none"
                                   defaultValue={0}
                                 >
                                    {Array.from({ length: settings.positions + 1 }).map((_, i) => <option key={i} value={i}>{i}</option>)}
                                 </select>
                               </div>
                               <div className="space-y-3">
                                 <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                   {t('numCorrect')}
                                 </label>
                                 <select 
                                   id="b-select"
                                   className="tech-input w-full text-center text-lg font-bold mono h-12 bg-slate-900 border-slate-800 text-slate-100 rounded focus:border-indigo-500 outline-none"
                                   defaultValue={0}
                                 >
                                    {Array.from({ length: settings.positions + 1 }).map((_, i) => <option key={i} value={i}>{i}</option>)}
                                 </select>
                               </div>
                               <button 
                                 disabled={candidates.length <= 1}
                                 onClick={() => {
                                   const aSelect = document.getElementById('a-select') as HTMLSelectElement;
                                   const bSelect = document.getElementById('b-select') as HTMLSelectElement;
                                   const a = parseInt(aSelect.value);
                                   const b = parseInt(bSelect.value);
                                   handleSolverUpdate({ a, b });
                                   // Reset selects
                                   aSelect.value = "0";
                                   bSelect.value = "0";
                                 }}
                                 className="col-span-2 btn-primary py-4 text-base tracking-[0.2em] font-black italic shadow-lg shadow-sky-500/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                               >
                                 {t('submitFeedback')}
                               </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {mode === 'solver' && (
                   <div className={`tech-panel p-6 shadow-xl transition-all border ${candidates.length <= 10 && candidates.length > 0 ? 'border-emerald-500/40 bg-emerald-950/5 shadow-emerald-500/5' : 'border-slate-800 border-dashed bg-slate-900/10'}`}>
                     <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="font-bold text-xs tracking-widest text-indigo-400 uppercase">{t('remainingPool')}</h3>
                          <div className="mt-1 text-2xl font-black text-slate-200 mono flex items-baseline gap-2">
                            <span>{candidates.length}</span> 
                            <span className="text-[10px] text-slate-600 font-bold tracking-normal uppercase">{t('possibilities')}</span>
                          </div>
                        </div>
                        {candidates.length <= 10 && candidates.length > 1 && (
                          <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded animate-pulse">
                            CRITICAL_DENSITY_NEAR
                          </span>
                        )}
                     </div>
                     <div className="h-48 overflow-y-auto scrolling-touch space-y-1.5 pr-2 custom-scrollbar">
                        {candidates.slice(0, 100).map((cand, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50 hover:bg-slate-800/50 transition-colors group">
                             <div className="flex gap-2 font-mono items-center">
                               <span className="text-slate-600 mr-2 text-[10px] font-bold">#{(idx+1).toString().padStart(2, '0')}</span>
                               <div className="flex gap-1.5">
                                 {cand.map((num, i) => (
                                   <span key={i} className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-bold text-xs text-indigo-300">
                                     {num}
                                   </span>
                                 ))}
                               </div>
                             </div>
                             <span className="text-[10px] text-slate-700 font-mono opacity-0 group-hover:opacity-100 transition-opacity">MATCH_PROB: {(100/candidates.length).toFixed(2)}%</span>
                          </div>
                        ))}
                        {candidates.length > 100 && (
                          <div className="text-center py-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest border-t border-slate-800 mt-4 italic">{t('matchesDisplayed')}</div>
                        )}
                        {candidates.length === 0 && (
                          <div className="text-center py-12 text-sm text-red-500/30 flex flex-col items-center gap-2">
                            <Trash2 size={32} />
                            <span className="font-bold uppercase tracking-tighter italic">{t('noValidPatterns')}</span>
                          </div>
                        )}
                     </div>
                   </div>
                )}
              </div>

              {/* Right Column: History */}
              <div className="w-full md:w-96 flex flex-col gap-6">
                <div className="tech-panel flex-1 min-h-[500px] flex flex-col shadow-2xl relative overflow-hidden">
                  <div className="p-5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {t('sessionLog')}
                    </h3>
                    <div className="px-2 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-[10px] text-slate-500 shadow-inner">
                      {history.length.toString().padStart(2, '0')} {t('iterations')}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-950/20">
                    {history.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-800 gap-4 py-24">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center">
                          <HistoryIcon size={24} className="opacity-20" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{t('awaitingInput')}</span>
                      </div>
                    ) : (
                      history.slice().reverse().map((record, i) => (
                        <motion.div 
                          initial={{ x: 20, opacity: 0 }} 
                          animate={{ x: 0, opacity: 1 }}
                          key={i} 
                          className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-xl group hover:border-indigo-500/30 hover:bg-slate-900 transition-all shadow-sm"
                        >
                          <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-black text-slate-600 mono uppercase tracking-widest">{t('cycle', { count: history.length - i })}</span>
                            <div className="flex gap-2">
                              {record.guess.map((n, idx) => (
                                <span key={idx} className="px-2 py-1 bg-slate-950 border border-slate-800 rounded font-mono font-bold text-indigo-400 text-sm shadow-inner min-w-[32px] text-center">
                                  {n}
                                </span>
                              ))}
                            </div>
                          </div>
                          <FeedbackBadge feedback={record.feedback} />
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <header></header> {/* Kept dummy to preserve structure alignment if needed */}
      <footer className="px-8 py-4 bg-slate-950 border-t border-slate-900 flex justify-between items-center shrink-0">
        <div className="flex gap-6 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2 group">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('linkEstablished')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>MODE: {mode.toUpperCase()}</span>
          </div>
          <div className="hidden md:block">
            <span>{t('target')}: {settings.positions}P_{settings.maxVal}R</span>
          </div>
        </div>
        <div className="text-[10px] text-slate-700 italic font-medium">{t('stableBuild')}</div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
