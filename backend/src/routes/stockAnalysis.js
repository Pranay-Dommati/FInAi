import express from 'express';
import stockAnalysisService from '../services/stockAnalysis.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get comprehensive stock analysis
router.get('/analyze/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Stock symbol is required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`API request for stock analysis: ${symbol}`);
    
    const analysis = await stockAnalysisService.getComprehensiveStockAnalysis(symbol);
    
    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in stock analysis API for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Search stocks by symbol or company name
router.get('/search', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query "q" is required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`API request for stock search: ${query}`);
    
    // Popular stocks database with logo URLs
    const popularStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', logo: 'https://logo.clearbit.com/apple.com' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', logo: 'https://logo.clearbit.com/microsoft.com' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', logo: 'https://logo.clearbit.com/google.com' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', logo: 'https://logo.clearbit.com/amazon.com' },
      { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', logo: 'https://logo.clearbit.com/tesla.com' },
      { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology', logo: 'https://logo.clearbit.com/meta.com' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', logo: 'https://logo.clearbit.com/nvidia.com' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services', logo: 'https://logo.clearbit.com/jpmorgan.com' },
      { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', logo: 'https://logo.clearbit.com/jnj.com' },
      { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services', logo: 'https://logo.clearbit.com/visa.com' },
      { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples', logo: 'https://logo.clearbit.com/pg.com' },
      { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', logo: 'https://logo.clearbit.com/unitedhealthgroup.com' },
      { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Discretionary', logo: 'https://logo.clearbit.com/homedepot.com' },
      { symbol: 'BAC', name: 'Bank of America', sector: 'Financial Services', logo: 'https://logo.clearbit.com/bankofamerica.com' },
      { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financial Services', logo: 'https://logo.clearbit.com/mastercard.com' }
    ];

    const searchTerm = query.toLowerCase();
    const results = popularStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(searchTerm) ||
      stock.name.toLowerCase().includes(searchTerm) ||
      stock.sector.toLowerCase().includes(searchTerm)
    );

    if (results.length === 0) {
      // If no matches found, create a dynamic entry for any symbol
      const symbolMatch = query.toUpperCase().match(/^[A-Z]{1,5}$/);
      if (symbolMatch) {
        results.push({
          symbol: query.toUpperCase(),
          name: `${query.toUpperCase()} Inc.`,
          sector: 'Unknown',
          logo: `https://via.placeholder.com/32x32/6366f1/ffffff?text=${query.charAt(0).toUpperCase()}`
        });
      }
    }

    res.json({
      success: true,
      data: {
        results: results.slice(0, 10), // Limit to 10 results
        query: query,
        totalResults: results.length
      },
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

// Get stock quick info (for autocomplete/preview)
router.get('/quick/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    logger.info(`API request for quick stock info: ${symbol}`);
    
    // Get basic stock data quickly
    const stockData = await stockAnalysisService.getStockData(symbol);
    
    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        price: stockData?.price || 'N/A',
        change: stockData?.change || 'N/A',
        changePercent: stockData?.changePercent || 'N/A',
        volume: stockData?.volume || 'N/A',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in quick stock info API for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get popular/trending stocks
router.get('/trending', async (req, res) => {
  try {
    logger.info('API request for trending stocks');
    
    const popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    
    // Get quick data for popular stocks
    const trendingPromises = popularSymbols.map(async (symbol) => {
      try {
        const stockData = await stockAnalysisService.getStockData(symbol);
        return {
          symbol,
          name: this.getCompanyName(symbol),
          price: stockData?.price || 'N/A',
          change: stockData?.change || 'N/A',
          changePercent: stockData?.changePercent || 'N/A'
        };
      } catch (error) {
        return {
          symbol,
          name: this.getCompanyName(symbol),
          price: 'N/A',
          change: 'N/A',
          changePercent: 'N/A',
          error: 'Data unavailable'
        };
      }
    });

    const trendingStocks = await Promise.all(trendingPromises);
    
    res.json({
      success: true,
      data: {
        stocks: trendingStocks,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in trending stocks API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get stock news sentiment specifically
router.get('/sentiment/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    logger.info(`API request for stock sentiment: ${symbol}`);
    
    const news = await stockAnalysisService.getStockNews(symbol);
    const sentimentAnalysis = stockAnalysisService.analyzeSentiment(news);
    
    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        sentiment: sentimentAnalysis,
        newsCount: news?.articles?.length || 0,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in stock sentiment API for ${req.params.symbol}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for stock analysis service
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test with a popular stock
    await stockAnalysisService.getStockData('AAPL');
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      service: 'Stock Analysis Service',
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Stock analysis service health check failed:', error.message);
    res.status(503).json({
      success: false,
      service: 'Stock Analysis Service',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to get company names
function getCompanyName(symbol) {
  const companyMap = {
    'AAPL': 'Apple Inc.',
    'GOOGL': 'Alphabet Inc.',
    'MSFT': 'Microsoft Corporation',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'NFLX': 'Netflix Inc.'
  };
  return companyMap[symbol] || 'Unknown Company';
}

export default router;
