const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Basic routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1/tasks', require('./routes/tasks'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/ai', require('./routes/ai'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OmniMind backend running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
});

module.exports = app;