// server/src/middleware/moderationMiddleware.js

/**
 * Middleware to moderate content before posting to community
 * Blocks or flags harmful content
 * 
 * NOTE: This is a TEMPORARY implementation that works without aiModerationService.js
 * For full AI moderation, you'll need to implement aiModerationService.js
 */

/**
 * Simple keyword-based moderation (works without AI service)
 */
const moderateContent = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    // Simple crisis keyword detection
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'want to die', 'better off dead',
      'no reason to live', 'self harm', 'hurt myself', 'cut myself'
    ];

    const lowerContent = content.toLowerCase();
    const hasCrisisLanguage = crisisKeywords.some(keyword => lowerContent.includes(keyword));

    // If crisis language detected, block and provide resources
    if (hasCrisisLanguage) {
      return res.status(403).json({
        success: false,
        message: 'Your post contains language that suggests you may need immediate support.',
        canPost: false,
        helpResources: [
          {
            name: 'National Suicide Prevention Lifeline',
            contact: '988',
            description: 'Free, confidential support 24/7',
          },
          {
            name: 'Crisis Text Line',
            contact: 'Text HOME to 741741',
            description: 'Free, 24/7 support via text',
          },
          {
            name: 'International Association for Suicide Prevention',
            url: 'https://www.iasp.info/resources/Crisis_Centres/',
            description: 'Find help in your country',
          },
        ],
        suggestion: {
          type: 'crisis_support',
          message: 'It sounds like you\'re going through a really difficult time. Your safety is the most important thing right now.',
          encouragement: 'Please reach out to these resources. You don\'t have to face this alone. Your life matters, and there are people who want to help.',
        },
      });
    }

    // Check for excessive profanity (simple filter)
    const profanityPattern = /\b(fuck|shit|damn|bitch)\w*/gi;
    const profanityMatches = content.match(profanityPattern) || [];
    
    if (profanityMatches.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Your post contains excessive profanity. Please revise and try again.',
        canPost: false,
        flags: ['excessive_profanity'],
      });
    }

    // Check for harmful self-talk
    const harmfulKeywords = ['hate myself', 'worthless', 'useless', 'failure', 'waste of space'];
    const harmfulCount = harmfulKeywords.filter(keyword => lowerContent.includes(keyword)).length;

    let flags = [];
    let suggestion = null;

    if (harmfulCount >= 2) {
      flags.push('negative_self_talk');
      suggestion = {
        type: 'supportive',
        message: 'I noticed some harsh self-criticism in your words. Remember, you deserve the same kindness you would show a friend.',
        tips: [
          'Try reframing negative thoughts with compassion',
          'What would you say to a friend feeling this way?',
          'Your worth isn\'t defined by a difficult moment',
        ],
      };
    }

    // Attach moderation result to request for controller to use
    req.moderationResult = {
      isSafe: true,
      flags,
      suggestion,
    };

    next();
  } catch (error) {
    console.error('Moderation middleware error:', error);
    
    // On error, fail safe: allow post but flag for manual review
    req.moderationResult = {
      isSafe: true,
      flags: ['moderation_error'],
      suggestion: null,
    };
    next();
  }
};

/**
 * Rate limit community posts to prevent spam
 */
const rateLimitPosts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Check how many posts user made in last hour
    const { CommunityPost } = require('../models/Index');
    const { Op } = require('sequelize');
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentPosts = await CommunityPost.count({
      where: {
        userId,
        createdAt: { [Op.gte]: oneHourAgo },
      },
    });

    // Limit to 5 posts per hour
    if (recentPosts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'You\'ve reached the posting limit. Please wait before posting again.',
        retryAfter: 60, // minutes
      });
    }

    next();
  } catch (error) {
    console.error('Rate limit error:', error);
    next(); // On error, allow through
  }
};

module.exports = {
  moderateContent,
  rateLimitPosts,
};