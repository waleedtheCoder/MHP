const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database and models
const { sequelize, testConnection } = require('./config/database');
const { User, Entry, Sentiment } = require('./models/Index');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Mental Health Journal API is running!' });
});

// Database connection and sync
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync models with database (creates tables)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced successfully!');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
};

startServer();