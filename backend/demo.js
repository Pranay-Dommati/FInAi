// Simple demo script to test backend integration
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function demoBackendIntegration() {
  console.log('\n🚀 Financial Research AI Backend - Integration Demo\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Health Check
    console.log('\n💓 Health Check:');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server Status:', health.data.status);
    console.log('⏱️  Uptime:', Math.round(health.data.uptime), 'seconds');

    // Test 2: Stock Data
    console.log('\n📈 Stock Data Integration:');
    
    // US Stock
    console.log('\n🇺🇸 US Stock (AAPL):');
    const usStock = await axios.get(`${BASE_URL}/api/market-data/stock/AAPL`);
    const appleData = usStock.data.data;
    console.log(`   Symbol: ${appleData.symbol}`);
    console.log(`   Price: $${appleData.currentPrice}`);
    console.log(`   Change: ${appleData.change.toFixed(2)} (${appleData.changePercent.toFixed(2)}%)`);
    console.log(`   Volume: ${appleData.volume?.toLocaleString() || 'N/A'}`);

    // Indian Stock
    console.log('\n🇮🇳 Indian Stock (RELIANCE):');
    const indianStock = await axios.get(`${BASE_URL}/api/market-data/indian-stock/RELIANCE`);
    const relianceData = indianStock.data.data;
    console.log(`   Symbol: ${relianceData.symbol}`);
    console.log(`   Price: ₹${relianceData.currentPrice}`);
    console.log(`   Change: ${relianceData.change.toFixed(2)} (${relianceData.changePercent.toFixed(2)}%)`);
    console.log(`   Volume: ${relianceData.volume?.toLocaleString() || 'N/A'}`);

    // Top Indian Stocks
    console.log('\n🏆 Top 5 Indian Stocks:');
    const topStocks = await axios.get(`${BASE_URL}/api/market-data/indian-stocks/top`);
    topStocks.data.data.slice(0, 5).forEach((stock, index) => {
      const symbol = stock.symbol.replace('.NS', '');
      const changeColor = stock.changePercent >= 0 ? '🟢' : '🔴';
      console.log(`   ${index + 1}. ${symbol}: ₹${stock.currentPrice} ${changeColor} ${stock.changePercent.toFixed(2)}%`);
    });

    // Test 3: Economic Indicators
    console.log('\n📊 Economic Indicators:');
    
    // Indian Economic Data
    console.log('\n🇮🇳 Indian Economy:');
    const indianEcon = await axios.get(`${BASE_URL}/api/economic-indicators/india`);
    const indData = indianEcon.data.data;
    console.log(`   GDP Growth: ${indData.gdp.value}${indData.gdp.unit} (${indData.gdp.period})`);
    console.log(`   Inflation: ${indData.inflation.value}${indData.inflation.unit} (${indData.inflation.period})`);
    console.log(`   Repo Rate: ${indData.repoRate.value}${indData.repoRate.unit} (${indData.repoRate.period})`);
    console.log(`   Unemployment: ${indData.unemployment.value}${indData.unemployment.unit} (${indData.unemployment.period})`);

    // Forex Data
    console.log('\n💱 Forex Rates:');
    const forex = await axios.get(`${BASE_URL}/api/economic-indicators/forex`);
    forex.data.data.forEach(pair => {
      const symbol = pair.symbol.replace('=X', '');
      const changeColor = pair.changePercent >= 0 ? '🟢' : '🔴';
      console.log(`   ${symbol}: ${pair.price.toFixed(4)} ${changeColor} ${pair.changePercent.toFixed(2)}%`);
    });

    // Test 4: Financial News
    console.log('\n📰 Financial News:');
    
    // Indian News
    console.log('\n🇮🇳 Latest Indian Financial News:');
    const indianNews = await axios.get(`${BASE_URL}/api/news/indian`);
    indianNews.data.data.slice(0, 3).forEach((article, index) => {
      const sentimentEmoji = article.sentiment === 'positive' ? '😊' : 
                            article.sentiment === 'negative' ? '😞' : '😐';
      console.log(`   ${index + 1}. ${article.title}`);
      console.log(`      ${sentimentEmoji} Sentiment: ${article.sentiment} | Category: ${article.category}`);
      console.log(`      ⏰ ${new Date(article.timestamp).toLocaleString()}`);
      console.log('');
    });

    // News Sentiment Analysis
    console.log('\n📈 News Sentiment Analysis:');
    const sentiment = await axios.get(`${BASE_URL}/api/news/sentiment`);
    const sentData = sentiment.data.data;
    console.log(`   Overall Sentiment: ${sentData.overall.toUpperCase()}`);
    console.log(`   Total Articles: ${sentData.totalArticles}`);
    sentData.breakdown.forEach(item => {
      const emoji = item.sentiment === 'positive' ? '😊' : 
                   item.sentiment === 'negative' ? '😞' : '😐';
      console.log(`   ${emoji} ${item.sentiment}: ${item.count} articles (${item.percentage}%)`);
    });

    // Test 5: Search Functionality
    console.log('\n🔍 Search Functionality:');
    
    // Search Stocks
    console.log('\n🔍 Stock Search (query: "Apple"):');
    const stockSearch = await axios.get(`${BASE_URL}/api/market-data/search?q=Apple`);
    stockSearch.data.data.slice(0, 3).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.symbol} - ${result.longname || result.shortname}`);
    });

    // Search News
    console.log('\n🔍 News Search (query: "inflation"):');
    const newsSearch = await axios.get(`${BASE_URL}/api/news/search?q=inflation`);
    newsSearch.data.data.slice(0, 2).forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title} (${article.source})`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL INTEGRATIONS WORKING SUCCESSFULLY!');
    console.log('🎉 Backend is ready for frontend integration');
    console.log('🌐 Server running at: http://localhost:5000');
    console.log('📖 API Documentation available in README.md');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running:');
      console.log('   cd backend && npm run dev');
    }
  }
}

// Run the demo
demoBackendIntegration();
