import express from 'express';
import stockDataService from '../services/stockData.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get stock data by symbol
router.get('/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    logger.info(`API request for stock data: ${symbol}`);
    
    const stockData = await stockDataService.getStockData(symbol);
    
    res.json({
      success: true,
      data: stockData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in stock data API for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get Indian stock data by symbol
router.get('/indian-stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    logger.info(`API request for Indian stock data: ${symbol}`);
    
    const stockData = await stockDataService.getIndianStockData(symbol);
    
    res.json({
      success: true,
      data: stockData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in Indian stock data API for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get top Indian stocks
router.get('/indian-stocks/top', async (req, res) => {
  try {
    logger.info('API request for top Indian stocks');
    
    const topStocks = await stockDataService.getTopIndianStocks();
    
    res.json({
      success: true,
      data: topStocks,
      count: topStocks.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in top Indian stocks API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Search stocks
router.get('/search', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
        timestamp: new Date().toISOString()
      });
    }
    
    logger.info(`API request for stock search: ${query}`);
    
    const searchResults = await stockDataService.searchStocks(query);
    
    res.json({
      success: true,
      data: searchResults,
      query,
      count: searchResults.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in stock search API for "${req.query.q}":`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get multiple stocks data
router.post('/bulk', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Array of symbols is required in request body',
        timestamp: new Date().toISOString()
      });
    }
    
    logger.info(`API request for bulk stock data: ${symbols.join(', ')}`);
    
    const promises = symbols.map(symbol => 
      stockDataService.getStockData(symbol)
        .catch(error => ({
          symbol,
          error: error.message
        }))
    );
    
    const results = await Promise.all(promises);
    
    const successful = results.filter(result => !result.error);
    const failed = results.filter(result => result.error);
    
    res.json({
      success: true,
      data: {
        successful,
        failed,
        stats: {
          total: symbols.length,
          successful: successful.length,
          failed: failed.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in bulk stock data API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for market data service
router.get('/health', async (req, res) => {
  try {
    // Test with a known stock symbol
    const testSymbol = 'AAPL';
    const startTime = Date.now();
    
    await stockDataService.getStockData(testSymbol);
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      service: 'Market Data Service',
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Market data service health check failed:', error.message);
    res.status(503).json({
      success: false,
      service: 'Market Data Service',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Alpha Vantage API Routes

// Get real-time quote from Alpha Vantage
router.get('/alpha/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    logger.info(`API request for Alpha Vantage quote: ${symbol}`);
    
    const quote = await stockDataService.getAlphaVantageQuote(symbol);
    
    res.json({
      success: true,
      data: quote,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in Alpha Vantage quote API for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get intraday data from Alpha Vantage
router.get('/alpha/intraday/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '5min' } = req.query;
    logger.info(`API request for Alpha Vantage intraday data: ${symbol} (${interval})`);
    
    const intradayData = await stockDataService.getIntradayData(symbol, interval);
    
    res.json({
      success: true,
      data: intradayData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in Alpha Vantage intraday API for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get daily historical data from Alpha Vantage
router.get('/alpha/daily/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { outputsize = 'compact' } = req.query;
    logger.info(`API request for Alpha Vantage daily data: ${symbol}`);
    
    const dailyData = await stockDataService.getDailyData(symbol, outputsize);
    
    res.json({
      success: true,
      data: dailyData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in Alpha Vantage daily API for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get technical indicators from Alpha Vantage
router.get('/alpha/technical/:symbol/:indicator', async (req, res) => {
  try {
    const { symbol, indicator } = req.params;
    const { interval = 'daily', time_period = '20' } = req.query;
    logger.info(`API request for Alpha Vantage ${indicator}: ${symbol}`);
    
    const technicalData = await stockDataService.getTechnicalIndicator(
      symbol, 
      indicator, 
      interval, 
      parseInt(time_period)
    );
    
    res.json({
      success: true,
      data: technicalData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in Alpha Vantage technical API for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get company overview from Alpha Vantage
router.get('/alpha/overview/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    logger.info(`API request for Alpha Vantage company overview: ${symbol}`);
    
    const overview = await stockDataService.getCompanyOverview(symbol);
    
    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in Alpha Vantage overview API for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get comprehensive stock analysis combining multiple Alpha Vantage endpoints
router.get('/alpha/analysis/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    logger.info(`API request for comprehensive Alpha Vantage analysis: ${symbol}`);
    
    // Fetch multiple data points in parallel
    const [quote, overview, dailyData, sma20, rsi] = await Promise.allSettled([
      stockDataService.getAlphaVantageQuote(symbol),
      stockDataService.getCompanyOverview(symbol),
      stockDataService.getDailyData(symbol, 'compact'),
      stockDataService.getTechnicalIndicator(symbol, 'sma', 'daily', 20),
      stockDataService.getTechnicalIndicator(symbol, 'rsi', 'daily', 14)
    ]);

    const analysis = {
      symbol: symbol.toUpperCase(),
      quote: quote.status === 'fulfilled' ? quote.value : null,
      overview: overview.status === 'fulfilled' ? overview.value : null,
      dailyData: dailyData.status === 'fulfilled' ? {
        ...dailyData.value,
        dataPoints: dailyData.value.dataPoints.slice(0, 30) // Last 30 days
      } : null,
      technicalIndicators: {
        sma20: sma20.status === 'fulfilled' ? sma20.value : null,
        rsi: rsi.status === 'fulfilled' ? rsi.value : null
      },
      analysis: {
        dataAvailable: {
          quote: quote.status === 'fulfilled',
          overview: overview.status === 'fulfilled',
          historical: dailyData.status === 'fulfilled',
          technical: sma20.status === 'fulfilled' || rsi.status === 'fulfilled'
        }
      },
      lastUpdated: new Date().toISOString(),
      source: 'Alpha Vantage'
    };
    
    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in Alpha Vantage analysis API for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get Indian market indices (NIFTY 50, SENSEX, Gold)
router.get('/indian-indices', async (req, res) => {
  try {
    logger.info('API request for Indian market indices');
    
    const indices = [
      { symbol: '^NSEI', name: 'NIFTY 50' },
      { symbol: '^BSESN', name: 'BSE SENSEX' },
      { symbol: 'GC=F', name: 'Gold Futures' } // Gold in USD
    ];
    
    const promises = indices.map(async (index) => {
      try {
        const stockData = await stockDataService.getYahooFinanceData(index.symbol);
        if (stockData && !stockData.error) {
          return {
            name: index.name,
            symbol: index.symbol,
            price: stockData.currentPrice,
            change: stockData.change,
            changePercent: stockData.changePercent,
            currency: stockData.currency || (index.symbol === 'GC=F' ? 'USD' : 'INR'),
            lastUpdated: new Date().toISOString()
          };
        }
        return null;
      } catch (error) {
        logger.error(`Error fetching ${index.name}:`, error.message);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    const validResults = results.filter(result => result !== null);
    
    res.json({
      success: true,
      data: validResults,
      count: validResults.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in Indian indices API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get Indian market indices (NIFTY 50, SENSEX, Gold)
router.get('/indian-indices', async (req, res) => {
  try {
    logger.info('API request for Indian market indices');
    
    const indices = [
      { symbol: '^NSEI', name: 'NIFTY 50' },
      { symbol: '^BSESN', name: 'BSE SENSEX' },
      { symbol: 'GC=F', name: 'Gold Futures' } // Gold in USD
    ];
    
    const promises = indices.map(async (index) => {
      try {
        const stockData = await stockDataService.getYahooFinanceData(index.symbol);
        if (stockData && !stockData.error) {
          return {
            name: index.name,
            symbol: index.symbol,
            price: stockData.currentPrice,
            change: stockData.change,
            changePercent: stockData.changePercent,
            currency: stockData.currency || (index.symbol === 'GC=F' ? 'USD' : 'INR'),
            lastUpdated: new Date().toISOString()
          };
        }
        return null;
      } catch (error) {
        logger.error(`Error fetching ${index.name}:`, error.message);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    const validResults = results.filter(result => result !== null);
    
    res.json({
      success: true,
      data: validResults,
      count: validResults.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in Indian indices API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
