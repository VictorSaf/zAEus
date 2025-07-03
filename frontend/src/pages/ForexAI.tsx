import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';
import { ChatMessage, LearningProgress } from '../types/ai';
import ReactMarkdown from 'react-markdown';

const ForexAI: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
    loadProgress();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const history = await aiService.getChatHistory(10);
      setMessages(history.history.reverse());
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const progressData = await aiService.getLearningProgress();
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const messageToSend = inputMessage.trim();
    setInputMessage('');
    setError('');
    setIsLoading(true);

    // Adaugă mesajul utilizatorului în chat
    const userMessage: ChatMessage = {
      message: messageToSend,
      response: '',
      timestamp: new Date().toISOString(),
      type: 'user'
    };

    // Adaugă și un mesaj AI gol pentru streaming
    const aiMessage: ChatMessage = {
      message: '',
      response: '',
      timestamp: new Date().toISOString(),
      type: 'ai'
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);

    try {
      let streamingResponse = '';
      
      await aiService.sendMessage(messageToSend, true, (chunk: string) => {
        streamingResponse += chunk;
        
        // Actualizează mesajul AI în timp real
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              response: streamingResponse
            };
          }
          return newMessages;
        });
      });
    } catch (err: any) {
      setError(err.message || 'Eroare la trimiterea mesajului');
      // Elimină ultimele două mesaje dacă a avut eroare
      setMessages(prev => prev.slice(0, -2));
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestedQuestions = () => {
    const suggestions = [
      "Ce este Forex și cum funcționează?",
      "Explică-mi ce înseamnă leverage în trading",
      "Care sunt principalele perechi de valute?",
      "Cum să gestionez riscul în tranzacționare?",
      "Ce este un pip și cum se calculează?",
      "Care sunt diferențele între analiza tehnică și fundamentală?",
      "Cum să aleg un broker Forex de încredere?",
      "Ce strategii recomanzi pentru începători?"
    ];
    
    return suggestions.slice(0, 4);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return 'Începător';
      case 'intermediate': return 'Intermediar';
      case 'advanced': return 'Avansat';
      default: return 'Necunoscut';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                ← Înapoi
              </button>
              <h1 className="text-xl font-semibold">Asistent Forex AI</h1>
              {progress && (
                <span className={`ml-4 px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(progress.currentLevel)}`}>
                  Nivel: {getLevelText(progress.currentLevel)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/quiz')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Quiz Forex
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Progress Summary */}
        {progress && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Progresul tău</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{progress.totalQuizzes}</div>
                <div className="text-sm text-gray-500">Quiz-uri completate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{progress.averageScore}%</div>
                <div className="text-sm text-gray-500">Scor mediu</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{progress.bestScore}%</div>
                <div className="text-sm text-gray-500">Cel mai bun scor</div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow">
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <h3 className="text-lg font-medium mb-2">Bine ai venit la Asistentul Forex AI!</h3>
                <p className="mb-4">Sunt aici să te ajut să înveți tranzacționarea pe piețele valutare.</p>
                <p className="text-sm">Întreabă-mă orice despre Forex - concepte de bază, strategii, gestionarea riscului și multe altele!</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className="space-y-2">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg max-w-xs lg:max-w-md">
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
                
                {/* AI Response */}
                {msg.response && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg max-w-xs lg:max-w-md">
                      <div className="flex items-center mb-1">
                        <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center mr-2">
                          <span className="text-white text-xs font-bold">AI</span>
                        </div>
                        <span className="text-xs text-gray-500">Forex Expert</span>
                      </div>
                      <div className="text-sm prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.response}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                    <span className="text-sm">AI gândește...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 pb-2">
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            </div>
          )}

          {/* Suggested Questions */}
          {messages.length === 0 && (
            <div className="px-4 pb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Întrebări sugerate:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {getSuggestedQuestions().map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-left bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="border-t p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Întreabă despre Forex, strategii, concepte..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Trimite
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Presează Enter pentru a trimite mesajul
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForexAI;