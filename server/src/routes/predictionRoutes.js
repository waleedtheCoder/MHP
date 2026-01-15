const express = require('express');
const {
  generatePredictions,
  getPredictions,
  getUpcomingPredictions,
  verifyPrediction,
  getInterventions,
  dismissIntervention,
  provideFeedback,
} = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Prediction routes
router.post('/generate', generatePredictions);
router.get('/', getPredictions);
router.get('/upcoming', getUpcomingPredictions);
router.post('/:id/verify', verifyPrediction);

// Intervention routes
router.get('/interventions', getInterventions);
router.post('/interventions/:id/dismiss', dismissIntervention);
router.post('/interventions/:id/feedback', provideFeedback);

module.exports = router;