import axios from 'axios';
import logger from '../utils/logger.js';

class NewsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes for news
  }

  // Main news fetching method with robust fallback
  async getStockNews(symbol, limit = 20) {
    try {
      logger.info(`Fetching news for ${symbol} with fallback support`);
      
      // Try Alpha Vantage first
      let newsData = await this.getAlphaVantageNews(symbol);
      
      if (!newsData || !newsData.articles || newsData.articles.length === 0) {
        logger.info(`Alpha Vantage news failed for ${symbol}, trying FMP`);
        newsData = await this.getFMPNews(symbol);
      }
      
      if (!newsData || !newsData.articles || newsData.articles.length === 0) {
        logger.info(`FMP news failed for ${symbol}, no news data available`);
        return {
          error: true,
          symbol: symbol || 'general',
          message: 'News data is currently unavailable from all sources.',
          details: 'We attempted to fetch news from Alpha Vantage and Financial Modeling Prep, but both services are not responding or have no data available.',
          suggestedActions: [
            'Try again in a few minutes',
            'Check your internet connection',
            'Verify API quotas are not exceeded'
          ],
          timestamp: new Date().toISOString()
        };
      }
      
      // Limit results
      if (newsData.articles) {
        newsData.articles = newsData.articles.slice(0, limit);
      }
      
      return newsData;
    } catch (error) {
      logger.error(`Error in getStockNews for ${symbol}:`, error.message);
      return {
        error: true,
        symbol: symbol,
        message: 'News service is currently experiencing technical difficulties.',
        details: `System error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Alpha Vantage News API
  async getAlphaVantageNews(symbol = null) {
    try {
      logger.info(`Fetching Alpha Vantage news for ${symbol || 'general'}`);
      
      const url = 'https://www.alphavantage.co/query';
      const params = {
        function: 'NEWS_SENTIMENT',
        apikey: process.env.ALPHA_VANTAGE_API_KEY,
        limit: 50
      };

      if (symbol) {
        params.tickers = symbol;
      }

      const response = await axios.get(url, { 
        params,
        timeout: 10000 
      });

      if (response.data.feed && response.data.feed.length > 0) {
        const articles = response.data.feed.map(article => ({
          title: article.title,
          url: article.url,
          summary: article.summary,
          source: article.source,
          publishedAt: article.time_published,
          sentiment: this.analyzeSentimentScore(article.overall_sentiment_score),
          relevanceScore: article.relevance_score,
          tickerSentiment: article.ticker_sentiment || []
        }));

        logger.info(`Alpha Vantage news data retrieved for ${symbol || 'general'}: ${articles.length} articles`);
        return {
          success: true,
          articles: articles,
          totalResults: articles.length,
          source: 'Alpha Vantage'
        };
      }

      return null;
    } catch (error) {
      logger.error(`Error fetching Alpha Vantage news for ${symbol || 'general'}:`, error.message);
      return null;
    }
  }

  // Financial Modeling Prep News API
  async getFMPNews(symbol = null) {
    try {
      logger.info(`Fetching FMP news for ${symbol || 'general'}`);
      
      const url = symbol 
        ? `https://financialmodelingprep.com/api/v3/stock_news`
        : `https://financialmodelingprep.com/api/v4/general_news`;
      
      const params = {
        apikey: process.env.FMP_API_KEY,
        limit: 50
      };

      if (symbol) {
        params.tickers = symbol;
      }

      const response = await axios.get(url, { 
        params,
        timeout: 10000 
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const articles = response.data.map(article => ({
          title: article.title,
          url: article.url,
          summary: article.text ? article.text.substring(0, 200) + '...' : 'No summary available',
          source: article.site || 'FMP News',
          publishedAt: article.publishedDate,
          sentiment: 'neutral', // FMP doesn't provide sentiment
          relevanceScore: 0.8
        }));

        logger.info(`FMP news data retrieved for ${symbol || 'general'}: ${articles.length} articles`);
        return {
          success: true,
          articles: articles,
          totalResults: articles.length,
          source: 'Financial Modeling Prep'
        };
      }

      return null;
    } catch (error) {
      logger.error(`Error fetching FMP news for ${symbol || 'general'}:`, error.message);
      return null;
    }
  }

  // Mock news data as fallback
  getMockNews(symbol) {
    logger.info(`Generating mock news for ${symbol}`);
    
    const mockArticles = [
      {
        title: `${symbol} Stock Analysis: Market Outlook Remains Positive`,
        summary: `Recent analysis of ${symbol} shows strong fundamentals and positive market sentiment. Analysts are optimistic about future performance based on strong earnings and market position.`,
        source: 'Financial News Network',
        publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive',
        url: '#',
        relevanceScore: 0.9
      },
      {
        title: `${symbol} Quarterly Results Beat Expectations`,
        summary: `${symbol} reported stronger than expected quarterly earnings, driven by robust demand and operational improvements. Revenue growth exceeded analyst forecasts.`,
        source: 'Market Watch',
        publishedAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive',
        url: '#',
        relevanceScore: 0.8
      },
      {
        title: `Industry Analysis: ${symbol} Sector Shows Resilience`,
        summary: `The sector containing ${symbol} demonstrates strong resilience amid market volatility with positive growth indicators and strong fundamentals.`,
        source: 'Business Today',
        publishedAt: new Date(Date.now() - Math.random() * 72 * 60 * 60 * 1000).toISOString(),
        sentiment: 'neutral',
        url: '#',
        relevanceScore: 0.7
      },
      {
        title: `${symbol} Investment Strategy: Long-term Growth Potential`,
        summary: `Investment analysts highlight ${symbol}'s long-term growth potential, citing strong market position, innovation pipeline, and competitive advantages.`,
        source: 'Investment Daily',
        publishedAt: new Date(Date.now() - Math.random() * 96 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive',
        url: '#',
        relevanceScore: 0.8
      },
      {
        title: `${symbol} Market Performance Update`,
        summary: `Latest trading session shows ${symbol} maintaining strong performance with increased trading volume and positive investor sentiment across key metrics.`,
        source: 'Stock Market Today',
        publishedAt: new Date(Date.now() - Math.random() * 120 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive',
        url: '#',
        relevanceScore: 0.7
      }
    ];

    return {
      success: true,
      articles: mockArticles,
      totalResults: mockArticles.length,
      source: 'Mock News (Demo)'
    };
  }

  // Analyze sentiment score
  analyzeSentimentScore(score) {
    if (!score) return 'neutral';
    const numScore = parseFloat(score);
    if (numScore > 0.1) return 'positive';
    if (numScore < -0.1) return 'negative';
    return 'neutral';
  }

  // General financial news with fallback
  async getGeneralFinancialNews() {
    try {
      logger.info('Fetching general financial news');
      
      // Try Alpha Vantage general news first
      let newsData = await this.getAlphaVantageNews();
      
      if (!newsData || !newsData.articles || newsData.articles.length === 0) {
        logger.info('Alpha Vantage general news failed, trying FMP');
        newsData = await this.getFMPNews();
      }
      
      if (!newsData || !newsData.articles || newsData.articles.length === 0) {
        logger.info('FMP general news failed, no news data available');
        return {
          error: true,
          message: 'General financial news is currently unavailable.',
          details: 'All news data sources (Alpha Vantage, Financial Modeling Prep) are not responding or have no data available.',
          suggestedActions: [
            'Try again later',
            'Check API service status',
            'Verify internet connectivity'
          ],
          timestamp: new Date().toISOString()
        };
      }
      
      return newsData;
    } catch (error) {
      logger.error('Error in getGeneralFinancialNews:', error.message);
      return {
        error: true,
        message: 'General financial news service is experiencing technical difficulties.',
        details: `System error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Mock general financial news
  getMockGeneralNews() {
    logger.info('Generating mock general financial news');
    
    const mockArticles = [
      {
        title: 'Federal Reserve Signals Potential Rate Adjustments',
        summary: 'The Federal Reserve indicates possible monetary policy changes in response to current economic indicators and inflation trends.',
        source: 'Financial Times',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sentiment: 'neutral',
        url: '#',
        relevanceScore: 0.9
      },
      {
        title: 'Technology Sector Shows Strong Q4 Performance',
        summary: 'Major technology companies report robust quarterly earnings, driving market optimism and sector rotation into tech stocks.',
        source: 'Bloomberg',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive',
        url: '#',
        relevanceScore: 0.8
      },
      {
        title: 'Global Supply Chain Disruptions Impact Markets',
        summary: 'Ongoing supply chain challenges continue to affect various industries, creating volatility in commodity and manufacturing sectors.',
        source: 'Reuters',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        sentiment: 'negative',
        url: '#',
        relevanceScore: 0.7
      },
      {
        title: 'Cryptocurrency Market Experiences Volatility',
        summary: 'Digital assets show mixed performance as regulatory clarity and institutional adoption continue to influence market dynamics.',
        source: 'CoinDesk',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        sentiment: 'neutral',
        url: '#',
        relevanceScore: 0.6
      },
      {
        title: 'Energy Sector Gains Momentum on Oil Price Recovery',
        summary: 'Energy companies see increased investor interest as oil prices stabilize and demand outlook improves across global markets.',
        source: 'Energy News',
        publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive',
        url: '#',
        relevanceScore: 0.7
      }
    ];

    return {
      success: true,
      articles: mockArticles,
      totalResults: mockArticles.length,
      source: 'Mock General News (Demo)'
    };
  }

  // For backwards compatibility with existing routes
  async getIndianFinancialNews() {
    return this.getMockGeneralNews();
  }

  async getGlobalFinancialNews() {
    return this.getGeneralFinancialNews();
  }

  async getNewsByCategory(category) {
    return this.getGeneralFinancialNews();
  }

  async searchNews(query) {
    const news = await this.getGeneralFinancialNews();
    return news.articles.filter(article => 
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.summary.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getNewsSentiment() {
    const news = await this.getGeneralFinancialNews();
    
    const sentimentCounts = news.articles.reduce((acc, article) => {
      acc[article.sentiment] = (acc[article.sentiment] || 0) + 1;
      return acc;
    }, {});

    const totalArticles = news.articles.length;
    const sentimentPercentages = Object.entries(sentimentCounts).map(([sentiment, count]) => ({
      sentiment,
      count,
      percentage: ((count / totalArticles) * 100).toFixed(1)
    }));

    const overallSentiment = sentimentCounts.positive > sentimentCounts.negative 
      ? 'positive' 
      : sentimentCounts.negative > sentimentCounts.positive 
        ? 'negative' 
        : 'neutral';

    return {
      overall: overallSentiment,
      breakdown: sentimentPercentages,
      totalArticles,
      lastUpdated: new Date().toISOString(),
      categories: ['financial', 'general']
    };
  }
}

export default new NewsService();
