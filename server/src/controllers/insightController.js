// server/src/controllers/insightController.js
const { Entry, Sentiment, Pattern } = require('../models/Index');
const { Op } = require('sequelize');

/**
 * @desc    Get overview of user's mental health insights
 * @route   GET /api/insights/overview
 * @access  Private
 */
const getOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get stats
    const [totalEntries, recentEntries, patterns] = await Promise.all([
      Entry.count({ where: { userId } }),
      Entry.count({ 
        where: { 
          userId, 
          createdAt: { [Op.gte]: thirtyDaysAgo } 
        } 
      }),
      Pattern.count({ where: { userId } }),
    ]);

    // Get average sentiment for last 30 days
    const entries = await Entry.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
      include: [{ model: Sentiment }],
    });

    let avgSentiment = 0;
    if (entries.length > 0) {
      const sum = entries.reduce((acc, e) => acc + (e.Sentiment?.score || 0), 0);
      avgSentiment = sum / entries.length;
    }

    // Mood distribution
    const moodCounts = {};
    entries.forEach(e => {
      if (e.mood) {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
      }
    });

    res.json({
      success: true,
      overview: {
        totalEntries,
        entriesThisMonth: recentEntries,
        patternsDetected: patterns,
        averageSentiment: avgSentiment.toFixed(2),
        moodDistribution: moodCounts,
        journalingStreak: await calculateStreak(userId),
      },
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overview',
    });
  }
};

/**
 * Calculate journaling streak (consecutive days)
 */
const calculateStreak = async (userId) => {
  const entries = await Entry.findAll({
    where: { userId },
    attributes: ['createdAt'],
    order: [['createdAt', 'DESC']],
  });

  if (entries.length === 0) return 0;

  let streak = 1;
  let currentDate = new Date(entries[0].createdAt);
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 1; i < entries.length; i++) {
    const entryDate = new Date(entries[i].createdAt);
    entryDate.setHours(0, 0, 0, 0);

    const dayDiff = (currentDate - entryDate) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      streak++;
      currentDate = entryDate;
    } else if (dayDiff > 1) {
      break;
    }
  }

  return streak;
};

/**
 * @desc    Get mood trends over time
 * @route   GET /api/insights/mood-trends
 * @access  Private
 */
const getMoodTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const entries = await Entry.findAll({
      where: {
        userId: req.user.id,
        createdAt: { [Op.gte]: startDate },
      },
      include: [{ model: Sentiment }],
      order: [['createdAt', 'ASC']],
    });

    const trends = entries.map(e => ({
      date: e.createdAt,
      sentiment: e.Sentiment?.score || 0,
      mood: e.mood,
      emotion: e.Sentiment?.emotion,
    }));

    res.json({
      success: true,
      count: trends.length,
      trends,
    });
  } catch (error) {
    console.error('Get mood trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mood trends',
    });
  }
};

/**
 * @desc    Get weekly report
 * @route   GET /api/insights/weekly-report
 * @access  Private
 */
const getWeeklyReport = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const entries = await Entry.findAll({
      where: {
        userId: req.user.id,
        createdAt: { [Op.gte]: sevenDaysAgo },
      },
      include: [{ model: Sentiment }],
    });

    if (entries.length === 0) {
      return res.json({
        success: true,
        message: 'No entries this week yet',
        report: null,
      });
    }

    // Calculate stats
    const sentiments = entries.map(e => e.Sentiment?.score || 0);
    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    const bestDay = entries.reduce((best, e) => 
      (e.Sentiment?.score || 0) > (best.Sentiment?.score || 0) ? e : best
    );
    const worstDay = entries.reduce((worst, e) => 
      (e.Sentiment?.score || 0) < (worst.Sentiment?.score || 0) ? e : worst
    );

    // Most common emotions
    const emotions = {};
    entries.forEach(e => {
      if (e.Sentiment?.emotion) {
        emotions[e.Sentiment.emotion] = (emotions[e.Sentiment.emotion] || 0) + 1;
      }
    });

    const topEmotions = Object.entries(emotions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion, count]) => ({ emotion, count }));

    res.json({
      success: true,
      report: {
        period: 'Last 7 days',
        totalEntries: entries.length,
        averageSentiment: avgSentiment.toFixed(2),
        bestDay: {
          date: bestDay.createdAt,
          title: bestDay.title,
          sentiment: bestDay.Sentiment?.score,
        },
        worstDay: {
          date: worstDay.createdAt,
          title: worstDay.title,
          sentiment: worstDay.Sentiment?.score,
        },
        topEmotions,
        insights: generateWeeklyInsights(avgSentiment, entries.length),
      },
    });
  } catch (error) {
    console.error('Get weekly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating weekly report',
    });
  }
};

const generateWeeklyInsights = (avgSentiment, entryCount) => {
  const insights = [];

  if (avgSentiment > 0.3) {
    insights.push('Your week has been emotionally positive overall. Great job taking care of yourself!');
  } else if (avgSentiment < -0.3) {
    insights.push('This week has been challenging. Remember to be gentle with yourself.');
  }

  if (entryCount >= 5) {
    insights.push('Excellent consistency with journaling this week! This builds great mental health habits.');
  } else if (entryCount < 3) {
    insights.push('Try to journal more consistently. Even brief entries can provide valuable insights.');
  }

  return insights;
};

/**
 * @desc    Get monthly report
 * @route   GET /api/insights/monthly-report
 * @access  Private
 */
const getMonthlyReport = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const entries = await Entry.findAll({
      where: {
        userId: req.user.id,
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
      include: [{ model: Sentiment }],
    });

    if (entries.length === 0) {
      return res.json({
        success: true,
        message: 'No entries this month yet',
        report: null,
      });
    }

    // Group by week
    const weeklyData = groupByWeek(entries);

    res.json({
      success: true,
      report: {
        period: 'Last 30 days',
        totalEntries: entries.length,
        weeklyBreakdown: weeklyData,
      },
    });
  } catch (error) {
    console.error('Get monthly report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating monthly report',
    });
  }
};

const groupByWeek = (entries) => {
  const weeks = [{}, {}, {}, {}];
  const now = new Date();

  entries.forEach(entry => {
    const entryDate = new Date(entry.createdAt);
    const daysDiff = Math.floor((now - entryDate) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.min(Math.floor(daysDiff / 7), 3);

    if (!weeks[weekIndex].entries) {
      weeks[weekIndex].entries = [];
    }
    weeks[weekIndex].entries.push(entry);
  });

  return weeks.map((week, i) => {
    if (!week.entries || week.entries.length === 0) {
      return {
        week: `Week ${4 - i}`,
        entries: 0,
        avgSentiment: 0,
      };
    }

    const sentiments = week.entries.map(e => e.Sentiment?.score || 0);
    const avg = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;

    return {
      week: `Week ${4 - i}`,
      entries: week.entries.length,
      avgSentiment: avg.toFixed(2),
    };
  });
};

/**
 * @desc    Find similar entries to a given entry
 * @route   GET /api/insights/similar-entries/:entryId
 * @access  Private
 */
const getSimilarEntries = async (req, res) => {
  try {
    const targetEntry = await Entry.findOne({
      where: {
        id: req.params.entryId,
        userId: req.user.id,
      },
      include: [{ model: Sentiment }],
    });

    if (!targetEntry) {
      return res.status(404).json({
        success: false,
        message: 'Entry not found',
      });
    }

    // Find entries with similar sentiment and tags
    const allEntries = await Entry.findAll({
      where: {
        userId: req.user.id,
        id: { [Op.ne]: targetEntry.id },
      },
      include: [{ model: Sentiment }],
    });

    const similar = allEntries
      .map(entry => ({
        entry,
        similarity: calculateSimilarity(targetEntry, entry),
      }))
      .filter(item => item.similarity > 0.5)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    res.json({
      success: true,
      count: similar.length,
      similarEntries: similar.map(item => ({
        ...item.entry.toJSON(),
        similarity: item.similarity,
      })),
    });
  } catch (error) {
    console.error('Get similar entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding similar entries',
    });
  }
};

const calculateSimilarity = (entry1, entry2) => {
  let score = 0;

  // Sentiment similarity (40% weight)
  const sentiment1 = entry1.Sentiment?.score || 0;
  const sentiment2 = entry2.Sentiment?.score || 0;
  const sentimentDiff = Math.abs(sentiment1 - sentiment2);
  score += (1 - sentimentDiff) * 0.4;

  // Tag overlap (40% weight)
  const tags1 = new Set(entry1.tags || []);
  const tags2 = new Set(entry2.tags || []);
  const intersection = new Set([...tags1].filter(x => tags2.has(x)));
  const union = new Set([...tags1, ...tags2]);
  const tagSimilarity = union.size > 0 ? intersection.size / union.size : 0;
  score += tagSimilarity * 0.4;

  // Mood similarity (20% weight)
  if (entry1.mood && entry2.mood && entry1.mood === entry2.mood) {
    score += 0.2;
  }

  return score;
};

/**
 * @desc    Get keyword cloud
 * @route   GET /api/insights/keyword-cloud
 * @access  Private
 */
const getKeywordCloud = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const entries = await Entry.findAll({
      where: {
        userId: req.user.id,
        createdAt: { [Op.gte]: startDate },
      },
      include: [{ model: Sentiment }],
    });

    const keywords = new Map();

    entries.forEach(entry => {
      // Extract keywords from Sentiment
      if (entry.Sentiment?.keywords) {
        entry.Sentiment.keywords.forEach(keyword => {
          keywords.set(keyword, (keywords.get(keyword) || 0) + 1);
        });
      }

      // Extract from tags
      if (entry.tags) {
        entry.tags.forEach(tag => {
          keywords.set(tag, (keywords.get(tag) || 0) + 1);
        });
      }
    });

    const cloud = Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word, count]) => ({ word, count }));

    res.json({
      success: true,
      count: cloud.length,
      keywords: cloud,
    });
  } catch (error) {
    console.error('Get keyword cloud error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating keyword cloud',
    });
  }
};

/**
 * @desc    Get emotional journey visualization data
 * @route   GET /api/insights/emotional-journey
 * @access  Private
 */
const getEmotionalJourney = async (req, res) => {
  try {
    const entries = await Entry.findAll({
      where: { userId: req.user.id },
      include: [{ model: Sentiment }],
      order: [['createdAt', 'ASC']],
    });

    const journey = entries.map((entry, index) => ({
      id: entry.id,
      date: entry.createdAt,
      title: entry.title,
      sentiment: entry.Sentiment?.score || 0,
      emotion: entry.Sentiment?.emotion,
      mood: entry.mood,
      sequenceNumber: index + 1,
    }));

    res.json({
      success: true,
      count: journey.length,
      journey,
    });
  } catch (error) {
    console.error('Get emotional journey error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emotional journey',
    });
  }
};

module.exports = {
  getOverview,
  getMoodTrends,
  getWeeklyReport,
  getMonthlyReport,
  getSimilarEntries,
  getKeywordCloud,
  getEmotionalJourney,
};