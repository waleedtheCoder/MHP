const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pattern = sequelize.define('Pattern', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  patternType: {
    type: DataTypes.ENUM('trigger', 'cycle', 'thought_pattern', 'coping_success'),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  frequency: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'How many times this pattern has occurred',
  },
  strength: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Confidence score 0-1',
  },
  triggerWords: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  associatedMoods: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  timeOfDay: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'morning, afternoon, evening, night',
  },
  daysOfWeek: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
    comment: '0-6 for Sunday-Saturday',
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
  tableName: 'patterns',
  indexes: [
    { fields: ['userId'] },
    { fields: ['patternType'] },
    { fields: ['strength'] },
  ],
});

module.exports = Pattern;