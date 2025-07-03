const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  getSkills, 
  getDailyMissions, 
  claimReward, 
  getSkillsOverview 
} = require('../controllers/skillsController');

// Middleware de autentificare pentru toate rutele
router.use(authenticateToken);

// Rute pentru skill-uri
router.get('/', getSkills);
router.get('/overview', getSkillsOverview);

// Rute pentru misiuni zilnice
router.get('/missions', getDailyMissions);
router.post('/missions/:missionId/claim', claimReward);

module.exports = router;