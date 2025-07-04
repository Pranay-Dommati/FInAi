import dotenv from 'dotenv';
import stockDataService from './src/services/stockData.js';
import logger from './src/utils/logger.js';

// Load environment variables
dotenv.config();

async function testAlphaVantageIntegration() {
  console.log('\n📈 Testing Alpha Vantage Integration...\n');
  console.log('API Key:', process.env.ALPHA_VANTAGE_API_KEY);

  const testSymbol = 'AAPL';

  try {
    // Test 1: Real-time Quote
    console.log('1. Testing Alpha Vantage Real-time Quote...');
    const quote = await stockDataService.getAlphaVantageQuote(testSymbol);
    console.log('Quote Data:', {
      symbol: quote.symbol,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      volume: quote.volume,
      lastTradingDay: quote.latestTradingDay
    });
    console.log('✅ Real-time quote retrieved successfully\n');

    // Test 2: Company Overview
    console.log('2. Testing Company Overview...');
    const overview = await stockDataService.getCompanyOverview(testSymbol);
    console.log('Company Overview:', {
      name: overview.name,
      sector: overview.sector,
      industry: overview.industry,
      marketCap: overview.marketCapitalization,
      peRatio: overview.peRatio,
      eps: overview.eps,
      dividendYield: overview.dividendYield
    });
    console.log('✅ Company overview retrieved successfully\n');

    // Test 3: Daily Historical Data
    console.log('3. Testing Daily Historical Data...');
    const dailyData = await stockDataService.getDailyData(testSymbol, 'compact');
    console.log('Daily Data:', {
      symbol: dailyData.symbol,
      totalDataPoints: dailyData.totalDataPoints,
      lastRefreshed: dailyData.lastRefreshed,
      latestPrice: dailyData.dataPoints[0]?.close,
      latestDate: dailyData.dataPoints[0]?.date
    });
    console.log('✅ Daily historical data retrieved successfully\n');

    // Test 4: Intraday Data
    console.log('4. Testing Intraday Data...');
    const intradayData = await stockDataService.getIntradayData(testSymbol, '5min');
    console.log('Intraday Data:', {
      symbol: intradayData.symbol,
      interval: intradayData.interval,
      totalDataPoints: intradayData.totalDataPoints,
      lastRefreshed: intradayData.lastRefreshed,
      latestPrice: intradayData.dataPoints[0]?.close,
      latestTime: intradayData.dataPoints[0]?.timestamp
    });
    console.log('✅ Intraday data retrieved successfully\n');

    // Test 5: Technical Indicators
    console.log('5. Testing Technical Indicators...');
    
    // SMA (Simple Moving Average)
    const sma = await stockDataService.getTechnicalIndicator(testSymbol, 'sma', 'daily', 20);
    console.log('SMA 20:', {
      symbol: sma.symbol,
      indicator: sma.indicator,
      timePeriod: sma.timePeriod,
      totalDataPoints: sma.totalDataPoints,
      latestValue: sma.dataPoints[0]?.value,
      latestDate: sma.dataPoints[0]?.date
    });

    // RSI (Relative Strength Index)
    const rsi = await stockDataService.getTechnicalIndicator(testSymbol, 'rsi', 'daily', 14);
    console.log('RSI 14:', {
      symbol: rsi.symbol,
      indicator: rsi.indicator,
      timePeriod: rsi.timePeriod,
      latestValue: rsi.dataPoints[0]?.value,
      latestDate: rsi.dataPoints[0]?.date
    });
    console.log('✅ Technical indicators retrieved successfully\n');

    console.log('🎉 Alpha Vantage Integration Test Complete!');
    console.log('\n📊 Available Alpha Vantage Endpoints:');
    console.log('   GET /api/market-data/alpha/quote/:symbol - Real-time quote');
    console.log('   GET /api/market-data/alpha/overview/:symbol - Company overview');
    console.log('   GET /api/market-data/alpha/daily/:symbol - Daily historical data');
    console.log('   GET /api/market-data/alpha/intraday/:symbol - Intraday data');
    console.log('   GET /api/market-data/alpha/technical/:symbol/:indicator - Technical indicators');
    console.log('   GET /api/market-data/alpha/analysis/:symbol - Comprehensive analysis');
    console.log('\n🔧 Technical Indicators Available:');
    console.log('   - SMA (Simple Moving Average)');
    console.log('   - EMA (Exponential Moving Average)');
    console.log('   - RSI (Relative Strength Index)');
    console.log('   - MACD (Moving Average Convergence Divergence)');
    console.log('   - BBANDS (Bollinger Bands)');
    console.log('   - STOCH (Stochastic Oscillator)');
    console.log('   - ADX (Average Directional Index)');
    console.log('   - And many more...\n');

  } catch (error) {
    console.error('❌ Error testing Alpha Vantage integration:', error.message);
    console.error('Full error:', error);
    
    if (error.message.includes('API call frequency')) {
      console.log('\n⚠️  Note: Alpha Vantage free tier has API call limits.');
      console.log('    You may need to wait a minute between requests.');
    }
  }
}

// Run the test
testAlphaVantageIntegration();
