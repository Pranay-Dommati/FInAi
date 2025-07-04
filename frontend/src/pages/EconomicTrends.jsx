// src/pages/EconomicTrends.jsx
import { useState } from 'react';

function EconomicTrends() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1Y');
  
  const indicators = [
    { 
      label: "GDP Growth", 
      value: "$23.3T", 
      trend: "+2.4% QoQ",
      isPositive: true,
      icon: "📈",
      description: "Quarterly GDP growth rate",
      color: "from-blue-500 to-blue-600"
    },
    { 
      label: "Inflation Rate", 
      value: "3.2%", 
      trend: "+0.1% MoM",
      isPositive: false,
      icon: "📊",
      description: "Consumer Price Index",
      color: "from-orange-500 to-red-500"
    },
    { 
      label: "Unemployment", 
      value: "3.6%", 
      trend: "-0.1% MoM",
      isPositive: true,
      icon: "👥",
      description: "National unemployment rate",
      color: "from-green-500 to-emerald-600"
    },
    { 
      label: "Interest Rate", 
      value: "5.25%", 
      trend: "No change",
      isPositive: null,
      icon: "🏦",
      description: "Federal funds rate",
      color: "from-purple-500 to-indigo-600"
    },
    { 
      label: "Market Volatility", 
      value: "18.4", 
      trend: "-2.1 points",
      isPositive: true,
      icon: "📉",
      description: "VIX volatility index",
      color: "from-pink-500 to-rose-600"
    },
    { 
      label: "Dollar Index", 
      value: "103.2", 
      trend: "+0.8%",
      isPositive: true,
      icon: "💵",
      description: "US Dollar strength",
      color: "from-teal-500 to-cyan-600"
    }
  ];

  const timeframes = ['1M', '3M', '6M', '1Y', '2Y', '5Y'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
              <span className="mr-3">📊</span>
              Economic Trends
            </h1>
            <p className="text-gray-600 text-lg">
              Track key macroeconomic indicators and market dynamics
            </p>
          </div>
          
          {/* Timeframe Selector */}
          <div className="mt-4 lg:mt-0">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {timeframes.map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    selectedTimeframe === timeframe
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Economic Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {indicators.map((indicator, index) => (
          <div key={index} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${indicator.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                {indicator.icon}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                indicator.isPositive === true ? 'bg-green-100 text-green-700' :
                indicator.isPositive === false ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {indicator.trend}
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{indicator.label}</h3>
            <p className="text-sm text-gray-500 mb-3">{indicator.description}</p>
            <div className="text-3xl font-bold text-gray-900">{indicator.value}</div>
            
            {/* Mini trend indicator */}
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${indicator.color} rounded-full transition-all duration-1000`} 
                   style={{ width: `${Math.random() * 60 + 20}%` }}>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Chart */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Market Overview</h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">GDP</button>
              <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">Inflation</button>
              <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">Employment</button>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-12 rounded-xl border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className="text-8xl mb-6">📈</div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-3">Interactive Economic Dashboard</h3>
              <p className="text-gray-500 mb-6">Multi-layered time series visualization with correlation analysis</p>
              <div className="flex justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">GDP Growth</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Inflation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Employment</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Market Summary */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📋</span>
              Market Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">S&P 500</span>
                <span className="font-semibold text-green-600">+1.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">NASDAQ</span>
                <span className="font-semibold text-green-600">+2.1%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">DOW</span>
                <span className="font-semibold text-red-600">-0.3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">VIX</span>
                <span className="font-semibold text-yellow-600">18.4</span>
              </div>
            </div>
          </div>

          {/* Economic Calendar */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📅</span>
              Upcoming Events
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                <p className="font-medium text-gray-900 text-sm">Fed Meeting</p>
                <p className="text-gray-600 text-xs">Dec 18, 2024</p>
              </div>
              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                <p className="font-medium text-gray-900 text-sm">GDP Report</p>
                <p className="text-gray-600 text-xs">Dec 22, 2024</p>
              </div>
              <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded-lg">
                <p className="font-medium text-gray-900 text-sm">Employment Data</p>
                <p className="text-gray-600 text-xs">Jan 5, 2025</p>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🤖</span>
              AI Insights
            </h3>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-700 mb-2">
                Current economic indicators suggest moderate growth with controlled inflation. 
                The labor market remains strong.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-600 font-medium">Confidence: 85%</span>
                <span className="text-xs text-gray-500">Updated 2h ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EconomicTrends;