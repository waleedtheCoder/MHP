const express = require('express');
const {
  detectPatterns,
  getPatterns,
  getPattern,
  deletePattern,
  detectCycles,
  detectTriggers,
  detectThoughtPatterns,
  getCopingSuggestions,
} = require('../controllers/patternController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected (require authentication)
router.use(protect);

// Pattern detection routes
router.post('/detect', detectPatterns);
router.get('/cycles', detectCycles);
router.get('/triggers', detectTriggers);
router.get('/thought-patterns', detectThoughtPatterns);

// CRUD routes
router.get('/', getPatterns);
router.get('/:id', getPattern);
router.delete('/:id', deletePattern);

// Coping strategies
router.get('/coping/suggestions', getCopingSuggestions);

module.exports = router;