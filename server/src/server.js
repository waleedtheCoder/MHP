const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database and models
const { sequelize, testConnection } = require('./config/database');
const { User, Entry, Sentiment } = require('./models/Index');

// Import routes
const authRoutes = require('./routes/authRoutes');
const entryRoutes = require('./routes/entryRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Mental Health Journal API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      entries: '/api/entries'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/entries', entryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database connection and server start
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
      console.log(`📝 API Documentation: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();