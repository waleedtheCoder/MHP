const { Prediction, Intervention } = require('../models/Index');
const predictionService = require('../services/predictionService');
const { Op } = require('sequelize');

/**
 * @desc    Generate predictions for user
 * @route   POST /api/predictions/generate
 * @access  Private
 */
const generatePredictions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { daysAhead = 14 } = req.body;

    const predictions = await predictionService.generatePredictions(userId, daysAhead);

    res.json({
      success: true,
      message: 'Predictions generated successfully',
      count: predictions.length,
      predictions,
    });
  } catch (error) {
    console.error('Generate predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating predictions',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all predictions for user
 * @route   GET /api/predictions
 * @access  Private
 */
const getPredictions = async (req, res) => {
  try {
    const { startDate, endDate, type, minConfidence = 0.5 } = req.query;

    const where = {
      userId: req.user.id,
      confidence: { [Op.gte]: parseFloat(minConfidence) },
    };

    if (type) {
      where.predictionType = type;
    }

    if (startDate || endDate) {
      where.predictedDate = {};
      if (startDate) where.predictedDate[Op.gte] = new Date(startDate);
      if (endDate) where.predictedDate[Op.lte] = new Date(endDate);
    }

    const predictions = await Prediction.findAll({
      where,
      order: [['predictedDate', 'ASC']],
    });

    res.json({
      success: true,
      count: predictions.length,
      predictions,
    });
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching predictions',
    });
  }
};

/**
 * @desc    Get upcoming predictions (next 7 days)
 * @route   GET /api/predictions/upcoming
 * @access  Private
 */
const getUpcomingPredictions = async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const predictions = await Prediction.findAll({
      where: {
        userId: req.user.id,
        predictedDate: {
          [Op.between]: [now, nextWeek],
        },
      },
      order: [['predictedDate', 'ASC'], ['severity', 'DESC']],
    });

    res.json({
      success: true,
      count: predictions.length,
      predictions,
    });
  } catch (error) {
    console.error('Get upcoming predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming predictions',
    });
  }
};

/**
 * @desc    Verify prediction accuracy
 * @route   POST /api/predictions/:id/verify
 * @access  Private
 */
const verifyPrediction = async (req, res) => {
  try {
    const { isAccurate, actualOutcome } = req.body;

    const prediction = await Prediction.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found',
      });
    }

    prediction.isAccurate = isAccurate;
    prediction.actualOutcome = actualOutcome;
    await prediction.save();

    res.json({
      success: true,
      message: 'Prediction verified',
      prediction,
    });
  } catch (error) {
    console.error('Verify prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying prediction',
    });
  }
};

/**
 * @desc    Get interventions for user
 * @route   GET /api/predictions/interventions
 * @access  Private
 */
const getInterventions = async (req, res) => {
  try {
    const { priority, undelivered } = req.query;

    const where = { userId: req.user.id };

    if (priority) {
      where.priority = priority;
    }

    if (undelivered === 'true') {
      where.deliveredAt = null;
    }

    const interventions = await Intervention.findAll({
      where,
      order: [
        ['priority', 'DESC'],
        ['scheduledFor', 'ASC'],
      ],
    });

    res.json({
      success: true,
      count: interventions.length,
      interventions,
    });
  } catch (error) {
    console.error('Get interventions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching interventions',
    });
  }
};

/**
 * @desc    Dismiss intervention
 * @route   POST /api/predictions/interventions/:id/dismiss
 * @access  Private
 */
const dismissIntervention = async (req, res) => {
  try {
    const intervention = await Intervention.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found',
      });
    }

    intervention.deliveredAt = new Date();
    await intervention.save();

    res.json({
      success: true,
      message: 'Intervention dismissed',
    });
  } catch (error) {
    console.error('Dismiss intervention error:', error);
    res.status(500).json({
      success: false,
      message: 'Error dismissing intervention',
    });
  }
};

/**
 * @desc    Provide feedback on intervention
 * @route   POST /api/predictions/interventions/:id/feedback
 * @access  Private
 */
const provideFeedback = async (req, res) => {
  try {
    const { wasHelpful, userResponse } = req.body;

    const intervention = await Intervention.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found',
      });
    }

    intervention.wasHelpful = wasHelpful;
    intervention.userResponse = userResponse;
    await intervention.save();

    res.json({
      success: true,
      message: 'Feedback recorded',
    });
  } catch (error) {
    console.error('Provide feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording feedback',
    });
  }
};

module.exports = {
  generatePredictions,
  getPredictions,
  getUpcomingPredictions,
  verifyPrediction,
  getInterventions,
  dismissIntervention,
  provideFeedback,
};