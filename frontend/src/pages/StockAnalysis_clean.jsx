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
  const [chartInitialized, setChartInitialized] = useState(false);
  const chartContainerRef = useRef(null);
  const searchContainerRef = useRef(null);

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

    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        console.log('Search response:', data);
        setSearchResults(data.data?.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
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
      
      if (searchResults.length > 0) {
        handleStockSelect(searchResults[0]);
      } else if (searchTerm.trim()) {
        const symbol = searchTerm.trim().toUpperCase();
        handleStockSelect({ symbol, name: symbol });
      }
    } else if (e.key === 'Escape') {
      setSearchResults([]);
      e.target.blur();
    }
  };

  // Handle stock selection
  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    setSearchTerm(stock.symbol);
    setSearchResults([]);
    // Add your analysis fetch logic here
  };

  return (
    <div className="stock-analysis" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Clean Single Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 32px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: '#6366f1'
        }}>
          FinAI
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ 
            padding: '8px 16px', 
            backgroundColor: '#6366f1', 
            color: 'white',
            borderRadius: '6px',
            fontWeight: '500',
            fontSize: '14px'
          }}>📊 Stock Analysis</div>
          <div style={{ 
            padding: '8px 16px',
            color: '#64748b',
            fontSize: '14px',
            cursor: 'pointer'
          }}>📈 Economic Trends</div>
          <div style={{ 
            padding: '8px 16px',
            color: '#64748b',
            fontSize: '14px',
            cursor: 'pointer'
          }}>📝 Planning</div>
        </div>
      </div>

      {/* Main Content Container */}
      <div style={{ 
        maxWidth: '1000px', 
        margin: '40px auto',
        padding: '0 20px'
      }}>
        
        {/* Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          marginBottom: '40px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '36px' }}>🚀</span>
            <h1 style={{ 
              color: 'white', 
              margin: 0, 
              fontSize: '32px',
              fontWeight: '700' 
            }}>FinAI Stock Analysis</h1>
          </div>
          <p style={{ 
            color: 'white', 
            margin: 0,
            fontSize: '16px',
            opacity: '0.9'
          }}>
            Advanced AI-powered financial analysis with real-time insights
          </p>
        </div>

        {/* Search Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h3 style={{ 
              fontSize: '22px', 
              fontWeight: '600', 
              color: '#374151',
              margin: '0 0 8px 0'
            }}>
              🔍 Discover Stock Insights
            </h3>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: '0'
            }}>
              Search any stock symbol or company name to get started
            </p>
          </div>
          
          <div className="search-container" ref={searchContainerRef}>
            <div className="search-box" style={{
              position: 'relative',
              backgroundColor: '#f9fafb',
              borderRadius: '10px',
              border: '1px solid #d1d5db',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
              }}>
                <div style={{
                  padding: '12px 16px',
                  color: '#6366f1',
                  fontSize: '18px'
                }}>
                  🔍
                </div>
                <input
                  type="text"
                  placeholder="Search stocks (e.g., AAPL, Tesla, Microsoft, Reliance)..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyPress}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '16px',
                    padding: '14px 16px 14px 0',
                    color: '#374151',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
              {searchResults.length > 0 && (
                <div className="search-results" style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  right: '0',
                  background: 'white',
                  borderRadius: '0 0 10px 10px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #d1d5db',
                  borderTop: 'none',
                  zIndex: 1000,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {searchResults.map((stock, index) => (
                    <div
                      key={index}
                      className="search-result-item"
                      onClick={() => handleStockSelect(stock)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: index < searchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {stock.logo && (
                          <img 
                            src={stock.logo} 
                            alt={`${stock.name} logo`}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: '600',
                            fontSize: '14px',
                            color: '#374151'
                          }}>{stock.symbol}</div>
                          <div style={{
                            color: '#6b7280',
                            fontSize: '12px',
                            marginTop: '2px'
                          }}>{stock.name}</div>
                          {(stock.sector || stock.exchange) && (
                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                              {stock.sector && (
                                <span style={{
                                  background: '#f3f4f6',
                                  color: '#4b5563',
                                  padding: '2px 6px',
                                  borderRadius: '8px',
                                  fontSize: '10px'
                                }}>{stock.sector}</span>
                              )}
                              {stock.exchange && (
                                <span style={{
                                  background: '#6366f1',
                                  color: 'white',
                                  padding: '2px 6px',
                                  borderRadius: '8px',
                                  fontSize: '10px'
                                }}>{stock.exchange}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          <p>Analyzing {selectedStock?.symbol}...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          maxWidth: '600px',
          margin: '20px auto',
          padding: '20px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#b91c1c'
        }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Error Occurred</h3>
          <p style={{ margin: '0' }}>{error}</p>
        </div>
      )}

      {/* Analysis results would go here */}
      {analysis && !loading && (
        <div style={{
          maxWidth: '1000px',
          margin: '20px auto',
          padding: '0 20px'
        }}>
          {/* Add your analysis display components here */}
          <p>Analysis data loaded for {selectedStock?.symbol}</p>
        </div>
      )}
    </div>
  );
};

export default StockAnalysis;
