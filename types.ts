
export type EDSound = 't' | 'd' | 'id';

export interface WordData {
  word: string;
  sound: EDSound;
  rule: string;
  exampleSentence: string;
}

export interface QuizState {
  currentWordIndex: number;
  score: number;
  totalQuestions: number;
  isFinished: boolean;
  history: Array<{
    word: string;
    userChoice: EDSound;
    isCorrect: boolean;
  }>;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS',
  LEARN = 'LEARN'
}
