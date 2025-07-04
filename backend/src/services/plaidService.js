import { PlaidApi, Configuration, PlaidEnvironments } from 'plaid';
import logger from '../utils/logger.js';

class PlaidService {
  constructor() {
    // Plaid configuration - use correct API hosts
    const environments = {
      sandbox: PlaidEnvironments.sandbox,
      development: PlaidEnvironments.development,
      production: PlaidEnvironments.production
    };

    const configuration = new Configuration({
      basePath: environments[process.env.PLAID_ENV || 'sandbox'],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
          'Content-Type': 'application/json'
        },
      },
    });

    this.client = new PlaidApi(configuration);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // Create a link token for Plaid Link initialization
  async createLinkToken(userId, clientName = 'Financial Research AI') {
    try {
      logger.info(`Creating link token for user: ${userId}`);

      const request = {
        user: {
          client_user_id: userId,
        },
        client_name: clientName,
        products: ['transactions', 'accounts'], // Simplified products for sandbox
        country_codes: ['US'],
        language: 'en',
      };

      const response = await this.client.linkTokenCreate(request);
      
      logger.info(`Link token created successfully for user: ${userId}`);
      return {
        linkToken: response.data.link_token,
        expiration: response.data.expiration,
        requestId: response.data.request_id,
      };
    } catch (error) {
      logger.error(`Error creating link token for user ${userId}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorData: error.response?.data,
        message: error.message
      });
      const errorMessage = error.response?.data?.error_message || error.message;
      throw new Error(`Failed to create link token: ${errorMessage}`);
    }
  }

  // Exchange public token for access token
  async exchangePublicToken(publicToken, userId) {
    try {
      logger.info(`Exchanging public token for user: ${userId}`);

      const request = {
        public_token: publicToken,
      };

      const response = await this.client.linkPublicTokenExchange(request);
      
      const result = {
        accessToken: response.data.access_token,
        itemId: response.data.item_id,
        requestId: response.data.request_id,
      };

      logger.info(`Public token exchanged successfully for user: ${userId}`);
      return result;
    } catch (error) {
      logger.error(`Error exchanging public token for user ${userId}:`, error.message);
      throw new Error(`Failed to exchange public token: ${error.message}`);
    }
  }

  // Get accounts for a user
  async getAccounts(accessToken) {
    try {
      logger.info('Fetching accounts from Plaid');

      const cacheKey = `accounts_${accessToken}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        logger.info('Returning cached accounts data');
        return cached.data;
      }

      const request = {
        access_token: accessToken,
      };

      const response = await this.client.accountsGet(request);
      
      const accounts = response.data.accounts.map(account => ({
        accountId: account.account_id,
        name: account.name,
        officialName: account.official_name,
        type: account.type,
        subtype: account.subtype,
        mask: account.mask,
        balances: {
          available: account.balances.available,
          current: account.balances.current,
          limit: account.balances.limit,
          isoCurrencyCode: account.balances.iso_currency_code,
        },
      }));

      const result = {
        accounts,
        totalAccounts: accounts.length,
        lastUpdated: new Date().toISOString(),
      };

      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      logger.info(`Retrieved ${accounts.length} accounts from Plaid`);
      return result;
    } catch (error) {
      logger.error('Error fetching accounts from Plaid:', error.message);
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }
  }

  // Get transactions for a user
  async getTransactions(accessToken, startDate, endDate, accountIds = null, count = 100, offset = 0) {
    try {
      logger.info(`Fetching transactions from ${startDate} to ${endDate}`);

      const request = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        count: count,
        offset: offset,
      };

      if (accountIds && accountIds.length > 0) {
        request.account_ids = accountIds;
      }

      const response = await this.client.transactionsGet(request);
      
      const transactions = response.data.transactions.map(transaction => ({
        transactionId: transaction.transaction_id,
        accountId: transaction.account_id,
        amount: transaction.amount,
        isoCurrencyCode: transaction.iso_currency_code,
        date: transaction.date,
        datetime: transaction.datetime,
        name: transaction.name,
        merchantName: transaction.merchant_name,
        paymentChannel: transaction.payment_channel,
        category: transaction.category,
        categoryId: transaction.category_id,
        location: transaction.location,
        accountOwner: transaction.account_owner,
      }));

      const result = {
        transactions,
        totalTransactions: response.data.total_transactions,
        accounts: response.data.accounts,
        requestId: response.data.request_id,
        lastUpdated: new Date().toISOString(),
      };

      logger.info(`Retrieved ${transactions.length} transactions from Plaid`);
      return result;
    } catch (error) {
      logger.error('Error fetching transactions from Plaid:', error.message);
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }

  // Get investment holdings
  async getInvestmentHoldings(accessToken) {
    try {
      logger.info('Fetching investment holdings from Plaid');

      const cacheKey = `holdings_${accessToken}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        logger.info('Returning cached investment holdings data');
        return cached.data;
      }

      const request = {
        access_token: accessToken,
      };

      const response = await this.client.investmentsHoldingsGet(request);
      
      const holdings = response.data.holdings.map(holding => ({
        accountId: holding.account_id,
        securityId: holding.security_id,
        institutionPrice: holding.institution_price,
        institutionValue: holding.institution_value,
        costBasis: holding.cost_basis,
        quantity: holding.quantity,
        isoCurrencyCode: holding.iso_currency_code,
      }));

      const securities = response.data.securities.map(security => ({
        securityId: security.security_id,
        isin: security.isin,
        cusip: security.cusip,
        sedol: security.sedol,
        institutionSecurityId: security.institution_security_id,
        institutionId: security.institution_id,
        proxySecurityId: security.proxy_security_id,
        name: security.name,
        tickerSymbol: security.ticker_symbol,
        isoCurrencyCode: security.iso_currency_code,
        type: security.type,
        closePrice: security.close_price,
        closePriceAsOf: security.close_price_as_of,
      }));

      const result = {
        holdings,
        securities,
        accounts: response.data.accounts,
        totalHoldings: holdings.length,
        lastUpdated: new Date().toISOString(),
      };

      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      logger.info(`Retrieved ${holdings.length} investment holdings from Plaid`);
      return result;
    } catch (error) {
      logger.error('Error fetching investment holdings from Plaid:', error.message);
      throw new Error(`Failed to fetch investment holdings: ${error.message}`);
    }
  }

  // Get identity information
  async getIdentity(accessToken) {
    try {
      logger.info('Fetching identity information from Plaid');

      const request = {
        access_token: accessToken,
      };

      const response = await this.client.identityGet(request);
      
      const identities = response.data.accounts.map(account => ({
        accountId: account.account_id,
        owners: account.owners.map(owner => ({
          names: owner.names,
          phoneNumbers: owner.phone_numbers,
          emails: owner.emails,
          addresses: owner.addresses,
        })),
      }));

      const result = {
        identities,
        requestId: response.data.request_id,
        lastUpdated: new Date().toISOString(),
      };

      logger.info('Retrieved identity information from Plaid');
      return result;
    } catch (error) {
      logger.error('Error fetching identity from Plaid:', error.message);
      throw new Error(`Failed to fetch identity: ${error.message}`);
    }
  }

  // Get item information
  async getItem(accessToken) {
    try {
      logger.info('Fetching item information from Plaid');

      const request = {
        access_token: accessToken,
      };

      const response = await this.client.itemGet(request);
      
      const result = {
        itemId: response.data.item.item_id,
        institutionId: response.data.item.institution_id,
        webhook: response.data.item.webhook,
        error: response.data.item.error,
        availableProducts: response.data.item.available_products,
        billedProducts: response.data.item.billed_products,
        products: response.data.item.products,
        consentExpirationTime: response.data.item.consent_expiration_time,
        updateType: response.data.item.update_type,
        requestId: response.data.request_id,
        lastUpdated: new Date().toISOString(),
      };

      logger.info('Retrieved item information from Plaid');
      return result;
    } catch (error) {
      logger.error('Error fetching item from Plaid:', error.message);
      throw new Error(`Failed to fetch item: ${error.message}`);
    }
  }

  // Generate spending insights from transactions
  generateSpendingInsights(transactions) {
    try {
      const categorySpending = {};
      const monthlySpending = {};
      let totalSpending = 0;

      transactions.forEach(transaction => {
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
      });

      // Top spending categories
      const topCategories = Object.entries(categorySpending)
        .sort(([,a], [,b]) => b.amount - a.amount)
        .slice(0, 10)
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          count: data.count,
          percentage: ((data.amount / totalSpending) * 100).toFixed(2),
        }));

      // Monthly trends
      const monthlyTrends = Object.entries(monthlySpending)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount }));

      return {
        totalSpending,
        averageTransaction: totalSpending / transactions.length,
        totalTransactions: transactions.length,
        topCategories,
        monthlyTrends,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error generating spending insights:', error.message);
      throw new Error(`Failed to generate spending insights: ${error.message}`);
    }
  }

  // Health check for Plaid service
  async healthCheck() {
    try {
      // Create a test link token to verify API connectivity
      const testRequest = {
        user: { client_user_id: 'health_check_user' },
        client_name: 'Health Check',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
      };

      await this.client.linkTokenCreate(testRequest);
      return { status: 'healthy', message: 'Plaid API is accessible' };
    } catch (error) {
      logger.error('Plaid health check failed:', {
        status: error.response?.status,
        errorData: error.response?.data,
        message: error.message
      });
      const errorMessage = error.response?.data?.error_message || error.message;
      return { status: 'unhealthy', message: errorMessage };
    }
  }
}

export default new PlaidService();
