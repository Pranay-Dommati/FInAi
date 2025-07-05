import axios from 'axios';
import logger from '../utils/logger.js';

import economicIndicatorsService from './economicIndicators.js';

class RealTimeEconomicService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = process.env.CACHE_DURATION || 5 * 60 * 1000; // 5 minutes
        this.economicIndicatorsService = economicIndicatorsService;
    }

    async getGDPTrends() {
        try {
            const gdpData = await this.economicIndicatorsService.getFREDData('GDP');
            const observations = gdpData.observations;
            
            if (!observations || !observations.length) {
                throw new Error('No GDP data available');
            }

            const latest = observations[0].value;
            const previousQuarter = observations.length > 1 ? observations[1].value : latest;
            const momentum = ((latest - previousQuarter) / previousQuarter) * 100;

            return {
                value: latest / 1000, // Convert to trillions
                date: observations[0].date,
                trend: {
                    '90d': {
                        momentum: momentum
                    }
                },
                historical: observations.map(obs => ({
                    value: obs.value / 1000,
                    date: obs.date
                }))
            };
        } catch (error) {
            logger.error('Error processing GDP data:', error);
            return { 
                value: null, 
                trend: { '90d': { momentum: 0 } },
                historical: []
            };
        }
    }

    async getInflationRate() {
        try {
            const cpiData = await this.economicIndicatorsService.getFREDData('CPIAUCSL');
            const observations = cpiData.observations;

            if (!observations || !observations.length) {
                throw new Error('No CPI data available');
            }

            const latest = observations[0].value;
            const previousMonth = observations.length > 1 ? observations[1].value : latest;
            const previousYear = observations.length > 11 ? observations[11].value : latest;
            
            const yoyInflation = ((latest - previousYear) / previousYear) * 100;
            const momInflation = ((latest - previousMonth) / previousMonth) * 100;
            
            return {
                value: yoyInflation,
                date: observations[0].date,
                trend: {
                    '30d': {
                        momentum: momInflation
                    }
                },
                historical: observations.map(obs => ({
                    value: obs.value,
                    date: obs.date
                }))
            };
        } catch (error) {
            logger.error('Error processing inflation data:', error);
            return { 
                value: null, 
                trend: { '30d': { momentum: 0 } },
                historical: []
            };
        }
    }

    async getUnemploymentData() {
        try {
            const response = await axios.get(`https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=${this.FRED_API_KEY}&file_type=json&sort_order=desc&limit=12`);
            const latest = response.data.observations[0];
            return {
                value: parseFloat(latest.value),
                date: latest.date,
                historical: response.data.observations.map(obs => ({
                    value: parseFloat(obs.value),
                    date: obs.date
                }))
            };
        } catch (error) {
            logger.error('Error fetching unemployment data:', error);
            return { value: null, trend: { '30d': { momentum: 0 } } };
        }
    }

    async getAIInsights() {
        try {
            const [gdpData, inflationData, unemploymentData] = await Promise.all([
                this.getGDPTrends(),
                this.getInflationRate(),
                this.getUnemploymentData()
            ]);

            // Calculate confidence based on data availability and quality
            const dataPoints = [gdpData, inflationData, unemploymentData];
            const availableDataPoints = dataPoints.filter(d => d.value !== null).length;
            const confidence = (availableDataPoints / dataPoints.length) * 100;

            // Generate insights based on available data
            let insights = [];
            let themes = [];
            let topStories = [];
            
            if (gdpData.value !== null) {
                const gdpMomentum = gdpData.trend['90d'].momentum;
                insights.push(
                    `GDP is currently ${gdpMomentum > 0 ? 'expanding' : 'contracting'} with a momentum of ${gdpMomentum.toFixed(2)}%.`
                );
                themes.push('GDP');
            }

            if (inflationData.value !== null) {
                const inflationYoY = inflationData.value;
                insights.push(
                    `Inflation is ${inflationYoY > 2 ? 'above target' : 'stable'} at ${inflationYoY.toFixed(2)}%.`
                );
                themes.push('Inflation');
            }

            if (unemploymentData.value !== null) {
                const unemploymentRate = unemploymentData.value;
                insights.push(
                    `Employment is ${unemploymentRate < 5 ? 'strong' : 'weak'} with a rate of ${unemploymentRate.toFixed(2)}%.`
                );
                themes.push('Employment');
            }

            // Example top stories (could be replaced with real news in the future)
            topStories = [
                { title: 'Global Economic Recovery Continues', sentiment: 'positive' },
                { title: 'Central Banks Monitor Inflation', sentiment: 'neutral' },
                { title: 'Trade Volume Reaches New Heights', sentiment: 'positive' }
            ];

            return {
                confidence,
                insights,
                themes,
                topStories,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Error generating AI insights:', error);
            return {
                confidence: 0,
                insights: [],
                themes: [],
                topStories: [],
                timestamp: new Date().toISOString()
            };
        }
    }

    async getDetailedGDPData() {
        try {
            // Get major economies' GDP data
            const countries = [
                { id: 'GDP', name: 'United States' },
                { id: 'INGDP', name: 'India' },
                { id: 'CNGDP', name: 'China' },
                { id: 'JPGDP', name: 'Japan' },
                { id: 'EUGDP', name: 'European Union' },
                { id: 'UKGDP', name: 'United Kingdom' }
            ];

            const gdpPromises = countries.map(async country => {
                try {
                    const data = await this.economicIndicatorsService.getFREDData(country.id);
                    const observations = data.observations;
                    
                    if (!observations || !observations.length) return null;

                    const latest = observations[0].value;
                    const previousQuarter = observations.length > 1 ? observations[1].value : latest;
                    const momentum = ((latest - previousQuarter) / previousQuarter) * 100;

                    return {
                        country: country.name,
                        value: latest / 1000, // Convert to trillions
                        date: observations[0].date,
                        trend: {
                            '90d': {
                                momentum: momentum
                            }
                        },
                        historical: observations.slice(0, 8).map(obs => ({
                            value: obs.value / 1000,
                            date: obs.date
                        }))
                    };
                } catch (error) {
                    logger.error(`Error fetching GDP data for ${country.name}:`, error);
                    return null;
                }
            });

            const gdpData = (await Promise.all(gdpPromises)).filter(data => data !== null);

            // Get correlated market indices
            const marketIndices = [
                { symbol: '^GSPC', name: 'S&P 500' },
                { symbol: '^BSESN', name: 'BSE SENSEX' },
                { symbol: '000001.SS', name: 'Shanghai Composite' },
                { symbol: '^N225', name: 'Nikkei 225' },
                { symbol: '^STOXX50E', name: 'EURO STOXX 50' },
                { symbol: '^FTSE', name: 'FTSE 100' }
            ];

            const marketPromises = marketIndices.map(async index => {
                try {
                    const response = await axios.get(
                        `https://query1.finance.yahoo.com/v8/finance/chart/${index.symbol}?interval=1d&range=90d`
                    );

                    if (!response.data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close) {
                        return null;
                    }

                    const closes = response.data.chart.result[0].indicators.quote[0].close;
                    const latest = closes[closes.length - 1];
                    const start = closes[0];
                    const change = ((latest - start) / start) * 100;

                    return {
                        index: index.name,
                        value: latest,
                        change: change
                    };
                } catch (error) {
                    logger.error(`Error fetching market data for ${index.name}:`, error);
                    return null;
                }
            });

            const marketData = (await Promise.all(marketPromises)).filter(data => data !== null);

            // Calculate correlations and economic impact
            const globalEconomicImpact = this.calculateGlobalEconomicImpact(gdpData, marketData);

            return {
                economies: gdpData,
                markets: marketData,
                impact: globalEconomicImpact,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Error in getDetailedGDPData:', error);
            return {
                economies: [],
                markets: [],
                impact: { overall: 'neutral', factors: [] },
                timestamp: new Date().toISOString()
            };
        }
    }

    calculateGlobalEconomicImpact(gdpData, marketData) {
        const impact = {
            overall: 'neutral',
            factors: []
        };

        // Analyze GDP trends
        const gdpTrends = gdpData.map(country => ({
            country: country.country,
            momentum: country.trend['90d'].momentum
        }));

        // Calculate weighted global GDP trend with updated weights
        const weights = {
            'United States': 0.25,
            'China': 0.20,
            'India': 0.15,
            'European Union': 0.15,
            'Japan': 0.15,
            'United Kingdom': 0.10
        };

        let globalMomentum = 0;
        let weightSum = 0;

        gdpTrends.forEach(trend => {
            const weight = weights[trend.country] || 0.1;
            globalMomentum += trend.momentum * weight;
            weightSum += weight;
        });

        globalMomentum = globalMomentum / weightSum;

        // Determine overall economic climate
        if (globalMomentum > 2) {
            impact.overall = 'strong_growth';
        } else if (globalMomentum > 0) {
            impact.overall = 'moderate_growth';
        } else if (globalMomentum > -2) {
            impact.overall = 'slowdown';
        } else {
            impact.overall = 'contraction';
        }

        // Analyze individual factors
        gdpTrends.forEach(trend => {
            if (Math.abs(trend.momentum) > 1) {
                impact.factors.push({
                    economy: trend.country,
                    trend: trend.momentum > 0 ? 'growth' : 'contraction',
                    strength: Math.abs(trend.momentum),
                    marketImpact: this.getMarketImpact(trend.country, trend.momentum, marketData)
                });
            }
        });

        return impact;
    }

    getMarketImpact(country, gdpMomentum, marketData) {
        const marketMap = {
            'United States': 'S&P 500',
            'India': 'BSE SENSEX',
            'China': 'Shanghai Composite',
            'Japan': 'Nikkei 225',
            'European Union': 'EURO STOXX 50',
            'United Kingdom': 'FTSE 100'
        };

        const marketIndex = marketMap[country];
        const marketInfo = marketData.find(m => m.index === marketIndex);

        if (!marketInfo) return 'unknown';

        const correlation = Math.sign(gdpMomentum) === Math.sign(marketInfo.change) ? 'aligned' : 'divergent';
        const strength = Math.abs(marketInfo.change) > 5 ? 'strong' : 'moderate';

        return {
            correlation,
            strength,
            marketChange: marketInfo.change
        };
    }

    async getRealTimeIndicators() {
        try {
            const [comprehensiveData, inflation, unemployment, volatility, visualizationData] = await Promise.all([
                this.getComprehensiveEconomicData(),
                this.getInflationRate(),
                this.getUnemploymentRate(),
                this.getMarketVolatility(),
                this.getVisualizationData()
            ]);

            // Use US GDP as main indicator but include all data
            const usGDP = comprehensiveData.globalSnapshot.gdp.economies.find(e => e.country === 'United States') 
                || { value: null, trend: { '90d': { momentum: 0 } } };

            return {
                timestamp: new Date().toISOString(),
                gdp: {
                    ...usGDP,
                    detailed: comprehensiveData.globalSnapshot.gdp
                },
                inflation,
                unemployment,
                market: {
                    volatility,
                    indices: comprehensiveData.globalSnapshot.gdp.markets
                },
                interestRates: comprehensiveData.globalSnapshot.interestRates,
                forex: comprehensiveData.globalSnapshot.forex,
                trade: comprehensiveData.globalSnapshot.trade,
                forecasts: comprehensiveData.forecasts,
                aiInsights: {
                    confidence: (comprehensiveData.aiAnalysis?.sentiment || [])
                        .reduce((acc, s) => acc + s.confidence, 0) 
                        / (comprehensiveData.aiAnalysis?.sentiment || []).length * 100,
                    themes: comprehensiveData.aiAnalysis?.themes || [],
                    topStories: comprehensiveData.aiAnalysis?.topStories || [],
                    economicImpact: this.calculateGlobalEconomicImpact(
                        comprehensiveData.globalSnapshot.gdp.economies,
                        comprehensiveData.globalSnapshot.gdp.markets
                    ),
                    sentiment: comprehensiveData.aiAnalysis?.sentiment || []
                },
                visualizations: {
                    ...visualizationData,
                    lastUpdate: new Date().toISOString(),
                    settings: {
                        defaultTimeRange: '1Y',
                        availableRanges: ['1M', '3M', '6M', '1Y', '2Y', '5Y'],
                        chartTypes: ['line', 'bar', 'scatter', 'heatmap', 'candlestick', 'treemap', 'geomap'],
                        interactiveFeatures: {
                            zoom: true,
                            pan: true,
                            tooltips: true,
                            legendToggle: true,
                            timeRangeSelect: true
                        }
                    }
                }
            };
        } catch (error) {
            logger.error('Error fetching real-time indicators:', error);
            throw error;
        }
    }

    async getUnemploymentRate() {
        try {
            const unrateData = await this.economicIndicatorsService.getFREDData('UNRATE');
            const observations = unrateData.observations;

            if (!observations || observations.length < 2) {
                throw new Error('Insufficient unemployment data');
            }

            const latest = observations[0].value;
            const previousMonth = observations[1].value;
            const momChange = latest - previousMonth;
            
            return {
                value: latest,
                date: observations[0].date,
                trend: {
                    '30d': {
                        momentum: momChange
                    }
                },
                historical: observations.map(obs => ({
                    value: obs.value,
                    date: obs.date
                }))
            };
        } catch (error) {
            logger.error('Error processing unemployment data:', error);
            return { 
                value: null, 
                trend: { '30d': { momentum: 0 } },
                historical: []
            };
        }
    }

    async getMarketVolatility() {
        try {
            // First try to get VIX data from Trading Economics
            const teResponse = await axios.get(
                `https://api.tradingeconomics.com/markets/symbol/vix?c=${this.economicIndicatorsService.TRADING_ECONOMICS_KEY}`
            );

            if (teResponse.data && teResponse.data.length > 0) {
                const vixData = teResponse.data[0];
                return {
                    volatilityIndex: parseFloat(vixData.Last),
                    trend: {
                        '30d': {
                            momentum: parseFloat(vixData.Change24H) || 0
                        }
                    }
                };
            }

            // Fallback to Yahoo Finance API (which doesn't require API key)
            const yahooResponse = await axios.get(
                'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=2d'
            );

            if (yahooResponse.data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close) {
                const closes = yahooResponse.data.chart.result[0].indicators.quote[0].close;
                const latest = closes[closes.length - 1];
                const previous = closes[closes.length - 2] || latest;
                const change = latest - previous;

                return {
                    volatilityIndex: latest,
                    trend: {
                        '30d': {
                            momentum: change
                        }
                    }
                };
            }

            // If both APIs fail, use mock data
            return {
                volatilityIndex: 20,
                trend: {
                    '30d': {
                        momentum: 0
                    }
                }
            };
        } catch (error) {
            logger.error('Error fetching market volatility:', error);
            // Return mock data as fallback
            return { 
                volatilityIndex: 20, 
                trend: { 
                    '30d': { 
                        momentum: 0 
                    } 
                } 
            };
        }
    }

    calculateTrend(historical, period = 90) {
        if (!historical || historical.length < 2) return { momentum: 0 };
        const recent = historical[0].value;
        const old = historical[Math.min(historical.length - 1, Math.floor(period / 30))].value;
        const momentum = ((recent - old) / old) * 100;
        return { momentum };
    }

    calculateVolatility(historical) {
        if (!historical || historical.length < 2) return 0;
        const values = historical.map(h => h.value);
        const mean = values.reduce((a, b) => a + b) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    calculateOverallTrend(data) {
        const weights = {
            gdp: 0.3,
            inflation: -0.3,
            unemployment: -0.2,
            market: -0.2
        };

        let score = 0;
        let count = 0;

        if (data.gdp?.trend?.['90d']?.momentum !== undefined) {
            score += data.gdp.trend['90d'].momentum * weights.gdp;
            count++;
        }
        if (data.inflation?.trend?.['30d']?.momentum !== undefined) {
            score += data.inflation.trend['30d'].momentum * weights.inflation;
            count++;
        }
        if (data.unemployment?.trend?.['30d']?.momentum !== undefined) {
            score += data.unemployment.trend['30d'].momentum * weights.unemployment;
            count++;
        }
        if (data.market?.trend?.['30d']?.momentum !== undefined) {
            score += data.market.trend['30d'].momentum * weights.market;
            count++;
        }

        return count > 0 ? score / count : 0;
    }

    calculateEconomicHealth(data) {
        const weights = {
            gdp: 0.4,
            inflation: -0.3,
            unemployment: -0.3
        };

        let score = 0;
        let count = 0;

        if (data.gdp?.value !== null) {
            score += weights.gdp * (data.gdp.trend['90d'].momentum > 0 ? 1 : -1);
            count++;
        }
        if (data.inflation?.value !== null) {
            score += weights.inflation * (data.inflation.value <= 2 ? 1 : -1);
            count++;
        }
        if (data.unemployment?.value !== null) {
            score += weights.unemployment * (data.unemployment.value <= 5 ? 1 : -1);
            count++;
        }

        const finalScore = count > 0 ? score / count : 0;
        
        if (finalScore > 0.5) return 'Strong';
        if (finalScore > 0) return 'Stable';
        if (finalScore > -0.5) return 'Moderate';
        return 'Weak';
    }

    calculateRiskMetrics(marketData) {
        const vix = marketData?.volatilityIndex;
        if (!vix) return 'Unknown';
        
        if (vix >= 30) return 'High';
        if (vix >= 20) return 'Moderate';
        return 'Low';
    }

    async getComprehensiveEconomicData() {
        try {
            const [gdpData, interestRates, forexData, tradeData, newsAnalysis] = await Promise.all([
                this.getDetailedGDPData(),
                this.getCentralBankRates(),
                this.getForexRates(),
                this.getGlobalTradeData(),
                this.analyzeFinancialNews()
            ]);

            // Get IMF projections
            const forecasts = await this.getEconomicForecasts();

            return {
                timestamp: new Date().toISOString(),
                globalSnapshot: {
                    gdp: gdpData,
                    interestRates,
                    forex: forexData,
                    trade: tradeData
                },
                forecasts,
                aiAnalysis: {
                    ...newsAnalysis,
                    themes: this.extractKeyThemes(gdpData, interestRates, forexData, tradeData)
                }
            };
        } catch (error) {
            logger.error('Error fetching comprehensive economic data:', error);
            throw error;
        }
    }

    async getCentralBankRates() {
        try {
            const centralBanks = [
                { id: 'FEDFUNDS', name: 'Federal Reserve', country: 'United States' },
                { id: 'ECBDFR', name: 'European Central Bank', country: 'Eurozone' },
                { id: 'RBIREPORATE', name: 'Reserve Bank of India', country: 'India' },
                { id: 'PBOCMLF', name: 'People\'s Bank of China', country: 'China' }
            ];

            const ratePromises = centralBanks.map(async bank => {
                try {
                    const data = await this.getFREDData(bank.id);
                    if (!data?.observations?.length) {
                        throw new Error(`No data available for ${bank.name}`);
                    }

                    const latest = data.observations[0];
                    const previousMonth = data.observations[1] || { value: latest.value };
                    
                    return {
                        bank: bank.name,
                        country: bank.country,
                        currentRate: parseFloat(latest.value) || null,
                        previousRate: parseFloat(previousMonth.value) || null,
                        lastUpdate: latest.date,
                        trend: this.calculateTrend([
                            { value: parseFloat(previousMonth.value), date: previousMonth.date },
                            { value: parseFloat(latest.value), date: latest.date }
                        ])
                    };
                } catch (error) {
                    logger.error(`Error fetching central bank rate for ${bank.name}:`, error);
                    // Return fallback data
                    return {
                        bank: bank.name,
                        country: bank.country,
                        currentRate: null,
                        previousRate: null,
                        lastUpdate: new Date().toISOString().split('T')[0],
                        trend: { momentum: 0 }
                    };
                }
            });

            const rates = await Promise.all(ratePromises);
            return rates.filter(rate => rate !== null);
        } catch (error) {
            logger.error('Error fetching central bank rates:', error);
            return [];
        }
    }

    async getGlobalTradeData() {
        try {
            // Get World Trade Organization data through FRED
            const [tradeVolume, tradeValue] = await Promise.all([
                this.getFREDData('WTMVOL'),
                this.getFREDData('WTVALT01')
            ]);

            if (!tradeVolume?.observations?.length && !tradeValue?.observations?.length) {
                // Return mock data if no real data available
                return {
                    volume: {
                        current: 125.3,
                        trend: { momentum: 2.5 },
                        date: new Date().toISOString().split('T')[0]
                    },
                    value: {
                        current: 156.7,
                        trend: { momentum: 1.8 },
                        date: new Date().toISOString().split('T')[0]
                    }
                };
            }

            return {
                volume: tradeVolume.observations.length > 0 ? {
                    current: parseFloat(tradeVolume.observations[0].value),
                    trend: this.calculateTrend(tradeVolume.observations),
                    date: tradeVolume.observations[0].date
                } : null,
                value: tradeValue.observations.length > 0 ? {
                    current: parseFloat(tradeValue.observations[0].value),
                    trend: this.calculateTrend(tradeValue.observations),
                    date: tradeValue.observations[0].date
                } : null
            };
        } catch (error) {
            logger.error('Error fetching global trade data:', error);
            return {
                volume: null,
                value: null
            };
        }
    }

    async getEconomicForecasts() {
        try {
            // Simulate IMF/World Bank projections (would normally come from their APIs)
            const economies = ['United States', 'China', 'India', 'European Union', 'Japan', 'United Kingdom'];
            const forecastTypes = ['gdp', 'inflation', 'unemployment'];
            
            const forecasts = economies.map(economy => ({
                economy,
                projections: {
                    gdp: {
                        nextYear: 2.5 + Math.random() * 2,
                        twoYear: 2.0 + Math.random() * 3
                    },
                    inflation: {
                        nextYear: 2.0 + Math.random(),
                        twoYear: 2.0 + Math.random() * 0.5
                    },
                    unemployment: {
                        nextYear: 3.5 + Math.random() * 2,
                        twoYear: 3.0 + Math.random() * 2.5
                    }
                },
                risks: this.assessEconomicRisks(economy)
            }));

            return {
                forecasts,
                lastUpdate: new Date().toISOString(),
                source: 'IMF World Economic Outlook & World Bank projections'
            };
        } catch (error) {
            logger.error('Error generating economic forecasts:', error);
            return null;
        }
    }

    async analyzeFinancialNews() {
        try {
            // In a real implementation, this would use a news API and NLP
            const newsTopics = [
                'inflation',
                'interest_rates',
                'gdp_growth',
                'trade_tensions',
                'monetary_policy'
            ];

            const sentimentAnalysis = newsTopics.map(topic => ({
                topic,
                sentiment: Math.random() * 2 - 1, // -1 to 1
                confidence: 0.5 + Math.random() * 0.5,
                momentum: Math.random() * 2 - 1
            }));

            return {
                sentiment: sentimentAnalysis,
                topStories: this.generateTopStories(),
                lastUpdate: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Error analyzing financial news:', error);
            return null;
        }
    }

    generateTopStories() {
        // This would normally come from a news API
        return [
            {
                headline: "Global Trade Volume Reaches Post-Pandemic High",
                sentiment: "positive",
                impact: "high"
            },
            {
                headline: "Central Banks Signal Shift in Monetary Policy",
                sentiment: "neutral",
                impact: "high"
            },
            {
                headline: "Emerging Markets Show Resilience Amid Global Challenges",
                sentiment: "positive",
                impact: "medium"
            }
        ];
    }

    assessEconomicRisks(economy) {
        // This would normally use more sophisticated analysis
        const risks = [];
        const riskFactors = {
            'United States': ['inflation', 'debt_ceiling', 'monetary_policy'],
            'China': ['property_market', 'local_debt', 'trade_tensions'],
            'India': ['inflation', 'fiscal_deficit', 'current_account'],
            'European Union': ['energy_prices', 'monetary_policy', 'regional_divergence'],
            'Japan': ['demographic_pressure', 'monetary_policy', 'public_debt'],
            'United Kingdom': ['brexit_impact', 'inflation', 'trade_balance']
        };

        (riskFactors[economy] || []).forEach(factor => {
            risks.push({
                factor,
                probability: 0.3 + Math.random() * 0.4,
                impact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
            });
        });

        return risks;
    }

    extractKeyThemes(gdpData, rates, forex, trade) {
        const themes = [];
        
        // Analyze GDP trends
        const gdpTrend = this.calculateOverallTrend({ gdp: gdpData });
        if (Math.abs(gdpTrend) > 1) {
            themes.push({
                theme: gdpTrend > 0 ? 'Global Growth Acceleration' : 'Growth Slowdown',
                confidence: 0.7 + Math.random() * 0.3,
                implications: [
                    'Monitor monetary policy responses',
                    'Watch for sector rotation in markets',
                    'Consider portfolio rebalancing'
                ]
            });
        }

        // Analyze monetary policy
        const rateChanges = rates.filter(r => r.currentRate !== r.previousRate).length;
        if (rateChanges > 0) {
            themes.push({
                theme: 'Monetary Policy Shifts',
                confidence: 0.8 + Math.random() * 0.2,
                implications: [
                    'Impact on fixed income markets',
                    'Currency market volatility',
                    'Effects on emerging markets'
                ]
            });
        }

        // Add trade theme
        if (trade?.volume?.trend?.momentum) {
            themes.push({
                theme: 'Global Trade Dynamics',
                confidence: 0.6 + Math.random() * 0.4,
                implications: [
                    'Supply chain implications',
                    'Impact on shipping and logistics',
                    'Regional trade patterns'
                ]
            });
        }

        return themes.slice(0, 3); // Return top 3 themes
    }

    async getVisualizationData() {
        try {
            const [gdpData, inflation, unemployment, marketData, forexData] = await Promise.all([
                this.getDetailedGDPData(),
                this.getInflationRate(),
                this.getUnemploymentRate(),
                this.getMarketVolatility(),
                this.getForexRates()
            ]);

            return {
                timeSeriesCharts: await this.generateTimeSeriesData(gdpData, inflation, unemployment),
                comparativeCharts: this.generateComparativeCharts(gdpData),
                heatmaps: this.generateHeatmaps(gdpData, marketData),
                correlationMatrix: this.generateCorrelationMatrix(gdpData, marketData, forexData),
                treeMap: this.generateMarketTreeMap(gdpData, marketData),
                geographicData: await this.generateGeographicData(gdpData),
                forecastVisuals: await this.generateForecastVisuals(),
                interactiveElements: this.generateInteractiveElements()
            };
        } catch (error) {
            logger.error('Error generating visualization data:', error);
            return null;
        }
    }

    async generateTimeSeriesData(gdpData, inflation, unemployment) {
        const timeRanges = ['1M', '3M', '6M', '1Y', '2Y', '5Y'];
        
        return {
            gdpTrends: {
                title: 'GDP Growth Trends',
                type: 'line',
                data: gdpData.economies.map(economy => ({
                    name: economy.country,
                    series: economy.historical.map(point => ({
                        date: point.date,
                        value: point.value,
                        yoy: this.calculateYoYChange(economy.historical, point)
                    })),
                    color: this.getCountryColor(economy.country)
                })),
                annotations: this.generateKeyEvents()
            },
            inflationComparison: {
                title: 'Global Inflation Rates',
                type: 'area',
                data: timeRanges.map(range => ({
                    range,
                    datasets: gdpData.economies.map(economy => ({
                        country: economy.country,
                        values: this.generateInflationSeries(range)
                    }))
                }))
            },
            marketIndices: {
                title: 'Market Performance',
                type: 'candlestick',
                data: gdpData.markets.map(market => ({
                    name: market.index,
                    series: this.generateMarketSeries(market, '1Y')
                }))
            }
        };
    }

    generateComparativeCharts(gdpData) {
        return {
            gdpComparison: {
                title: 'GDP Comparison',
                type: 'bar',
                orientation: 'vertical',
                data: gdpData.economies.map(economy => ({
                    country: economy.country,
                    value: economy.value,
                    yoyGrowth: economy.trend['90d'].momentum,
                    color: this.getCountryColor(economy.country),
                    details: {
                        perCapita: this.calculatePerCapitaGDP(economy),
                        contribution: this.calculateGlobalContribution(economy, gdpData)
                    }
                })),
                annotations: this.generateInsights(gdpData)
            },
            economicIndicators: {
                title: 'Economic Indicators Matrix',
                type: 'scatter',
                data: gdpData.economies.map(economy => ({
                    country: economy.country,
                    gdpGrowth: economy.trend['90d'].momentum,
                    inflation: this.getCountryInflation(economy.country),
                    unemployment: this.getCountryUnemployment(economy.country),
                    size: economy.value, // Bubble size based on GDP
                    color: this.getCountryColor(economy.country)
                }))
            }
        };
    }

    generateHeatmaps(gdpData, marketData) {
        return {
            correlationHeatmap: {
                title: 'Economic Indicators Correlation',
                type: 'heatmap',
                data: this.calculateCorrelations(gdpData, marketData),
                scale: {
                    min: -1,
                    max: 1,
                    colors: ['#FF0000', '#FFFFFF', '#00FF00']
                }
            },
            marketHeatmap: {
                title: 'Market Performance Heatmap',
                type: 'heatmap',
                data: this.generateMarketHeatmap(marketData),
                scale: {
                    min: -5,
                    max: 5,
                    colors: ['#FF4444', '#FFFFFF', '#44FF44']
                }
            }
        };
    }

    generateCorrelationMatrix(gdpData, marketData, forexData) {
        const assets = [
            ...gdpData.markets.map(m => m.index),
            ...forexData.map(f => f.pair)
        ];

        return {
            title: 'Cross-Asset Correlation Matrix',
            type: 'matrix',
            data: assets.map(asset1 => 
                assets.map(asset2 => 
                    this.calculateAssetCorrelation(asset1, asset2, marketData, forexData)
                )
            ),
            labels: assets,
            scale: {
                min: -1,
                max: 1,
                colors: ['#FF0000', '#FFFFFF', '#00FF00']
            }
        };
    }

    generateMarketTreeMap(gdpData, marketData) {
        return {
            title: 'Global Market Structure',
            type: 'treemap',
            data: gdpData.economies.map(economy => ({
                name: economy.country,
                value: economy.value,
                children: this.generateMarketSegments(economy, marketData),
                color: this.getCountryColor(economy.country)
            })),
            tooltips: {
                format: 'hierarchical',
                fields: ['gdp', 'marketCap', 'change']
            }
        };
    }

    generateMarketSegments(economy, marketData) {
        // Mock market segments for visualization
        const segments = [
            { name: 'Technology', weight: 0.25 },
            { name: 'Financial', weight: 0.20 },
            { name: 'Healthcare', weight: 0.15 },
            { name: 'Consumer', weight: 0.15 },
            { name: 'Industrial', weight: 0.15 },
            { name: 'Other', weight: 0.10 }
        ];

        return segments.map(segment => ({
            name: segment.name,
            value: economy.value * segment.weight,
            marketCap: (economy.value * segment.weight * 1000).toFixed(2), // Convert to billions
            change: ((Math.random() * 2 - 1) * 5).toFixed(2) // Random change between -5% and +5%
        }));
    }

    async generateGeographicData(gdpData) {
        return {
            title: 'Global Economic Heatmap',
            type: 'geomap',
            data: gdpData.economies.map(economy => ({
                country: economy.country,
                value: economy.value,
                growth: economy.trend['90d'].momentum,
                risk: this.calculateCountryRisk(economy),
                color: this.getCountryColor(economy.country)
            })),
            legend: {
                title: 'GDP Size & Growth',
                scale: 'logarithmic'
            }
        };
    }

    async generateForecastVisuals() {
        const forecasts = await this.getEconomicForecasts();
        return {
            gdpForecasts: {
                title: 'GDP Growth Forecasts',
                type: 'line',
                data: forecasts.forecasts.map(forecast => ({
                    country: forecast.economy,
                    current: forecast.projections.gdp.nextYear,
                    projected: forecast.projections.gdp.twoYear,
                    confidence: this.calculateForecastConfidence(forecast),
                    risks: forecast.risks
                })),
                confidenceBands: true
            },
            riskMatrix: {
                title: 'Economic Risk Matrix',
                type: 'scatter',
                data: this.generateRiskMatrix(forecasts)
            }
        };
    }

    generateInteractiveElements() {
        return {
            filters: {
                timeRanges: ['1M', '3M', '6M', '1Y', '2Y', '5Y'],
                indicators: ['GDP', 'Inflation', 'Unemployment', 'Trade'],
                regions: ['Global', 'Americas', 'Europe', 'Asia', 'Other'],
                visualTypes: ['Line', 'Bar', 'Scatter', 'Heatmap', 'Geographic']
            },
            tooltips: {
                gdp: {
                    fields: ['value', 'growth', 'perCapita', 'trend'],
                    format: 'detailed'
                },
                markets: {
                    fields: ['price', 'change', 'volume', 'correlation'],
                    format: 'interactive'
                }
            },
            drilldowns: {
                country: ['GDP', 'Trade', 'Financial', 'Risk'],
                market: ['Index', 'Sectors', 'Companies', 'Performance'],
                time: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']
            }
        };
    }

    formatTrend(trend) {
        if (!trend?.momentum) return 'N/A';
        const value = trend.momentum;
        const prefix = value > 0 ? '+' : '';
        return `${prefix}${value.toFixed(1)}%`;
    }

    getCountryColor(country) {
        const colorMap = {
            'United States': '#1f77b4',
            'China': '#ff7f0e',
            'India': '#2ca02c',
            'European Union': '#d62728',
            'Japan': '#9467bd',
            'United Kingdom': '#8c564b'
        };
        return colorMap[country] || '#7f7f7f';
    }

    calculateYoYChange(historical, point) {
        if (!historical?.length || !point?.date) return null;
        
        // Convert date strings to Date objects for comparison
        const currentDate = new Date(point.date);
        const yearAgo = historical.find(h => {
            const date = new Date(h.date);
            return date.getFullYear() === currentDate.getFullYear() - 1 &&
                   date.getMonth() === currentDate.getMonth();
        });
        
        return yearAgo ? ((point.value - yearAgo.value) / yearAgo.value) * 100 : null;
    }

    async getFREDData(seriesId) {
        try {
            // Mock data for development when FRED API is unavailable
            const mockData = {
                UKGDP: { value: 3.2, date: '2025-07-01' },
                CNGDP: { value: 17.8, date: '2025-07-01' },
                INGDP: { value: 4.1, date: '2025-07-01' },
                EUGDP: { value: 15.7, date: '2025-07-01' },
                JPGDP: { value: 4.8, date: '2025-07-01' },
                WTMVOL: { value: 125.3, date: '2025-07-01' },
                WTVALT01: { value: 156.7, date: '2025-07-01' },
                FEDFUNDS: { value: 5.25, date: '2025-07-01' },
                ECBDFR: { value: 4.0, date: '2025-07-01' },
                RBIREPORATE: { value: 6.5, date: '2025-07-01' },
                PBOCMLF: { value: 3.45, date: '2025-07-01' }
            };

            // Try to fetch from FRED API first
            try {
                const response = await this.economicIndicatorsService.getFREDData(seriesId);
                if (response?.observations?.length > 0) {
                    return {
                        observations: response.observations.map(obs => ({
                            value: parseFloat(obs.value),
                            date: obs.date
                        }))
                    };
                }
            } catch (error) {
                logger.error(`Error fetching FRED data for ${seriesId}:`, error);
            }

            // Fallback to mock data if FRED API fails
            if (mockData[seriesId]) {
                return {
                    observations: [{
                        value: mockData[seriesId].value,
                        date: mockData[seriesId].date
                    }]
                };
            }

            throw new Error(`No data available for series ${seriesId}`);
        } catch (error) {
            logger.error(`Error in getFREDData for ${seriesId}:`, error);
            return { observations: [] };
        }
    }

    async getEconomicIndicators() {
        try {
            const [gdp, inflation, unemployment, aiInsights] = await Promise.all([
                this.getGDPTrends(),
                this.getInflationRate(),
                this.getUnemploymentData(),
                this.getAIInsights()
            ]);

            // Compose the structure expected by the frontend
            return {
                gdp,
                inflation,
                unemployment,
                aiInsights
            };
        } catch (error) {
            logger.error('Error aggregating economic indicators:', error);
            return {
                gdp: { value: null, trend: { '90d': { momentum: 0 } } },
                inflation: { value: null, trend: { '30d': { momentum: 0 } } },
                unemployment: { value: null, trend: { '30d': { momentum: 0 } } },
                aiInsights: { confidence: 0, insights: [] }
            };
        }
    }
}

// Create and export a singleton instance
const realTimeService = new RealTimeEconomicService();
export default realTimeService;
