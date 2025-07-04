import stockDataService from './src/services/stockData.js';

async function testStockData() {
  try {
    console.log('Testing Yahoo Finance for AAPL...');
    const result = await stockDataService.getYahooFinanceData('AAPL');
    console.log('Result:', result);
    console.log('Result type:', typeof result);
    console.log('Result is null:', result === null);
    console.log('Result has success property:', result && 'success' in result);
    
    if (result && result.error) {
      console.log('Error in result:', result.error);
      console.log('Error message:', result.message);
    }
  } catch (error) {
    console.error('Caught error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testStockData();
