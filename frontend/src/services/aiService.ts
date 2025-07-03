import api from './api';
import { ChatResponse, Quiz, QuizEvaluation, LearningProgress, ChatHistory } from '../types/ai';

export const aiService = {
  // Chat cu AI-ul educațional cu streaming
  async sendMessage(
    message: string, 
    includeHistory: boolean = true,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:5002/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message,
        includeHistory
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        
        if (onChunk) {
          onChunk(chunk);
        }
      }
    }

    return fullResponse;
  },

  // Generare quiz - nivelul este determinat automat pe backend
  async generateQuiz(): Promise<Quiz> {
    try {
      const response = await api.get<Quiz>(`/ai/quiz`);
      return response.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },

  // Evaluare quiz
  async evaluateQuiz(
    questions: Quiz['questions'], 
    answers: string[], 
    level: string,
    timeSpent?: number
  ): Promise<QuizEvaluation> {
    const response = await api.post<QuizEvaluation>('/ai/quiz/evaluate', {
      questions,
      answers,
      level,
      timeSpent
    });
    return response.data;
  },

  // Istoric conversații
  async getChatHistory(limit: number = 20, offset: number = 0): Promise<ChatHistory> {
    const response = await api.get<ChatHistory>(`/ai/chat/history?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Progres învățare
  async getLearningProgress(): Promise<LearningProgress> {
    const response = await api.get<LearningProgress>('/ai/progress');
    return response.data;
  },

  // Actualizare nivel utilizator
  async updateUserLevel(level: 'beginner' | 'intermediate' | 'advanced'): Promise<{ message: string; newLevel: string }> {
    const response = await api.put('/ai/level', { level });
    return response.data;
  }
};