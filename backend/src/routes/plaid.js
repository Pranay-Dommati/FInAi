import express from 'express';
// import plaidService from '../services/plaidService.js'; // Real Plaid service
import plaidService from '../services/mockPlaidService.js'; // Mock service for demo
import logger from '../utils/logger.js';

const router = express.Router();

// Create link token for Plaid Link initialization
router.post('/link/token/create', async (req, res) => {
  try {
    const { userId, clientName } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`API request to create link token for user: ${userId}`);
    
    const linkTokenData = await plaidService.createLinkToken(userId, clientName);
    
    res.json({
      success: true,
      data: linkTokenData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in create link token API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Exchange public token for access token
router.post('/link/token/exchange', async (req, res) => {
  try {
    const { publicToken, userId } = req.body;
    
    if (!publicToken || !userId) {
      return res.status(400).json({
        success: false,
        error: 'publicToken and userId are required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`API request to exchange public token for user: ${userId}`);
    
    const accessTokenData = await plaidService.exchangePublicToken(publicToken, userId);
    
    res.json({
      success: true,
      data: accessTokenData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in exchange public token API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get accounts
router.post('/accounts', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'accessToken is required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('API request to get accounts');
    
    const accounts = await plaidService.getAccounts(accessToken);
    
    res.json({
      success: true,
      data: accounts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in get accounts API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get transactions
router.post('/transactions', async (req, res) => {
  try {
    const { accessToken, startDate, endDate, accountIds, count = 100, offset = 0 } = req.body;
    
    if (!accessToken || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'accessToken, startDate, and endDate are required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`API request to get transactions from ${startDate} to ${endDate}`);
    
    const transactions = await plaidService.getTransactions(
      accessToken, 
      startDate, 
      endDate, 
      accountIds, 
      parseInt(count), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: transactions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in get transactions API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get investment holdings
router.post('/investments/holdings', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'accessToken is required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('API request to get investment holdings');
    
    const holdings = await plaidService.getInvestmentHoldings(accessToken);
    
    res.json({
      success: true,
      data: holdings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in get investment holdings API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get identity information
router.post('/identity', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'accessToken is required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('API request to get identity information');
    
    const identity = await plaidService.getIdentity(accessToken);
    
    res.json({
      success: true,
      data: identity,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in get identity API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get item information
router.post('/item', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'accessToken is required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('API request to get item information');
    
    const item = await plaidService.getItem(accessToken);
    
    res.json({
      success: true,
      data: item,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in get item API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get spending insights
router.post('/insights/spending', async (req, res) => {
  try {
    const { accessToken, startDate, endDate, accountIds } = req.body;
    
    if (!accessToken || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'accessToken, startDate, and endDate are required',
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`API request to get spending insights from ${startDate} to ${endDate}`);
    
    // Get transactions first
    const transactionData = await plaidService.getTransactions(accessToken, startDate, endDate, accountIds, 500, 0);
    
    // Generate insights
    const insights = plaidService.generateSpendingInsights(transactionData.transactions);
    
    res.json({
      success: true,
      data: {
        ...insights,
        period: { startDate, endDate },
        accountsAnalyzed: transactionData.accounts.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in get spending insights API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get available Plaid products and features
router.get('/info/products', async (req, res) => {
  try {
    const products = {
      transactions: {
        name: 'Transactions',
        description: 'Access to bank transaction history',
        features: ['Transaction details', 'Categorization', 'Merchant information', 'Location data']
      },
      accounts: {
        name: 'Accounts',
        description: 'Bank account information and balances',
        features: ['Account details', 'Real-time balances', 'Account types', 'Routing numbers']
      },
      identity: {
        name: 'Identity',
        description: 'Account holder identity information',
        features: ['Names', 'Addresses', 'Phone numbers', 'Email addresses']
      },
      investments: {
        name: 'Investments',
        description: 'Investment account holdings and transactions',
        features: ['Holdings', 'Securities', 'Investment transactions', 'Performance data']
      },
      liabilities: {
        name: 'Liabilities',
        description: 'Loan and credit information',
        features: ['Loan balances', 'Payment history', 'Terms', 'Interest rates']
      }
    };

    res.json({
      success: true,
      data: {
        products,
        environment: process.env.PLAID_ENV || 'sandbox',
        supportedCountries: ['US', 'CA', 'GB', 'FR', 'ES', 'NL', 'IE'],
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in get products info API:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for Plaid service
router.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    const healthStatus = await plaidService.healthCheck();
    
    const responseTime = Date.now() - startTime;
    
    if (healthStatus.status === 'healthy') {
      res.json({
        success: true,
        service: 'Plaid Service',
        status: 'healthy',
        environment: process.env.PLAID_ENV || 'sandbox',
        responseTime: `${responseTime}ms`,
        message: healthStatus.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        service: 'Plaid Service',
        status: 'unhealthy',
        error: healthStatus.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Plaid service health check failed:', error.message);
    res.status(503).json({
      success: false,
      service: 'Plaid Service',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
