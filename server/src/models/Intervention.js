const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Intervention = sequelize.define('Intervention', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  interventionType: {
    type: DataTypes.ENUM('prompt', 'reminder', 'suggestion', 'exercise', 'alert'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  actionItems: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Suggested actions user can take',
  },
  triggerReason: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'What triggered this intervention',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  wasHelpful: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: 'User feedback on intervention',
  },
  userResponse: {
    type: DataTypes.TEXT,
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
  tableName: 'interventions',
  indexes: [
    { fields: ['userId'] },
    { fields: ['scheduledFor'] },
    { fields: ['priority'] },
  ],
});

module.exports = Intervention;