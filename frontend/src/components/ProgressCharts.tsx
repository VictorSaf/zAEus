import React, { useRef, useEffect } from 'react';
import { Gauge, Column, Line } from '@antv/g2plot';
import { LearningProgress } from '../types/ai';

interface ProgressChartsProps {
  progress: LearningProgress;
}

const ProgressCharts: React.FC<ProgressChartsProps> = ({ progress }) => {
  const progressGaugeRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const performanceRef = useRef<HTMLDivElement>(null);

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return 'Începător';
      case 'intermediate': return 'Intermediar';
      case 'advanced': return 'Avansat';
      default: return level;
    }
  };

  useEffect(() => {
    if (!progress?.progressToNextLevel?.canAdvance) return;

    console.log('Rendering charts for progress:', progress);

    // Grafic progres către nivelul următor - Gauge
    if (progressGaugeRef.current) {
      progressGaugeRef.current.innerHTML = '';
      
      const progressPercentage = (progress.progressToNextLevel.perfectQuizzesCompleted / progress.progressToNextLevel.perfectQuizzesNeeded) * 100;
      
      try {
        const gauge = new Gauge(progressGaugeRef.current, {
          percent: progressPercentage / 100,
          range: {
            color: ['#F7D794', '#6C5CE7'],
          },
          indicator: {
            pointer: {
              style: {
                stroke: '#D0021B',
                lineWidth: 3,
              },
            },
            pin: {
              style: {
                stroke: '#D0021B',
                r: 6,
              },
            },
          },
          statistic: {
            content: {
              style: {
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#6C5CE7',
              },
              formatter: () => `${progress.progressToNextLevel?.perfectQuizzesCompleted || 0}/5`,
            },
            title: {
              formatter: () => 'Quiz-uri perfecte',
              style: {
                color: '#8E8E93',
                fontSize: '10px',
                marginTop: '8px',
              },
            },
          },
        });
        gauge.render();
        console.log('Gauge chart rendered successfully');
      } catch (error) {
        console.error('Error rendering gauge chart:', error);
      }
    }

    // Grafic timeline - activitate în timp
    if (timelineRef.current && progress.recentProgress.length > 0) {
      timelineRef.current.innerHTML = '';
      
      // Grupăm quiz-urile pe zile
      const dailyActivity: { [key: string]: { date: string; count: number; avgScore: number } } = {};
      
      progress.recentProgress.forEach(quiz => {
        const date = new Date(quiz.created_at).toLocaleDateString('ro-RO');
        if (!dailyActivity[date]) {
          dailyActivity[date] = { date, count: 0, avgScore: 0 };
        }
        dailyActivity[date].count++;
        const score = Math.round((quiz.quiz_score / quiz.total_questions) * 100);
        dailyActivity[date].avgScore = 
          (dailyActivity[date].avgScore * (dailyActivity[date].count - 1) + score) / dailyActivity[date].count;
      });

      const timelineData = Object.values(dailyActivity).map(day => ({
        date: day.date,
        value: day.count,
        type: 'Quiz-uri completate'
      }));

      // Adăugăm și scorul mediu pe zi
      const scoreData = Object.values(dailyActivity).map(day => ({
        date: day.date,
        value: Math.round(day.avgScore),
        type: 'Scor mediu'
      }));

      const allData = [...timelineData, ...scoreData];

      try {
        const line = new Line(timelineRef.current, {
          data: allData,
          xField: 'date',
          yField: 'value',
          seriesField: 'type',
          yAxis: {
            label: {
              formatter: (v) => {
                return allData.find(d => d.value === Number(v))?.type === 'Scor mediu' ? `${v}%` : v;
              }
            }
          },
          color: ['#1890FF', '#52C41A'],
          point: {
            size: 5,
            shape: 'circle',
          },
          tooltip: {
            formatter: (datum) => {
              return {
                name: datum.type,
                value: datum.type === 'Scor mediu' ? `${datum.value}%` : `${datum.value} quiz-uri`,
              };
            },
          },
          smooth: true,
        });
        line.render();
        console.log('Timeline chart rendered successfully');
      } catch (error) {
        console.error('Error rendering timeline chart:', error);
      }
    }

    // Grafic performanță quiz-uri recente
    if (performanceRef.current && progress.recentProgress.length > 0) {
      performanceRef.current.innerHTML = '';
      
      // Filtrează doar quiz-urile de la nivelul curent și le afișează în ordine cronologică
      const currentLevelQuizzes = progress.recentProgress
        .filter(quiz => quiz.level === progress.currentLevel)
        .reverse() // Cronologic de la cel mai vechi la cel mai nou
        .map((quiz, index) => ({
          quiz: `${new Date(quiz.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })} - ${Math.round((quiz.quiz_score / quiz.total_questions) * 100)}%`,
          percentage: Math.round((quiz.quiz_score / quiz.total_questions) * 100),
          level: getLevelText(quiz.level),
        }));
      
      const recentData = currentLevelQuizzes;

      try {
        const column = new Column(performanceRef.current, {
          data: recentData,
          xField: 'quiz',
          yField: 'percentage',
          label: {
            position: 'top',
            style: {
              fill: '#FFFFFF',
              opacity: 0.8,
            },
            formatter: (datum) => `${datum.percentage}%`,
          },
          meta: {
            percentage: {
              alias: 'Scor (%)',
              min: 0,
              max: 100,
            },
          },
          color: ({ percentage }) => {
            if (percentage === 100) return '#00D4AA';
            if (percentage >= 80) return '#52C41A';
            if (percentage >= 60) return '#FAAD14';
            return '#FF4D4F';
          },
          columnWidthRatio: 0.6,
          tooltip: {
            formatter: (datum) => {
              return {
                name: 'Performanță',
                value: `${datum.percentage}% (${datum.level})`,
              };
            },
          },
        });
        column.render();
        console.log('Column chart rendered successfully');
      } catch (error) {
        console.error('Error rendering column chart:', error);
      }
    }
  }, [progress]);

  if (!progress?.progressToNextLevel?.canAdvance) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Grafic progres către nivel următor */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Vizualizare progres
        </h3>
        <div ref={progressGaugeRef} style={{ height: '180px' }}></div>
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600 px-2 leading-relaxed break-words">
            {progress.progressToNextLevel.message}
          </p>
        </div>
      </div>

      {/* Grafic activitate temporală */}
      {progress.recentProgress && progress.recentProgress.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Activitate în timp
          </h3>
          <div ref={timelineRef} style={{ height: '200px' }}></div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Interacțiunea cu quiz-urile în ultimele zile
            </p>
          </div>
        </div>
      )}

      {/* Grafic performanță quiz-uri recente */}
      {progress.recentProgress && progress.recentProgress.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performanța la nivelul {getLevelText(progress.currentLevel)}
          </h3>
          <div ref={performanceRef} style={{ height: '200px' }}></div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Toate quiz-urile de la nivelul curent ({progress.recentProgress.filter(quiz => quiz.level === progress.currentLevel).length} total)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressCharts;