const express = require('express');
const {
  getOverview,
  getMoodTrends,
  getWeeklyReport,
  getMonthlyReport,
  getSimilarEntries,
  getKeywordCloud,
  getEmotionalJourney,
} = require('../controllers/insightController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Insight routes
router.get('/overview', getOverview);
router.get('/mood-trends', getMoodTrends);
router.get('/weekly-report', getWeeklyReport);
router.get('/monthly-report', getMonthlyReport);
router.get('/similar-entries/:entryId', getSimilarEntries);
router.get('/keyword-cloud', getKeywordCloud);
router.get('/emotional-journey', getEmotionalJourney);

module.exports = router;