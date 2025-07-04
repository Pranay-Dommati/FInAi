import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaChartLine } from 'react-icons/fa';
import { RiRobot2Fill } from 'react-icons/ri';

const WelcomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();
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

    // Add event listeners
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup event listeners
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Server port configuration with fallback
  const API_BASE_PORTS = [5000, 5001, 5002, 5003, 5004];
  let currentPortIndex = 0;
  let API_BASE_URL = `http://localhost:${API_BASE_PORTS[currentPortIndex]}`;

  // Function to try the next available port
  const tryNextPort = () => {
    currentPortIndex = (currentPortIndex + 1) % API_BASE_PORTS.length;
    API_BASE_URL = `http://localhost:${API_BASE_PORTS[currentPortIndex]}`;
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
    
    // If the search term is empty, clear results immediately
    if (!value.trim()) {
      setSearchResults([]);
    } else {
      searchStocks(value);
    }
  };

  // Handle stock selection
  const handleStockSelect = (stock) => {
    setSearchTerm('');
    setSearchResults([]);
    navigate(`/stockanalysis?symbol=${stock.symbol}`);
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
        const symbol = searchTerm.trim().toUpperCase();
        handleStockSelect({ symbol, name: symbol });
      }
    } else if (e.key === 'Escape') {
      // Close dropdown on Escape key
      setSearchResults([]);
      e.target.blur(); // Remove focus from input
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl w-full rounded-xl p-6 flex flex-col items-center backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <RiRobot2Fill className="text-indigo-500 text-5xl" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Stock Analysis
            </h1>
          </div>
          <p className="text-gray-500 max-w-lg mx-auto">
            Real-time data • AI risk assessment • Smart recommendations
          </p>
        </div>

        <div className="w-full max-w-xl relative" ref={searchContainerRef}>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyPress}
              placeholder="Search stocks (e.g., AAPL, Tesla, Microsoft)..."
              className="w-full py-3 px-4 pr-12 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <span className="absolute right-3 top-3 text-gray-400">
              <FaSearch />
            </span>
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden max-h-36 overflow-y-auto">
              {searchResults.map((result) => (
                <div
                  key={result.symbol}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center"
                  onClick={() => handleStockSelect(result)}
                >
                  <div>
                    <div className="font-medium">{result.symbol}</div>
                    <div className="text-sm text-gray-600 truncate">{result.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
