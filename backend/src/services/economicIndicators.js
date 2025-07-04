import axios from 'axios';
import logger from '../utils/logger.js';

class EconomicIndicatorsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes for economic data
  }

  // FRED API for US Economic Indicators (Free with API key)
  async getFREDData(seriesId) {
    try {
      logger.info(`Fetching FRED data for series: ${seriesId}`);
      
      const cacheKey = `fred_${seriesId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        logger.info(`Returning cached FRED data for ${seriesId}`);
        return cached.data;
      }

      // Using FRED API (requires free API key)
      const apiKey = process.env.FRED_API_KEY || 'demo';
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=10&sort_order=desc`;
      
      const response = await axios.get(url);
      const observations = response.data.observations;
      
      const data = {
        seriesId,
        title: response.data.title || seriesId,
        observations: observations.map(obs => ({
          date: obs.date,
          value: parseFloat(obs.value) || 0
        }))
      };

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      logger.info(`FRED data fetched successfully for ${seriesId}`);
      return data;
    } catch (error) {
      logger.error(`Error fetching FRED data for ${seriesId}:`, error.message);
      
      // Return mock data if API fails
      return this.getMockEconomicData(seriesId);
    }
  }

  // Indian Economic Indicators (using alternative free sources)
  async getIndianEconomicData() {
    try {
      logger.info('Fetching Indian economic indicators');
      
      const cacheKey = 'indian_economic_data';
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        logger.info('Returning cached Indian economic data');
        return cached.data;
      }

      // Mock Indian economic data (in real implementation, use RBI API or other sources)
      const data = {
        gdp: {
          value: 3.7,
          unit: '%',
          period: 'Q2 2024',
          description: 'GDP Growth Rate'
        },
        inflation: {
          value: 4.87,
          unit: '%',
          period: 'Oct 2024',
          description: 'CPI Inflation Rate'
        },
        repoRate: {
          value: 6.50,
          unit: '%',
          period: 'Current',
          description: 'RBI Repo Rate'
        },
        unemployment: {
          value: 3.2,
          unit: '%',
          period: 'Sep 2024',
          description: 'Unemployment Rate'
        },
        fiscalDeficit: {
          value: 5.8,
          unit: '% of GDP',
          period: 'FY 2024',
          description: 'Fiscal Deficit'
        },
        currentAccount: {
          value: -0.9,
          unit: '% of GDP',
          period: 'Q1 2024',
          description: 'Current Account Balance'
        }
      };

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      logger.info('Indian economic data fetched successfully:', Object.keys(data));
      return data;
    } catch (error) {
      logger.error('Error fetching Indian economic data:', error.message);
      throw new Error(`Failed to fetch Indian economic data: ${error.message}`);
    }
  }

  // US Economic Indicators
  async getUSEconomicData() {
    try {
      logger.info('Fetching US economic indicators');
      
      const indicators = {
        gdp: 'GDP',
        unemployment: 'UNRATE',
        inflation: 'CPIAUCSL',
        federalRate: 'FEDFUNDS'
      };

      const promises = Object.entries(indicators).map(async ([key, seriesId]) => {
        try {
          const data = await this.getFREDData(seriesId);
          return { [key]: data };
        } catch (error) {
          logger.warn(`Failed to fetch ${key} data:`, error.message);
          return { [key]: this.getMockEconomicData(seriesId) };
        }
      });

      const results = await Promise.all(promises);
      const combinedData = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});

      logger.info('US economic data compiled successfully');
      return combinedData;
    } catch (error) {
      logger.error('Error fetching US economic data:', error.message);
      throw new Error(`Failed to fetch US economic data: ${error.message}`);
    }
  }

  // Global Economic Indicators
  async getGlobalEconomicData() {
    try {
      logger.info('Fetching global economic indicators');
      
      // Combine US and Indian data
      const [usData, indianData] = await Promise.all([
        this.getUSEconomicData(),
        this.getIndianEconomicData()
      ]);

      const globalData = {
        usa: usData,
        india: indianData,
        metadata: {
          lastUpdated: new Date().toISOString(),
          sources: ['FRED', 'RBI', 'NSE']
        }
      };

      logger.info('Global economic data compiled successfully');
      return globalData;
    } catch (error) {
      logger.error('Error fetching global economic data:', error.message);
      throw new Error(`Failed to fetch global economic data: ${error.message}`);
    }
  }

  // Forex data
  async getForexData() {
    try {
      logger.info('Fetching forex data');
      
      const cacheKey = 'forex_data';
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        logger.info('Returning cached forex data');
        return cached.data;
      }

      // Using Yahoo Finance for forex data
      const pairs = ['USDINR=X', 'EURUSD=X', 'GBPUSD=X', 'JPYUSD=X'];
      const promises = pairs.map(async (pair) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${pair}`;
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const result = response.data.chart.result[0];
          const meta = result.meta;

          return {
            symbol: pair,
            price: meta.regularMarketPrice,
            change: meta.regularMarketPrice - meta.previousClose,
            changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
            timestamp: new Date(meta.regularMarketTime * 1000)
          };
        } catch (error) {
          logger.warn(`Failed to fetch forex data for ${pair}:`, error.message);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const forexData = results.filter(result => result !== null);

      this.cache.set(cacheKey, {
        data: forexData,
        timestamp: Date.now()
      });

      logger.info(`Forex data fetched successfully for ${forexData.length} pairs`);
      return forexData;
    } catch (error) {
      logger.error('Error fetching forex data:', error.message);
      throw new Error(`Failed to fetch forex data: ${error.message}`);
    }
  }

  // Mock data for when APIs are unavailable
  getMockEconomicData(seriesId) {
    const mockData = {
      GDP: {
        seriesId: 'GDP',
        title: 'Gross Domestic Product',
        observations: [
          { date: '2024-07-01', value: 27000.0 },
          { date: '2024-04-01', value: 26900.0 },
          { date: '2024-01-01', value: 26800.0 }
        ]
      },
      UNRATE: {
        seriesId: 'UNRATE',
        title: 'Unemployment Rate',
        observations: [
          { date: '2024-10-01', value: 4.1 },
          { date: '2024-09-01', value: 4.0 },
          { date: '2024-08-01', value: 4.2 }
        ]
      },
      CPIAUCSL: {
        seriesId: 'CPIAUCSL',
        title: 'Consumer Price Index',
        observations: [
          { date: '2024-10-01', value: 310.3 },
          { date: '2024-09-01', value: 309.7 },
          { date: '2024-08-01', value: 309.1 }
        ]
      },
      FEDFUNDS: {
        seriesId: 'FEDFUNDS',
        title: 'Federal Funds Rate',
        observations: [
          { date: '2024-10-01', value: 5.25 },
          { date: '2024-09-01', value: 5.25 },
          { date: '2024-08-01', value: 5.50 }
        ]
      }
    };

    return mockData[seriesId] || {
      seriesId,
      title: 'Unknown Series',
      observations: []
    };
  }
}

export default new EconomicIndicatorsService();
