const express = require('express');
const {
  enableTracking,
  disableTracking,
  getCycleData,
  logPeriodStart,
  logPeriodEnd,
  getCurrentPhase,
  getMoodCorrelations,
  updateCyclePreferences,
} = require('../controllers/menstrualCycleController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Tracking management
router.post('/enable', enableTracking);
router.post('/disable', disableTracking);

// Cycle data
router.get('/', getCycleData);
router.get('/phase', getCurrentPhase);
router.get('/mood-correlations', getMoodCorrelations);

// Period logging
router.post('/period/start', logPeriodStart);
router.post('/period/end', logPeriodEnd);

// Preferences
router.put('/preferences', updateCyclePreferences);

module.exports = router;