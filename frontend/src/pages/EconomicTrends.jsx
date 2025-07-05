  // src/pages/EconomicTrends.jsx
import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import RiskMatrix from '../components/charts/RiskMatrix';
import GlobalDistribution from '../components/charts/GlobalDistribution';
import './EconomicTrends.css';

function EconomicTrends() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1Y');
  const [economicData, setEconomicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const formatValue = (value, type = 'number', precision = 1) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value !== 'number') return 'N/A';
    try {
      const formatted = value.toFixed(precision);
      switch (type) {
        case 'percent':
          return `${formatted}%`;
        case 'currency':
          return `$${formatted}T`;
        default:
          return formatted;
      }
    } catch (err) {
      return 'N/A';
    }
  };

  const formatTrend = (trend, type = 'percent') => {
    if (!trend?.momentum) return 'N/A';
    try {
      const value = Number(trend.momentum);
      const prefix = value > 0 ? '+' : '';
      const formatted = formatValue(value, type);
      return `${prefix}${formatted}`;
    } catch (err) {
      return 'N/A';
    }
  };

  const fetchEconomicData = useCallback(async () => {
    try {
      setLoading(true);
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/api/economic-indicators/summary?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const result = await response.json();
      
      if (response.ok) {
        // Extract the data from the API response structure
        setEconomicData(result.data);
        setLastUpdate(new Date());
        setError(null);
        console.log('Fresh economic data loaded:', result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch economic data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchEconomicData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchEconomicData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEconomicData]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800">Loading Economic Data</h3>
            <p className="text-slate-600">Fetching the latest market insights...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800">Unable to Load Data</h3>
            <p className="text-slate-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Modern Header with Glass Effect */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                Economic Trends Dashboard
              </h1>
              <p className="text-slate-600 mt-1">Real-time insights into global economic indicators</p>
            </div>
            {lastUpdate && (
              <div className="flex items-center space-x-2 text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics with Modern Cards */}
        <section className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            <h2 className="text-xl font-semibold text-slate-800">Key Economic Indicators</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* GDP Card */}
            <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-sm">GDP</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-700">Gross Domestic Product</h3>
                      <p className="text-xs text-slate-500">Global economic output</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-slate-800">
                    {formatValue(economicData?.gdp?.value, 'currency')}
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    economicData?.gdp?.trend?.['90d']?.momentum > 0 
                      ? 'bg-green-100 text-green-700' 
                      : economicData?.gdp?.trend?.['90d']?.momentum < 0 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {economicData?.gdp?.trend?.['90d']?.momentum > 0 ? '↗' : economicData?.gdp?.trend?.['90d']?.momentum < 0 ? '↘' : '→'} 
                    {formatTrend(economicData?.gdp?.trend?.['90d'])} (90d)
                  </div>
                </div>
              </div>
            </div>

            {/* Inflation Card */}
            <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-xl hover:border-orange-200 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-xs">INF</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-700">Inflation Rate</h3>
                      <p className="text-xs text-slate-500">Consumer price index</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-slate-800">
                    {formatValue(economicData?.inflation?.value, 'percent')}
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    economicData?.inflation?.trend?.['30d']?.momentum > 0 
                      ? 'bg-red-100 text-red-700' 
                      : economicData?.inflation?.trend?.['30d']?.momentum < 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {economicData?.inflation?.trend?.['30d']?.momentum > 0 ? '↗' : economicData?.inflation?.trend?.['30d']?.momentum < 0 ? '↘' : '→'} 
                    {formatTrend(economicData?.inflation?.trend?.['30d'])} (30d)
                  </div>
                </div>
              </div>
            </div>

            {/* Unemployment Card */}
            <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-xl hover:border-purple-200 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-xs">UNE</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-700">Unemployment</h3>
                      <p className="text-xs text-slate-500">Labor market health</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-slate-800">
                    {formatValue(economicData?.unemployment?.value, 'percent')}
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    economicData?.unemployment?.trend?.['30d']?.momentum > 0 
                      ? 'bg-red-100 text-red-700' 
                      : economicData?.unemployment?.trend?.['30d']?.momentum < 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {economicData?.unemployment?.trend?.['30d']?.momentum > 0 ? '↗' : economicData?.unemployment?.trend?.['30d']?.momentum < 0 ? '↘' : '→'} 
                    {formatTrend(economicData?.unemployment?.trend?.['30d'])} (30d)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modern Visualization Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
              <h2 className="text-xl font-semibold text-slate-800">Market Analytics</h2>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Live data visualization</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* GDP Time Series */}
            {economicData?.visualizations?.timeSeriesCharts?.gdpTrends && (
              <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="relative">
                  <TimeSeriesChart
                    data={economicData.visualizations.timeSeriesCharts.gdpTrends.data}
                    config={economicData.visualizations.timeSeriesCharts.gdpTrends.config}
                  />
                </div>
              </div>
            )}

            {/* Inflation Time Series */}
            {economicData?.visualizations?.timeSeriesCharts?.inflationTrends && (
              <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 hover:shadow-xl hover:border-orange-200 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="relative">
                  <TimeSeriesChart
                    data={economicData.visualizations.timeSeriesCharts.inflationTrends.data}
                    config={economicData.visualizations.timeSeriesCharts.inflationTrends.config}
                  />
                </div>
              </div>
            )}

            {/* Global GDP Distribution */}
            {economicData?.visualizations?.comparativeCharts?.globalGDP && (
              <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="relative">
                  <GlobalDistribution
                    data={economicData.visualizations.comparativeCharts.globalGDP.data}
                    config={economicData.visualizations.comparativeCharts.globalGDP.config}
                  />
                </div>
              </div>
            )}

            {/* Risk Matrix */}
            {economicData?.visualizations?.heatmaps?.riskMatrix && (
              <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 hover:shadow-xl hover:border-red-200 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="relative">
                  <RiskMatrix
                    data={economicData.visualizations.heatmaps.riskMatrix.data}
                    config={economicData.visualizations.heatmaps.riskMatrix.config}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Modern AI Insights Section */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-1 h-8 bg-gradient-to-b from-violet-500 to-violet-600 rounded-full"></div>
            <h2 className="text-xl font-semibold text-slate-800">AI-Powered Insights</h2>
          </div>
          
          {economicData?.aiInsights && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* AI Confidence Card */}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-200/60">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AI</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Analysis Confidence</h3>
                    <p className="text-sm text-slate-600">Machine learning accuracy</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-3xl font-bold text-slate-800">
                    {formatValue(economicData.aiInsights.confidence, 'percent')}
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${economicData.aiInsights.confidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Top Stories Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center space-x-2">
                  <span>📰</span>
                  <span>Market Headlines</span>
                </h3>
                <div className="space-y-3">
                  {economicData.aiInsights.topStories.map((story, index) => (
                    <div key={index} className={`p-4 rounded-xl border-l-4 ${
                      story.sentiment === 'positive' 
                        ? 'bg-green-50 border-green-400 text-green-800' 
                        : story.sentiment === 'negative'
                        ? 'bg-red-50 border-red-400 text-red-800'
                        : 'bg-blue-50 border-blue-400 text-blue-800'
                    }`}>
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-sm">{story.title}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          story.sentiment === 'positive' 
                            ? 'bg-green-100 text-green-700' 
                            : story.sentiment === 'negative'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {story.sentiment === 'positive' ? '↗ Positive' : story.sentiment === 'negative' ? '↘ Negative' : '→ Neutral'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights and Themes */}
              {(economicData.aiInsights.insights.length > 0 || economicData.aiInsights.themes.length > 0) && (
                <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {economicData.aiInsights.insights.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center space-x-2">
                          <span>💡</span>
                          <span>Key Insights</span>
                        </h4>
                        <div className="space-y-2">
                          {economicData.aiInsights.insights.map((insight, index) => (
                            <div key={index} className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                              {insight}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {economicData.aiInsights.themes.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center space-x-2">
                          <span>🏷️</span>
                          <span>Market Themes</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {economicData.aiInsights.themes.map((theme, index) => (
                            <span key={index} className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-xs font-medium border border-blue-200">
                              {theme}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default EconomicTrends;
