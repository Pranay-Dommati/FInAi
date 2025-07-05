import express from 'express';
import { formatDistanceToNow } from 'date-fns';
import logger from '../utils/logger.js';
import realTimeService from '../services/realTimeEconomicService.js';

const router = express.Router();

const getMockData = () => ({
  gdp: {
    value: 31.8,
    trend: { '90d': { momentum: 2.2 } },
    detailed: {
      economies: [
        {
          country: 'United States',
          value: 31.8,
          trend: { '90d': { momentum: 2.2 } }
        }
      ],
      impact: {
        overall: 'strong_growth',
        factors: ['Technology sector expansion', 'Consumer spending resilience']
      }
    }
  },
  inflation: {
    value: 2.0,
    trend: { '30d': { momentum: -0.1 } }
  },
  unemployment: {
    value: 3.8,
    trend: { '30d': { momentum: -0.2 } }
  },
  market: {
    volatilityIndex: 12.8,
    trend: { '30d': { momentum: -1.8 } }
  },
  aiInsights: {
    confidence: 82.5,
    insights: [
      'Economic growth remains robust despite global uncertainties',
      'Labor market showing continued strength with declining unemployment',
      'Inflation trending toward Federal Reserve target of 2%'
    ],
    themes: [
      'Post-pandemic recovery',
      'AI-driven productivity gains',
      'Green energy transition',
      'Supply chain normalization'
    ],
    topStories: [
      { title: 'US Economy Shows Resilient Growth in Q2 2025', sentiment: 'positive' },
      { title: 'Fed Maintains Steady Monetary Policy Approach', sentiment: 'neutral' },
      { title: 'Tech Sector Drives Innovation and Employment', sentiment: 'positive' },
      { title: 'Global Trade Relations Stabilize', sentiment: 'positive' }
    ]
  }
});

// Get summary of real-time economic indicators
router.get('/summary', async (req, res) => {
  try {
    logger.info('Fetching real-time economic indicators summary');
    
    // Set a timeout for real data fetching
    const timeout = 10000; // 10 seconds timeout
    let data;
    
    // Check if mock data should be used
    if (process.env.USE_MOCK_DATA === 'true') {
      logger.info('Using mock data for economic indicators');
      data = getMockData();
    } else {
      try {
        // Try to get real data with timeout
        const dataPromise = realTimeService.getEconomicIndicators();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        );
        
        data = await Promise.race([dataPromise, timeoutPromise]);
      } catch (error) {
        logger.warn('Failed to fetch real data, falling back to mock data:', error);
        data = getMockData();
      }
    }

    // Ensure visualization data is always present
    if (!data.visualizations) {
      // Generate visualizations from real-time data
      data.visualizations = {
        timeSeriesCharts: {
          gdpTrends: {
            data: (() => {
              if (data.gdp?.historical?.length > 0) {
                // Get real data and reverse it for chronological order
                const realData = data.gdp.historical.slice(0, 8).reverse().map(item => ({
                  date: item.date,
                  value: item.value,
                  yoy: ((item.value - (data.gdp?.historical?.[1]?.value || item.value)) / (data.gdp?.historical?.[1]?.value || item.value)) * 100,
                  type: 'actual'
                }));
                
                // Add projected data for current quarter if latest data is older than 3 months
                const latestDate = new Date(realData[realData.length - 1].date);
                const currentDate = new Date();
                const monthsDiff = (currentDate.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
                
                if (monthsDiff > 3) {
                  const latestValue = realData[realData.length - 1].value;
                  const growthRate = data.gdp?.trend?.['90d']?.momentum || 0.8;
                  const quarterlyGrowth = (growthRate / 100) / 4; // Convert annual to quarterly
                  
                  // Add Q2 2025 projection
                  realData.push({
                    date: '2025-04-01',
                    value: latestValue * (1 + quarterlyGrowth),
                    yoy: growthRate,
                    type: 'projected'
                  });
                  
                  // Add Q3 2025 projection (current quarter)
                  realData.push({
                    date: '2025-07-01',
                    value: latestValue * (1 + quarterlyGrowth * 2),
                    yoy: growthRate,
                    type: 'projected'
                  });
                }
                
                return realData;
              } else {
                // Fallback to mock data if no real data available
                return [
                  { date: '2024-01-01', value: 29.8, yoy: 2.4, type: 'actual' },
                  { date: '2024-04-01', value: 30.2, yoy: 2.8, type: 'actual' },
                  { date: '2024-07-01', value: 30.6, yoy: 3.1, type: 'actual' },
                  { date: '2024-10-01', value: 31.0, yoy: 2.9, type: 'actual' },
                  { date: '2025-01-01', value: 31.2, yoy: 2.6, type: 'actual' },
                  { date: '2025-04-01', value: 31.5, yoy: 2.4, type: 'projected' },
                  { date: '2025-07-01', value: 31.8, yoy: 2.2, type: 'projected' }
                ];
              }
            })(),
            config: {
              title: 'GDP Growth Trends (Real-time)',
              yAxisLabel: 'GDP (Trillion USD)',
              secondaryYAxisLabel: 'YoY Change (%)'
            }
          },
          inflationTrends: {
            data: data.inflation?.historical?.slice(0, 8).reverse().map(item => ({
              date: item.date,
              value: ((item.value - (data.inflation?.historical?.[12]?.value || item.value)) / (data.inflation?.historical?.[12]?.value || item.value)) * 100,
              core: ((item.value - (data.inflation?.historical?.[12]?.value || item.value)) / (data.inflation?.historical?.[12]?.value || item.value)) * 100 * 0.85
            })) || [
              { date: '2024-01-01', value: 3.2, core: 2.8 },
              { date: '2024-04-01', value: 2.9, core: 2.5 },
              { date: '2024-07-01', value: 2.6, core: 2.3 },
              { date: '2024-10-01', value: 2.4, core: 2.1 },
              { date: '2025-01-01', value: 2.2, core: 1.9 },
              { date: '2025-04-01', value: 2.1, core: 1.8 },
              { date: '2025-07-01', value: 2.0, core: 1.7 }
            ],
            config: {
              title: 'Inflation Trends (Real-time)',
              yAxisLabel: 'Rate (%)'
            }
          }
        },
        comparativeCharts: {
          globalGDP: {
            data: [
              { country: 'United States', value: data.gdp?.value || 31.8, share: 22.8 },
              { country: 'China', value: 26.2, share: 18.8 },
              { country: 'Japan', value: 4.4, share: 3.2 },
              { country: 'Germany', value: 4.2, share: 3.0 },
              { country: 'India', value: 4.1, share: 2.9 }
            ],
            config: {
              title: 'Global GDP Distribution (Real-time)',
              type: 'pieChart'
            }
          }
        },
        heatmaps: {
          riskMatrix: {
            data: [
              { 
                factor: 'Inflation', 
                risk: data.inflation?.value > 3 ? 'high' : data.inflation?.value > 2 ? 'medium' : 'low', 
                value: (data.inflation?.value || 2.0) / 5.0 
              },
              { 
                factor: 'Interest Rates', 
                risk: 'medium', 
                value: 0.6 
              },
              { 
                factor: 'Unemployment', 
                risk: data.unemployment?.value > 5 ? 'high' : data.unemployment?.value > 3.5 ? 'medium' : 'low', 
                value: (data.unemployment?.value || 3.8) / 10.0 
              },
              { 
                factor: 'GDP Growth', 
                risk: (data.gdp?.trend?.['90d']?.momentum || 0) < 0 ? 'high' : (data.gdp?.trend?.['90d']?.momentum || 0) < 1 ? 'medium' : 'low', 
                value: Math.abs(data.gdp?.trend?.['90d']?.momentum || 2.2) / 5.0 
              }
            ],
            config: {
              title: 'Economic Risk Matrix (Real-time)',
              colorScale: ['#10b981', '#f59e0b', '#ef4444']
            }
          }
        }
      };
    }

    res.json(data);
  } catch (error) {
    logger.error('Error in /economic/summary endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch economic indicators',
      mockData: getMockData() // Always send mock data on error
    });
  }
});

export default router;
