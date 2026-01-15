const { sequelize } = require('../config/database');
const User = require('./User');
const Entry = require('./Entry');
const Sentiment = require('./Sentiment');
const Pattern = require('./Pattern');
const EmotionalCycle = require('./EmotionalCycle');
const CopingStrategy = require('./CopingStrategy');
const MenstrualCycle = require('./MenstrualCycle');
const Prediction = require('./Prediction');
const Intervention = require('./Intervention');
const CommunityPost = require('./CommunityPost');

// Define relationships between models

// User has many Entries
User.hasMany(Entry, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

// Entry belongs to User
Entry.belongsTo(User, {
  foreignKey: 'userId',
});

// Entry has one Sentiment
Entry.hasOne(Sentiment, {
  foreignKey: 'entryId',
  onDelete: 'CASCADE',
});

// Sentiment belongs to Entry
Sentiment.belongsTo(Entry, {
  foreignKey: 'entryId',
});

// User has many Patterns
User.hasMany(Pattern, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

Pattern.belongsTo(User, {
  foreignKey: 'userId',
});

// User has many EmotionalCycles
User.hasMany(EmotionalCycle, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

EmotionalCycle.belongsTo(User, {
  foreignKey: 'userId',
});

// User has many CopingStrategies
User.hasMany(CopingStrategy, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

CopingStrategy.belongsTo(User, {
  foreignKey: 'userId',
});

// User has one MenstrualCycle (optional)
User.hasOne(MenstrualCycle, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

MenstrualCycle.belongsTo(User, {
  foreignKey: 'userId',
});

// User has many Predictions
User.hasMany(Prediction, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

Prediction.belongsTo(User, {
  foreignKey: 'userId',
});

// User has many Interventions
User.hasMany(Intervention, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

Intervention.belongsTo(User, {
  foreignKey: 'userId',
});

// User has many CommunityPosts
User.hasMany(CommunityPost, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

CommunityPost.belongsTo(User, {
  foreignKey: 'userId',
});

// Export models and sequelize
module.exports = {
  sequelize,
  User,
  Entry,
  Sentiment,
  Pattern,
  EmotionalCycle,
  CopingStrategy,
  MenstrualCycle,
  Prediction,
  Intervention,
  CommunityPost,
};