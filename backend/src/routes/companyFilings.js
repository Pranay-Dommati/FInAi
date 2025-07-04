import express from 'express';
import companyFilingsService from '../services/companyFilings.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get company filings by ticker
router.get('/company/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { limit = 10 } = req.query;
    
    logger.info(`API request for company filings: ${ticker}`);
    
    const filings = await companyFilingsService.getCompanyFilings(ticker, parseInt(limit));
    
    res.json({
      success: true,
      data: filings,
      ticker: ticker.toUpperCase(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in company filings API for ${req.params.ticker}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific filing types (10-K, 10-Q, 8-K, etc.)
router.get('/company/:ticker/form/:formType', async (req, res) => {
  try {
    const { ticker, formType } = req.params;
    const { limit = 5 } = req.query;
    
    logger.info(`API request for ${formType} filings: ${ticker}`);
    
    const filings = await companyFilingsService.getFilingsByType(ticker, formType, parseInt(limit));
    
    res.json({
      success: true,
      data: filings,
      ticker: ticker.toUpperCase(),
      formType: formType.toUpperCase(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in ${req.params.formType} filings API for ${req.params.ticker}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get company financial facts from XBRL filings
router.get('/company/:ticker/facts', async (req, res) => {
  try {
    const { ticker } = req.params;
    
    logger.info(`API request for company facts: ${ticker}`);
    
    const facts = await companyFilingsService.getCompanyFacts(ticker);
    
    res.json({
      success: true,
      data: facts,
      ticker: ticker.toUpperCase(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in company facts API for ${req.params.ticker}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get company CIK by ticker
router.get('/cik/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    
    logger.info(`API request for company CIK: ${ticker}`);
    
    const cikInfo = await companyFilingsService.getCompanyCIK(ticker);
    
    res.json({
      success: true,
      data: cikInfo,
      ticker: ticker.toUpperCase(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in company CIK API for ${req.params.ticker}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Search companies
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
    
    logger.info(`API request for company search: ${query}`);
    
    const searchResults = await companyFilingsService.searchCompanies(query);
    
    res.json({
      success: true,
      data: searchResults,
      query,
      count: searchResults.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in company search API for "${req.query.q}":`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get available filing forms information
router.get('/forms', async (req, res) => {
  try {
    logger.info('API request for filing forms information');
    
    const formsInfo = companyFilingsService.getFilingFormsInfo();
    
    res.json({
      success: true,
      data: formsInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in filing forms API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get latest 10-K filings across popular companies
router.get('/latest/10-k', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    logger.info('API request for latest 10-K filings');
    
    const popularCompanies = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
    const promises = popularCompanies.slice(0, parseInt(limit)).map(async (ticker) => {
      try {
        const filings = await companyFilingsService.getFilingsByType(ticker, '10-K', 1);
        return {
          ticker,
          company: filings.company.name,
          filing: filings.filings[0] || null
        };
      } catch (error) {
        logger.warn(`Failed to get 10-K for ${ticker}:`, error.message);
        return {
          ticker,
          company: null,
          filing: null,
          error: error.message
        };
      }
    });
    
    const results = await Promise.all(promises);
    
    res.json({
      success: true,
      data: results.filter(result => result.filing !== null),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in latest 10-K filings API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for company filings service
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test with Apple's CIK lookup
    await companyFilingsService.getCompanyCIK('AAPL');
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      service: 'Company Filings Service',
      status: 'healthy',
      dataSource: 'SEC EDGAR',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Company filings service health check failed:', error.message);
    res.status(503).json({
      success: false,
      service: 'Company Filings Service',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
