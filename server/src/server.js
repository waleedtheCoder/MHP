const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database and models
const { sequelize, testConnection } = require('./config/database');
const { 
  User, 
  Entry, 
  Sentiment, 
  Pattern, 
  EmotionalCycle, 
  CopingStrategy,
  MenstrualCycle,
  Prediction,
  Intervention,
  CommunityPost
} = require('./models/Index');

// Import routes
const authRoutes = require('./routes/authRoutes');
const entryRoutes = require('./routes/entryRoutes');
const patternRoutes = require('./routes/patternRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const menstrualCycleRoutes = require('./routes/menstrualCycleRoutes');
const communityRoutes = require('./routes/communityRoutes');
const insightRoutes = require('./routes/insightRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Mental Health Journal API is running!',
    version: '2.0.0',
    features: [
      'Journal Entries',
      'Sentiment Analysis',
      'Pattern Detection',
      'Emotional Cycle Tracking',
      'Predictive Interventions',
      'Menstrual Cycle Integration',
      'Community Support'
    ],
    endpoints: {
      auth: '/api/auth',
      entries: '/api/entries',
      patterns: '/api/patterns',
      predictions: '/api/predictions',
      menstrualCycle: '/api/menstrual-cycle',
      community: '/api/community',
      insights: '/api/insights'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/patterns', patternRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/menstrual-cycle', menstrualCycleRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/insights', insightRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync models with database (creates tables)
    // Use { alter: true } in development, { force: false } in production
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database synced successfully!');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 API Documentation: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();