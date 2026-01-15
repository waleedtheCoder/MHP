const { Entry, Sentiment } = require('../models/Index');
const { Op } = require('sequelize');

/**
 * @desc    Create new journal entry
 * @route   POST /api/entries
 * @access  Private
 */
const createEntry = async (req, res) => {
  try {
    const { title, content, mood, tags } = req.body;

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and content',
      });
    }

    // Create entry
    const entry = await Entry.create({
      title,
      content,
      mood,
      tags: tags || [],
      userId: req.user.id, // From auth middleware
    });

    res.status(201).json({
      success: true,
      message: 'Entry created successfully',
      entry,
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating entry',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all entries for logged-in user
 * @route   GET /api/entries
 * @access  Private
 */
const getEntries = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC' } = req.query;

    const entries = await Entry.findAndCountAll({
      where: { userId: req.user.id },
      include: [{ model: Sentiment }],
      order: [[sortBy, order]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({
      success: true,
      count: entries.count,
      page: parseInt(page),
      pages: Math.ceil(entries.count / parseInt(limit)),
      entries: entries.rows,
    });
  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching entries',
    });
  }
};

/**
 * @desc    Get single entry by ID
 * @route   GET /api/entries/:id
 * @access  Private
 */
const getEntry = async (req, res) => {
  try {
    const entry = await Entry.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id, // Ensure user owns this entry
      },
      include: [{ model: Sentiment }],
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
    }

    res.json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error('Get entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching entry',
    });
  }
};

/**
 * @desc    Update entry
 * @route   PUT /api/entries/:id
 * @access  Private
 */
const updateEntry = async (req, res) => {
  try {
    const { title, content, mood, tags } = req.body;

    const entry = await Entry.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
    }

    // Update fields
    if (title) entry.title = title;
    if (content) entry.content = content;
    if (mood) entry.mood = mood;
    if (tags) entry.tags = tags;

    await entry.save();

    res.json({
      success: true,
      message: 'Entry updated successfully',
      entry,
    });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating entry',
    });
  }
};

/**
 * @desc    Delete entry
 * @route   DELETE /api/entries/:id
 * @access  Private
 */
const deleteEntry = async (req, res) => {
  try {
    const entry = await Entry.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
    }

    await entry.destroy();

    res.json({
      success: true,
      message: 'Entry deleted successfully',
    });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting entry',
    });
  }
};

/**
 * @desc    Search entries by keyword, tag, or date
 * @route   GET /api/entries/search
 * @access  Private
 */
const searchEntries = async (req, res) => {
  try {
    const { keyword, tag, startDate, endDate } = req.query;
    
    let whereClause = { userId: req.user.id };

    // Search by keyword in title or content
    if (keyword) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${keyword}%` } },
        { content: { [Op.iLike]: `%${keyword}%` } },
      ];
    }

    // Search by tag
    if (tag) {
      whereClause.tags = { [Op.contains]: [tag] };
    }

    // Search by date range
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const entries = await Entry.findAll({
      where: whereClause,
      include: [{ model: Sentiment }],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      count: entries.length,
      entries,
    });
  } catch (error) {
    console.error('Search entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching entries',
    });
  }
};

module.exports = {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  searchEntries,
};