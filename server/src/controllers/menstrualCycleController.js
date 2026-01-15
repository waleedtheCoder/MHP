// server/src/controllers/menstrualCycleController.js
const { MenstrualCycle, Entry, Sentiment } = require('../models/Index');
const { Op } = require('sequelize');

/**
 * @desc    Enable menstrual cycle tracking
 * @route   POST /api/menstrual-cycle/enable
 * @access  Private
 */
const enableTracking = async (req, res) => {
  try {
    const { cycleLength, lastPeriodStart } = req.body;
    
    const [cycle, created] = await MenstrualCycle.findOrCreate({
      where: { userId: req.user.id },
      defaults: {
        isTracking: true,
        averageCycleLength: cycleLength || 28,
        lastPeriodStart: lastPeriodStart ? new Date(lastPeriodStart) : null,
        userId: req.user.id,
      },
    });

    if (!created) {
      cycle.isTracking = true;
      if (cycleLength) cycle.averageCycleLength = cycleLength;
      if (lastPeriodStart) cycle.lastPeriodStart = new Date(lastPeriodStart);
      await cycle.save();
    }

    // Calculate next predicted period
    if (cycle.lastPeriodStart) {
      const nextPredicted = new Date(cycle.lastPeriodStart);
      nextPredicted.setDate(nextPredicted.getDate() + cycle.averageCycleLength);
      cycle.nextPredictedPeriod = nextPredicted;
      await cycle.save();
    }

    res.json({
      success: true,
      message: 'Menstrual cycle tracking enabled',
      cycle,
    });
  } catch (error) {
    console.error('Enable tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enabling tracking',
    });
  }
};

/**
 * @desc    Disable menstrual cycle tracking
 * @route   POST /api/menstrual-cycle/disable
 * @access  Private
 */
const disableTracking = async (req, res) => {
  try {
    const cycle = await MenstrualCycle.findOne({
      where: { userId: req.user.id },
    });

    if (cycle) {
      cycle.isTracking = false;
      await cycle.save();
    }

    res.json({
      success: true,
      message: 'Menstrual cycle tracking disabled',
    });
  } catch (error) {
    console.error('Disable tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error disabling tracking',
    });
  }
};

/**
 * @desc    Get cycle data for user
 * @route   GET /api/menstrual-cycle
 * @access  Private
 */
const getCycleData = async (req, res) => {
  try {
    const cycle = await MenstrualCycle.findOne({
      where: { userId: req.user.id },
    });

    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: 'Cycle tracking not enabled',
      });
    }

    res.json({
      success: true,
      cycle,
    });
  } catch (error) {
    console.error('Get cycle data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cycle data',
    });
  }
};

/**
 * @desc    Log period start date
 * @route   POST /api/menstrual-cycle/period/start
 * @access  Private
 */
const logPeriodStart = async (req, res) => {
  try {
    const { startDate } = req.body;
    
    const cycle = await MenstrualCycle.findOne({
      where: { userId: req.user.id },
    });

    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: 'Cycle tracking not enabled',
      });
    }

    const newStart = new Date(startDate || Date.now());
    cycle.lastPeriodStart = newStart;
    
    // Calculate next predicted period
    const nextPredicted = new Date(newStart);
    nextPredicted.setDate(nextPredicted.getDate() + cycle.averageCycleLength);
    cycle.nextPredictedPeriod = nextPredicted;

    await cycle.save();

    res.json({
      success: true,
      message: 'Period start logged',
      cycle,
    });
  } catch (error) {
    console.error('Log period start error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging period start',
    });
  }
};

/**
 * @desc    Log period end date
 * @route   POST /api/menstrual-cycle/period/end
 * @access  Private
 */
const logPeriodEnd = async (req, res) => {
  try {
    const { endDate } = req.body;
    
    const cycle = await MenstrualCycle.findOne({
      where: { userId: req.user.id },
    });

    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: 'Cycle tracking not enabled',
      });
    }

    const end = new Date(endDate || Date.now());
    const start = new Date(cycle.lastPeriodStart);
    const length = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Add to history
    const history = cycle.cycleHistory || [];
    history.push({
      startDate: cycle.lastPeriodStart,
      endDate: end,
      length,
    });
    cycle.cycleHistory = history;

    // Update average cycle length if we have enough data
    if (history.length >= 3) {
      const totalLength = history.reduce((sum, h) => sum + h.length, 0);
      cycle.averageCycleLength = Math.round(totalLength / history.length);
    }

    await cycle.save();

    res.json({
      success: true,
      message: 'Period end logged',
      cycle,
    });
  } catch (error) {
    console.error('Log period end error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging period end',
    });
  }
};

/**
 * @desc    Get current cycle phase
 * @route   GET /api/menstrual-cycle/phase
 * @access  Private
 */
const getCurrentPhase = async (req, res) => {
  try {
    const cycle = await MenstrualCycle.findOne({
      where: { userId: req.user.id, isTracking: true },
    });

    if (!cycle || !cycle.lastPeriodStart) {
      return res.json({
        success: true,
        phase: 'unknown',
        message: 'Cycle tracking not active or no period data',
      });
    }

    const today = new Date();
    const lastPeriod = new Date(cycle.lastPeriodStart);
    const daysSinceStart = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24));
    const cycleDay = (daysSinceStart % cycle.averageCycleLength) + 1;

    let phase, description, expectedMood;

    if (cycleDay >= 1 && cycleDay <= 5) {
      phase = 'menstruation';
      description = 'Menstruation phase - period is active';
      expectedMood = 'May feel tired, irritable, or experience physical discomfort';
    } else if (cycleDay >= 6 && cycleDay <= 13) {
      phase = 'follicular';
      description = 'Follicular phase - energy typically increasing';
      expectedMood = 'Usually feel more energetic, positive, and social';
    } else if (cycleDay >= 14 && cycleDay <= 16) {
      phase = 'ovulation';
      description = 'Ovulation phase - peak fertility';
      expectedMood = 'Often feel confident, outgoing, and energetic';
    } else {
      phase = 'luteal';
      description = 'Luteal phase - approaching next period';
      expectedMood = 'May experience PMS symptoms, mood swings, anxiety';
    }

    res.json({
      success: true,
      phase,
      cycleDay,
      description,
      expectedMood,
      nextPeriod: cycle.nextPredictedPeriod,
      daysUntilNextPeriod: Math.max(0, cycle.averageCycleLength - cycleDay),
    });
  } catch (error) {
    console.error('Get current phase error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting current phase',
    });
  }
};

/**
 * @desc    Get mood correlations with cycle
 * @route   GET /api/menstrual-cycle/mood-correlations
 * @access  Private
 */
const getMoodCorrelations = async (req, res) => {
  try {
    const cycle = await MenstrualCycle.findOne({
      where: { userId: req.user.id, isTracking: true },
    });

    if (!cycle || !cycle.lastPeriodStart) {
      return res.json({
        success: true,
        message: 'Insufficient cycle data',
        correlations: null,
      });
    }

    // Get last 90 days of entries
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const entries = await Entry.findAll({
      where: {
        userId: req.user.id,
        createdAt: { [Op.gte]: ninetyDaysAgo },
      },
      include: [{ model: Sentiment }],
      order: [['createdAt', 'ASC']],
    });

    // Group entries by cycle phase
    const phaseData = {
      menstruation: { sentiments: [], moods: [] },
      follicular: { sentiments: [], moods: [] },
      ovulation: { sentiments: [], moods: [] },
      luteal: { sentiments: [], moods: [] },
    };

    entries.forEach(entry => {
      const phase = calculatePhaseForDate(
        entry.createdAt,
        cycle.lastPeriodStart,
        cycle.averageCycleLength
      );

      if (phase && entry.Sentiment) {
        phaseData[phase].sentiments.push(entry.Sentiment.score);
        if (entry.mood) {
          phaseData[phase].moods.push(entry.mood);
        }
      }
    });

    // Calculate statistics for each phase
    const correlations = {};
    for (const [phase, data] of Object.entries(phaseData)) {
      if (data.sentiments.length > 0) {
        const avgSentiment = data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length;
        const moodFrequency = getMoodFrequency(data.moods);

        correlations[phase] = {
          averageSentiment: avgSentiment.toFixed(2),
          entriesCount: data.sentiments.length,
          commonMoods: moodFrequency.slice(0, 3),
          intensity: Math.abs(avgSentiment),
        };
      }
    }

    // Store correlations in cycle model
    cycle.moodCorrelations = correlations;
    await cycle.save();

    res.json({
      success: true,
      correlations,
      insights: generateCorrelationInsights(correlations),
    });
  } catch (error) {
    console.error('Get mood correlations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting mood correlations',
    });
  }
};

/**
 * Calculate which phase a specific date falls into
 */
const calculatePhaseForDate = (entryDate, lastPeriodStart, cycleLength) => {
  const entry = new Date(entryDate);
  const lastPeriod = new Date(lastPeriodStart);
  const daysSinceStart = Math.floor((entry - lastPeriod) / (1000 * 60 * 60 * 24));
  const cycleDay = (daysSinceStart % cycleLength) + 1;

  if (cycleDay >= 1 && cycleDay <= 5) return 'menstruation';
  if (cycleDay >= 6 && cycleDay <= 13) return 'follicular';
  if (cycleDay >= 14 && cycleDay <= 16) return 'ovulation';
  return 'luteal';
};

/**
 * Get mood frequency using hashmap
 */
const getMoodFrequency = (moods) => {
  const frequency = new Map();
  
  moods.forEach(mood => {
    frequency.set(mood, (frequency.get(mood) || 0) + 1);
  });

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([mood, count]) => ({ mood, count }));
};

/**
 * Generate insights from correlations
 */
const generateCorrelationInsights = (correlations) => {
  const insights = [];

  // Find phase with lowest sentiment
  let lowestPhase = null;
  let lowestScore = Infinity;

  for (const [phase, data] of Object.entries(correlations)) {
    const score = parseFloat(data.averageSentiment);
    if (score < lowestScore) {
      lowestScore = score;
      lowestPhase = phase;
    }
  }

  if (lowestPhase) {
    insights.push({
      type: 'challenging_phase',
      phase: lowestPhase,
      message: `Your ${lowestPhase} phase tends to be emotionally challenging. Consider extra self-care during this time.`,
    });
  }

  // Find phase with highest sentiment
  let highestPhase = null;
  let highestScore = -Infinity;

  for (const [phase, data] of Object.entries(correlations)) {
    const score = parseFloat(data.averageSentiment);
    if (score > highestScore) {
      highestScore = score;
      highestPhase = phase;
    }
  }

  if (highestPhase) {
    insights.push({
      type: 'positive_phase',
      phase: highestPhase,
      message: `Your ${highestPhase} phase is typically your best time emotionally. Great for tackling challenging tasks!`,
    });
  }

  return insights;
};

/**
 * @desc    Update cycle preferences
 * @route   PUT /api/menstrual-cycle/preferences
 * @access  Private
 */
const updateCyclePreferences = async (req, res) => {
  try {
    const { averageCycleLength, ovulationDay } = req.body;
    
    const cycle = await MenstrualCycle.findOne({
      where: { userId: req.user.id },
    });

    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: 'Cycle tracking not enabled',
      });
    }

    if (averageCycleLength) cycle.averageCycleLength = averageCycleLength;
    if (ovulationDay) cycle.ovulationDay = ovulationDay;

    await cycle.save();

    res.json({
      success: true,
      message: 'Preferences updated',
      cycle,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences',
    });
  }
};

module.exports = {
  enableTracking,
  disableTracking,
  getCycleData,
  logPeriodStart,
  logPeriodEnd,
  getCurrentPhase,
  getMoodCorrelations,
  updateCyclePreferences,
};