const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Prediction = sequelize.define('Prediction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  predictionType: {
    type: DataTypes.ENUM('mood_dip', 'stress_peak', 'anxiety_spike', 'emotional_low', 'cycle_related'),
    allowNull: false,
  },
  predictedDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Confidence score 0-1',
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
  },
  basedOn: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'What data was used: ["past_patterns", "menstrual_cycle", "seasonal"]',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isAccurate: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: 'Was this prediction accurate? null = not yet verified',
  },
  actualOutcome: {
    type: DataTypes.STRING,
    allowNull: true,
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
  tableName: 'predictions',
  indexes: [
    { fields: ['userId'] },
    { fields: ['predictedDate'] },
    { fields: ['predictionType'] },
  ],
});

module.exports = Prediction;