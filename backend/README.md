# Financial Research AI Backend

A comprehensive backend service for financial data integration, providing real-time market data, economic indicators, and financial news from multiple sources including Indian and global markets.

## 🚀 Features

### Market Data Integration
- **Stock Data**: Real-time stock prices from Yahoo Finance API
- **Indian Stocks**: NSE/BSE listed companies data
- **Global Stocks**: US and international markets
- **Search Functionality**: Find stocks by name or symbol

### Economic Indicators
- **Indian Economy**: GDP, inflation, repo rate, unemployment
- **US Economy**: FRED API integration for economic data
- **Forex Markets**: Currency exchange rates
- **Global Indicators**: Combined economic overview

### Financial News
- **Indian Financial News**: Economic Times and other Indian sources
- **Global Financial News**: Reuters, Bloomberg, CNBC
- **Sentiment Analysis**: AI-powered news sentiment evaluation
- **Category Filtering**: Markets, economy, policy, earnings

### Additional Features
- **Caching**: Intelligent data caching for performance
- **Scheduled Updates**: Automatic data refresh
- **Health Monitoring**: Service health checks
- **Comprehensive Logging**: Winston-based logging

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn package manager

## 🛠️ Installation

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env file with your API keys (optional for basic functionality)
```

4. **Create logs directory**
```bash
mkdir logs
```

## 🚦 Usage

### Start the server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### Test all integrations
```bash
# Test all data sources
node src/test-integrations.js

# Test specific services
node src/test-integrations.js stock
node src/test-integrations.js economic
node src/test-integrations.js news
```

## 🔗 API Endpoints

### Market Data
- `GET /api/market-data/stock/:symbol` - Get stock data by symbol
- `GET /api/market-data/indian-stock/:symbol` - Get Indian stock data
- `GET /api/market-data/indian-stocks/top` - Get top Indian stocks
- `GET /api/market-data/search?q=query` - Search stocks
- `POST /api/market-data/bulk` - Get multiple stocks data

### Economic Indicators
- `GET /api/economic-indicators/us` - US economic indicators
- `GET /api/economic-indicators/india` - Indian economic indicators
- `GET /api/economic-indicators/global` - Global economic overview
- `GET /api/economic-indicators/forex` - Forex rates
- `GET /api/economic-indicators/fred/:seriesId` - Specific FRED data

### Financial News
- `GET /api/news/indian` - Indian financial news
- `GET /api/news/global` - Global financial news
- `GET /api/news/latest?limit=20` - Latest news (combined)
- `GET /api/news/category/:category` - News by category
- `GET /api/news/search?q=query` - Search news
- `GET /api/news/sentiment` - News sentiment analysis

### Health & Status
- `GET /health` - Overall service health
- `GET /api/market-data/health` - Market data service health
- `GET /api/economic-indicators/health` - Economic indicators health
- `GET /api/news/health` - News service health

## 📊 Data Sources

### Free APIs Used
- **Yahoo Finance**: Stock prices and market data
- **FRED (Federal Reserve)**: US economic indicators
- **NSE India**: Indian stock market data (via Yahoo Finance)
- **Economic Times**: Indian financial news (mock data)
- **Global News Sources**: Reuters, Bloomberg, CNBC (mock data)

### Indian Market Focus
- Top NSE stocks (RELIANCE, TCS, HDFCBANK, etc.)
- Indian economic indicators (GDP, inflation, repo rate)
- Indian financial news and analysis
- INR forex rates

## 🔧 Configuration

### Environment Variables
```env
NODE_ENV=development
PORT=5000

# API Keys (Optional - free alternatives used)
ALPHA_VANTAGE_API_KEY=demo
FRED_API_KEY=your_fred_api_key

# Cache Settings
CACHE_DURATION=300000
DATA_REFRESH_INTERVAL=60000
```

### Scheduled Jobs
- **Stock Data**: Refreshed every 5 minutes
- **Economic Indicators**: Refreshed every 30 minutes  
- **News**: Refreshed every 15 minutes
- **Health Check**: Daily at 9:00 AM
- **System Stats**: Logged every hour

## 📈 Example Usage

### Get Stock Data
```javascript
// Get Apple stock data
const response = await fetch('http://localhost:5000/api/market-data/stock/AAPL');
const data = await response.json();
console.log(data.data.currentPrice); // Current stock price
```

### Get Indian Economic Data
```javascript
// Get Indian economic indicators
const response = await fetch('http://localhost:5000/api/economic-indicators/india');
const data = await response.json();
console.log(data.data.gdp); // GDP data
```

### Search Financial News
```javascript
// Search for inflation news
const response = await fetch('http://localhost:5000/api/news/search?q=inflation');
const data = await response.json();
console.log(data.data); // Array of news articles
```

## 🧪 Testing

### Run Integration Tests
```bash
# Test all services
npm run test

# Test individual services  
node src/test-integrations.js stock
node src/test-integrations.js economic
node src/test-integrations.js news
```

### Example Test Output
```
🚀 Financial Research AI Backend - Data Integration Test

📈 Testing Stock Data Integration...
🇺🇸 US Stock Data (AAPL):
Symbol: AAPL
Current Price: 192.32
Change: 2.14
Change %: 1.12%
Volume: 45,123,456

🇮🇳 Indian Stock Data (RELIANCE):
Symbol: RELIANCE.NS
Current Price: 2,847.50
Change: 23.75
Change %: 0.84%

📊 Testing Economic Indicators Integration...
🇮🇳 Indian Economic Indicators:
GDP Growth: 3.7% (Q2 2024)
Inflation Rate: 4.87% (Oct 2024)
Repo Rate: 6.50% (Current)

📰 Testing News Integration...
🇮🇳 Indian Financial News:
1. RBI keeps repo rate unchanged at 6.5%
2. Nifty 50 hits fresh all-time high

✅ ALL INTEGRATIONS TESTED SUCCESSFULLY!
```

## 🔄 Data Flow

1. **Client Request** → API Endpoint
2. **Cache Check** → Return cached data if valid
3. **External API Call** → Fetch fresh data
4. **Data Processing** → Clean and format data
5. **Cache Update** → Store for future requests
6. **Response** → Return formatted JSON

## 📝 Logging

- **Development**: Console + File logging
- **Production**: File logging only
- **Log Levels**: Error, Warn, Info, Debug
- **Log Files**: `logs/error.log`, `logs/combined.log`

## 🛡️ Error Handling

- Graceful API failure handling
- Fallback to cached data
- Mock data for development
- Comprehensive error logging
- Client-friendly error messages

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📚 Next Steps

1. **AI Integration**: Add sentiment analysis and prediction models
2. **Real-time Updates**: WebSocket implementation
3. **Database**: Add MongoDB for data persistence
4. **Authentication**: JWT-based API authentication
5. **Rate Limiting**: API usage limits
6. **Documentation**: Swagger/OpenAPI documentation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions, please create an issue in the repository.

---

**Built with ❤️ for the Financial Research AI Project**
