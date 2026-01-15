const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MenstrualCycle = sequelize.define('MenstrualCycle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  isTracking: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'User opted in to track menstrual cycle',
  },
  averageCycleLength: {
    type: DataTypes.INTEGER,
    defaultValue: 28,
    comment: 'Average cycle length in days',
  },
  lastPeriodStart: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  nextPredictedPeriod: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  cycleHistory: {
    type: DataTypes.ARRAY(DataTypes.JSONB),
    defaultValue: [],
    comment: 'Array of {startDate, endDate, length}',
  },
  ovulationDay: {
    type: DataTypes.INTEGER,
    defaultValue: 14,
    comment: 'Typical ovulation day in cycle',
  },
  symptoms: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Common symptoms by cycle phase: {follicular: [], ovulation: [], luteal: [], menstruation: []}',
  },
  moodCorrelations: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Detected mood patterns by cycle phase',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  timestamps: true,
  tableName: 'menstrual_cycles',
});

module.exports = MenstrualCycle;