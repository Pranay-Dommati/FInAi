import logger from '../utils/logger.js';

class MockPlaidService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    
    logger.info('Mock Plaid Service initialized - for demonstration purposes');
  }

  // Create a mock link token for Plaid Link initialization
  async createLinkToken(userId, clientName = 'Financial Research AI') {
    try {
      logger.info(`Creating mock link token for user: ${userId}`);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const mockLinkToken = `link-sandbox-${userId}-${Date.now()}`;
      const expiration = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now

      const result = {
        linkToken: mockLinkToken,
        expiration: expiration.toISOString(),
        requestId: `req-${Date.now()}`,
      };

      logger.info(`Mock link token created successfully for user: ${userId}`);
      return result;
    } catch (error) {
      logger.error(`Error creating mock link token for user ${userId}:`, error.message);
      throw new Error(`Failed to create link token: ${error.message}`);
    }
  }

  // Mock exchange public token for access token
  async exchangePublicToken(publicToken, userId) {
    try {
      logger.info(`Exchanging mock public token for user: ${userId}`);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = {
        accessToken: `access-sandbox-${userId}-${Date.now()}`,
        itemId: `item-${userId}-${Date.now()}`,
        requestId: `req-${Date.now()}`,
      };

      logger.info(`Mock public token exchanged successfully for user: ${userId}`);
      return result;
    } catch (error) {
      logger.error(`Error exchanging mock public token for user ${userId}:`, error.message);
      throw new Error(`Failed to exchange public token: ${error.message}`);
    }
  }

  // Get mock accounts for a user
  async getAccounts(accessToken) {
    try {
      logger.info('Fetching mock accounts from Plaid');

      const cacheKey = `accounts_${accessToken}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        logger.info('Returning cached mock accounts data');
        return cached.data;
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 200));

      const accounts = [
        {
          accountId: 'mock_checking_001',
          name: 'Primary Checking',
          officialName: 'Chase Total Checking®',
          type: 'depository',
          subtype: 'checking',
          mask: '0000',
          balances: {
            available: 1250.75,
            current: 1250.75,
            limit: null,
            isoCurrencyCode: 'USD',
          },
        },
        {
          accountId: 'mock_savings_001',
          name: 'Savings Account',
          officialName: 'Chase Savings℠',
          type: 'depository',
          subtype: 'savings',
          mask: '1111',
          balances: {
            available: 8420.50,
            current: 8420.50,
            limit: null,
            isoCurrencyCode: 'USD',
          },
        },
        {
          accountId: 'mock_credit_001',
          name: 'Freedom Unlimited®',
          officialName: 'Chase Freedom Unlimited®',
          type: 'credit',
          subtype: 'credit_card',
          mask: '2222',
          balances: {
            available: 4750.25,
            current: -1249.75,
            limit: 6000.00,
            isoCurrencyCode: 'USD',
          },
        }
      ];

      const result = {
        accounts,
        totalAccounts: accounts.length,
        lastUpdated: new Date().toISOString(),
        note: 'This is mock data for demonstration purposes'
      };

      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      logger.info(`Retrieved ${accounts.length} mock accounts from Plaid`);
      return result;
    } catch (error) {
      logger.error('Error fetching mock accounts from Plaid:', error.message);
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }
  }

  // Get mock transactions for a user
  async getTransactions(accessToken, startDate, endDate, accountIds = null, count = 100, offset = 0) {
    try {
      logger.info(`Fetching mock transactions from ${startDate} to ${endDate}`);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const mockTransactions = [
        {
          transactionId: 'mock_txn_001',
          accountId: 'mock_checking_001',
          amount: -4.50,
          isoCurrencyCode: 'USD',
          date: '2025-07-03',
          datetime: '2025-07-03T10:30:00Z',
          name: 'Starbucks',
          merchantName: 'Starbucks',
          paymentChannel: 'in_store',
          category: ['Food and Drink', 'Restaurants', 'Coffee Shop'],
          categoryId: '13005043',
          location: {
            address: '123 Main St',
            city: 'Seattle',
            region: 'WA',
            postal_code: '98101',
            country: 'US'
          },
          accountOwner: null,
        },
        {
          transactionId: 'mock_txn_002',
          accountId: 'mock_checking_001',
          amount: -85.20,
          isoCurrencyCode: 'USD',
          date: '2025-07-02',
          datetime: '2025-07-02T14:15:00Z',
          name: 'Amazon.com',
          merchantName: 'Amazon',
          paymentChannel: 'online',
          category: ['Shops', 'Digital Purchase'],
          categoryId: '19019000',
          location: null,
          accountOwner: null,
        },
        {
          transactionId: 'mock_txn_003',
          accountId: 'mock_checking_001',
          amount: 2500.00,
          isoCurrencyCode: 'USD',
          date: '2025-07-01',
          datetime: '2025-07-01T09:00:00Z',
          name: 'ACME Corp Payroll',
          merchantName: null,
          paymentChannel: 'other',
          category: ['Deposit', 'Payroll'],
          categoryId: '21006000',
          location: null,
          accountOwner: null,
        }
      ];

      const result = {
        transactions: mockTransactions.slice(offset, offset + count),
        totalTransactions: mockTransactions.length,
        accounts: [
          {
            accountId: 'mock_checking_001',
            name: 'Primary Checking',
            type: 'depository',
            subtype: 'checking'
          }
        ],
        requestId: `req-${Date.now()}`,
        lastUpdated: new Date().toISOString(),
        note: 'This is mock data for demonstration purposes'
      };

      logger.info(`Retrieved ${result.transactions.length} mock transactions from Plaid`);
      return result;
    } catch (error) {
      logger.error('Error fetching mock transactions from Plaid:', error.message);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }

  // Generate spending insights from transactions
  generateSpendingInsights(transactions) {
    try {
      const categorySpending = {};
      const monthlySpending = {};
      let totalSpending = 0;

      transactions.forEach(transaction => {
        if (transaction.amount < 0) { // Only count expenses (negative amounts)
          const amount = Math.abs(transaction.amount);
          const category = transaction.category[0] || 'Other';
          const month = transaction.date.substring(0, 7); // YYYY-MM format

          // Category spending
          if (!categorySpending[category]) {
            categorySpending[category] = { amount: 0, count: 0 };
          }
          categorySpending[category].amount += amount;
          categorySpending[category].count += 1;

          // Monthly spending
          if (!monthlySpending[month]) {
            monthlySpending[month] = 0;
          }
          monthlySpending[month] += amount;

          totalSpending += amount;
        }
      });

      // Top spending categories
      const topCategories = Object.entries(categorySpending)
        .sort(([,a], [,b]) => b.amount - a.amount)
        .slice(0, 10)
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          count: data.count,
          percentage: totalSpending > 0 ? ((data.amount / totalSpending) * 100).toFixed(2) : '0.00',
        }));

      // Monthly trends
      const monthlyTrends = Object.entries(monthlySpending)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount }));

      return {
        totalSpending,
        averageTransaction: totalSpending > 0 ? totalSpending / transactions.filter(t => t.amount < 0).length : 0,
        totalTransactions: transactions.length,
        expenseTransactions: transactions.filter(t => t.amount < 0).length,
        topCategories,
        monthlyTrends,
        generatedAt: new Date().toISOString(),
        note: 'This analysis is based on mock data for demonstration purposes'
      };
    } catch (error) {
      logger.error('Error generating spending insights:', error.message);
      throw new Error(`Failed to generate spending insights: ${error.message}`);
    }
  }

  // Mock investment holdings
  async getInvestmentHoldings(accessToken) {
    try {
      logger.info('Fetching mock investment holdings from Plaid');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 250));

      const holdings = [
        {
          accountId: 'mock_investment_001',
          securityId: 'mock_security_001',
          institutionPrice: 150.25,
          institutionValue: 15025.00,
          costBasis: 14500.00,
          quantity: 100,
          isoCurrencyCode: 'USD',
        }
      ];

      const securities = [
        {
          securityId: 'mock_security_001',
          name: 'Apple Inc.',
          tickerSymbol: 'AAPL',
          type: 'equity',
          closePrice: 150.25,
          closePriceAsOf: '2025-07-03',
          isoCurrencyCode: 'USD',
        }
      ];

      const result = {
        holdings,
        securities,
        accounts: [
          {
            accountId: 'mock_investment_001',
            name: 'Investment Account',
            type: 'investment',
            subtype: 'brokerage'
          }
        ],
        totalHoldings: holdings.length,
        lastUpdated: new Date().toISOString(),
        note: 'This is mock data for demonstration purposes'
      };

      logger.info(`Retrieved ${holdings.length} mock investment holdings from Plaid`);
      return result;
    } catch (error) {
      logger.error('Error fetching mock investment holdings from Plaid:', error.message);
      throw new Error(`Failed to fetch investment holdings: ${error.message}`);
    }
  }

  // Mock identity information
  async getIdentity(accessToken) {
    try {
      logger.info('Fetching mock identity information from Plaid');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 150));

      const result = {
        identities: [
          {
            accountId: 'mock_checking_001',
            owners: [
              {
                names: ['John Doe', 'John A. Doe'],
                phoneNumbers: [
                  {
                    data: '+1-555-123-4567',
                    primary: true,
                    type: 'home'
                  }
                ],
                emails: [
                  {
                    data: 'john.doe@example.com',
                    primary: true,
                    type: 'primary'
                  }
                ],
                addresses: [
                  {
                    data: {
                      street: '123 Main St',
                      city: 'Seattle',
                      region: 'WA',
                      postal_code: '98101',
                      country: 'US'
                    },
                    primary: true
                  }
                ]
              }
            ]
          }
        ],
        requestId: `req-${Date.now()}`,
        lastUpdated: new Date().toISOString(),
        note: 'This is mock data for demonstration purposes'
      };

      logger.info('Retrieved mock identity information from Plaid');
      return result;
    } catch (error) {
      logger.error('Error fetching mock identity from Plaid:', error.message);
      throw new Error(`Failed to fetch identity: ${error.message}`);
    }
  }

  // Mock item information
  async getItem(accessToken) {
    try {
      logger.info('Fetching mock item information from Plaid');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = {
        itemId: `item-${Date.now()}`,
        institutionId: 'ins_mock_chase',
        webhook: null,
        error: null,
        availableProducts: ['transactions', 'accounts', 'identity'],
        billedProducts: ['transactions', 'accounts'],
        products: ['transactions', 'accounts'],
        consentExpirationTime: null,
        updateType: 'background',
        requestId: `req-${Date.now()}`,
        lastUpdated: new Date().toISOString(),
        note: 'This is mock data for demonstration purposes'
      };

      logger.info('Retrieved mock item information from Plaid');
      return result;
    } catch (error) {
      logger.error('Error fetching mock item from Plaid:', error.message);
      throw new Error(`Failed to fetch item: ${error.message}`);
    }
  }

  // Health check for mock Plaid service
  async healthCheck() {
    try {
      // Simulate health check
      await new Promise(resolve => setTimeout(resolve, 50));
      return { 
        status: 'healthy', 
        message: 'Mock Plaid service is running (for demonstration purposes)',
        environment: 'mock',
        realPlaidStatus: 'To use real Plaid, ensure your credentials are correct and the API is accessible'
      };
    } catch (error) {
      logger.error('Mock Plaid health check failed:', error.message);
      return { status: 'unhealthy', message: error.message };
    }
  }
}

export default new MockPlaidService();
