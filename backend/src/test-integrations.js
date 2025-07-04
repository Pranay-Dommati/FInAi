import stockDataService from './services/stockData.js';
import economicIndicatorsService from './services/economicIndicators.js';
import newsService from './services/news.js';
import logger from './utils/logger.js';

// Test all market data integrations
async function testAllIntegrations() {
  console.log('\n🚀 Financial Research AI Backend - Data Integration Test\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Stock Data Integration
    console.log('\n📈 Testing Stock Data Integration...');
    console.log('-'.repeat(40));
    
    // Test US stock
    console.log('\n🇺🇸 US Stock Data (AAPL):');
    const appleStock = await stockDataService.getStockData('AAPL');
    console.log('Symbol:', appleStock.symbol);
    console.log('Current Price:', appleStock.currentPrice);
    console.log('Change:', appleStock.change.toFixed(2));
    console.log('Change %:', appleStock.changePercent.toFixed(2) + '%');
    console.log('Volume:', appleStock.volume?.toLocaleString() || 'N/A');
    console.log('Exchange:', appleStock.exchangeName);
    
    // Test Indian stock
    console.log('\n🇮🇳 Indian Stock Data (RELIANCE):');
    const relianceStock = await stockDataService.getIndianStockData('RELIANCE');
    console.log('Symbol:', relianceStock.symbol);
    console.log('Current Price:', relianceStock.currentPrice);
    console.log('Change:', relianceStock.change.toFixed(2));
    console.log('Change %:', relianceStock.changePercent.toFixed(2) + '%');
    console.log('Volume:', relianceStock.volume?.toLocaleString() || 'N/A');
    console.log('Exchange:', relianceStock.exchangeName);
    
    // Test top Indian stocks
    console.log('\n🏆 Top Indian Stocks:');
    const topStocks = await stockDataService.getTopIndianStocks();
    topStocks.slice(0, 5).forEach(stock => {
      console.log(`${stock.symbol}: ₹${stock.currentPrice} (${stock.changePercent.toFixed(2)}%)`);
    });

    // Test 2: Economic Indicators Integration
    console.log('\n\n📊 Testing Economic Indicators Integration...');
    console.log('-'.repeat(50));
    
    // Test Indian economic data
    console.log('\n🇮🇳 Indian Economic Indicators:');
    const indianEconomicData = await economicIndicatorsService.getIndianEconomicData();
    console.log('GDP Growth:', indianEconomicData.gdp.value + indianEconomicData.gdp.unit, `(${indianEconomicData.gdp.period})`);
    console.log('Inflation Rate:', indianEconomicData.inflation.value + indianEconomicData.inflation.unit, `(${indianEconomicData.inflation.period})`);
    console.log('Repo Rate:', indianEconomicData.repoRate.value + indianEconomicData.repoRate.unit, `(${indianEconomicData.repoRate.period})`);
    console.log('Unemployment:', indianEconomicData.unemployment.value + indianEconomicData.unemployment.unit, `(${indianEconomicData.unemployment.period})`);
    
    // Test US economic data
    console.log('\n🇺🇸 US Economic Indicators:');
    const usEconomicData = await economicIndicatorsService.getUSEconomicData();
    console.log('Available indicators:', Object.keys(usEconomicData));
    
    // Test forex data
    console.log('\n💱 Forex Data:');
    const forexData = await economicIndicatorsService.getForexData();
    forexData.forEach(pair => {
      console.log(`${pair.symbol}: ${pair.price.toFixed(4)} (${pair.changePercent.toFixed(2)}%)`);
    });

    // Test 3: News Integration
    console.log('\n\n📰 Testing News Integration...');
    console.log('-'.repeat(35));
    
    // Test Indian financial news
    console.log('\n🇮🇳 Indian Financial News:');
    const indianNews = await newsService.getIndianFinancialNews();
    indianNews.slice(0, 3).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   Source: ${article.source} | Category: ${article.category} | Sentiment: ${article.sentiment}`);
      console.log(`   Time: ${new Date(article.timestamp).toLocaleString()}`);
      console.log('');
    });
    
    // Test global financial news
    console.log('\n🌍 Global Financial News:');
    const globalNews = await newsService.getGlobalFinancialNews();
    globalNews.slice(0, 3).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   Source: ${article.source} | Region: ${article.region} | Sentiment: ${article.sentiment}`);
      console.log(`   Time: ${new Date(article.timestamp).toLocaleString()}`);
      console.log('');
    });
    
    // Test sentiment analysis
    console.log('\n📈 News Sentiment Analysis:');
    const sentimentAnalysis = await newsService.getNewsSentiment();
    console.log('Overall Sentiment:', sentimentAnalysis.overall.toUpperCase());
    console.log('Total Articles:', sentimentAnalysis.totalArticles);
    sentimentAnalysis.breakdown.forEach(item => {
      console.log(`${item.sentiment}: ${item.count} articles (${item.percentage}%)`);
    });

    // Test 4: Search Functionality
    console.log('\n\n🔍 Testing Search Functionality...');
    console.log('-'.repeat(40));
    
    // Test stock search
    console.log('\n🔍 Stock Search (query: "Apple"):');
    const stockSearchResults = await stockDataService.searchStocks('Apple');
    stockSearchResults.slice(0, 3).forEach(result => {
      console.log(`${result.symbol} - ${result.longname || result.shortname}`);
    });
    
    // Test news search
    console.log('\n🔍 News Search (query: "inflation"):');
    const newsSearchResults = await newsService.searchNews('inflation');
    newsSearchResults.slice(0, 2).forEach(article => {
      console.log(`- ${article.title} (${article.source})`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL INTEGRATIONS TESTED SUCCESSFULLY!');
    console.log('🎉 Financial Research AI Backend is ready for use');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    logger.error('Integration test failed:', error);
    process.exit(1);
  }
}

// Test individual services
async function testStockDataService() {
  console.log('\n📈 Testing Stock Data Service...');
  
  try {
    const testSymbols = ['AAPL', 'GOOGL', 'MSFT'];
    for (const symbol of testSymbols) {
      const data = await stockDataService.getStockData(symbol);
      console.log(`✅ ${symbol}: $${data.currentPrice} (${data.changePercent.toFixed(2)}%)`);
    }
  } catch (error) {
    console.error('❌ Stock data test failed:', error.message);
  }
}

async function testEconomicIndicatorsService() {
  console.log('\n📊 Testing Economic Indicators Service...');
  
  try {
    const indianData = await economicIndicatorsService.getIndianEconomicData();
    console.log('✅ Indian Economic Data:', Object.keys(indianData));
    
    const forexData = await economicIndicatorsService.getForexData();
    console.log('✅ Forex Data:', forexData.length, 'currency pairs');
  } catch (error) {
    console.error('❌ Economic indicators test failed:', error.message);
  }
}

async function testNewsService() {
  console.log('\n📰 Testing News Service...');
  
  try {
    const indianNews = await newsService.getIndianFinancialNews();
    console.log('✅ Indian News:', indianNews.length, 'articles');
    
    const globalNews = await newsService.getGlobalFinancialNews();
    console.log('✅ Global News:', globalNews.length, 'articles');
    
    const sentiment = await newsService.getNewsSentiment();
    console.log('✅ Sentiment Analysis: Overall', sentiment.overall);
  } catch (error) {
    console.error('❌ News service test failed:', error.message);
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const testType = process.argv[2];
  
  switch (testType) {
    case 'stock':
      testStockDataService();
      break;
    case 'economic':
      testEconomicIndicatorsService();
      break;
    case 'news':
      testNewsService();
      break;
    case 'all':
    default:
      testAllIntegrations();
      break;
  }
}

export { 
  testAllIntegrations, 
  testStockDataService, 
  testEconomicIndicatorsService, 
  testNewsService 
};
