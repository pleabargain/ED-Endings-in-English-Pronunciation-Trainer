
import React, { useState, useEffect, useCallback } from 'react';
import { AppStatus, WordData, EDSound, QuizState } from './types';
import { INITIAL_WORDS, RULES } from './constants';
import { geminiService } from './services/geminiService';
import { QuizCard } from './components/QuizCard';
import { AudioPlayer } from './components/AudioPlayer';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [difficultyIndex, setDifficultyIndex] = useState(2); // Default B1
  const [words, setWords] = useState<WordData[]>(INITIAL_WORDS);
  const [rulesState, setRulesState] = useState(RULES);
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);
  const [sessionSeenWords, setSessionSeenWords] = useState<string[]>([]);
  const [quizState, setQuizState] = useState<QuizState>({
    currentWordIndex: 0,
    score: 0,
    totalQuestions: INITIAL_WORDS.length,
    isFinished: false,
    history: []
  });

  const goHome = () => setStatus(AppStatus.IDLE);

  const startQuiz = async (useAI: boolean) => {
    setStatus(AppStatus.LOADING);
    const difficulty = LEVELS[difficultyIndex];
    
    if (useAI) {
      const freshWords = await geminiService.generateWords(difficulty, sessionSeenWords);
      if (freshWords.length > 0) {
        setWords(freshWords);
        setSessionSeenWords(prev => [...prev, ...freshWords.map(w => w.word)]);
        setQuizState({
          currentWordIndex: 0,
          score: 0,
          totalQuestions: freshWords.length,
          isFinished: false,
          history: []
        });
      } else {
        // Fallback to local
        setWords(INITIAL_WORDS);
        setQuizState({
          currentWordIndex: 0,
          score: 0,
          totalQuestions: INITIAL_WORDS.length,
          isFinished: false,
          history: []
        });
      }
    } else {
      // For classic practice, we shuffle local words and filter seen ones if possible
      const filtered = INITIAL_WORDS.filter(w => !sessionSeenWords.includes(w.word));
      const pool = filtered.length >= 5 ? filtered : INITIAL_WORDS;
      const subset = pool.sort(() => Math.random() - 0.5).slice(0, 10);
      
      setWords(subset);
      setSessionSeenWords(prev => [...prev, ...subset.map(w => w.word)]);
      setQuizState({
        currentWordIndex: 0,
        score: 0,
        totalQuestions: subset.length,
        isFinished: false,
        history: []
      });
    }
    setStatus(AppStatus.QUIZ);
  };

  const handleAnswer = (choice: EDSound) => {
    const currentWord = words[quizState.currentWordIndex];
    const isCorrect = choice === currentWord.sound;
    
    setQuizState(prev => {
      const nextIndex = prev.currentWordIndex + 1;
      const finished = nextIndex >= prev.totalQuestions;
      
      const newState = {
        ...prev,
        score: isCorrect ? prev.score + 1 : prev.score,
        currentWordIndex: nextIndex,
        isFinished: finished,
        history: [...prev.history, { word: currentWord.word, userChoice: choice, isCorrect }]
      };

      if (finished) {
        setStatus(AppStatus.RESULTS);
      }
      return newState;
    });
  };

  const handleGenerateExamples = async () => {
    setIsGeneratingExamples(true);
    const newRules = await geminiService.generateExamples();
    if (newRules && newRules.length === 3) {
      setRulesState(newRules);
    }
    setIsGeneratingExamples(false);
  };

  const sendToGmail = () => {
    const scoreText = `I scored ${quizState.score}/${quizState.totalQuestions} on ED-Master Pro (Level ${LEVELS[difficultyIndex]})!`;
    const wordList = quizState.history.map(h => 
      `${h.isCorrect ? '✓' : '✗'} ${h.word.padEnd(15)} - Predicted: /${h.userChoice}/`
    ).join('\n');
    
    const body = `Hi,\n\nI just finished a pronunciation practice session for English -ed endings.\n\nSummary: ${scoreText}\n\nWord List:\n${wordList}\n\nKeep practicing!\nSent from ED-Master Pro`;
    
    const mailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent('My English Pronunciation Practice')}&body=${encodeURIComponent(body)}`;
    window.open(mailUrl, '_blank');
  };

  const renderContent = () => {
    switch (status) {
      case AppStatus.IDLE:
        return (
          <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-700 w-full max-w-2xl">
            <div className="p-4 bg-indigo-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-slate-800 tracking-tight">ED-Master Pro</h1>
              <p className="text-xl text-slate-600">
                Master the three sounds of the past tense suffix. 
              </p>
            </div>

            <div className="w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Difficulty</span>
                <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-black rounded-full">{LEVELS[difficultyIndex]}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="5" 
                value={difficultyIndex}
                onChange={(e) => setDifficultyIndex(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                {LEVELS.map((L, i) => (
                  <span key={L} className={i === difficultyIndex ? "text-indigo-600" : ""}>{L}</span>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4">
              <button 
                onClick={() => startQuiz(false)}
                className="px-8 py-4 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-all shadow-md active:scale-95 flex-1"
              >
                Classic Practice
              </button>
              <button 
                onClick={() => startQuiz(true)}
                className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2 flex-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
                AI Practice ({LEVELS[difficultyIndex]})
              </button>
            </div>
            <button 
              onClick={() => setStatus(AppStatus.LEARN)}
              className="text-slate-500 hover:text-indigo-600 font-medium underline underline-offset-4"
            >
              Learn the rules first
            </button>
          </div>
        );
      
      case AppStatus.LOADING:
        return (
          <div className="flex flex-col items-center space-y-6">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-8 border-indigo-100 rounded-full"></div>
              <div className="absolute inset-0 border-8 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-xl font-medium text-slate-700 animate-pulse">
              Gemini is crafting {LEVELS[difficultyIndex]} level words...
            </p>
            <button 
              onClick={goHome}
              className="px-6 py-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011-1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Cancel & Home
            </button>
          </div>
        );

      case AppStatus.QUIZ:
        return (
          <div className="w-full flex flex-col items-center px-4 space-y-6">
            <QuizCard 
              wordData={words[quizState.currentWordIndex]}
              onAnswer={handleAnswer}
              currentIndex={quizState.currentWordIndex}
              total={quizState.totalQuestions}
            />
            <button 
              onClick={goHome}
              className="text-slate-400 hover:text-rose-500 font-medium text-sm flex items-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Exit to Home
            </button>
          </div>
        );

      case AppStatus.RESULTS:
        const percentage = Math.round((quizState.score / quizState.totalQuestions) * 100);
        return (
          <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-500">
            <div className="p-10 text-center bg-indigo-600 text-white relative">
              <button 
                onClick={goHome}
                className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Home"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011-1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </button>
              <button 
                onClick={sendToGmail}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center gap-2 text-xs font-bold"
                title="Send practice words to Gmail"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="hidden sm:inline">Gmail Practice List</span>
              </button>
              <h2 className="text-4xl font-black">Test Complete!</h2>
              <div className="mt-6 inline-flex items-center justify-center p-8 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                <span className="text-7xl font-black">{percentage}%</span>
              </div>
              <p className="mt-4 text-indigo-100 text-lg">
                Level {LEVELS[difficultyIndex]} Score: {quizState.score}/{quizState.totalQuestions}
              </p>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Review History</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {quizState.history.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-bold text-xs ${item.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                          {item.isCorrect ? '✓' : '✗'}
                        </span>
                        <div>
                          <p className="font-bold text-slate-700">{item.word}</p>
                          <p className="text-xs text-slate-500 uppercase tracking-tight">Result: /{item.userChoice}/</p>
                        </div>
                      </div>
                      <AudioPlayer text={item.word} />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col justify-center space-y-6">
                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <h3 className="font-bold text-indigo-800 text-lg mb-2">Teacher's Note</h3>
                  <p className="text-indigo-900 leading-relaxed text-sm">
                    {percentage >= 90 ? "Excellent job! You are mastering this level." : 
                     percentage >= 70 ? "Good work. Try focusing on the voiced vs voiceless distinction." : 
                     "Keep practicing! Focus on the /id/ sound—it only happens after 't' and 'd'."}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => startQuiz(true)}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg"
                  >
                    Try New {LEVELS[difficultyIndex]} Words
                  </button>
                  <button 
                    onClick={goHome}
                    className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                  >
                    Main Menu / Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case AppStatus.LEARN:
        const cardThemes = [
          { blob: 'bg-amber-100', text: 'text-amber-600', hover: 'hover:border-amber-400' },
          { blob: 'bg-sky-100', text: 'text-sky-600', hover: 'hover:border-sky-400' },
          { blob: 'bg-rose-100', text: 'text-rose-600', hover: 'hover:border-rose-400' }
        ];

        return (
          <div className="max-w-5xl w-full space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
            <div className="flex items-center gap-6">
              <button 
                onClick={goHome}
                className="px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 transition-all flex items-center gap-2 group text-sm font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Home
              </button>
              <h2 className="text-3xl font-black text-slate-800">The Rules of -ED</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {rulesState.map((rule, idx) => (
                <div key={idx} className={`bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col h-full relative group transition-opacity ${isGeneratingExamples ? 'opacity-50' : ''}`}>
                  <div className="relative mb-6">
                    <div className={`absolute -top-4 -left-4 w-16 h-16 rounded-full blur-xl opacity-60 ${cardThemes[idx % cardThemes.length].blob}`}></div>
                    <div className="relative">
                      <h3 className={`text-4xl font-black ${cardThemes[idx % cardThemes.length].text} leading-tight`}>
                        {rule.category.split(' ')[0]}
                      </h3>
                      <h3 className={`text-3xl font-bold ${cardThemes[idx % cardThemes.length].text} opacity-80 leading-none`}>
                        Sound
                      </h3>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-grow">
                    {rule.description}
                  </p>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Examples:</p>
                    <div className="flex flex-wrap gap-2">
                      {rule.examples.map(ex => (
                        <span key={ex} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 text-xs font-semibold hover:bg-white transition-colors">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center -mt-4">
              <button 
                onClick={handleGenerateExamples}
                disabled={isGeneratingExamples}
                className="text-indigo-600 hover:text-indigo-800 font-bold text-sm underline underline-offset-4 decoration-indigo-200 decoration-2 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingExamples ? (
                  <><span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span> Generating Examples...</>
                ) : (
                  "Generate new examples"
                )}
              </button>
            </div>
            
            <div className="bg-white p-10 rounded-[2.5rem] shadow-lg border border-slate-50">
              <h3 className="text-2xl font-black text-slate-800 mb-4">Pro Tip: Voiced vs Voiceless</h3>
              <p className="text-slate-600 leading-relaxed text-lg">
                To tell if a sound is <strong>voiced</strong>, put your hand on your throat. If you feel a vibration, it's voiced. If you don't, it's <strong>voiceless</strong>. 
                Voiced endings usually take /d/, and voiceless endings usually take /t/.
              </p>
            </div>
            <div className="flex justify-center">
              <button 
                onClick={goHome}
                className="px-10 py-4 bg-[#4f46e5] text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011-1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Return to Home
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center pointer-events-none z-50">
        <button 
          onClick={goHome} 
          className="flex items-center gap-2 pointer-events-auto cursor-pointer group active:scale-95 transition-all"
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">ED</div>
          <span className="font-bold text-slate-800 tracking-tight hidden sm:block">Master Pro</span>
        </button>
        <div className="pointer-events-auto flex items-center gap-4">
          <div className="px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:block">
            Gemini API Powered
          </div>
        </div>
      </header>

      <main className="w-full flex justify-center py-20">
        {renderContent()}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
        &copy; {new Date().getFullYear()} Linguistic AI Research Lab
      </footer>
    </div>
  );
};

export default App;
