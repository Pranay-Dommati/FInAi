import cron from 'node-cron';
import stockDataService from './stockData.js';
import economicIndicatorsService from './economicIndicators.js';
import newsService from './news.js';
import logger from '../utils/logger.js';

// Schedule data refresh jobs
export function startDataRefreshJobs() {
  logger.info('🕒 Starting scheduled data refresh jobs');

  // Refresh stock data every 5 minutes during market hours
  cron.schedule('*/5 * * * *', async () => {
    try {
      logger.info('🔄 Running scheduled stock data refresh');
      
      // Refresh top Indian stocks
      await stockDataService.getTopIndianStocks();
      
      // Refresh some popular US stocks
      const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
      for (const symbol of popularStocks) {
        try {
          await stockDataService.getStockData(symbol);
        } catch (error) {
          logger.warn(`Failed to refresh ${symbol}:`, error.message);
        }
      }
      
      logger.info('✅ Stock data refresh completed');
    } catch (error) {
      logger.error('❌ Stock data refresh failed:', error.message);
    }
  });

  // Refresh economic indicators every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      logger.info('🔄 Running scheduled economic indicators refresh');
      
      await Promise.all([
        economicIndicatorsService.getIndianEconomicData(),
        economicIndicatorsService.getForexData(),
        economicIndicatorsService.getUSEconomicData()
      ]);
      
      logger.info('✅ Economic indicators refresh completed');
    } catch (error) {
      logger.error('❌ Economic indicators refresh failed:', error.message);
    }
  });

  // Refresh news every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      logger.info('🔄 Running scheduled news refresh');
      
      await Promise.all([
        newsService.getIndianFinancialNews(),
        newsService.getGlobalFinancialNews()
      ]);
      
      logger.info('✅ News refresh completed');
    } catch (error) {
      logger.error('❌ News refresh failed:', error.message);
    }
  });

  // Daily health check at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      logger.info('🏥 Running daily health check');
      
      const healthChecks = await Promise.allSettled([
        stockDataService.getStockData('AAPL'),
        economicIndicatorsService.getIndianEconomicData(),
        newsService.getIndianFinancialNews()
      ]);

      const results = healthChecks.map((check, index) => ({
        service: ['Stock Data', 'Economic Indicators', 'News'][index],
        status: check.status,
        error: check.status === 'rejected' ? check.reason?.message : null
      }));

      logger.info('🏥 Daily health check results:', results);
    } catch (error) {
      logger.error('❌ Daily health check failed:', error.message);
    }
  });

  // Log system statistics every hour
  cron.schedule('0 * * * *', () => {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    logger.info('📊 System Statistics:', {
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
      },
      nodeVersion: process.version,
      platform: process.platform
    });
  });

  logger.info('✅ All scheduled jobs initialized');
}

// Manual data refresh functions
export async function refreshAllData() {
  logger.info('🔄 Manual refresh of all data initiated');
  
  try {
    await Promise.all([
      stockDataService.getTopIndianStocks(),
      economicIndicatorsService.getGlobalEconomicData(),
      newsService.getIndianFinancialNews(),
      newsService.getGlobalFinancialNews()
    ]);
    
    logger.info('✅ Manual data refresh completed successfully');
    return { success: true, message: 'All data refreshed successfully' };
  } catch (error) {
    logger.error('❌ Manual data refresh failed:', error.message);
    throw new Error(`Data refresh failed: ${error.message}`);
  }
}

export async function refreshStockData() {
  logger.info('🔄 Manual stock data refresh initiated');
  
  try {
    await stockDataService.getTopIndianStocks();
    logger.info('✅ Stock data refresh completed successfully');
    return { success: true, message: 'Stock data refreshed successfully' };
  } catch (error) {
    logger.error('❌ Stock data refresh failed:', error.message);
    throw new Error(`Stock data refresh failed: ${error.message}`);
  }
}
