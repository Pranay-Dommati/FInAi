import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import logger from './utils/logger.js';
import marketDataRoutes from './routes/marketData.js';
import economicIndicatorsRoutes from './routes/economicIndicators.js';
import newsRoutes from './routes/news.js';
import companyFilingsRoutes from './routes/companyFilings.js';
import plaidRoutes from './routes/plaid.js';
import stockAnalysisRoutes from './routes/stockAnalysis.js';
import financialPlanningRoutes from './routes/financialPlanning.js';
import { startDataRefreshJobs } from './services/scheduler.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'FRED_API_KEY',
  'ALPHA_VANTAGE_API_KEY',
  'NEWS_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
  logger.warn(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  // Set mock data flag if environment variables are missing
  process.env.USE_MOCK_DATA = 'true';
}

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An unexpected error occurred'
  });
});

// Response formatting middleware
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    if (data && typeof data === 'object' && !data.hasOwnProperty('success')) {
      return originalJson.call(this, {
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    }
    return originalJson.call(this, data);
  };
  next();
});

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/market-data', marketDataRoutes);
app.use('/api/economic-indicators', economicIndicatorsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/company-filings', companyFilingsRoutes);
app.use('/api/plaid', plaidRoutes);
app.use('/api/stock-analysis', stockAnalysisRoutes);
app.use('/api/financial-planning', financialPlanningRoutes);
app.use('/api/financial-planning', financialPlanningRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      timestamp: new Date().toISOString()
    }
  });
});

// Start server with simple port fallback
const tryPort = (port) => {
  return new Promise((resolve, reject) => {
    const serverInstance = server.listen(port, () => {
      logger.info(`🚀 Financial Research AI Backend running on port ${port}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`📊 Market data integration active`);
      
      // Start background data refresh jobs
      startDataRefreshJobs();
      
      resolve(port);
    });

    serverInstance.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(err);
      } else {
        logger.error('Server error:', err);
        process.exit(1);
      }
    });
  });
};

// Try multiple ports
const startServer = async () => {
  const ports = [PORT, 5001, 5002, 5003, 5004];
  
  for (const port of ports) {
    try {
      await tryPort(port);
      break;
    } catch (err) {
      if (port === ports[ports.length - 1]) {
        logger.error('❌ Could not start server on any available port');
        process.exit(1);
      } else {
        logger.warn(`Port ${port} is busy, trying next port...`);
      }
    }
  }
};

startServer().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;
