import express from 'express';
import economicIndicatorsService from '../services/economicIndicators.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get US economic indicators
router.get('/us', async (req, res) => {
  try {
    logger.info('API request for US economic indicators');
    
    const usEconomicData = await economicIndicatorsService.getUSEconomicData();
    
    res.json({
      success: true,
      data: usEconomicData,
      region: 'USA',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in US economic indicators API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get Indian economic indicators
router.get('/india', async (req, res) => {
  try {
    logger.info('API request for Indian economic indicators');
    
    const indianEconomicData = await economicIndicatorsService.getIndianEconomicData();
    
    res.json({
      success: true,
      data: indianEconomicData,
      region: 'India',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in Indian economic indicators API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get global economic indicators
router.get('/global', async (req, res) => {
  try {
    logger.info('API request for global economic indicators');
    
    const globalEconomicData = await economicIndicatorsService.getGlobalEconomicData();
    
    res.json({
      success: true,
      data: globalEconomicData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in global economic indicators API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get forex data
router.get('/forex', async (req, res) => {
  try {
    logger.info('API request for forex data');
    
    const forexData = await economicIndicatorsService.getForexData();
    
    res.json({
      success: true,
      data: forexData,
      count: forexData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in forex data API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific FRED data
router.get('/fred/:seriesId', async (req, res) => {
  try {
    const { seriesId } = req.params;
    logger.info(`API request for FRED data: ${seriesId}`);
    
    const fredData = await economicIndicatorsService.getFREDData(seriesId);
    
    res.json({
      success: true,
      data: fredData,
      source: 'FRED',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in FRED data API for ${req.params.seriesId}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get economic summary
router.get('/summary', async (req, res) => {
  try {
    logger.info('API request for economic indicators summary');
    
    const [usData, indianData, forexData] = await Promise.allSettled([
      economicIndicatorsService.getUSEconomicData(),
      economicIndicatorsService.getIndianEconomicData(),
      economicIndicatorsService.getForexData()
    ]);

    const summary = {
      usa: usData.status === 'fulfilled' ? usData.value : { error: usData.reason?.message },
      india: indianData.status === 'fulfilled' ? indianData.value : { error: indianData.reason?.message },
      forex: forexData.status === 'fulfilled' ? forexData.value : { error: forexData.reason?.message },
      metadata: {
        lastUpdated: new Date().toISOString(),
        availableRegions: ['usa', 'india'],
        availableIndicators: ['gdp', 'inflation', 'unemployment', 'interestRates']
      }
    };
    
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in economic indicators summary API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for economic indicators service
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test with Indian economic data
    await economicIndicatorsService.getIndianEconomicData();
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      service: 'Economic Indicators Service',
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Economic indicators service health check failed:', error.message);
    res.status(503).json({
      success: false,
      service: 'Economic Indicators Service',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
