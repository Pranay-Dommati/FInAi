import axios from 'axios';
import logger from '../utils/logger.js';

class StockDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Main method with fallback support
  async getStockData(symbol) {
    try {
      logger.info(`Fetching stock data for ${symbol} with fallback support`);
      
      // Try Yahoo Finance first (most reliable free API)
      let stockData = await this.getYahooFinanceData(symbol);
      
      if (!stockData) {
        logger.info(`Yahoo Finance failed for ${symbol}, trying Alpha Vantage`);
        stockData = await this.getAlphaVantageQuote(symbol);
      }
      
      if (!stockData) {
        logger.info(`Alpha Vantage failed for ${symbol}, trying Financial Modeling Prep`);
        stockData = await this.getFinancialModelingPrepData(symbol);
      }
      
      if (!stockData) {
        logger.warn(`All APIs failed for ${symbol}`);
        return {
          error: true,
          symbol: symbol.toUpperCase(),
          message: `Stock data for ${symbol.toUpperCase()} is currently unavailable. All financial data providers (Yahoo Finance, Alpha Vantage, Financial Modeling Prep) are not responding. Please try again later or check if the symbol is correct.`,
          details: 'We attempted to fetch data from multiple reliable financial data sources but none are currently accessible.',
          suggestedActions: [
            'Verify the stock symbol is correct',
            'Try again in a few minutes',
            'Check if the market is currently open',
            'Contact support if the issue persists'
          ],
          timestamp: new Date().toISOString()
        };
      }
      
      return stockData;
    } catch (error) {
      logger.error(`Error in getStockData for ${symbol}:`, error.message);
      return {
        error: true,
        symbol: symbol.toUpperCase(),
        message: `Unable to retrieve stock data for ${symbol.toUpperCase()} due to a system error.`,
        details: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Yahoo Finance implementation
  async getYahooFinanceData(symbol) {
    try {
      logger.info(`Fetching Yahoo Finance data for ${symbol}`);
      
      const cacheKey = `yahoo_${symbol}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        logger.info(`Returning cached Yahoo data for ${symbol}`);
        return cached.data;
      }

      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const result = response.data.chart.result[0];
      if (!result) {
        return null;
      }

      const meta = result.meta;
      const quote = result.indicators.quote[0];
      
      const stockData = {
        symbol: meta.symbol,
        name: meta.longName || meta.shortName || symbol,
        currency: meta.currency || 'USD',
        exchangeName: meta.exchangeName || meta.fullExchangeName,
        instrumentType: meta.instrumentType,
        currentPrice: meta.regularMarketPrice || meta.previousClose,
        previousClose: meta.previousClose,
        change: (meta.regularMarketPrice || meta.previousClose) - meta.previousClose,
        changePercent: (((meta.regularMarketPrice || meta.previousClose) - meta.previousClose) / meta.previousClose) * 100,
        volume: meta.regularMarketVolume,
        marketCap: meta.marketCap,
        marketState: meta.marketState,
        dayRange: {
          low: meta.regularMarketDayLow,
          high: meta.regularMarketDayHigh
        },
        fiftyTwoWeekRange: {
          low: meta.fiftyTwoWeekLow,
          high: meta.fiftyTwoWeekHigh
        },
        timestamp: new Date(meta.regularMarketTime * 1000),
        priceData: {
          open: quote?.open,
          high: quote?.high,
          low: quote?.low,
          close: quote?.close,
          volume: quote?.volume
        },
        source: 'Yahoo Finance'
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: stockData,
        timestamp: Date.now()
      });

      logger.info(`Yahoo Finance data fetched successfully for ${symbol}`);
      return stockData;
    } catch (error) {
      logger.error(`Error fetching Yahoo Finance data for ${symbol}:`, error.message);
      return null;
    }
  }

  // Financial Modeling Prep fallback
  async getFinancialModelingPrepData(symbol) {
    try {
      logger.info(`Fetching Financial Modeling Prep data for ${symbol}`);
      
      const cacheKey = `fmp_${symbol}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return cached.data;
      }

      // Using demo API key for Financial Modeling Prep
      const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=demo`;
      const response = await axios.get(url, { timeout: 10000 });

      const data = response.data[0];
      if (!data) {
        return null;
      }

      const stockData = {
        symbol: data.symbol,
        name: data.name || symbol,
        currentPrice: data.price,
        previousClose: data.previousClose,
        change: data.change,
        changePercent: data.changesPercentage,
        currency: 'USD',
        exchangeName: data.exchange,
        volume: data.volume,
        dayRange: {
          low: data.dayLow,
          high: data.dayHigh
        },
        fiftyTwoWeekRange: {
          low: data.yearLow,
          high: data.yearHigh
        },
        marketCap: data.marketCap,
        timestamp: new Date(),
        source: 'Financial Modeling Prep'
      };

      this.cache.set(cacheKey, {
        data: stockData,
        timestamp: Date.now()
      });

      logger.info(`Financial Modeling Prep data retrieved for ${symbol}`);
      return stockData;
    } catch (error) {
      logger.error(`Error fetching Financial Modeling Prep data for ${symbol}:`, error.message);
      return null;
    }
  }

  // Mock data as final fallback
  getMockStockData(symbol) {
    logger.info(`Generating mock data for ${symbol}`);
    
    const basePrice = 100 + Math.random() * 400; // Random price between 100-500
    const change = (Math.random() - 0.5) * 20; // Random change between -10 to +10
    const changePercent = (change / basePrice) * 100;
    
    return {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Inc.`,
      currentPrice: Number(basePrice.toFixed(2)),
      previousClose: Number((basePrice - change).toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      currency: 'USD',
      exchangeName: 'NASDAQ',
      marketState: 'REGULAR',
      volume: Math.floor(Math.random() * 10000000),
      dayRange: {
        low: Number((basePrice * 0.95).toFixed(2)),
        high: Number((basePrice * 1.05).toFixed(2))
      },
      fiftyTwoWeekRange: {
        low: Number((basePrice * 0.7).toFixed(2)),
        high: Number((basePrice * 1.3).toFixed(2))
      },
      marketCap: Math.floor(Math.random() * 1000000000000),
      timestamp: new Date(),
      source: 'Mock Data (Demo)'
    };
  }

  // NSE India API for Indian stocks
  async getIndianStockData(symbol) {
    try {
      logger.info(`Fetching Indian stock data for ${symbol}`);
      
      const cacheKey = `indian_stock_${symbol}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        logger.info(`Returning cached Indian stock data for ${symbol}`);
        return cached.data;
      }

      // Alternative free API for Indian stocks
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS`; // .NS for NSE
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const result = response.data.chart.result[0];
      const meta = result.meta;
      
      const stockData = {
        symbol: meta.symbol,
        currency: meta.currency || 'INR',
        exchangeName: 'NSE',
        currentPrice: meta.regularMarketPrice,
        previousClose: meta.previousClose,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        volume: meta.regularMarketVolume,
        timestamp: new Date(meta.regularMarketTime * 1000),
        marketStatus: meta.marketState
      };

      this.cache.set(cacheKey, {
        data: stockData,
        timestamp: Date.now()
      });

      logger.info(`Indian stock data fetched successfully for ${symbol}:`, {
        price: stockData.currentPrice,
        change: stockData.change.toFixed(2),
        changePercent: stockData.changePercent.toFixed(2)
      });

      return stockData;
    } catch (error) {
      logger.error(`Error fetching Indian stock data for ${symbol}:`, error.message);
      throw new Error(`Failed to fetch Indian stock data: ${error.message}`);
    }
  }

  // Get top Indian stocks
  async getTopIndianStocks() {
    try {
      logger.info('Fetching top Indian stocks data');
      
      const topStocks = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'KOTAKBANK', 'BHARTIARTL', 'ITC', 'SBIN'];
      const promises = topStocks.map(symbol => this.getIndianStockData(symbol));
      
      const results = await Promise.allSettled(promises);
      const successfulResults = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      logger.info(`Fetched data for ${successfulResults.length} top Indian stocks`);
      return successfulResults;
    } catch (error) {
      logger.error('Error fetching top Indian stocks:', error.message);
      throw new Error(`Failed to fetch top Indian stocks: ${error.message}`);
    }
  }

  // Search for stocks by symbol or company name
  async searchStocks(query) {
    try {
      logger.info(`Searching for stocks with query: ${query}`);
      
      // Yahoo Finance search endpoint
      const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      if (!response.data || !response.data.quotes) {
        logger.warn(`No search results found for: ${query}`);
        return [];
      }

      const quotes = response.data.quotes;
      
      // Filter and format the results
      const formattedResults = quotes
        .filter(quote => quote.symbol && quote.shortname) // Only include valid stocks
        .slice(0, 10) // Limit to 10 results
        .map(quote => {
          // Determine exchange for TradingView
          let exchange = 'NASDAQ';
          
          // Check symbol suffix for Indian exchanges
          if (quote.symbol.endsWith('.NS')) {
            exchange = 'NSE';
          } else if (quote.symbol.endsWith('.BO')) {
            exchange = 'BSE';
          } else if (quote.exchange) {
            // Check exchange field
            const exchangeName = quote.exchange.toUpperCase();
            if (exchangeName.includes('NSE') || exchangeName.includes('NATIONAL STOCK EXCHANGE')) {
              exchange = 'NSE';
            } else if (exchangeName.includes('BSE') || exchangeName.includes('BOMBAY STOCK EXCHANGE')) {
              exchange = 'BSE';
            } else if (exchangeName.includes('NYSE') || exchangeName.includes('NEW YORK STOCK EXCHANGE')) {
              exchange = 'NYSE';
            } else if (exchangeName.includes('NASDAQ')) {
              exchange = 'NASDAQ';
            }
          }
          
          // Generate logo URL
          const logoUrl = this.generateLogoUrl(quote.symbol, quote.shortname);
          
          return {
            symbol: quote.symbol,
            name: quote.shortname || quote.longname || `${quote.symbol} Inc.`,
            sector: quote.sector || 'Unknown',
            exchange: exchange,
            logo: logoUrl,
            marketType: quote.quoteType || 'EQUITY'
          };
        });

      logger.info(`Found ${formattedResults.length} search results for: ${query}`);
      return formattedResults;
      
    } catch (error) {
      logger.error(`Error searching stocks for query "${query}":`, error.message);
      
      // Fallback to popular stocks if search fails
      const popularStocks = [
        // US Stocks
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', logo: 'https://logo.clearbit.com/apple.com', exchange: 'NASDAQ' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', logo: 'https://logo.clearbit.com/microsoft.com', exchange: 'NASDAQ' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', logo: 'https://logo.clearbit.com/google.com', exchange: 'NASDAQ' },
        { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', logo: 'https://logo.clearbit.com/tesla.com', exchange: 'NASDAQ' },
        
        // Indian Stocks
        { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', sector: 'Energy', logo: 'https://logo.clearbit.com/ril.com', exchange: 'NSE' },
        { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', sector: 'Technology', logo: 'https://logo.clearbit.com/tcs.com', exchange: 'NSE' },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', sector: 'Financial Services', logo: 'https://logo.clearbit.com/hdfcbank.com', exchange: 'NSE' },
        { symbol: 'INFY', name: 'Infosys Ltd.', sector: 'Technology', logo: 'https://logo.clearbit.com/infosys.com', exchange: 'NSE' }
      ];
      
      const searchTerm = query.toLowerCase();
      return popularStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm) ||
        stock.name.toLowerCase().includes(searchTerm) ||
        stock.sector.toLowerCase().includes(searchTerm)
      );
    }
  }

  // Generate logo URL for a stock
  generateLogoUrl(symbol, companyName) {
    try {
      // Try to guess the company domain for Clearbit
      const cleanName = companyName.toLowerCase()
        .replace(/\binc\.?|\bltd\.?|\bcorp\.?|\bco\.?|\bllc|\bplc/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
      
      // Special cases for known companies
      const specialCases = {
        'aapl': 'apple.com',
        'msft': 'microsoft.com',
        'googl': 'google.com',
        'amzn': 'amazon.com',
        'tsla': 'tesla.com',
        'meta': 'meta.com',
        'nvda': 'nvidia.com',
        'reliance': 'ril.com',
        'tcs': 'tcs.com',
        'hdfcbank': 'hdfcbank.com',
        'infy': 'infosys.com'
      };
      
      const domain = specialCases[symbol.toLowerCase()] || specialCases[cleanName] || `${cleanName}.com`;
      return `https://logo.clearbit.com/${domain}`;
      
    } catch (error) {
      // Fallback to placeholder
      return `https://via.placeholder.com/32x32/6366f1/ffffff?text=${symbol.charAt(0).toUpperCase()}`;
    }
  }

  // Alpha Vantage API integration for comprehensive stock data
  async getAlphaVantageQuote(symbol) {
    try {
      logger.info(`Fetching Alpha Vantage quote for ${symbol}`);
      
      const cacheKey = `av_quote_${symbol}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        logger.info(`Returning cached Alpha Vantage data for ${symbol}`);
        return cached.data;
      }

      const url = 'https://www.alphavantage.co/query';
      const response = await axios.get(url, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: process.env.ALPHA_VANTAGE_API_KEY
        },
        timeout: 10000
      });

      const quote = response.data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        logger.warn(`No Alpha Vantage data found for ${symbol}`);
        return null;
      }

      const stockData = {
        symbol: quote['01. symbol'],
        name: symbol.toUpperCase(),
        currentPrice: parseFloat(quote['05. price']),
        previousClose: parseFloat(quote['08. previous close']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        dayRange: {
          low: parseFloat(quote['04. low']),
          high: parseFloat(quote['03. high'])
        },
        open: parseFloat(quote['02. open']),
        currency: 'USD',
        exchangeName: 'Unknown',
        timestamp: new Date(quote['07. latest trading day']),
        source: 'Alpha Vantage'
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: stockData,
        timestamp: Date.now()
      });

      logger.info(`Alpha Vantage quote data retrieved for ${symbol}:`, {
        price: stockData.currentPrice,
        change: stockData.change.toFixed(2),
        changePercent: stockData.changePercent.toFixed(2)
      });

      return stockData;
    } catch (error) {
      logger.error(`Error fetching Alpha Vantage quote for ${symbol}:`, error.message);
      return null;
    }
  }

  // Alpha Vantage Company Overview
  async getAlphaVantageCompanyOverview(symbol) {
    try {
      logger.info(`Fetching Alpha Vantage company overview for ${symbol}`);
      
      const cacheKey = `av_overview_${symbol}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < (60 * 60 * 1000)) { // Cache for 1 hour
        logger.info(`Returning cached Alpha Vantage overview for ${symbol}`);
        return cached.data;
      }

      const url = 'https://www.alphavantage.co/query';
      const response = await axios.get(url, {
        params: {
          function: 'OVERVIEW',
          symbol: symbol,
          apikey: process.env.ALPHA_VANTAGE_API_KEY
        },
        timeout: 15000
      });

      const overview = response.data;
      if (!overview || Object.keys(overview).length === 0 || overview.Note) {
        logger.warn(`No Alpha Vantage overview found for ${symbol}`);
        return { success: false, data: null };
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: { success: true, data: overview },
        timestamp: Date.now()
      });

      logger.info(`Alpha Vantage overview retrieved for ${symbol}`);
      return { success: true, data: overview };
    } catch (error) {
      logger.error(`Error fetching Alpha Vantage overview for ${symbol}:`, error.message);
      return { success: false, data: null };
    }
  }

  // Alpha Vantage Technical Indicators
  async getAlphaVantageTechnicalIndicator(symbol, indicator) {
    try {
      logger.info(`Fetching Alpha Vantage ${indicator} for ${symbol}`);
      
      const cacheKey = `av_${indicator.toLowerCase()}_${symbol}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < (30 * 60 * 1000)) { // Cache for 30 minutes
        logger.info(`Returning cached Alpha Vantage ${indicator} for ${symbol}`);
        return cached.data;
      }

      // Check if API key is available
      if (!process.env.ALPHA_VANTAGE_API_KEY) {
        logger.warn(`Alpha Vantage API key not found for ${indicator} indicator`);
        return { success: false, data: null, error: 'API key not configured' };
      }

      let functionName = '';
      let params = {
        symbol: symbol,
        apikey: process.env.ALPHA_VANTAGE_API_KEY
      };

      // Set function name and specific parameters based on indicator
      switch (indicator.toUpperCase()) {
        case 'RSI':
          functionName = 'RSI';
          params.interval = 'daily';
          params.time_period = 14;
          params.series_type = 'close';
          break;
        case 'MACD':
          functionName = 'MACD';
          params.interval = 'daily';
          params.series_type = 'close';
          break;
        case 'SMA':
          functionName = 'SMA';
          params.interval = 'daily';
          params.time_period = 20;
          params.series_type = 'close';
          break;
        default:
          logger.warn(`Unsupported technical indicator: ${indicator}`);
          return { success: false, data: null, error: 'Unsupported indicator' };
      }

      params.function = functionName;

      const url = 'https://www.alphavantage.co/query';
      const response = await axios.get(url, {
        params: params,
        timeout: 15000
      });

      const data = response.data;
      
      // Check for API errors
      if (data.Note || data['Error Message'] || !data[`Technical Analysis: ${functionName}`]) {
        logger.warn(`No Alpha Vantage ${indicator} data found for ${symbol}:`, data.Note || data['Error Message'] || 'No data available');
        return { success: false, data: null, error: data.Note || data['Error Message'] || 'No data available' };
      }

      const technicalData = data[`Technical Analysis: ${functionName}`];
      const result = { success: true, data: technicalData, indicator: indicator };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      logger.info(`Alpha Vantage ${indicator} retrieved for ${symbol}`);
      return result;
    } catch (error) {
      logger.error(`Error fetching Alpha Vantage ${indicator} for ${symbol}:`, error.message);
      return { success: false, data: null, error: error.message };
    }
  }
}

export default new StockDataService();
