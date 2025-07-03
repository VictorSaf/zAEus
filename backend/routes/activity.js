const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const { 
  getActivityLogs, 
  getActivityStats, 
  getActionTypes 
} = require('../controllers/activityController');

// Toate endpoint-urile sunt doar pentru admin
router.use(isAdmin);

// Obține activity log-urile
router.get('/logs', getActivityLogs);

// Obține statistici de activitate
router.get('/stats', getActivityStats);

// Obține tipurile de acțiuni disponibile
router.get('/action-types', getActionTypes);

module.exports = router;