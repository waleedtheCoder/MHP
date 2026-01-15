const { Pattern, CopingStrategy } = require('../models/Index');
const patternDetectionService = require('../services/patternDetectionService');

/**
 * @desc    Detect all patterns for user
 * @route   POST /api/patterns/detect
 * @access  Private
 */
const detectPatterns = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lookbackDays = 90 } = req.body;

    // Detect all pattern types
    const [cycles, triggers, thoughtPatterns] = await Promise.all([
      patternDetectionService.detectEmotionalCycles(userId, lookbackDays),
      patternDetectionService.detectTriggerPatterns(userId),
      patternDetectionService.detectThoughtPatterns(userId),
    ]);

    // Save detected patterns to database
    const allPatterns = [
      ...triggers,
      ...thoughtPatterns,
    ];

    if (allPatterns.length > 0) {
      await Pattern.bulkCreate(allPatterns, {
        updateOnDuplicate: ['frequency', 'strength', 'updatedAt'],
      });
    }

    res.json({
      success: true,
      message: 'Pattern detection complete',
      results: {
        cycles: cycles.cycles.length,
        triggers: triggers.length,
        thoughtPatterns: thoughtPatterns.length,
        total: cycles.cycles.length + allPatterns.length,
      },
    });
  } catch (error) {
    console.error('Pattern detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error detecting patterns',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all patterns for user
 * @route   GET /api/patterns
 * @access  Private
 */
const getPatterns = async (req, res) => {
  try {
    const { type, minStrength = 0.3 } = req.query;

    const where = {
      userId: req.user.id,
      strength: { [require('sequelize').Op.gte]: parseFloat(minStrength) },
    };

    if (type) {
      where.patternType = type;
    }

    const patterns = await Pattern.findAll({
      where,
      order: [['strength', 'DESC']],
    });

    res.json({
      success: true,
      count: patterns.length,
      patterns,
    });
  } catch (error) {
    console.error('Get patterns error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patterns',
    });
  }
};

/**
 * @desc    Get single pattern
 * @route   GET /api/patterns/:id
 * @access  Private
 */
const getPattern = async (req, res) => {
  try {
    const pattern = await Pattern.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!pattern) {
      return res.status(404).json({
        success: false,
        message: 'Pattern not found',
      });
    }

    res.json({
      success: true,
      pattern,
    });
  } catch (error) {
    console.error('Get pattern error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pattern',
    });
  }
};

/**
 * @desc    Delete pattern
 * @route   DELETE /api/patterns/:id
 * @access  Private
 */
const deletePattern = async (req, res) => {
  try {
    const pattern = await Pattern.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!pattern) {
      return res.status(404).json({
        success: false,
        message: 'Pattern not found',
      });
    }

    await pattern.destroy();

    res.json({
      success: true,
      message: 'Pattern deleted successfully',
    });
  } catch (error) {
    console.error('Delete pattern error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting pattern',
    });
  }
};

/**
 * @desc    Detect emotional cycles
 * @route   GET /api/patterns/cycles
 * @access  Private
 */
const detectCycles = async (req, res) => {
  try {
    const { lookbackDays = 90 } = req.query;
    const result = await patternDetectionService.detectEmotionalCycles(
      req.user.id,
      parseInt(lookbackDays)
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Detect cycles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error detecting cycles',
    });
  }
};

/**
 * @desc    Detect trigger patterns
 * @route   GET /api/patterns/triggers
 * @access  Private
 */
const detectTriggers = async (req, res) => {
  try {
    const triggers = await patternDetectionService.detectTriggerPatterns(req.user.id);

    res.json({
      success: true,
      count: triggers.length,
      triggers,
    });
  } catch (error) {
    console.error('Detect triggers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error detecting triggers',
    });
  }
};

/**
 * @desc    Detect thought patterns
 * @route   GET /api/patterns/thought-patterns
 * @access  Private
 */
const detectThoughtPatterns = async (req, res) => {
  try {
    const patterns = await patternDetectionService.detectThoughtPatterns(req.user.id);

    res.json({
      success: true,
      count: patterns.length,
      patterns,
    });
  } catch (error) {
    console.error('Detect thought patterns error:', error);
    res.status(500).json({
      success: false,
      message: 'Error detecting thought patterns',
    });
  }
};

/**
 * @desc    Get coping strategy suggestions
 * @route   GET /api/patterns/coping/suggestions
 * @access  Private
 */
const getCopingSuggestions = async (req, res) => {
  try {
    const { mood } = req.query;
    
    const suggestions = await patternDetectionService.suggestCopingStrategies(
      req.user.id,
      mood
    );

    res.json({
      success: true,
      count: suggestions.length,
      suggestions,
    });
  } catch (error) {
    console.error('Get coping suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting coping suggestions',
    });
  }
};

module.exports = {
  detectPatterns,
  getPatterns,
  getPattern,
  deletePattern,
  detectCycles,
  detectTriggers,
  detectThoughtPatterns,
  getCopingSuggestions,
};