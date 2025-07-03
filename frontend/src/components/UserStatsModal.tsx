import React, { useState, useEffect, useRef } from 'react';
import { Column, Pie, Line } from '@antv/g2plot';
import api from '../services/api';

interface UserStats {
  userInfo: {
    username: string;
    email: string;
    level: string;
    memberSince: string;
  };
  overall: {
    totalQuizzes: number;
    averageScore: number;
    bestScore: number;
    perfectQuizzes: number;
    perfectQuizzesPercentage: number;
  };
  byLevel: {
    distribution: { [key: string]: number };
    averageScores: { [key: string]: number };
  };
  progressToNextLevel: {
    canAdvance: boolean;
    nextLevel: string | null;
    perfectQuizzesNeeded: number;
    perfectQuizzesCompleted: number;
    message: string;
  };
  recentQuizzes: Array<{
    date: string;
    level: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    feedback: string;
  }>;
}

interface UserStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

const UserStatsModal: React.FC<UserStatsModalProps> = ({ isOpen, onClose, userId, username }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const levelDistributionRef = useRef<HTMLDivElement>(null);
  const performanceRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

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

  const fetchUserStats = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching user stats for userId:', userId);
      const response = await api.get(`/ai/user-stats/${userId}`);
      console.log('User stats response:', response.data);
      setStats(response.data);
    } catch (err: any) {
      console.error('Error fetching user stats:', err);
      setError(err.response?.data?.error || err.message || 'Eroare necunoscută');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserStats();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    if (!stats || !isOpen) return;

    // Grafic distribuție quiz-uri pe nivele
    if (levelDistributionRef.current && stats.byLevel.distribution) {
      levelDistributionRef.current.innerHTML = '';
      
      const distributionData = Object.entries(stats.byLevel.distribution)
        .filter(([_, count]) => count > 0)
        .map(([level, count]) => ({
          level: getLevelText(level),
          count
        }));

      if (distributionData.length > 0) {
        const pie = new Pie(levelDistributionRef.current, {
          data: distributionData,
          angleField: 'count',
          colorField: 'level',
          radius: 0.8,
          label: {
            type: 'outer',
            content: '{name}: {value}',
          },
          legend: {
            position: 'bottom',
          },
          color: ['#1890FF', '#52C41A', '#FAAD14'],
        });
        pie.render();
      }
    }

    // Grafic performanță pe nivele
    if (performanceRef.current && stats.byLevel.averageScores) {
      performanceRef.current.innerHTML = '';
      
      const performanceData = Object.entries(stats.byLevel.averageScores)
        .filter(([level, _]) => stats.byLevel.distribution[level] > 0)
        .map(([level, score]) => ({
          level: getLevelText(level),
          score
        }));

      if (performanceData.length > 0) {
        const column = new Column(performanceRef.current, {
          data: performanceData,
          xField: 'level',
          yField: 'score',
          label: {
            position: 'top',
            style: {
              fill: '#FFFFFF',
              opacity: 0.8,
            },
            formatter: (datum) => `${datum.score}%`,
          },
          meta: {
            score: {
              alias: 'Scor mediu (%)',
              min: 0,
              max: 100,
            },
          },
          color: ({ score }) => {
            if (score >= 80) return '#52C41A';
            if (score >= 60) return '#FAAD14';
            return '#FF4D4F';
          },
        });
        column.render();
      }
    }

    // Grafic progres în timp
    if (timelineRef.current && stats.recentQuizzes.length > 0) {
      timelineRef.current.innerHTML = '';
      
      const timelineData = stats.recentQuizzes.map((quiz, index) => ({
        quiz: `Quiz ${index + 1}`,
        percentage: quiz.percentage,
        level: getLevelText(quiz.level),
        date: new Date(quiz.date).toLocaleDateString('ro-RO')
      }));

      const line = new Line(timelineRef.current, {
        data: timelineData,
        xField: 'quiz',
        yField: 'percentage',
        seriesField: 'level',
        color: ['#1890FF', '#52C41A', '#FAAD14'],
        point: {
          size: 5,
          shape: 'diamond',
        },
        meta: {
          percentage: {
            alias: 'Scor (%)',
            min: 0,
            max: 100,
          },
        },
        tooltip: {
          formatter: (datum) => {
            return {
              name: `${datum.level} (${datum.date})`,
              value: `${datum.percentage}%`,
            };
          },
        },
      });
      line.render();
    }
  }, [stats, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Statistici detaliate - {username}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2">Se încarcă statisticile...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {stats && (
            <div className="space-y-6">
              {/* Info generale */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900">Total Quiz-uri</h3>
                  <p className="text-2xl font-bold text-blue-600">{stats.overall.totalQuizzes}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900">Scor Mediu</h3>
                  <p className="text-2xl font-bold text-green-600">{stats.overall.averageScore}%</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900">Cel Mai Bun Scor</h3>
                  <p className="text-2xl font-bold text-yellow-600">{stats.overall.bestScore}%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900">Quiz-uri Perfecte</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.overall.perfectQuizzes} ({stats.overall.perfectQuizzesPercentage}%)
                  </p>
                </div>
              </div>

              {/* Info utilizator */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Informații utilizator</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Email:</span> {stats.userInfo.email}
                  </div>
                  <div>
                    <span className="font-medium">Nivel curent:</span> {getLevelText(stats.userInfo.level)}
                  </div>
                  <div>
                    <span className="font-medium">Membru din:</span> {new Date(stats.userInfo.memberSince).toLocaleDateString('ro-RO')}
                  </div>
                </div>
              </div>

              {/* Progres către nivelul următor */}
              {stats.progressToNextLevel.canAdvance && (
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Progres către nivelul {getLevelText(stats.progressToNextLevel.nextLevel || '')}
                  </h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Quiz-uri perfecte consecutive</span>
                    <span className="text-sm font-medium">
                      {stats.progressToNextLevel.perfectQuizzesCompleted} / {stats.progressToNextLevel.perfectQuizzesNeeded}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        stats.progressToNextLevel.perfectQuizzesCompleted >= stats.progressToNextLevel.perfectQuizzesNeeded
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ 
                        width: `${(stats.progressToNextLevel.perfectQuizzesCompleted / stats.progressToNextLevel.perfectQuizzesNeeded) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{stats.progressToNextLevel.message}</p>
                </div>
              )}

              {/* Grafice */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Distribuție quiz-uri pe nivele */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Distribuție pe nivele</h3>
                  <div ref={levelDistributionRef} style={{ height: '200px' }}></div>
                </div>

                {/* Performanță pe nivele */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Scor mediu pe nivele</h3>
                  <div ref={performanceRef} style={{ height: '200px' }}></div>
                </div>

                {/* Progres în timp */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Progres recent</h3>
                  <div ref={timelineRef} style={{ height: '200px' }}></div>
                </div>
              </div>

              {/* Lista detaliată quiz-uri recente */}
              {stats.recentQuizzes.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Ultimele quiz-uri</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {stats.recentQuizzes.map((quiz, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{getLevelText(quiz.level)}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(quiz.date).toLocaleDateString('ro-RO')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getScoreColor(quiz.percentage)}`}>
                            {quiz.percentage}%
                          </p>
                          <p className="text-sm text-gray-500">
                            {quiz.score}/{quiz.totalQuestions}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStatsModal;