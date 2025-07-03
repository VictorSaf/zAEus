const db = require('../config/database-sqlite');
const { getChatResponse, generateQuiz, evaluateQuizAnswers } = require('../services/openaiService');
const { processQuizAnswer, tagQuestionWithSkills } = require('../services/skillsService');
const { processMissionEvent } = require('../services/missionsService');

async function chatWithAI(req, res) {
  try {
    console.log('chatWithAI called with user:', req.user);
    const { message, includeHistory = false } = req.body;
    const userId = req.user.id;
    console.log('Message received:', message);

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Mesajul este obligatoriu' });
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Obține nivelul utilizatorului
    const userResult = await db.query('SELECT level FROM users WHERE id = ?', [userId]);
    const userLevel = userResult.rows[0]?.level || 'beginner';

    // Obține istoricul recent dacă este solicitat (ultimele 5 mesaje)
    let chatHistory = [];
    if (includeHistory) {
      const historyResult = await db.query(
        'SELECT message, response FROM ai_chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
        [userId]
      );
      
      // Inversează ordinea pentru a avea cronologia corectă
      chatHistory = historyResult.rows.reverse().flatMap(row => [
        { role: 'user', content: row.message },
        { role: 'assistant', content: row.response }
      ]);
    }

    // Obține stream-ul de la AI
    const stream = await getChatResponse(message, userLevel, chatHistory);
    
    let fullResponse = '';

    // Process the stream
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        // Send chunk to client
        res.write(content);
      }
    }

    // End the response
    res.end();

    // Salvează conversația în baza de date
    await db.query(
      'INSERT INTO ai_chat_history (user_id, message, response, message_type) VALUES (?, ?, ?, ?)',
      [userId, message.trim(), fullResponse, 'forex_education']
    );

    // Procesează eveniment pentru misiuni
    await processMissionEvent(userId, 'chat_message_sent', {
      messageLength: message.trim().length,
      responseLength: fullResponse.length
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Nu pot genera răspuns în acest moment. Te rog încearcă din nou.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

async function generateForexQuiz(req, res) {
  try {
    const userId = req.user.id;

    // Obține nivelul actual al utilizatorului din baza de date
    const userResult = await db.query('SELECT level FROM users WHERE id = ?', [userId]);
    const userLevel = userResult.rows[0]?.level || 'beginner';
    
    // Utilizatorul poate face quiz doar la nivelul său actual
    const level = userLevel;

    // Generează quiz-ul
    const quiz = await generateQuiz(level);

    // Tag-ează întrebările cu skill-urile corespunzătoare
    for (const question of quiz.questions) {
      if (question.skills && question.skills.length > 0) {
        const skillTags = question.skills.map(skillName => ({
          skillName: skillName,
          xpValue: 15 // XP per skill per întrebare corectă
        }));
        
        await tagQuestionWithSkills(question.question, skillTags);
      }
    }

    // Adaugă metadate
    quiz.userId = userId;
    quiz.generatedAt = new Date().toISOString();
    quiz.timeLimit = 600; // 10 minute

    res.json(quiz);
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ 
      error: 'Nu pot genera quiz-ul în acest moment. Te rog încearcă din nou.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function evaluateQuiz(req, res) {
  try {
    const { questions, answers, level = 'beginner', timeSpent } = req.body;
    const userId = req.user.id;

    if (!questions || !answers || !Array.isArray(questions) || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Date de quiz invalide' });
    }

    if (questions.length !== answers.length) {
      return res.status(400).json({ error: 'Numărul de întrebări nu corespunde cu numărul de răspunsuri' });
    }

    // Obține nivelul actual al utilizatorului
    const userResult = await db.query('SELECT level FROM users WHERE id = ?', [userId]);
    const currentUserLevel = userResult.rows[0]?.level || 'beginner';

    // Evaluează răspunsurile
    const evaluation = await evaluateQuizAnswers(questions, answers, level);

    // Salvează rezultatul în baza de date
    await db.query(
      `INSERT INTO learning_progress 
       (user_id, quiz_type, quiz_score, total_questions, level, ai_feedback) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, 'forex_quiz', evaluation.score, evaluation.totalQuestions, level, evaluation.overallFeedback]
    );

    // Verifică criteriile de avansare: 5 quizuri consecutive cu scor 100%
    let shouldLevelUp = false;
    let newLevel = currentUserLevel;
    
    if (evaluation.percentage === 100) {
      // Obține ultimele 5 quiz-uri pentru același nivel
      const recentQuizzesResult = await db.query(
        `SELECT quiz_score, total_questions 
         FROM learning_progress 
         WHERE user_id = ? AND level = ? 
         ORDER BY created_at DESC 
         LIMIT 4`,
        [userId, currentUserLevel]
      );
      
      // Verifică dacă ultimele 4 quiz-uri + cel curent au toate scor 100%
      const allPerfectScores = recentQuizzesResult.rows.every(quiz => 
        Math.round((quiz.quiz_score / quiz.total_questions) * 100) === 100
      );
      
      if (recentQuizzesResult.rows.length === 4 && allPerfectScores) {
        // Utilizatorul a completat 5 quiz-uri consecutive cu scor 100%
        if (currentUserLevel === 'beginner') {
          newLevel = 'intermediate';
          shouldLevelUp = true;
        } else if (currentUserLevel === 'intermediate') {
          newLevel = 'advanced';
          shouldLevelUp = true;
        }
      }
    }
    
    if (shouldLevelUp) {
      await db.query('UPDATE users SET level = ? WHERE id = ?', [newLevel, userId]);
      evaluation.recommendedLevel = newLevel;
    }

    // Procesează skill-urile și acordă XP
    const skillUpdates = [];
    let correctStreak = 0;
    let maxStreak = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userAnswer = answers[i];
      const isCorrect = userAnswer === question.correct;
      
      if (isCorrect) {
        correctStreak++;
        maxStreak = Math.max(maxStreak, correctStreak);
        
        // Procesează XP pentru skill-uri
        const updates = await processQuizAnswer(userId, question.question, true);
        skillUpdates.push(...updates);
      } else {
        correctStreak = 0;
      }
    }

    // Procesează evenimente pentru misiuni
    const missionUpdates = [];
    
    // Eveniment: quiz completat
    const quizEvent = await processMissionEvent(userId, 'quiz_completed', {
      score: evaluation.score,
      totalQuestions: evaluation.totalQuestions,
      level: level
    });
    missionUpdates.push(...quizEvent);
    
    // Eveniment: streak de răspunsuri corecte
    if (maxStreak >= 5) {
      const streakEvent = await processMissionEvent(userId, 'correct_answer', {
        streak: maxStreak
      });
      missionUpdates.push(...streakEvent);
    }
    
    // Eveniment: XP câștigat pentru skill-uri
    const totalXpGained = skillUpdates.reduce((sum, update) => sum + update.xp_gained, 0);
    if (totalXpGained > 0) {
      const skillEvent = await processMissionEvent(userId, 'skill_xp_gained', {
        xpGained: totalXpGained,
        skillUpdates: skillUpdates
      });
      missionUpdates.push(...skillEvent);
    }

    // Adaugă informații suplimentare la evaluare
    evaluation.timeSpent = timeSpent;
    evaluation.currentLevel = currentUserLevel;
    evaluation.levelUpdated = shouldLevelUp;
    evaluation.skillUpdates = skillUpdates;
    evaluation.missionUpdates = missionUpdates.filter(update => update !== null);

    res.json(evaluation);
  } catch (error) {
    console.error('Quiz evaluation error:', error);
    res.status(500).json({ 
      error: 'Nu pot evalua quiz-ul în acest moment. Te rog încearcă din nou.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function getChatHistory(req, res) {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT message, response, message_type, created_at 
       FROM ai_chat_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    const history = result.rows.map(row => ({
      message: row.message,
      response: row.response,
      type: row.message_type,
      timestamp: row.created_at
    }));

    res.json({
      history,
      hasMore: result.rows.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Nu pot încărca istoricul conversației' });
  }
}

async function getLearningProgress(req, res) {
  try {
    const userId = req.user.id;

    // Obține progresul general
    const progressResult = await db.query(
      `SELECT quiz_type, quiz_score, total_questions, level, created_at
       FROM learning_progress 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    // Obține nivelul actual
    const userResult = await db.query('SELECT level FROM users WHERE id = ?', [userId]);
    const currentLevel = userResult.rows[0]?.level || 'beginner';

    // Calculează progresul către nivelul următor
    const progressToNextLevel = await calculateProgressToNextLevel(userId, currentLevel);
    
    // Calculează statistici
    const stats = {
      totalQuizzes: progressResult.rows.length,
      averageScore: 0,
      bestScore: 0,
      currentLevel: currentLevel,
      recentProgress: progressResult.rows.slice(0, 5),
      progressToNextLevel: progressToNextLevel
    };

    if (progressResult.rows.length > 0) {
      const scores = progressResult.rows.map(row => 
        Math.round((row.quiz_score / row.total_questions) * 100)
      );
      stats.averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      stats.bestScore = Math.max(...scores);
    }

    res.json(stats);
  } catch (error) {
    console.error('Learning progress error:', error);
    res.status(500).json({ error: 'Nu pot încărca progresul de învățare' });
  }
}

async function updateUserLevel(req, res) {
  try {
    const { level } = req.body;
    const userId = req.user.id;

    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ error: 'Nivel invalid' });
    }

    await db.query('UPDATE users SET level = ? WHERE id = ?', [level, userId]);

    res.json({ message: 'Nivelul a fost actualizat cu succes', newLevel: level });
  } catch (error) {
    console.error('Update level error:', error);
    res.status(500).json({ error: 'Nu pot actualiza nivelul' });
  }
}

async function calculateProgressToNextLevel(userId, currentLevel) {
  try {
    // Nu mai avansează de la advanced
    if (currentLevel === 'advanced') {
      return {
        canAdvance: false,
        nextLevel: null,
        perfectQuizzesNeeded: 0,
        perfectQuizzesCompleted: 0,
        message: 'Ai atins nivelul maxim!'
      };
    }

    const nextLevel = currentLevel === 'beginner' ? 'intermediate' : 'advanced';
    
    // Obține ultimele quiz-uri pentru nivelul curent cu scor 100%
    const perfectQuizzesResult = await db.query(
      `SELECT quiz_score, total_questions, created_at
       FROM learning_progress 
       WHERE user_id = ? AND level = ? 
       ORDER BY created_at DESC`,
      [userId, currentLevel]
    );
    
    // Numără quiz-urile consecutive cu scor 100% de la sfârșit
    let consecutivePerfectQuizzes = 0;
    for (const quiz of perfectQuizzesResult.rows) {
      const percentage = Math.round((quiz.quiz_score / quiz.total_questions) * 100);
      if (percentage === 100) {
        consecutivePerfectQuizzes++;
      } else {
        break; // Oprește dacă găsește un quiz care nu e perfect
      }
    }
    
    return {
      canAdvance: true,
      nextLevel: nextLevel,
      perfectQuizzesNeeded: 5,
      perfectQuizzesCompleted: consecutivePerfectQuizzes,
      message: consecutivePerfectQuizzes >= 5 
        ? `Felicitări! Poți avansa la nivelul ${nextLevel}!`
        : `Ai nevoie de ${5 - consecutivePerfectQuizzes} quiz-uri consecutive cu scor 100% pentru a avansa la nivelul ${nextLevel}.`
    };
  } catch (error) {
    console.error('Error calculating progress to next level:', error);
    return {
      canAdvance: false,
      nextLevel: null,
      perfectQuizzesNeeded: 5,
      perfectQuizzesCompleted: 0,
      message: 'Eroare la calcularea progresului'
    };
  }
}

async function getUserDetailedStats(req, res) {
  try {
    const { userId } = req.params;
    console.log('getUserDetailedStats called for userId:', userId);
    
    if (!userId) {
      console.log('Error: No userId provided');
      return res.status(400).json({ error: 'ID utilizator este obligatoriu' });
    }

    // Obține informații de bază despre utilizator
    console.log('Fetching user info for userId:', userId);
    const userResult = await db.query('SELECT username, email, level, created_at FROM users WHERE id = ?', [userId]);
    console.log('User query result:', userResult);
    
    if (userResult.rows.length === 0) {
      console.log('User not found for userId:', userId);
      return res.status(404).json({ error: 'Utilizatorul nu a fost găsit' });
    }
    
    const userInfo = userResult.rows[0];
    console.log('User info found:', userInfo);

    // Obține toate quiz-urile utilizatorului
    const quizzesResult = await db.query(
      `SELECT quiz_type, quiz_score, total_questions, level, ai_feedback, created_at
       FROM learning_progress 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    // Calculează statistici generale
    const quizzes = quizzesResult.rows;
    const totalQuizzes = quizzes.length;
    let totalScore = 0;
    let perfectQuizzes = 0;
    const quizzesByLevel = { beginner: 0, intermediate: 0, advanced: 0 };
    const scoresByLevel = { beginner: [], intermediate: [], advanced: [] };

    quizzes.forEach(quiz => {
      const percentage = Math.round((quiz.quiz_score / quiz.total_questions) * 100);
      totalScore += percentage;
      
      if (percentage === 100) {
        perfectQuizzes++;
      }
      
      if (quizzesByLevel.hasOwnProperty(quiz.level)) {
        quizzesByLevel[quiz.level]++;
        scoresByLevel[quiz.level].push(percentage);
      }
    });

    const averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;
    const bestScore = totalQuizzes > 0 ? Math.max(...quizzes.map(q => Math.round((q.quiz_score / q.total_questions) * 100))) : 0;

    // Calculează progresul către nivelul următor
    const progressToNextLevel = await calculateProgressToNextLevel(userId, userInfo.level);

    // Calculează average score per nivel
    const averageScoreByLevel = {};
    Object.keys(scoresByLevel).forEach(level => {
      if (scoresByLevel[level].length > 0) {
        averageScoreByLevel[level] = Math.round(
          scoresByLevel[level].reduce((a, b) => a + b, 0) / scoresByLevel[level].length
        );
      } else {
        averageScoreByLevel[level] = 0;
      }
    });

    // Ultimele 10 quiz-uri pentru grafic
    const recentQuizzes = quizzes.slice(0, 10).reverse();

    const detailedStats = {
      userInfo: {
        username: userInfo.username,
        email: userInfo.email,
        level: userInfo.level,
        memberSince: userInfo.created_at
      },
      overall: {
        totalQuizzes,
        averageScore,
        bestScore,
        perfectQuizzes,
        perfectQuizzesPercentage: Math.round((progressToNextLevel.perfectQuizzesCompleted / progressToNextLevel.perfectQuizzesNeeded) * 100)
      },
      byLevel: {
        distribution: quizzesByLevel,
        averageScores: averageScoreByLevel
      },
      progressToNextLevel,
      recentQuizzes: recentQuizzes.map(quiz => ({
        date: quiz.created_at,
        level: quiz.level,
        score: quiz.quiz_score,
        totalQuestions: quiz.total_questions,
        percentage: Math.round((quiz.quiz_score / quiz.total_questions) * 100),
        feedback: quiz.ai_feedback
      })),
      allQuizzes: quizzes.map(quiz => ({
        date: quiz.created_at,
        level: quiz.level,
        score: quiz.quiz_score,
        totalQuestions: quiz.total_questions,
        percentage: Math.round((quiz.quiz_score / quiz.total_questions) * 100),
        feedback: quiz.ai_feedback
      }))
    };

    res.json(detailedStats);
  } catch (error) {
    console.error('Error getting user detailed stats:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Nu pot încărca statisticile utilizatorului', details: error.message });
  }
}

module.exports = {
  chatWithAI,
  generateForexQuiz,
  evaluateQuiz,
  getChatHistory,
  getLearningProgress,
  updateUserLevel,
  getUserDetailedStats
};