import React, { useState, useEffect, useRef } from 'react';
import ErrorDisplay from '../components/ErrorDisplay';
import './StockAnalysis.css';

// Server port configuration with fallback
const API_BASE_PORTS = [5000, 5001, 5002, 5003, 5004];
let currentPortIndex = 0;
let API_BASE_URL = `http://localhost:${API_BASE_PORTS[currentPortIndex]}`;

// Function to try the next available port
const tryNextPort = () => {
  currentPortIndex = (currentPortIndex + 1) % API_BASE_PORTS.length;
  API_BASE_URL = `http://localhost:${API_BASE_PORTS[currentPortIndex]}`;
  console.log(`Trying next backend port: ${API_BASE_PORTS[currentPortIndex]}`);
  return API_BASE_PORTS[currentPortIndex];
};

// Function to fetch with port fallback
const fetchWithPortFallback = async (endpoint, options = {}, retries = API_BASE_PORTS.length) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (response.ok) {
      return response;
    }
    throw new Error(`API responded with status: ${response.status}`);
  } catch (error) {
    console.error(`Error connecting to ${API_BASE_URL}:`, error);
    
    if (retries > 1) {
      tryNextPort();
      return fetchWithPortFallback(endpoint, options, retries - 1);
    }
    
    throw new Error(`Failed to connect to backend after trying all ports. Please check if the backend server is running.`);
  }
};

const StockAnalysis = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const chartContainerRef = useRef(null);

  // Search for stocks
  const searchStocks = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetchWithPortFallback(`/api/stock-analysis/search?q=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Fetch comprehensive analysis
  const fetchAnalysis = async (symbol) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    console.log("Fetching analysis for:", symbol);
    
    try {
      const url = `/api/stock-analysis/analyze/${symbol}`;
      console.log("Requesting URL:", url);
      
      const response = await fetchWithPortFallback(url);
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(`API error: ${response.status} - ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log("API Response:", responseData);
      
      // Check the structure of the data
      if (responseData && responseData.success && responseData.data) {
        // Check if the data is demo data
        if (responseData.data.stockData && responseData.data.stockData.source === "Demo Data") {
          // Reject demo data with a clear error message
          throw new Error("⚠️ DEMO DATA DETECTED: The backend is returning demo data instead of real API data.\n\nPlease check the backend API connections and make sure actual financial data sources are working properly.");
        }
        
        // Extract data from the correct structure
        setAnalysis(responseData.data);
        console.log("Analysis data set successfully:", responseData.data);
      } else if (responseData && responseData.error) {
        // Handle error in response body
        throw new Error(`API returned error: ${responseData.error.message || JSON.stringify(responseData.error)}`);
      } else {
        // Handle unexpected response format
        console.error("Invalid data structure received:", responseData);
        throw new Error("Invalid data structure received from API");
      }
    } catch (error) {
      setError(error.message || "Unknown error occurred");
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle stock selection
  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    setSearchTerm(stock.symbol);
    setSearchResults([]);
    fetchAnalysis(stock.symbol);
    initTradingViewWidget(stock.symbol);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchStocks(value);
  };

  // Watchlist functions
  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
    }
  };

  const removeFromWatchlist = (symbol) => {
    setWatchlist(watchlist.filter(item => item !== symbol));
  };

  // Get sentiment color
  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return '#22c55e';
      case 'negative': return '#ef4444';
      case 'neutral': return '#64748b';
      default: return '#64748b';
    }
  };

  // Format percentage
  const formatPercent = (value) => {
    return value > 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // TradingView Widget
  const initTradingViewWidget = (symbol) => {
    console.log("Initializing TradingView widget for", symbol);
    
    setTimeout(() => {
      if (chartContainerRef.current) {
        try {
          // Clear any existing content
          chartContainerRef.current.innerHTML = '';
          
          // Create a placeholder message
          const tempEl = document.createElement('div');
          tempEl.innerHTML = `<div style="padding: 20px; text-align: center;">Loading chart for ${symbol}...</div>`;
          chartContainerRef.current.appendChild(tempEl);
          
          // Create the TradingView widget with a short delay
          setTimeout(() => {
            chartContainerRef.current.innerHTML = '';
            
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
            script.type = 'text/javascript';
            script.async = true;
            script.innerHTML = JSON.stringify({
              autosize: true,
              symbol: `NASDAQ:${symbol}`,
              interval: "D",
              timezone: "Etc/UTC",
              theme: "light",
              style: "1",
              locale: "en",
              toolbar_bg: "#f1f3f6",
              enable_publishing: false,
              allow_symbol_change: true,
              container_id: "tradingview_chart"
            });
            
            chartContainerRef.current.appendChild(script);
          }, 300);
        } catch (error) {
          console.error("Error initializing TradingView widget:", error);
        }
      } else {
        console.error("Chart container reference not available");
      }
    }, 100);
  };

  useEffect(() => {
    // Load default stock (e.g., AAPL) on component mount
    const defaultStock = { symbol: 'AAPL', name: 'Apple Inc.' };
    setSelectedStock(defaultStock);
    setSearchTerm(defaultStock.symbol);
    
    console.log('Stock Analysis component mounted, initializing with', defaultStock.symbol);
    
    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      console.log('Initializing chart for', defaultStock.symbol);
      initTradingViewWidget(defaultStock.symbol);
      
      console.log('Fetching initial data for', defaultStock.symbol);
      fetchAnalysis(defaultStock.symbol)
        .catch(err => {
          console.error('Failed to fetch initial data:', err);
          setError(`Initial data fetch failed: ${err.message || 'Unknown error'}`);
        });
    }, 1000);
    
    return () => {
      console.log('Cleaning up Stock Analysis component');
      clearTimeout(timer);
    };
  }, []);
  
  // Debug Effects
  useEffect(() => {
    console.log('Analysis state updated:', analysis);
  }, [analysis]);
  
  useEffect(() => {
    if (error) {
      console.error('Error state updated:', error);
    }
  }, [error]);

  return (
    <div className="stock-analysis">
      <div className="stock-analysis__header">
        <h1>🤖 AI-Powered Stock Analysis</h1>
        <p>FinBERT sentiment analysis • Real-time data • AI risk assessment • Smart recommendations</p>
        <div className="ai-features-badge">
          <span className="feature-badge">🧠 FinBERT AI</span>
          <span className="feature-badge">📊 Real-time Data</span>
          <span className="feature-badge">🎯 Smart Predictions</span>
          <span className="feature-badge">⚡ Risk Assessment</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search stocks (e.g., AAPL, Tesla, Microsoft)..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((stock, index) => (
                <div
                  key={index}
                  className="search-result-item"
                  onClick={() => handleStockSelect(stock)}
                >
                  <div className="search-result-symbol">{stock.symbol}</div>
                  <div className="search-result-name">{stock.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Analyzing {selectedStock?.symbol}...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-container" style={{ padding: '20px', margin: '20px 0', border: '1px solid #f88', borderRadius: '8px', backgroundColor: '#fff1f0' }}>
          <h3 style={{ color: '#d32f2f', marginTop: 0 }}>Error Occurred</h3>
          <p style={{ fontFamily: 'monospace', padding: '10px', backgroundColor: '#f8f8f8', borderRadius: '4px', overflow: 'auto' }}>{error}</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button 
              onClick={() => selectedStock && fetchAnalysis(selectedStock.symbol)}
              style={{ padding: '8px 16px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '8px 16px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

      {/* Debug Info - Visible during development to help troubleshoot */}
      <div style={{ padding: '10px', background: '#f0f0f0', margin: '10px 0', fontSize: '12px' }}>
        <p>Analysis Data: {analysis ? 'Present' : 'Not Present'}</p>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Selected Stock: {selectedStock ? selectedStock.symbol : 'None'}</p>
        <p>Error: {error ? error : 'None'}</p>
      </div>
      
      {/* Waiting for data - informative message */}
      {selectedStock && !loading && !analysis && !error && (
        <div className="waiting-container" style={{ padding: '20px', margin: '20px 0', textAlign: 'center', border: '1px dashed #ccc' }}>
          <p style={{ fontSize: '16px' }}>Waiting for data for {selectedStock.symbol}...</p>
          <p style={{ fontSize: '14px', color: '#666' }}>If this message persists, check the console for errors or inspect the network requests.</p>
        </div>
      )}
      
      {/* Analysis Results - Only showing when we have real data */}
      {analysis && !loading && (
        <div className="analysis-container">
          {/* Stock Header */}
          <div className="stock-header">
            {analysis.stockData?.error ? (
              <ErrorDisplay 
                error={analysis.stockData} 
                title="Stock Data Unavailable" 
              />
            ) : (
              <div className="stock-info">
                <h2>{analysis.stockData?.name || selectedStock?.name || 'Unknown Company'}</h2>
                <div className="stock-symbol">{analysis.stockData?.symbol || selectedStock?.symbol}</div>
                <div className="stock-price">
                  {analysis.stockData?.currentPrice && formatCurrency(analysis.stockData.currentPrice)}
                  {analysis.stockData?.changePercent && (
                    <span 
                      className={`price-change ${analysis.stockData.changePercent >= 0 ? 'positive' : 'negative'}`}
                    >
                      {formatPercent(analysis.stockData.changePercent)}
                    </span>
                  )}
                </div>
                {analysis.stockData?.source && analysis.stockData.source === "Demo Data" && (
                  <div className="data-source" style={{ backgroundColor: '#ffebee', padding: '5px 10px', margin: '5px 0', color: '#d32f2f', fontWeight: 'bold' }}>
                    ⚠️ ERROR: Demo Data detected. This should not appear during development.
                  </div>
                )}
                {analysis.stockData?.source && analysis.stockData.source !== "Demo Data" && (
                  <div className="data-source">
                    <small>Data source: {analysis.stockData.source}</small>
                  </div>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn btn-buy">Buy</button>
              <button className="btn btn-sell">Sell</button>
              {watchlist.includes(selectedStock?.symbol) ? (
                <button 
                  className="btn btn-watchlist active"
                  onClick={() => removeFromWatchlist(selectedStock.symbol)}
                >
                  Remove from Watchlist
                </button>
              ) : (
                <button 
                  className="btn btn-watchlist"
                  onClick={() => addToWatchlist(selectedStock.symbol)}
                >
                  Add to Watchlist
                </button>
              )}
            </div>
          </div>

          {/* TradingView Chart */}
          <div className="chart-container">
            <div className="tradingview-chart">
              <h3>Interactive Chart - {selectedStock?.symbol}</h3>
              <div 
                ref={chartContainerRef}
                id="tradingview_chart"
                className="chart-frame"
                style={{ height: '500px', width: '100%', border: '1px solid #ddd', borderRadius: '8px' }}
              />
            </div>
          </div>

          {/* Analysis Grid */}
          <div className="analysis-grid">
            {/* Sentiment Analysis */}
            <div className="analysis-card">
              <h3>🧠 FinBERT Sentiment Analysis</h3>
              <div className="ai-powered-badge">
                <span>Financial AI Language Model</span>
              </div>
              {analysis.sentimentAnalysis?.error ? (
                <ErrorDisplay 
                  error={analysis.sentimentAnalysis} 
                  title="AI Sentiment Analysis Unavailable" 
                />
              ) : analysis.sentimentAnalysis ? (
                <div className="sentiment-content">
                  <div className="sentiment-score">
                    <span 
                      className="sentiment-badge"
                      style={{ backgroundColor: getSentimentColor(analysis.sentimentAnalysis.overall) }}
                    >
                      {analysis.sentimentAnalysis.overall}
                    </span>
                    <span className="sentiment-confidence">
                      {analysis.sentimentAnalysis.confidence} confidence
                    </span>
                  </div>
                  
                  {analysis.sentimentAnalysis.breakdown && (
                    <div className="sentiment-breakdown">
                      <div className="sentiment-item">
                        <span>🟢 Positive:</span>
                        <span>{analysis.sentimentAnalysis.breakdown.positive || 0}%</span>
                      </div>
                      <div className="sentiment-item">
                        <span>⚪ Neutral:</span>
                        <span>{analysis.sentimentAnalysis.breakdown.neutral || 0}%</span>
                      </div>
                      <div className="sentiment-item">
                        <span>🔴 Negative:</span>
                        <span>{analysis.sentimentAnalysis.breakdown.negative || 0}%</span>
                      </div>
                    </div>
                  )}

                  {analysis.sentimentAnalysis.reasoning && (
                    <div className="ai-reasoning">
                      <h4>🤖 AI Analysis:</h4>
                      <p className="sentiment-summary">{analysis.sentimentAnalysis.reasoning}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-data">
                  <p>No sentiment data available</p>
                </div>
              )}
            </div>

            {/* Technical Analysis */}
            <div className="analysis-card">
              <h3>Technical Analysis</h3>
              {analysis.technicalAnalysis && (
                <div className="technical-content">
                  <div className="technical-signal">
                    <span 
                      className={`signal-badge ${analysis.technicalAnalysis.signal?.toLowerCase()}`}
                    >
                      {analysis.technicalAnalysis.signal}
                    </span>
                  </div>
                  
                  <div className="technical-indicators">
                    {analysis.technicalAnalysis.indicators && Object.entries(analysis.technicalAnalysis.indicators).map(([key, value]) => (
                      <div key={key} className="indicator-item">
                        <span>{key.toUpperCase()}:</span>
                        <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
                      </div>
                    ))}
                  </div>

                  {analysis.technicalAnalysis.summary && (
                    <p className="technical-summary">{analysis.technicalAnalysis.summary}</p>
                  )}
                </div>
              )}
            </div>

            {/* Fundamental Analysis */}
            <div className="analysis-card">
              <h3>Fundamental Analysis</h3>
              {analysis.fundamentalAnalysis && (
                <div className="fundamental-content">
                  <div className="fundamental-score">
                    <span 
                      className={`score-badge ${analysis.fundamentalAnalysis.score >= 7 ? 'strong' : analysis.fundamentalAnalysis.score >= 4 ? 'moderate' : 'weak'}`}
                    >
                      {analysis.fundamentalAnalysis.score}/10
                    </span>
                  </div>
                  
                  <div className="fundamental-metrics">
                    {analysis.fundamentalAnalysis.metrics && Object.entries(analysis.fundamentalAnalysis.metrics).map(([key, value]) => (
                      <div key={key} className="metric-item">
                        <span>{key}:</span>
                        <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
                      </div>
                    ))}
                  </div>

                  {analysis.fundamentalAnalysis.summary && (
                    <p className="fundamental-summary">{analysis.fundamentalAnalysis.summary}</p>
                  )}
                </div>
              )}
            </div>

            {/* Risk Assessment */}
            <div className="analysis-card">
              <h3>⚡ AI Risk Assessment</h3>
              <div className="ai-powered-badge">
                <span>Multi-factor AI Analysis</span>
              </div>
              {analysis.riskAssessment && (
                <div className="risk-content">
                  <div className="risk-level">
                    <span 
                      className={`risk-badge ${analysis.riskAssessment.level?.toLowerCase()}`}
                    >
                      {analysis.riskAssessment.level} Risk
                    </span>
                    <span className="risk-score">
                      AI Risk Score: {analysis.riskAssessment.score}/10
                    </span>
                  </div>
                  
                  {analysis.riskAssessment.factors && analysis.riskAssessment.factors.length > 0 && (
                    <div className="risk-factors">
                      <h4>🎯 AI-Identified Risk Factors:</h4>
                      <ul>
                        {analysis.riskAssessment.factors.map((factor, index) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.riskAssessment.assessment && (
                    <div className="ai-reasoning">
                      <h4>🤖 AI Assessment:</h4>
                      <p className="risk-summary">{analysis.riskAssessment.assessment}</p>
                    </div>
                  )}

                  {analysis.riskAssessment.recommendation && (
                    <div className="risk-recommendation">
                      <h4>💡 AI Recommendation:</h4>
                      <p>{analysis.riskAssessment.recommendation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* News Analysis */}
            <div className="analysis-card news-card">
              <h3>Recent News & Analysis</h3>
              {analysis.recentNews?.error ? (
                <ErrorDisplay 
                  error={analysis.recentNews} 
                  title="News Data Unavailable" 
                />
              ) : analysis.recentNews && analysis.recentNews.length > 0 ? (
                <div className="news-content">
                  {analysis.recentNews.slice(0, 5).map((article, index) => (
                    <div key={index} className="news-item">
                      <h4>{article.title}</h4>
                      <div className="news-meta">
                        <span className="news-source">{article.source}</span>
                        <span className="news-date">
                          {new Date(article.timestamp || article.publishedAt).toLocaleDateString()}
                        </span>
                        {article.sentiment && (
                          <span 
                            className="news-sentiment"
                            style={{ color: getSentimentColor(article.sentiment) }}
                          >
                            {article.sentiment}
                          </span>
                        )}
                      </div>
                      <p className="news-summary">{article.summary}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No recent news available for this stock</p>
                </div>
              )}
            </div>

            {/* AI Recommendation */}
            <div className="analysis-card recommendation-card">
              <h3>🤖 AI Investment Recommendation</h3>
              <div className="ai-powered-badge">
                <span>Powered by FinBERT & Advanced ML</span>
              </div>
              {analysis.overallRecommendation && (
                <div className="recommendation-content">
                  <div className="recommendation-action">
                    <span 
                      className={`action-badge ${analysis.overallRecommendation.action?.toLowerCase()}`}
                    >
                      {analysis.overallRecommendation.action}
                    </span>
                    <span className="confidence-score">
                      {analysis.overallRecommendation.confidence} confidence
                    </span>
                    <div className="ai-score">
                      AI Score: {analysis.overallRecommendation.score}/100
                    </div>
                  </div>
                  
                  {analysis.overallRecommendation.targetPrice && (
                    <div className="target-price">
                      <span>AI Target Price: {formatCurrency(analysis.overallRecommendation.targetPrice)}</span>
                    </div>
                  )}

                  {analysis.overallRecommendation.reasoning && (
                    <div className="recommendation-reasoning">
                      <h4>🧠 AI Analysis Factors:</h4>
                      <ul>
                        {analysis.overallRecommendation.reasoning.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.overallRecommendation.summary && (
                    <p className="recommendation-summary">{analysis.overallRecommendation.summary}</p>
                  )}

                  {analysis.overallRecommendation.timeHorizon && (
                    <div className="time-horizon">
                      <strong>Recommended Time Horizon:</strong> {analysis.overallRecommendation.timeHorizon}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAnalysis;
