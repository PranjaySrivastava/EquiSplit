const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

const mongoose = require('mongoose');

// Health check endpoint with database status
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    app: 'EquiSplit API',
    database: dbStatusMap[dbState] || 'unknown',
    databaseConnected: dbState === 1,
    timestamp: new Date().toISOString(),
  });
});

// Database readiness guard: Fail fast with clear error instead of hanging
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is connecting or unreachable. Please verify that MONGODB_URI has the correct password and 0.0.0.0/0 is enabled in MongoDB Atlas Network Access.',
    });
  }
  next();
});

// Mount Routes
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const settlementRoutes = require('./routes/settlementRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const activityRoutes = require('./routes/activityRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/groups/:groupId/expenses', expenseRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/groups/:groupId/settlements', settlementRoutes);
app.use('/api/groups/:groupId', analyticsRoutes);
app.use('/api/groups/:groupId', activityRoutes);

const path = require('path');

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const { autoSeedIfEmpty } = require('./services/autoSeeder');

// Connect to Database and start server
const startServer = async () => {
  app.listen(PORT, async () => {
    console.log(`🚀 EquiSplit Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    try {
      await connectDB();
      await autoSeedIfEmpty();
    } catch (err) {
      console.error('⚠️ MongoDB connection warning:', err.message);
      console.log('Server is alive and listening. Please verify MONGODB_URI in Render environment variables.');
    }
  });
};

startServer();

module.exports = app;
