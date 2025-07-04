import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [chartInitialized, setChartInitialized] = useState(false);
  const chartContainerRef = useRef(null);
  const searchContainerRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Handle ESC key and click outside to close search dropdown
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        setSearchResults([]);
      }
    };

    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchResults([]);
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup event listeners
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check for URL parameters
  useEffect(() => {
    const symbol = searchParams.get('symbol');
    if (symbol) {
      setSearchTerm(symbol);
      setSelectedStock({ symbol, name: symbol });
      fetchAnalysis(symbol);
    }
  }, [searchParams]);

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
        console.log('Search response:', data); // Debug log
        // The backend returns { success: true, data: { results: [...] } }
        setSearchResults(data.data?.results || []);
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
    initTradingViewWidget(stock.symbol, stock.exchange);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // If the search term is empty, clear results immediately
    if (!value.trim()) {
      setSearchResults([]);
    } else {
      searchStocks(value);
    }
  };

  // Handle search input key press
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If there are search results, select the first one
      if (searchResults.length > 0) {
        handleStockSelect(searchResults[0]);
      } else if (searchTerm.trim()) {
        // If no search results but there's a search term, try direct analysis
        // This handles cases where the user types a symbol directly
        const symbol = searchTerm.trim().toUpperCase();
        handleStockSelect({ symbol, name: symbol });
      }
    } else if (e.key === 'Escape') {
      // Close dropdown on Escape key
      setSearchResults([]);
      e.target.blur(); // Remove focus from input
    } else if (e.key === 'ArrowDown' && searchResults.length > 0) {
      // Prevent default scroll behavior
      e.preventDefault();
      // Focus could be enhanced here to navigate through results
    }
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
    // Ensure value is a number before formatting
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return 'N/A';
    }
    return numValue > 0 ? `+${numValue.toFixed(2)}%` : `${numValue.toFixed(2)}%`;
  };

  // Format currency based on exchange/region
  const formatCurrency = (value, exchange = 'NASDAQ') => {
    // Determine currency based on exchange
    let currency = 'USD';
    let locale = 'en-US';
    
    if (exchange === 'NSE' || exchange === 'BSE') {
      currency = 'INR';
      locale = 'en-IN';
    }
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // TradingView Widget - Working HTML embed approach with state tracking
  const initTradingViewWidget = (symbol, exchange = 'NASDAQ') => {
    console.log("Initializing TradingView widget for", symbol, "on", exchange);
    
    if (!chartContainerRef.current) {
      console.error("Chart container reference not available");
      return;
    }

    // Reset chart initialization state
    setChartInitialized(false);

    // Clear container with null check
    if (chartContainerRef.current) {
      chartContainerRef.current.innerHTML = '';
    } else {
      console.error("Chart container reference is null");
      return;
    }
    
    try {
      // Generate unique container ID
      const widgetId = `tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
      
      // Determine the correct exchange prefix for TradingView
      const getTradingViewSymbol = (symbol, exchange) => {
        // For Indian stocks, remove the .NS or .BO suffix
        let cleanSymbol = symbol;
        if (symbol.endsWith('.NS') || symbol.endsWith('.BO')) {
          cleanSymbol = symbol.split('.')[0];
        }
        
        switch (exchange) {
          case 'NSE':
            // Try both NSE: prefix and direct symbol for better compatibility
            return `NSE:${cleanSymbol}`;
          case 'BSE':
            return `BSE:${cleanSymbol}`;
          case 'NYSE':
            return `NYSE:${cleanSymbol}`;
          case 'NASDAQ':
          default:
            return `NASDAQ:${cleanSymbol}`;
        }
      };
      
      const tradingViewSymbol = getTradingViewSymbol(symbol, exchange);
      console.log(`TradingView symbol: ${tradingViewSymbol} for ${symbol} on ${exchange}`);
      
      // Configure timezone and locale based on exchange
      const getTimezoneAndLocale = (exchange) => {
        if (exchange === 'NSE' || exchange === 'BSE') {
          return {
            timezone: "Asia/Kolkata",
            locale: "en"
          };
        }
        return {
          timezone: "Etc/UTC",
          locale: "en"
        };
      };
      
      const { timezone, locale } = getTimezoneAndLocale(exchange);
      
      // Create the TradingView widget HTML directly
      const widgetHTML = `
        <!-- TradingView Widget BEGIN -->
        <div class="tradingview-widget-container" style="height:500px;width:100%">
          <div class="tradingview-widget-container__widget" id="${widgetId}"></div>
          <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" async>
          {
            "autosize": true,
            "symbol": "${tradingViewSymbol}",
            "interval": "D",
            "timezone": "${timezone}",
            "theme": "light",
            "style": "1",
            "locale": "${locale}",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "allow_symbol_change": true,
            "details": true,
            "hotlist": false,
            "calendar": false,
            "studies": [
              "Volume@tv-basicstudies"
            ],
            "container_id": "${widgetId}"
          }
          </script>
        </div>
        <!-- TradingView Widget END -->
      `;

      // Show loading message first (with null check)
      if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = `
          <div style="
            height: 500px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            color: #6c757d;
          ">
            <div style="text-align: center;">
              <div style="font-size: 20px; margin-bottom: 10px;">📈</div>
              <div>Initializing ${symbol} chart...</div>
              <div style="font-size: 12px; margin-top: 8px;">Powered by TradingView</div>
            </div>
          </div>
        `;
      }

      // Load the actual widget after a delay
      setTimeout(() => {
        if (chartContainerRef.current) {
          chartContainerRef.current.innerHTML = widgetHTML;
          console.log(`TradingView widget HTML set for ${symbol}`);
        }
        
        // Force script execution by recreating it
        setTimeout(() => {
          if (chartContainerRef.current) {
            const scripts = chartContainerRef.current.getElementsByTagName('script');
            for (let script of scripts) {
              const newScript = document.createElement('script');
              newScript.type = script.type;
              newScript.src = script.src;
              newScript.async = script.async;
              newScript.innerHTML = script.innerHTML;
              script.parentNode.replaceChild(newScript, script);
            }
            console.log(`TradingView scripts reloaded for ${symbol}`);
            setChartInitialized(true);
          }
        }, 200);
        
        // Show fallback if TradingView doesn't load within 10 seconds
        setTimeout(() => {
          if (chartContainerRef.current) {
            // Check if TradingView has loaded by looking for its elements
            const tvElements = chartContainerRef.current.querySelectorAll('iframe, canvas, .tv-embed-widget-wrapper');
            if (tvElements.length === 0) {
              console.log('TradingView timeout - showing fallback chart');
              showChartError(symbol, 'TradingView chart taking too long to load', exchange);
            }
          }
        }, 10000);
        
      }, 1200);
      
    } catch (error) {
      console.error("Error creating TradingView widget:", error);
      showChartError(symbol, error.message, exchange);
    }
  };
  
  // Show chart error with fallback
  const showChartError = (symbol, errorMessage, exchange = 'NASDAQ') => {
    if (chartContainerRef.current) {
      // Determine currency symbol based on exchange
      const getCurrencySymbol = (exchange) => {
        return (exchange === 'NSE' || exchange === 'BSE') ? '₹' : '$';
      };
      
      const currencySymbol = getCurrencySymbol(exchange);
      
      chartContainerRef.current.innerHTML = `
        <div style="
          height: 500px; 
          display: flex; 
          flex-direction: column;
          align-items: center; 
          justify-content: center; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          color: white;
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 40px;
        ">
          <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
          <div style="font-size: 24px; margin-bottom: 16px; font-weight: bold;">${symbol} Chart (${exchange})</div>
          <div style="font-size: 16px; margin-bottom: 20px; opacity: 0.9;">
            Interactive chart temporarily unavailable
          </div>
          <div style="font-size: 14px; opacity: 0.8; max-width: 400px; line-height: 1.4; margin-bottom: 20px;">
            ${analysis && analysis.stockData ? 
              `Current Price: ${currencySymbol}${analysis.stockData.currentPrice?.toFixed(2) || 'N/A'}<br>
               Change: ${analysis.stockData.change >= 0 ? '+' : ''}${analysis.stockData.change?.toFixed(2) || '0.00'} 
               (${analysis.stockData.changePercent?.toFixed(2) || '0.00'}%)<br>
               Volume: ${analysis.stockData.volume?.toLocaleString() || 'N/A'}` 
              : 'Loading stock data...'}
          </div>
          <div style="margin-top: 20px; padding: 12px 24px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 12px;">
            ${errorMessage || 'Chart loading...'}
          </div>
          <button 
            onclick="window.location.reload()" 
            style="
              margin-top: 20px;
              background: rgba(255,255,255,0.2); 
              color: white; 
              border: 1px solid rgba(255,255,255,0.3); 
              padding: 10px 20px; 
              border-radius: 6px; 
              cursor: pointer;
              font-size: 14px;
            "
          >
            🔄 Refresh Page
          </button>
        </div>
      `;
    }
  };

  useEffect(() => {
    // Load default stock (e.g., AAPL) on component mount
    const defaultStock = { symbol: 'AAPL', name: 'Apple Inc.' };
    setSelectedStock(defaultStock);
    setSearchTerm(defaultStock.symbol);
    
    console.log('Stock Analysis component mounted, initializing with', defaultStock.symbol);
    
    // Add a small delay to ensure DOM is ready, then fetch data only
    const timer = setTimeout(() => {
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
  
  // Chart initialization effect - improved timing and state tracking
  useEffect(() => {
    if (selectedStock && selectedStock.symbol) {
      console.log('Selected stock changed, initializing chart for:', selectedStock.symbol);
      
      // Wait for the DOM to be ready and chart container to be available
      const initChart = () => {
        if (chartContainerRef.current) {
          console.log('Chart container is ready, initializing chart');
          initTradingViewWidget(selectedStock.symbol, selectedStock.exchange);
        } else {
          console.log('Chart container not ready, retrying...');
          // Retry after a short delay
          setTimeout(initChart, 300);
        }
      };
      
      // Start initialization with a longer delay to ensure component is fully mounted
      const timer = setTimeout(initChart, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedStock]);
  
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
      <div className="search-container" ref={searchContainerRef}>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search stocks (e.g., AAPL, Tesla, Microsoft)..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyPress}
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
                  <div className="search-result-content">
                    {stock.logo && (
                      <img 
                        src={stock.logo} 
                        alt={`${stock.name} logo`}
                        className="search-result-logo"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="search-result-info">
                      <div className="search-result-symbol">{stock.symbol}</div>
                      <div className="search-result-name">{stock.name}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                        {stock.sector && (
                          <div className="search-result-sector">{stock.sector}</div>
                        )}
                        {stock.exchange && (
                          <div className="search-result-exchange">{stock.exchange}</div>
                        )}
                      </div>
                    </div>
                  </div>
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
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 rounded-2xl p-8 mb-8 text-white shadow-2xl relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-20 -translate-y-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full transform -translate-x-10 translate-y-10"></div>
            
            {analysis.stockData?.error ? (
              <ErrorDisplay 
                error={analysis.stockData} 
                title="Stock Data Unavailable" 
              />
            ) : (
              <div className="relative z-10">
                {/* Main Stock Info */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-6">
                    {selectedStock?.logo && (
                      <img 
                        src={selectedStock.logo} 
                        alt={`${selectedStock.name} logo`}
                        className="w-20 h-20 rounded-xl bg-white/90 p-2 shadow-lg flex-shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-sm">
                        {analysis.stockData?.name || selectedStock?.name || 'Unknown Company'}
                      </h1>
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-xl font-semibold text-white/90 tracking-wide">
                          {analysis.stockData?.symbol || selectedStock?.symbol}
                        </span>
                        {selectedStock?.exchange && (
                          <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                            {selectedStock.exchange}
                          </span>
                        )}
                      </div>
                      {selectedStock?.sector && (
                        <span className="inline-block px-4 py-1 bg-white/10 rounded-full text-sm font-medium text-white/80 backdrop-blur-sm">
                          {selectedStock.sector}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price Information */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-4xl font-bold text-white drop-shadow-sm">
                      {analysis.stockData?.currentPrice && formatCurrency(analysis.stockData.currentPrice, selectedStock?.exchange)}
                    </div>
                    {analysis.stockData?.changePercent != null && !isNaN(analysis.stockData.changePercent) && (
                      <div className={`flex items-center px-4 py-2 rounded-full font-bold text-lg shadow-lg ${
                        analysis.stockData.changePercent >= 0 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        <span className="mr-1">
                          {analysis.stockData.changePercent >= 0 ? '↗' : '↘'}
                        </span>
                        {formatPercent(analysis.stockData.changePercent)}
                      </div>
                    )}
                  </div>
                  
                  {/* Additional Stats */}
                  <div className="text-right">
                    {analysis.stockData?.volume && (
                      <div className="text-white/80 mb-1">
                        <span className="text-sm">Volume: </span>
                        <span className="font-semibold">{analysis.stockData.volume.toLocaleString()}</span>
                      </div>
                    )}
                    {analysis.stockData?.marketCap && (
                      <div className="text-white/80">
                        <span className="text-sm">Market Cap: </span>
                        <span className="font-semibold">{formatCurrency(analysis.stockData.marketCap, selectedStock?.exchange)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Data Source */}
                {analysis.stockData?.source && analysis.stockData.source === "Demo Data" && (
                  <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg font-bold">
                    ⚠️ ERROR: Demo Data detected. This should not appear during development.
                  </div>
                )}
                {analysis.stockData?.source && analysis.stockData.source !== "Demo Data" && (
                  <div className="mt-4 inline-block px-4 py-2 bg-white/10 rounded-full text-sm font-medium text-white/70 backdrop-blur-sm">
                    Data source: {analysis.stockData.source}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* TradingView Chart */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-xl border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <span className="text-2xl">📈</span>
                Interactive Chart - {selectedStock?.symbol}
              </h3>
              <button 
                onClick={() => {
                  if (selectedStock) {
                    console.log('Force refreshing chart for', selectedStock.symbol);
                    setChartInitialized(false);
                    setTimeout(() => {
                      initTradingViewWidget(selectedStock.symbol, selectedStock.exchange);
                    }, 100);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                <span>🔄</span>
                Refresh Chart
              </button>
            </div>
            <div 
              ref={chartContainerRef}
              className="w-full h-[500px] border border-gray-200 rounded-xl bg-white relative overflow-hidden"
            />
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
                      <span>AI Target Price: {formatCurrency(analysis.overallRecommendation.targetPrice, selectedStock?.exchange)}</span>
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
