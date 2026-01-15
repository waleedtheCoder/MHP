const express = require('express');
const {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  searchEntries,
} = require('../controllers/entryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected (require authentication)
router.use(protect);

// Search route must come before /:id to avoid conflict
router.get('/search', searchEntries);

// CRUD routes
router.route('/').get(getEntries).post(createEntry);
router.route('/:id').get(getEntry).put(updateEntry).delete(deleteEntry);

module.exports = router;