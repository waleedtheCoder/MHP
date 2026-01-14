const { sequelize } = require('../config/database');
const User = require('./User');
const Entry = require('./Entry');
const Sentiment = require('./Sentiment');

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

// Export models and sequelize
module.exports = {
  sequelize,
  User,
  Entry,
  Sentiment,
};