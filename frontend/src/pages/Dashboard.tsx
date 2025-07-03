import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../services/aiService';
import { LearningProgress } from '../types/ai';
import ProgressCharts from '../components/ProgressCharts';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<LearningProgress | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const progressData = await aiService.getLearningProgress();
      console.log('Progress data loaded:', progressData);
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
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

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Bun venit, <span className="font-bold">{user?.fullName || user?.username}</span>!</span>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/settings')}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Settings
                </button>
              )}
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Delogare
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Dashboard Statistics */}
          {progress && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Progresul tău în învățarea Forex</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Quizzes */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Quiz-uri completate</p>
                      <p className="text-3xl font-bold text-gray-900">{progress.totalQuizzes}</p>
                    </div>
                  </div>
                </div>

                {/* Average Score */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Scor mediu</p>
                      <p className={`text-3xl font-bold ${getScoreColor(progress.averageScore)}`}>
                        {progress.averageScore}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Best Score */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cel mai bun scor</p>
                      <p className={`text-3xl font-bold ${getScoreColor(progress.bestScore)}`}>
                        {progress.bestScore}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Level */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Nivelul curent</p>
                      <p className="text-2xl font-bold text-gray-900">{getLevelText(progress.currentLevel)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Progress */}
              {progress.recentProgress && progress.recentProgress.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Progres recent</h3>
                  <div className="space-y-3">
                    {progress.recentProgress.slice(0, 5).map((quiz, index) => {
                      const percentage = Math.round((quiz.quiz_score / quiz.total_questions) * 100);
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                            percentage === 100 
                              ? 'bg-green-50 border-2 border-green-200 animate-pulse shadow-lg' 
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${getScoreColor(percentage).replace('text-', 'bg-')}`}></div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Quiz {getLevelText(quiz.level)}
                                {percentage === 100 && (
                                  <span className="ml-2 text-green-600 font-bold">✓ Perfect!</span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(quiz.created_at).toLocaleDateString('ro-RO', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })} - {new Date(quiz.created_at).toLocaleTimeString('ro-RO', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${getScoreColor(percentage)}`}>{percentage}%</p>
                            <p className="text-sm text-gray-500">{quiz.quiz_score}/{quiz.total_questions}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Progress to Next Level */}
              {progress?.progressToNextLevel && progress.progressToNextLevel.canAdvance && (
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Progres către nivelul {getLevelText(progress.progressToNextLevel.nextLevel || '')}
                  </h3>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Quiz-uri perfecte consecutive</span>
                      <span>
                        {progress.progressToNextLevel.perfectQuizzesCompleted} / {progress.progressToNextLevel.perfectQuizzesNeeded}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          progress.progressToNextLevel.perfectQuizzesCompleted >= progress.progressToNextLevel.perfectQuizzesNeeded
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ 
                          width: `${(progress.progressToNextLevel.perfectQuizzesCompleted / progress.progressToNextLevel.perfectQuizzesNeeded) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${
                    progress.progressToNextLevel.perfectQuizzesCompleted >= progress.progressToNextLevel.perfectQuizzesNeeded
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <p className={`text-sm ${
                      progress.progressToNextLevel.perfectQuizzesCompleted >= progress.progressToNextLevel.perfectQuizzesNeeded
                        ? 'text-green-800'
                        : 'text-blue-800'
                    }`}>
                      {progress.progressToNextLevel.message}
                    </p>
                  </div>
                  
                  {progress.progressToNextLevel.perfectQuizzesCompleted < progress.progressToNextLevel.perfectQuizzesNeeded && (
                    <div className="mt-4 text-xs text-gray-500 break-words">
                      💡 Ai nevoie de {progress.progressToNextLevel.perfectQuizzesNeeded} quiz-uri consecutive cu scor 100% pentru avansare.
                    </div>
                  )}
                </div>
              )}

              {!progress?.progressToNextLevel?.canAdvance && progress?.currentLevel === 'advanced' && (
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Nivel maxim atins</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      🏆 Felicitări! Ai atins nivelul maxim de expertiza Forex. Continuă să exersezi pentru a-ți menține cunoștințele!
                    </p>
                  </div>
                </div>
              )}

              {/* Separator vizual */}
              <div className="mt-8 mb-8 border-t-2 border-gray-200"></div>

              {/* Grafice statistici AntV */}
              <div className="">
                {progress && (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Statistici Detaliate și Progres</h2>
                    <ProgressCharts progress={progress} />
                  </>
                )}
              </div>

              {/* Indicator pentru utilizatori avansați */}
              {progress?.currentLevel === 'advanced' && (
                <div className="mt-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow p-6 text-white">
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-2">🏆 Expert Forex</h3>
                      <p className="text-purple-100">
                        Felicitări! Ai atins nivelul maxim de expertiza. Continuă să exersezi pentru a-ți menține cunoștințele!
                      </p>
                      <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold">{progress.totalQuizzes}</div>
                            <div className="text-sm text-purple-200">Quiz-uri</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{progress.averageScore}%</div>
                            <div className="text-sm text-purple-200">Scor mediu</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{progress.bestScore}%</div>
                            <div className="text-sm text-purple-200">Cel mai bun</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Separator pentru secțiunea de acțiuni */}
          <div className="mt-8 mb-8 border-t-2 border-gray-200"></div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">Acțiuni Disponibile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Asistent Forex AI */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Asistent Forex AI</h3>
                  <p className="text-gray-600">Învață concepte Forex cu ajutorul AI-ului</p>
                </div>
              </div>
              <p className="text-gray-500 mb-4">
                Întreabă orice despre tranzacționare, strategii, gestionarea riscului și mai multe.
              </p>
              <button
                onClick={() => navigate('/forex-ai')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Începe conversația
              </button>
            </div>

            {/* Quiz Forex */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Quiz Forex</h3>
                  <p className="text-gray-600">Testează-ți cunoștințele de trading</p>
                </div>
              </div>
              <p className="text-gray-500 mb-4">
                Quiz-uri personalizate pe nivele cu feedback detaliat și recomandări AI.
              </p>
              <button
                onClick={() => navigate('/quiz')}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Începe un quiz
              </button>
            </div>

            {/* Settings - doar pentru admin */}
            {user?.role === 'admin' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Administrare</h3>
                    <p className="text-gray-600">Gestionează utilizatorii aplicației</p>
                  </div>
                </div>
                <p className="text-gray-500 mb-4">
                  Adaugă, editează și gestionează utilizatorii cu roluri diferite.
                </p>
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Accesează Settings
                </button>
              </div>
            )}

            {/* Informații generale */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Despre Platforma Forex</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></span>
                  <span>Învață concepte fundamentale de trading</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                  <span>Testează cunoștințele cu quiz-uri adaptive</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-600 rounded-full mr-3"></span>
                  <span>Primește feedback personalizat de la AI</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                  <span>Înaintează pe nivele de dificultate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;