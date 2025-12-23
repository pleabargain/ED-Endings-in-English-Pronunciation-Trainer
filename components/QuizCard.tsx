
import React, { useState, useEffect } from 'react';
import { WordData, EDSound } from '../types';
import { AudioPlayer } from './AudioPlayer';

interface QuizCardProps {
  wordData: WordData;
  onAnswer: (choice: EDSound) => void;
  currentIndex: number;
  total: number;
}

export const QuizCard: React.FC<QuizCardProps> = ({ wordData, onAnswer, currentIndex, total }) => {
  const [selected, setSelected] = useState<EDSound | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleChoice = (choice: EDSound) => {
    if (showFeedback) return;
    setSelected(choice);
    setShowFeedback(true);
    // Let user see feedback for a moment before moving on
    setTimeout(() => {
      onAnswer(choice);
      setSelected(null);
      setShowFeedback(false);
    }, 2500);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showFeedback) return;
      
      const key = event.key.toLowerCase();
      if (key === 't') handleChoice('t');
      if (key === 'd') handleChoice('d');
      if (key === 'i') handleChoice('id');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFeedback, handleChoice]);

  const isCorrect = selected === wordData.sound;

  return (
    <div className="flex flex-col items-center w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full transform transition-all hover:scale-[1.01]">
        <div className="bg-indigo-600 h-2 w-full">
          <div 
            className="bg-emerald-400 h-full transition-all duration-500" 
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
        
        <div className="p-8 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px bg-indigo-200 flex-grow border-t border-dashed"></div>
            <span className="text-indigo-500 font-bold uppercase tracking-widest text-[10px] whitespace-nowrap">
              Word {currentIndex + 1} of {total}
            </span>
            <div className="h-px bg-indigo-200 flex-grow border-t border-dashed"></div>
          </div>

          <h2 className="mt-6 text-5xl font-bold text-slate-800 tracking-tight">
            {wordData.word}
          </h2>
          
          <div className="mt-8 grid grid-cols-3 gap-4">
            {(['t', 'd', 'id'] as EDSound[]).map((choice) => (
              <div key={choice} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleChoice(choice)}
                  disabled={showFeedback}
                  className={`
                    w-full py-4 rounded-xl border-2 font-bold text-xl transition-all
                    ${showFeedback && choice === wordData.sound ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : ''}
                    ${showFeedback && selected === choice && choice !== wordData.sound ? 'bg-rose-50 border-rose-500 text-rose-700' : ''}
                    ${!showFeedback ? 'border-slate-200 hover:border-indigo-400 text-slate-600 hover:bg-indigo-50 active:bg-indigo-100' : ''}
                    ${!showFeedback && selected === choice ? 'bg-indigo-100 border-indigo-600' : ''}
                    ${showFeedback && choice !== wordData.sound && choice !== selected ? 'opacity-40 grayscale border-slate-200' : ''}
                  `}
                >
                  /{choice === 'id' ? 'ɪd' : choice}/
                </button>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  Press '{choice === 'id' ? 'i' : choice}'
                </span>
              </div>
            ))}
          </div>

          <div className={`mt-8 transition-all duration-500 overflow-hidden ${showFeedback ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-4 bg-slate-50 rounded-xl text-left border border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className={`font-bold text-lg ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isCorrect ? 'Correct!' : 'Not quite.'}
                  </p>
                  <p className="text-slate-600 text-sm mt-1">
                    <strong>Rule:</strong> {wordData.rule}
                  </p>
                  <p className="text-slate-500 italic text-xs mt-2">
                    "{wordData.exampleSentence}"
                  </p>
                </div>
                <AudioPlayer text={wordData.word} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <p className="mt-6 text-indigo-400/80 font-medium text-sm text-center">
        Select via keyboard using the letter <span className="font-bold border-b border-indigo-200">t</span>, <span className="font-bold border-b border-indigo-200">d</span> or <span className="font-bold border-b border-indigo-200">i</span>
      </p>
    </div>
  );
};
