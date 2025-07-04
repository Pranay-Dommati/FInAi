import axios from 'axios';
import logger from '../utils/logger.js';

class AIAnalysisService {
  constructor() {
    this.hfApiKey = process.env.HUGGING_FACE_API_KEY;
    this.finbertEndpoint = 'https://api-inference.huggingface.co/models/ProsusAI/finbert';
    this.sentimentEndpoint = 'https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment';
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  // Analyze financial sentiment using FinBERT
  async analyzeFinancialSentiment(texts) {
    try {
      if (!texts || texts.length === 0) {
        return { overall: 'neutral', confidence: 'low', breakdown: { positive: 33, neutral: 34, negative: 33 } };
      }

      const cacheKey = `finbert_${JSON.stringify(texts)}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return cached.data;
      }

      const results = [];
      
      // Analyze each text with FinBERT
      for (const text of texts.slice(0, 10)) { // Limit to 10 texts for API efficiency
        try {
          const response = await axios.post(
            this.finbertEndpoint,
            { inputs: text.substring(0, 512) }, // FinBERT has 512 token limit
            {
              headers: {
                'Authorization': `Bearer ${this.hfApiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'FinAI-Backend/1.0'
              },
              timeout: 15000
            }
          );

          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            results.push(response.data[0]);
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          logger.warn(`FinBERT analysis failed for text: ${error.message}`);
          
          // If it's a 401 error, try fallback sentiment analysis
          if (error.response?.status === 401) {
            logger.warn('Hugging Face API authentication failed, using fallback sentiment analysis');
            // Use basic keyword-based sentiment analysis as fallback
            const sentiment = this.basicSentimentAnalysis(text);
            results.push([sentiment]);
          } else {
            // Fallback to neutral sentiment
            results.push([
              { label: 'neutral', score: 0.6 },
              { label: 'positive', score: 0.2 },
              { label: 'negative', score: 0.2 }
            ]);
          }
        }
      }

      const analysis = this.aggregateSentimentResults(results);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: analysis,
        timestamp: Date.now()
      });

      return analysis;
    } catch (error) {
      logger.error('FinBERT sentiment analysis error:', error.message);
      return this.getFallbackSentiment();
    }
  }

  // Aggregate sentiment results from multiple texts
  aggregateSentimentResults(results) {
    if (!results || results.length === 0) {
      return this.getFallbackSentiment();
    }

    const aggregated = {
      positive: 0,
      negative: 0,
      neutral: 0
    };

    let totalScore = 0;
    let validResults = 0;

    results.forEach(result => {
      if (Array.isArray(result)) {
        result.forEach(item => {
          if (item.label && item.score) {
            const label = item.label.toLowerCase();
            if (label.includes('positive')) {
              aggregated.positive += item.score;
            } else if (label.includes('negative')) {
              aggregated.negative += item.score;
            } else {
              aggregated.neutral += item.score;
            }
            totalScore += item.score;
            validResults++;
          }
        });
      }
    });

    if (validResults === 0) {
      return this.getFallbackSentiment();
    }

    // Normalize to percentages
    const total = aggregated.positive + aggregated.negative + aggregated.neutral;
    const breakdown = {
      positive: Math.round((aggregated.positive / total) * 100),
      negative: Math.round((aggregated.negative / total) * 100),
      neutral: Math.round((aggregated.neutral / total) * 100)
    };

    // Determine overall sentiment
    let overall = 'neutral';
    let confidence = 'medium';
    
    if (breakdown.positive > breakdown.negative + 10) {
      overall = 'positive';
      confidence = breakdown.positive > 60 ? 'high' : 'medium';
    } else if (breakdown.negative > breakdown.positive + 10) {
      overall = 'negative';
      confidence = breakdown.negative > 60 ? 'high' : 'medium';
    }

    return {
      overall,
      confidence,
      breakdown,
      score: (aggregated.positive - aggregated.negative) / total,
      reasoning: this.generateSentimentReasoning(breakdown, overall)
    };
  }

  // Generate reasoning for sentiment analysis
  generateSentimentReasoning(breakdown, overall) {
    const { positive, negative, neutral } = breakdown;
    
    if (overall === 'positive') {
      return `Strong positive sentiment detected with ${positive}% positive, ${neutral}% neutral, and ${negative}% negative indicators. Market outlook appears favorable.`;
    } else if (overall === 'negative') {
      return `Negative sentiment predominates with ${negative}% negative, ${neutral}% neutral, and ${positive}% positive indicators. Market concerns are evident.`;
    } else {
      return `Balanced sentiment with ${neutral}% neutral, ${positive}% positive, and ${negative}% negative indicators. Market appears stable with mixed signals.`;
    }
  }

  // AI-powered risk assessment
  async assessInvestmentRisk(data) {
    try {
      const {
        stockData,
        sentimentAnalysis,
        technicalIndicators,
        economicContext,
        newsData
      } = data;

      // Prepare text for AI analysis
      const riskFactors = [];
      
      // Market volatility analysis
      if (stockData?.volatility && stockData.volatility > 0.3) {
        riskFactors.push(`High volatility detected: ${(stockData.volatility * 100).toFixed(1)}%`);
      }

      // Sentiment-based risk
      if (sentimentAnalysis?.overall === 'negative') {
        riskFactors.push(`Negative market sentiment: ${sentimentAnalysis.breakdown.negative}% negative indicators`);
      }

      // Technical risk indicators
      if (technicalIndicators?.rsi && technicalIndicators.rsi > 70) {
        riskFactors.push('Overbought conditions detected (RSI > 70)');
      } else if (technicalIndicators?.rsi && technicalIndicators.rsi < 30) {
        riskFactors.push('Oversold conditions detected (RSI < 30)');
      }

      // Economic risk factors
      if (economicContext?.inflationLevel === 'high') {
        riskFactors.push('High inflation environment poses risk to equity valuations');
      }

      // News-based risk assessment
      const newsTexts = newsData?.slice(0, 5)?.map(article => article.title + ' ' + article.summary) || [];
      const newsSentiment = await this.analyzeFinancialSentiment(newsTexts);

      if (newsSentiment.overall === 'negative') {
        riskFactors.push('Recent news sentiment is predominantly negative');
      }

      // Calculate risk score (0-10, where 10 is highest risk)
      let riskScore = 3; // Base risk score

      // Adjust based on factors
      if (sentimentAnalysis?.overall === 'negative') riskScore += 2;
      if (stockData?.volatility > 0.3) riskScore += 2;
      if (technicalIndicators?.rsi > 75 || technicalIndicators?.rsi < 25) riskScore += 1;
      if (economicContext?.inflationLevel === 'high') riskScore += 1;
      if (newsSentiment.overall === 'negative') riskScore += 1;

      riskScore = Math.min(riskScore, 10);

      // Determine risk level
      let riskLevel = 'medium';
      if (riskScore <= 3) riskLevel = 'low';
      else if (riskScore >= 7) riskLevel = 'high';

      return {
        level: riskLevel,
        score: riskScore,
        factors: riskFactors,
        assessment: this.generateRiskAssessment(riskLevel, riskScore, riskFactors),
        recommendation: this.generateRiskRecommendation(riskLevel, riskScore)
      };
    } catch (error) {
      logger.error('AI risk assessment error:', error.message);
      return {
        level: 'medium',
        score: 5,
        factors: ['Unable to complete comprehensive risk analysis'],
        assessment: 'Risk assessment temporarily unavailable. Please proceed with caution.',
        recommendation: 'Conduct additional due diligence before making investment decisions.'
      };
    }
  }

  // Generate AI-powered investment recommendations
  async generateInvestmentRecommendation(analysisData) {
    try {
      const {
        sentimentAnalysis,
        technicalAnalysis,
        fundamentalAnalysis,
        riskAssessment,
        economicContext
      } = analysisData;

      let score = 5; // Neutral starting point (1-10 scale)
      const reasoningFactors = [];

      // Sentiment impact
      if (sentimentAnalysis?.overall === 'positive') {
        score += 1.5;
        reasoningFactors.push('Positive market sentiment supports bullish outlook');
      } else if (sentimentAnalysis?.overall === 'negative') {
        score -= 1.5;
        reasoningFactors.push('Negative sentiment creates headwinds');
      }

      // Technical analysis impact
      if (technicalAnalysis?.signal === 'BUY') {
        score += 1;
        reasoningFactors.push('Technical indicators suggest upward momentum');
      } else if (technicalAnalysis?.signal === 'SELL') {
        score -= 1;
        reasoningFactors.push('Technical indicators show weakening trend');
      }

      // Fundamental impact
      if (fundamentalAnalysis?.score >= 7) {
        score += 1;
        reasoningFactors.push('Strong fundamental metrics support investment');
      } else if (fundamentalAnalysis?.score <= 3) {
        score -= 1;
        reasoningFactors.push('Weak fundamentals raise concerns');
      }

      // Risk adjustment
      if (riskAssessment?.level === 'low') {
        score += 0.5;
        reasoningFactors.push('Low risk profile enhances attractiveness');
      } else if (riskAssessment?.level === 'high') {
        score -= 1;
        reasoningFactors.push('High risk level requires caution');
      }

      // Economic context
      if (economicContext?.overall === 'favorable') {
        score += 0.5;
        reasoningFactors.push('Favorable economic conditions');
      } else if (economicContext?.overall === 'unfavorable') {
        score -= 0.5;
        reasoningFactors.push('Challenging economic environment');
      }

      // Determine recommendation
      let action = 'HOLD';
      let confidence = 'medium';

      if (score >= 7) {
        action = 'BUY';
        confidence = score >= 8 ? 'high' : 'medium';
      } else if (score <= 3) {
        action = 'SELL';
        confidence = score <= 2 ? 'high' : 'medium';
      }

      return {
        action,
        confidence,
        score: Math.round(score * 10),
        reasoning: reasoningFactors,
        timeHorizon: this.determineTimeHorizon(riskAssessment?.level),
        targetPrice: this.calculateTargetPrice(analysisData, score),
        summary: this.generateRecommendationSummary(action, confidence, reasoningFactors)
      };
    } catch (error) {
      logger.error('AI recommendation generation error:', error.message);
      return {
        action: 'HOLD',
        confidence: 'low',
        score: 50,
        reasoning: ['Unable to complete comprehensive analysis'],
        summary: 'Recommendation temporarily unavailable. Please conduct additional research.'
      };
    }
  }

  // Helper methods
  getFallbackSentiment() {
    return {
      error: true,
      overall: 'unavailable',
      confidence: 'none',
      message: 'AI sentiment analysis is currently unavailable',
      details: 'FinBERT sentiment analysis service is not accessible. This could be due to API limits, network issues, or service maintenance.',
      breakdown: null,
      score: null,
      reasoning: 'AI-powered sentiment analysis requires access to Hugging Face FinBERT model which is currently not available.'
    };
  }

  // Basic keyword-based sentiment analysis as fallback
  basicSentimentAnalysis(text) {
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'up', 'rise', 'gain', 'profit', 'strong', 'bullish', 'buy', 'growth', 'increase', 'boost', 'surge', 'rally'];
    const negativeWords = ['bad', 'poor', 'terrible', 'negative', 'down', 'fall', 'loss', 'weak', 'bearish', 'sell', 'decline', 'decrease', 'drop', 'crash', 'plunge'];
    
    const lowerText = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeScore++;
    });
    
    const total = positiveScore + negativeScore + 1; // +1 for neutral base
    
    if (positiveScore > negativeScore) {
      return { label: 'positive', score: positiveScore / total };
    } else if (negativeScore > positiveScore) {
      return { label: 'negative', score: negativeScore / total };
    } else {
      return { label: 'neutral', score: 0.6 };
    }
  }

  generateRiskAssessment(level, score, factors) {
    const descriptions = {
      low: 'Investment shows low risk characteristics with stable fundamentals and positive market conditions.',
      medium: 'Moderate risk investment with balanced risk-reward profile. Normal market volatility expected.',
      high: 'High risk investment with significant volatility potential. Suitable only for risk-tolerant investors.'
    };
    
    return descriptions[level] || descriptions.medium;
  }

  generateRiskRecommendation(level, score) {
    if (level === 'low') {
      return 'Suitable for conservative investors seeking stable returns.';
    } else if (level === 'high') {
      return 'Only suitable for aggressive investors with high risk tolerance.';
    } else {
      return 'Appropriate for moderate investors with balanced risk appetite.';
    }
  }

  determineTimeHorizon(riskLevel) {
    const horizons = {
      low: 'long-term',
      medium: 'medium-term',
      high: 'short-term'
    };
    return horizons[riskLevel] || 'medium-term';
  }

  calculateTargetPrice(data, score) {
    const currentPrice = data.stockData?.currentPrice;
    if (!currentPrice) return null;

    const multiplier = (score - 5) * 0.1; // -50% to +50% based on score
    return currentPrice * (1 + multiplier);
  }

  generateRecommendationSummary(action, confidence, factors) {
    const actionText = {
      BUY: 'Strong buying opportunity identified',
      SELL: 'Consider reducing position',
      HOLD: 'Maintain current position'
    };

    return `${actionText[action]} with ${confidence} confidence. ${factors.slice(0, 2).join('. ')}.`;
  }
}

export default new AIAnalysisService();
