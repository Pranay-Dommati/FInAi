import express from 'express';
import newsService from '../services/news.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get Indian financial news
router.get('/indian', async (req, res) => {
  try {
    logger.info('API request for Indian financial news');
    
    const indianNews = await newsService.getIndianFinancialNews();
    
    res.json({
      success: true,
      data: indianNews,
      count: indianNews.length,
      region: 'India',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in Indian financial news API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get global financial news
router.get('/global', async (req, res) => {
  try {
    logger.info('API request for global financial news');
    
    const globalNews = await newsService.getGlobalFinancialNews();
    
    res.json({
      success: true,
      data: globalNews,
      count: globalNews.length,
      region: 'Global',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in global financial news API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get news by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    logger.info(`API request for news category: ${category}`);
    
    const categoryNews = await newsService.getNewsByCategory(category);
    
    res.json({
      success: true,
      data: categoryNews,
      category,
      count: categoryNews.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in news category API for ${req.params.category}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Search news
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
    
    logger.info(`API request for news search: ${query}`);
    
    const searchResults = await newsService.searchNews(query);
    
    res.json({
      success: true,
      data: searchResults,
      query,
      count: searchResults.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in news search API for "${req.query.q}":`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get news sentiment analysis
router.get('/sentiment', async (req, res) => {
  try {
    logger.info('API request for news sentiment analysis');
    
    const sentimentAnalysis = await newsService.getNewsSentiment();
    
    res.json({
      success: true,
      data: sentimentAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in news sentiment API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get latest news (combined Indian and global)
router.get('/latest', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    logger.info(`API request for latest news (limit: ${limit})`);
    
    const [indianNews, globalNews] = await Promise.all([
      newsService.getIndianFinancialNews(),
      newsService.getGlobalFinancialNews()
    ]);
    
    const allNews = [...indianNews, ...globalNews];
    
    // Sort by timestamp (newest first) and limit results
    allNews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latestNews = allNews.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: latestNews,
      count: latestNews.length,
      limit: parseInt(limit),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in latest news API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get news categories
router.get('/categories', async (req, res) => {
  try {
    logger.info('API request for news categories');
    
    const categories = [
      { id: 'all', name: 'All News', description: 'All financial news' },
      { id: 'markets', name: 'Markets', description: 'Stock market and trading news' },
      { id: 'economy', name: 'Economy', description: 'Economic indicators and policy' },
      { id: 'monetary-policy', name: 'Monetary Policy', description: 'Central bank decisions' },
      { id: 'earnings', name: 'Earnings', description: 'Company earnings reports' },
      { id: 'currency', name: 'Currency', description: 'Forex and currency news' },
      { id: 'commodities', name: 'Commodities', description: 'Oil, gold, and commodity prices' },
      { id: 'crypto', name: 'Cryptocurrency', description: 'Digital currency news' }
    ];
    
    res.json({
      success: true,
      data: categories,
      count: categories.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in news categories API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for news service
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test with Indian financial news
    await newsService.getIndianFinancialNews();
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      service: 'News Service',
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('News service health check failed:', error.message);
    res.status(503).json({
      success: false,
      service: 'News Service',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Real-time financial news endpoints

// Get real-time financial news from multiple sources
router.get('/realtime', async (req, res) => {
  try {
    const { sources } = req.query;
    const sourcesArray = sources ? sources.split(',') : ['alpha_vantage', 'rss', 'yahoo'];
    
    logger.info(`API request for real-time financial news from sources: ${sourcesArray.join(', ')}`);
    
    const news = await newsService.getRealTimeFinancialNews(sourcesArray);
    
    res.json({
      success: true,
      data: news,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in real-time financial news API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get Alpha Vantage news and sentiment
router.get('/alpha-vantage', async (req, res) => {
  try {
    const { symbol, topics } = req.query;
    logger.info(`API request for Alpha Vantage news - symbol: ${symbol}, topics: ${topics}`);
    
    const news = await newsService.getAlphaVantageNews(symbol, topics);
    
    res.json({
      success: true,
      data: news,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in Alpha Vantage news API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get RSS financial news
router.get('/rss', async (req, res) => {
  try {
    const { category = 'financial' } = req.query;
    logger.info(`API request for RSS news - category: ${category}`);
    
    const news = await newsService.getRSSNews(category);
    
    res.json({
      success: true,
      data: news,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in RSS news API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get Yahoo Finance news
router.get('/yahoo-finance', async (req, res) => {
  try {
    logger.info('API request for Yahoo Finance news');
    
    const news = await newsService.getYahooFinanceNews();
    
    res.json({
      success: true,
      data: news,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in Yahoo Finance news API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get stock-specific news
router.get('/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    logger.info(`API request for stock-specific news: ${symbol}`);
    
    const news = await newsService.getAlphaVantageNews(symbol);
    
    res.json({
      success: true,
      data: news,
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in stock news API for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
