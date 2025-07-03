export interface ChatMessage {
  message: string;
  response: string;
  timestamp: string;
  type?: string;
}

export interface ChatResponse {
  message: string;
  response: string;
  userLevel: string;
  timestamp: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct: string;
  explanation: string;
}

export interface Quiz {
  questions: QuizQuestion[];
  level: string;
  totalQuestions: number;
  userId?: number;
  generatedAt?: string;
  timeLimit?: number;
}

export interface QuizEvaluation {
  score: number;
  totalQuestions: number;
  percentage: number;
  feedback: Array<{
    questionId: number;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }>;
  overallFeedback: string;
  recommendedLevel: string;
  timeSpent?: number;
  currentLevel?: string;
  levelUpdated?: boolean;
}

export interface LearningProgress {
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  currentLevel: string;
  recentProgress: Array<{
    quiz_type: string;
    quiz_score: number;
    total_questions: number;
    level: string;
    created_at: string;
  }>;
  progressToNextLevel?: {
    canAdvance: boolean;
    nextLevel: string | null;
    perfectQuizzesNeeded: number;
    perfectQuizzesCompleted: number;
    message: string;
  };
}

export interface ChatHistory {
  history: ChatMessage[];
  hasMore: boolean;
}