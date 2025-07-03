const express = require('express');
const router = express.Router();
const { 
  chatWithAI, 
  generateForexQuiz, 
  evaluateQuiz, 
  getChatHistory, 
  getLearningProgress,
  updateUserLevel,
  getUserDetailedStats 
} = require('../controllers/aiController');

// Chat cu AI-ul educațional
router.post('/chat', chatWithAI);

// Generare quiz Forex
router.get('/quiz', generateForexQuiz);

// Evaluare quiz
router.post('/quiz/evaluate', evaluateQuiz);

// Istoric conversații
router.get('/chat/history', getChatHistory);

// Progres învățare
router.get('/progress', getLearningProgress);

// Actualizare nivel utilizator
router.put('/level', updateUserLevel);

// Statistici detaliate utilizator (doar pentru admin)
router.get('/user-stats/:userId', getUserDetailedStats);

module.exports = router;