const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sentiment = sequelize.define('Sentiment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  magnitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  emotion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  keywords: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
  },
  entryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'entries',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  timestamps: true,
  tableName: 'sentiments',
});

module.exports = Sentiment;