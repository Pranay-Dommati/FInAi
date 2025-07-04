import plaidService from './src/services/plaidService.js';
import logger from './src/utils/logger.js';

async function testPlaidIntegration() {
  console.log('\n🏦 Testing Plaid Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Plaid Health Check...');
    const healthStatus = await plaidService.healthCheck();
    console.log('Health Status:', healthStatus);
    console.log('✅ Health check completed\n');

    // Test 2: Create Link Token
    console.log('2. Testing Link Token Creation...');
    const testUserId = 'test_user_' + Date.now();
    const linkTokenData = await plaidService.createLinkToken(testUserId, 'Test FinAI App');
    console.log('Link Token Data:', {
      linkToken: linkTokenData.linkToken.substring(0, 20) + '...',
      expiration: linkTokenData.expiration,
      requestId: linkTokenData.requestId
    });
    console.log('✅ Link token created successfully\n');

    // Test 3: Demo with Sandbox Data (Note: This requires frontend integration)
    console.log('3. Plaid Integration Setup Complete!');
    console.log('📝 Next Steps:');
    console.log('   - Use the link token in your frontend to initialize Plaid Link');
    console.log('   - After user connects their account, exchange public token for access token');
    console.log('   - Use access token to fetch accounts, transactions, and other data\n');

    console.log('🔗 Available Endpoints:');
    console.log('   POST /api/plaid/link/token/create - Create link token');
    console.log('   POST /api/plaid/link/token/exchange - Exchange public token');
    console.log('   POST /api/plaid/accounts - Get user accounts');
    console.log('   POST /api/plaid/transactions - Get transactions');
    console.log('   POST /api/plaid/investments/holdings - Get investment holdings');
    console.log('   POST /api/plaid/identity - Get identity information');
    console.log('   POST /api/plaid/insights/spending - Get spending insights');
    console.log('   GET /api/plaid/health - Health check');
    console.log('   GET /api/plaid/info/products - Available products info\n');

    console.log('🏗️ Environment:', process.env.PLAID_ENV || 'sandbox');
    console.log('🎯 Client ID:', process.env.PLAID_CLIENT_ID);
    console.log('✅ Plaid service is ready!\n');

  } catch (error) {
    console.error('❌ Error testing Plaid integration:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testPlaidIntegration();
