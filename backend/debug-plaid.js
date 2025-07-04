import { PlaidApi, Configuration, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';

dotenv.config();

async function debugPlaidAPI() {
  try {
    console.log('🔍 Debugging Plaid API Integration...\n');
    
    console.log('Environment Variables:');
    console.log('PLAID_CLIENT_ID:', process.env.PLAID_CLIENT_ID);
    console.log('PLAID_SECRET:', process.env.PLAID_SECRET ? '***' + process.env.PLAID_SECRET.slice(-4) : 'NOT SET');
    console.log('PLAID_ENV:', process.env.PLAID_ENV);
    console.log('');

    // Configure Plaid client
    const configuration = new Configuration({
      basePath: PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
          'Content-Type': 'application/json'
        },
      },
    });

    const client = new PlaidApi(configuration);

    // Test link token creation with minimal request
    console.log('Testing link token creation...');
    const request = {
      user: {
        client_user_id: 'debug_user_123',
      },
      client_name: 'Debug Test',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    };

    console.log('Request payload:', JSON.stringify(request, null, 2));

    const response = await client.linkTokenCreate(request);
    
    console.log('✅ Success! Link token created');
    console.log('Response data:', {
      link_token: response.data.link_token.substring(0, 20) + '...',
      expiration: response.data.expiration,
      request_id: response.data.request_id
    });

  } catch (error) {
    console.error('❌ Error details:');
    console.error('Status:', error.response?.status);
    console.error('Status text:', error.response?.statusText);
    console.error('Error data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
    
    if (error.response?.data?.error_code) {
      console.error('Plaid error code:', error.response.data.error_code);
      console.error('Plaid error type:', error.response.data.error_type);
      console.error('Plaid error message:', error.response.data.error_message);
    }
  }
}

debugPlaidAPI();
