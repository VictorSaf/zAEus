import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';
import { Quiz as QuizType, QuizEvaluation, LearningProgress } from '../types/ai';

const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [evaluation, setEvaluation] = useState<QuizEvaluation | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [timeStarted, setTimeStarted] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const progressData = await aiService.getLearningProgress();
      setProgress(progressData);
      // Nivelul este determinat automat de progresul utilizatorului
      setSelectedLevel(progressData.currentLevel as any);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const startQuiz = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Quiz-ul se generează automat pentru nivelul curent al utilizatorului
      const quizData = await aiService.generateQuiz();
      setQuiz(quizData);
      setCurrentQuestion(0);
      setAnswers([]);
      setSelectedAnswer('');
      setEvaluation(null);
      setShowResults(false);
      setTimeStarted(Date.now());
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      setError(err.response?.data?.error || err.message || 'Eroare la generarea quiz-ului');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const nextQuestion = () => {
    if (!selectedAnswer) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);
    setSelectedAnswer('');

    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz completat, evaluează răspunsurile
      evaluateQuiz(newAnswers);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || '');
    }
  };

  const evaluateQuiz = async (finalAnswers: string[]) => {
    if (!quiz || !timeStarted) return;

    setIsLoading(true);
    try {
      const timeSpent = Math.round((Date.now() - timeStarted) / 1000);
      const result = await aiService.evaluateQuiz(
        quiz.questions, 
        finalAnswers, 
        quiz.level,
        timeSpent
      );
      setEvaluation(result);
      setShowResults(true);
      await loadProgress(); // Reîncarcă progresul actualizat
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare la evaluarea quiz-ului');
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuiz = () => {
    setQuiz(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedAnswer('');
    setEvaluation(null);
    setShowResults(false);
    setTimeStarted(null);
    setError('');
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return 'Începător';
      case 'intermediate': return 'Intermediar';
      case 'advanced': return 'Avansat';
      default: return level;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (showResults && evaluation) {
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
                  ← Înapoi la Dashboard
                </button>
                <h1 className="text-xl font-semibold">Rezultate Quiz Forex</h1>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto py-6 px-4">
          {/* Score Summary */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Completat!</h2>
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(evaluation.percentage)}`}>
                {evaluation.percentage}%
              </div>
              <p className="text-gray-600 mb-4">
                {evaluation.score} din {evaluation.totalQuestions} răspunsuri corecte
              </p>
              
              {evaluation.levelUpdated && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                  <p className="text-green-800 font-medium">
                    🎉 Felicitări! Ai avansat la nivelul {getLevelText(evaluation.recommendedLevel)}!
                  </p>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  onClick={resetQuiz}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Quiz Nou
                </button>
                <button
                  onClick={() => navigate('/forex-ai')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Chat cu AI
                </button>
              </div>
            </div>
          </div>

          {/* AI Feedback */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback Personal</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{evaluation.overallFeedback}</p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Răspunsuri Detaliate</h3>
            <div className="space-y-4">
              {evaluation.feedback.map((item, index) => (
                <div key={index} className={`border rounded-lg p-4 ${item.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      Întrebarea {index + 1}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${item.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.isCorrect ? 'Corect' : 'Greșit'}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{item.question}</p>
                  <div className="space-y-1 text-sm">
                    <p><strong>Răspunsul tău:</strong> {item.userAnswer}</p>
                    {!item.isCorrect && (
                      <p><strong>Răspunsul corect:</strong> {item.correctAnswer}</p>
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm text-gray-600">
                      <strong>Explicație:</strong> {item.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-semibold">Quiz Forex</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/forex-ai')}
                className="text-indigo-600 hover:text-indigo-900"
              >
                Chat AI
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-6 px-4">
        {!quiz ? (
          // Quiz Selection
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Testează-ți Cunoștințele de Forex
            </h2>

            {progress && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Progresul tău actual</h3>
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
                    <div className="text-2xl font-bold text-yellow-600">{getLevelText(progress.currentLevel)}</div>
                    <div className="text-sm text-gray-500">Nivelul curent</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-blue-900 mb-2">
                  Nivelul tău curent: {getLevelText(progress?.currentLevel || 'beginner')}
                </h4>
                <p className="text-blue-800 text-sm mb-3">
                  Quiz-urile se generează automat pentru nivelul tău actual. Pentru a avansa la nivelul următor, 
                  trebuie să obții scor de 100% la 5 quiz-uri consecutive.
                </p>
                
                {progress?.progressToNextLevel && progress.progressToNextLevel.canAdvance && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-blue-700 mb-1">
                      <span>Progres către {getLevelText(progress.progressToNextLevel.nextLevel || '')}</span>
                      <span>
                        {progress.progressToNextLevel.perfectQuizzesCompleted} / {progress.progressToNextLevel.perfectQuizzesNeeded}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ 
                          width: `${(progress.progressToNextLevel.perfectQuizzesCompleted / progress.progressToNextLevel.perfectQuizzesNeeded) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="text-center">
              <button
                onClick={startQuiz}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-md font-medium text-lg"
              >
                {isLoading ? 'Se generează quiz-ul...' : 'Începe Quiz-ul'}
              </button>
            </div>

            <div className="mt-6 text-sm text-gray-600 text-center">
              <p>• Quiz-ul conține 10 întrebări adaptate nivelului tău</p>
              <p>• Nu există limită de timp pentru răspuns</p>
              <p>• Vei primi feedback detaliat și XP pentru skill-uri</p>
              <p>• Obții 100%? Progresezi către nivelul următor!</p>
            </div>
          </div>
        ) : (
          // Quiz Questions
          <div className="bg-white rounded-lg shadow p-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Întrebarea {currentQuestion + 1} din {quiz.questions.length}</span>
                <span>Nivel: {getLevelText(quiz.level)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question */}
            <div className="mb-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">
                {quiz.questions[currentQuestion].question}
              </h3>

              <div className="space-y-3">
                {Object.entries(quiz.questions[currentQuestion].options).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleAnswerSelect(key)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      selectedAnswer === key
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{key}.</span> {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={previousQuestion}
                disabled={currentQuestion === 0}
                className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-medium"
              >
                Anterior
              </button>

              <button
                onClick={nextQuestion}
                disabled={!selectedAnswer || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
              >
                {isLoading ? 'Se evaluează...' : 
                 currentQuestion === quiz.questions.length - 1 ? 'Finalizează Quiz-ul' : 'Următoarea'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;