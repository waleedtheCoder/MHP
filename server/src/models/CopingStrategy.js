const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CopingStrategy = sequelize.define('CopingStrategy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  strategy: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('breathing', 'exercise', 'social', 'creative', 'mindfulness', 'other'),
    allowNull: false,
  },
  effectivenessScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'How effective 0-1',
  },
  timesUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  associatedTriggers: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  associatedMoods: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  lastUsed: {
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
  tableName: 'coping_strategies',
  indexes: [
    { fields: ['userId'] },
    { fields: ['effectivenessScore'] },
  ],
});

module.exports = CopingStrategy;