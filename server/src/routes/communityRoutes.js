const express = require('express');
const {
  createPost,
  getPosts,
  getPost,
  deletePost,
  addSupport,
  removeSupport,
  reportPost,
} = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');
const { moderateContent } = require('../middleware/moderationMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Post routes
router.post('/', moderateContent, createPost);
router.get('/', getPosts);
router.get('/:id', getPost);
router.delete('/:id', deletePost);

// Interaction routes
router.post('/:id/support', addSupport);
router.delete('/:id/support', removeSupport);
router.post('/:id/report', reportPost);

module.exports = router;