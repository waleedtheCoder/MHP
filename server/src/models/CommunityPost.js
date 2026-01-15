const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommunityPost = sequelize.define('CommunityPost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  anonymousName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Anonymous display name like "Hopeful Warrior"',
  },
  category: {
    type: DataTypes.ENUM('support', 'victory', 'struggle', 'question', 'gratitude', 'general'),
    defaultValue: 'general',
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  emotion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isModerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  moderationStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'flagged', 'removed'),
    defaultValue: 'pending',
  },
  moderationFlags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'AI-detected issues: ["harmful_content", "crisis_language"]',
  },
  aiSuggestion: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI-generated supportive response',
  },
  supportCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of support reactions',
  },
  responseCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  timestamps: true,
  tableName: 'community_posts',
  indexes: [
    { fields: ['userId'] },
    { fields: ['moderationStatus'] },
    { fields: ['category'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = CommunityPost;