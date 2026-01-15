const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmotionalCycle = sequelize.define('EmotionalCycle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cycleLength: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Length in days',
  },
  peakDay: {
    type: DataTypes.INTEGER,
    comment: 'Day number when emotion peaks',
  },
  valleyDay: {
    type: DataTypes.INTEGER,
    comment: 'Day number when emotion is lowest',
  },
  emotionType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  confidence: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Confidence in this cycle detection 0-1',
  },
  lastOccurrence: {
    type: DataTypes.DATE,
  },
  nextPredictedDate: {
    type: DataTypes.DATE,
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
  tableName: 'emotional_cycles',
  indexes: [
    { fields: ['userId'] },
    { fields: ['nextPredictedDate'] },
  ],
});

module.exports = EmotionalCycle;