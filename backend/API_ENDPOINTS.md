# 🚀 Financial Research AI Backend - API Endpoints Summary

## 🌐 Base URL
```
http://localhost:5000
```

## 📊 Market Data Endpoints

### Stock Data
- **GET** `/api/market-data/stock/{symbol}` - Get US/Global stock data
  - Example: `/api/market-data/stock/AAPL`
  - Returns: Current price, change, volume, market cap, etc.

- **GET** `/api/market-data/indian-stock/{symbol}` - Get Indian stock data
  - Example: `/api/market-data/indian-stock/RELIANCE`
  - Returns: NSE stock data with INR prices

- **GET** `/api/market-data/indian-stocks/top` - Get top 10 Indian stocks
  - Returns: Array of top Indian stocks (RELIANCE, TCS, HDFCBANK, etc.)

- **GET** `/api/market-data/search?q={query}` - Search stocks by name/symbol
  - Example: `/api/market-data/search?q=Apple`
  - Returns: Array of matching stocks

- **POST** `/api/market-data/bulk` - Get multiple stocks data
  - Body: `{"symbols": ["AAPL", "GOOGL", "MSFT"]}`
  - Returns: Bulk stock data with success/failure stats

## 📈 Economic Indicators Endpoints

### Regional Economic Data
- **GET** `/api/economic-indicators/india` - Indian economic indicators
  - Returns: GDP, inflation, repo rate, unemployment, etc.

- **GET** `/api/economic-indicators/us` - US economic indicators
  - Returns: GDP, unemployment, inflation, federal funds rate

- **GET** `/api/economic-indicators/global` - Combined global overview
  - Returns: Both US and Indian data combined

### Specialized Data
- **GET** `/api/economic-indicators/forex` - Forex exchange rates
  - Returns: USD/INR, EUR/USD, GBP/USD, JPY/USD rates

- **GET** `/api/economic-indicators/fred/{seriesId}` - FRED economic data
  - Example: `/api/economic-indicators/fred/GDP`
  - Returns: Federal Reserve economic data series

- **GET** `/api/economic-indicators/summary` - Economic overview
  - Returns: Combined summary of all economic indicators

## 📰 Financial News Endpoints

### News Sources
- **GET** `/api/news/indian` - Indian financial news
  - Returns: Economic Times and Indian sources

- **GET** `/api/news/global` - Global financial news
  - Returns: Reuters, Bloomberg, CNBC sources

- **GET** `/api/news/latest?limit={n}` - Latest combined news
  - Example: `/api/news/latest?limit=20`
  - Returns: Most recent news from all sources

### News Categories & Search
- **GET** `/api/news/category/{category}` - News by category
  - Categories: markets, economy, monetary-policy, earnings, currency, commodities, crypto
  - Example: `/api/news/category/markets`

- **GET** `/api/news/search?q={query}` - Search news articles
  - Example: `/api/news/search?q=inflation`
  - Returns: Articles matching search query

- **GET** `/api/news/categories` - Available news categories
  - Returns: List of all available news categories

### News Analysis
- **GET** `/api/news/sentiment` - News sentiment analysis
  - Returns: Overall sentiment, breakdown by positive/negative/neutral

## 🏥 Health & Monitoring Endpoints

### Service Health
- **GET** `/health` - Overall service health
  - Returns: Server status, uptime, environment

- **GET** `/api/market-data/health` - Market data service health
- **GET** `/api/economic-indicators/health` - Economic indicators health
- **GET** `/api/news/health` - News service health

## 📋 Response Format

All endpoints return JSON with this structure:
```json
{
  "success": true,
  "data": { /* actual data */ },
  "timestamp": "2025-07-04T09:33:15.334Z",
  // Additional fields like count, query, region, etc.
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-07-04T09:33:15.334Z"
}
```

## 🔧 Query Parameters

### Common Parameters
- `limit` - Limit number of results (default varies by endpoint)
- `q` - Search query string

### Stock Search Parameters
- `q` - Stock name or symbol to search for

### News Parameters
- `limit` - Number of articles to return
- `q` - Search term for news articles

## 🌟 Sample API Calls

### Get Apple Stock Data
```bash
curl "http://localhost:5000/api/market-data/stock/AAPL"
```

### Get Indian Economic Indicators
```bash
curl "http://localhost:5000/api/economic-indicators/india"
```

### Search for Technology News
```bash
curl "http://localhost:5000/api/news/search?q=technology"
```

### Get Latest 10 News Articles
```bash
curl "http://localhost:5000/api/news/latest?limit=10"
```

### Get Forex Rates
```bash
curl "http://localhost:5000/api/economic-indicators/forex"
```

## 🔄 Data Sources

### Free APIs Used
- **Yahoo Finance**: Stock prices and market data
- **FRED (Federal Reserve)**: US economic indicators
- **Mock Indian Sources**: Economic indicators and news
- **Economic Times**: Indian financial news (mock data)

### Update Frequencies
- **Stock Data**: Real-time with 5-minute cache
- **Economic Indicators**: 30-minute cache
- **News**: 15-minute cache
- **Forex**: Real-time with 5-minute cache

## 🚀 Getting Started

1. **Start the server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Test the health endpoint**:
   ```bash
   curl http://localhost:5000/health
   ```

3. **Run the demo**:
   ```bash
   node demo.js
   ```

## 📚 Next Steps for Frontend Integration

1. **Use axios or fetch** to call these endpoints from your React app
2. **Handle loading states** while data is being fetched
3. **Implement error handling** for failed API calls
4. **Cache data** on frontend to reduce API calls
5. **Add real-time updates** using WebSockets (future enhancement)

---

**🎉 All endpoints are fully functional and ready for frontend integration!**
