import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();
// Financial planning calculator class
class FinancialPlanningEngine {
  constructor() {
    this.inflationRate = 0.03;
    this.marketReturns = {
      stocks: 0.09,
      bonds: 0.04,
      cash: 0.02
    };
  }

  calculatePortfolioAllocation(profile) {
    const { age, riskTolerance, investmentGoal } = profile;
    
    const baseAllocations = {
      'Conservative': { stocks: 40, bonds: 40, cash: 20 },
      'Moderate': { stocks: 60, bonds: 30, cash: 10 },
      'Aggressive': { stocks: 80, bonds: 15, cash: 5 }
    };
    
    let allocation = { ...baseAllocations[riskTolerance || 'Moderate'] };
    
    if (age > 60) {
      const reduction = Math.min(20, age - 60);
      allocation.stocks = Math.max(20, allocation.stocks - reduction);
      allocation.bonds += reduction;
    }
    
    if (investmentGoal === 'Emergency Fund') {
      allocation = { stocks: 0, bonds: 20, cash: 80 };
    } else if (investmentGoal === 'House' && age < 30) {
      allocation.stocks = Math.max(30, allocation.stocks - 20);
      allocation.bonds = Math.min(50, allocation.bonds + 10);
      allocation.cash = Math.min(40, allocation.cash + 10);
    }
    
    const expectedReturn = (
      (allocation.stocks / 100) * this.marketReturns.stocks + 
      (allocation.bonds / 100) * this.marketReturns.bonds + 
      (allocation.cash / 100) * this.marketReturns.cash
    );
    
    const volatility = (allocation.stocks / 100) * 0.15;
    
    return {
      allocation,
      expectedReturn: Math.round(expectedReturn * 1000) / 10,
      volatility: Math.round(volatility * 1000) / 10,
      riskLevel: volatility < 0.08 ? 'Low' : volatility < 0.12 ? 'Medium' : 'High'
    };
  }

  calculateRetirementNeeds(profile, currentAssets = 0) {
    const { age, income, timeHorizon, monthlyExpenses = 0 } = profile;
    const yearsToRetirement = parseInt(timeHorizon?.split(' ')[0] || '30');
    
    const annualExpenses = monthlyExpenses * 12;
    const targetRetirementIncome = monthlyExpenses > 0 ? 
      Math.max(annualExpenses, income * 0.7) : 
      income * 0.7;
    
    const requiredNestEgg = targetRetirementIncome * 25;
    
    const portfolio = this.calculatePortfolioAllocation(profile);
    const expectedReturn = portfolio.expectedReturn / 100;
    const projectedAssets = (currentAssets || 0) * Math.pow(1 + expectedReturn, yearsToRetirement);
    
    const shortfall = Math.max(0, requiredNestEgg - projectedAssets);
    const monthlyRate = expectedReturn / 12;
    const months = yearsToRetirement * 12;
    
    const monthlySavingsNeeded = shortfall > 0 ? 
      (shortfall * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1) : 0;
    
    const monthlyIncome = income / 12;
    const availableForSaving = monthlyExpenses > 0 ? 
      monthlyIncome - monthlyExpenses : 
      monthlyIncome * 0.2;
    
    return {
      requiredNestEgg: Math.round(requiredNestEgg),
      currentProjectedValue: Math.round(projectedAssets),
      shortfall: Math.round(shortfall),
      monthlySavingsNeeded: Math.round(monthlySavingsNeeded),
      monthlyAvailable: Math.round(availableForSaving),
      feasibilityScore: Math.min(100, Math.round((availableForSaving / monthlySavingsNeeded) * 100)),
      isRealistic: availableForSaving >= monthlySavingsNeeded * 0.8,
      yearsToRetirement,
      targetRetirementIncome: Math.round(targetRetirementIncome)
    };
  }

  calculateEmergencyFund(profile, monthlyExpenses) {
    const baseMonths = 6;
    const monthsAdjustment = {
      'Conservative': 2,
      'Moderate': 0,
      'Aggressive': -2
    };
    
    const recommendedMonths = baseMonths + (monthsAdjustment[profile.riskTolerance] || 0);
    const recommendedAmount = monthlyExpenses * recommendedMonths;
    
    return {
      recommendedAmount: Math.round(recommendedAmount),
      recommendedMonths,
      cashReserve: Math.round(recommendedAmount * 0.5),
      shortTermSavings: Math.round(recommendedAmount * 0.5)
    };
  }

  generateRecommendations(profile) {
    const recommendations = [];
    
    const liquidSavings = profile.currentSavings * 0.8;
    const emergencyFund = this.calculateEmergencyFund(profile, profile.monthlyExpenses);
    
    if (liquidSavings < emergencyFund.recommendedAmount) {
      recommendations.push({
        type: 'emergency_fund',
        priority: 'high',
        title: 'Build Emergency Fund',
        action: `Save ${Math.round(emergencyFund.recommendedAmount - liquidSavings).toLocaleString()} more`,
        impact: 'Essential financial safety net'
      });
    }

    const retirement = this.calculateRetirementNeeds(profile, profile.currentSavings);
    if (!retirement.isRealistic) {
      recommendations.push({
        type: 'retirement',
        priority: 'high',
        title: 'Increase Retirement Savings',
        action: `Save ${retirement.monthlySavingsNeeded.toLocaleString()} monthly`,
        impact: 'Secure retirement future'
      });
    }

    return recommendations;
  }
}

const planningEngine = new FinancialPlanningEngine();

// Get financial plan
router.post('/plan', async (req, res) => {
  try {
    const { profile } = req.body;
    
    if (!profile) {
      return res.status(400).json({
        success: false,
        error: 'Profile is required'
      });
    }

    const sanitizedProfile = {
      age: Math.max(18, Math.min(100, parseInt(profile.age) || 25)),
      income: Math.max(0, parseFloat(profile.income) || 50000),
      riskTolerance: ['Conservative', 'Moderate', 'Aggressive'].includes(profile.riskTolerance) ? 
        profile.riskTolerance : 'Moderate',
      investmentGoal: profile.investmentGoal || 'Retirement',
      timeHorizon: profile.timeHorizon || '30 years',
      currentSavings: Math.max(0, parseFloat(profile.currentSavings) || 0),
      monthlyExpenses: Math.max(0, parseFloat(profile.monthlyExpenses) || 3000),
      monthlySavings: Math.max(0, parseFloat(profile.monthlySavings) || 500)
    };

    logger.info('Generating financial plan', { profile: sanitizedProfile });

    const portfolioAnalysis = planningEngine.calculatePortfolioAllocation(sanitizedProfile);
    const retirementPlan = planningEngine.calculateRetirementNeeds(sanitizedProfile, sanitizedProfile.currentSavings);
    const emergencyFund = planningEngine.calculateEmergencyFund(sanitizedProfile, sanitizedProfile.monthlyExpenses);
    const recommendations = planningEngine.generateRecommendations(sanitizedProfile);

    res.json({
      success: true,
      data: {
        profile: sanitizedProfile,
        portfolioAnalysis,
        retirementPlan,
        emergencyFund,
        currentFinancials: {
          totalAssets: Math.round(sanitizedProfile.currentSavings),
          monthlyExpenses: Math.round(sanitizedProfile.monthlyExpenses),
          monthlySavings: Math.round(sanitizedProfile.monthlySavings)
        },
        recommendations,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error generating financial plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate financial plan',
      message: error.message
    });
  }
});

// Analyze changes to financial plan
router.post('/analyze', async (req, res) => {
  try {
    const { changes, profile } = req.body;
    
    if (!changes || !profile) {
      return res.status(400).json({
        success: false,
        error: 'Changes and current profile are required'
      });
    }

    // Create updated profile with changes
    const updatedProfile = { ...profile, ...changes };
    
    // Calculate plans with both profiles
    const oldPlan = {
      portfolio: planningEngine.calculatePortfolioAllocation(profile),
      retirement: planningEngine.calculateRetirementNeeds(profile, profile.currentSavings)
    };
    
    const newPlan = {
      portfolio: planningEngine.calculatePortfolioAllocation(updatedProfile),
      retirement: planningEngine.calculateRetirementNeeds(updatedProfile, updatedProfile.currentSavings)
    };
    
    res.json({
      success: true,
      data: {
        changes,
        impact: {
          expectedReturn: {
            before: oldPlan.portfolio.expectedReturn,
            after: newPlan.portfolio.expectedReturn,
            change: newPlan.portfolio.expectedReturn - oldPlan.portfolio.expectedReturn
          },
          monthlySavingsNeeded: {
            before: oldPlan.retirement.monthlySavingsNeeded,
            after: newPlan.retirement.monthlySavingsNeeded,
            change: newPlan.retirement.monthlySavingsNeeded - oldPlan.retirement.monthlySavingsNeeded
          },
          feasibilityScore: {
            before: oldPlan.retirement.feasibilityScore,
            after: newPlan.retirement.feasibilityScore,
            change: newPlan.retirement.feasibilityScore - oldPlan.retirement.feasibilityScore
          }
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error in real-time analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze change',
      message: error.message
    });
  }
});

// Track progress towards financial goals
router.post('/track', async (req, res) => {
  try {
    const { profile, goal } = req.body;
    
    if (!profile || !goal || !goal.targetAmount || !goal.timeframe) {
      return res.status(400).json({
        success: false,
        error: 'Profile and goal details are required'
      });
    }

    const portfolio = planningEngine.calculatePortfolioAllocation(profile);
    const monthsToGoal = goal.timeframe * 12;
    const monthlyReturn = portfolio.expectedReturn / 100 / 12;
    
    // Calculate progress and projections
    const currentAmount = profile.currentSavings || 0;
    const monthlyContribution = profile.monthlySavings || 0;
    let projectedValue = currentAmount;
    
    for (let month = 1; month <= monthsToGoal; month++) {
      projectedValue = (projectedValue + monthlyContribution) * (1 + monthlyReturn);
    }
    
    const willReachGoal = projectedValue >= goal.targetAmount;
    const shortfall = willReachGoal ? 0 : goal.targetAmount - projectedValue;
    
    // Calculate required monthly savings adjustment if needed
    const requiredMonthlyContribution = shortfall > 0 ? 
      (shortfall * monthlyReturn) / (Math.pow(1 + monthlyReturn, monthsToGoal) - 1) : 0;
    
    res.json({
      success: true,
      data: {
        currentAmount,
        monthlyContribution,
        targetAmount: goal.targetAmount,
        timeframe: goal.timeframe,
        projectedValue: Math.round(projectedValue),
        shortfall: Math.round(shortfall),
        requiredMonthlyContribution: Math.round(requiredMonthlyContribution),
        willReachGoal,
        expectedReturn: portfolio.expectedReturn,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error in portfolio simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate scenarios',
      message: error.message
    });
  }
});

// Detailed goal tracking with monthly progress
router.post('/track-detailed', async (req, res) => {
  try {
    const { currentSavings, monthlyContribution, targetAmount, timeframe, profile } = req.body;
    
    // Validate required parameters and check for NaN values
    if (!profile) {
      return res.status(400).json({
        success: false,
        error: 'Profile is required'
      });
    }

    // Convert and validate numeric values
    const numericCurrentSavings = parseFloat(currentSavings) || 0;
    const numericMonthlyContribution = parseFloat(monthlyContribution) || 0;
    const numericTargetAmount = parseFloat(targetAmount) || 0;
    const numericTimeframe = parseInt(timeframe) || 0;

    if (isNaN(numericCurrentSavings) || isNaN(numericMonthlyContribution) || 
        isNaN(numericTargetAmount) || isNaN(numericTimeframe)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid numeric values provided'
      });
    }

    if (numericTargetAmount <= 0 || numericTimeframe <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Target amount and timeframe must be positive values'
      });
    }

    const portfolio = planningEngine.calculatePortfolioAllocation(profile);
    const monthsToTarget = numericTimeframe * 12;
    const monthlyReturn = portfolio.expectedReturn / 100 / 12;
    
    // Calculate projected value with compound growth
    let projectedValue = numericCurrentSavings;
    const monthlyProgress = [];
    
    for (let month = 1; month <= monthsToTarget; month++) {
      projectedValue = (projectedValue + numericMonthlyContribution) * (1 + monthlyReturn);
      
      if (month % 12 === 0 || month === monthsToTarget) {
        monthlyProgress.push({
          month,
          year: Math.ceil(month / 12),
          projectedValue: Math.round(projectedValue),
          progressPercent: Math.round((projectedValue / numericTargetAmount) * 100),
          onTrack: projectedValue >= numericTargetAmount * (month / monthsToTarget)
        });
      }
    }
    
    const willReachGoal = projectedValue >= numericTargetAmount;
    const shortfall = willReachGoal ? 0 : numericTargetAmount - projectedValue;
    const additionalMonthlyNeeded = shortfall > 0 ? 
      shortfall / ((Math.pow(1 + monthlyReturn, monthsToTarget) - 1) / monthlyReturn) : 0;
    
    res.json({
      success: true,
      data: {
        currentSavings: numericCurrentSavings,
        monthlyContribution: numericMonthlyContribution,
        targetAmount: numericTargetAmount,
        timeframe: numericTimeframe,
        projectedFinalValue: Math.round(projectedValue),
        willReachGoal,
        shortfall: Math.round(shortfall),
        additionalMonthlyNeeded: Math.round(additionalMonthlyNeeded),
        monthlyProgress,
        expectedReturn: portfolio.expectedReturn,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error tracking progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track progress',
      message: error.message
    });
  }
});

// Function to analyze the impact of changing a specific field
// Helper functions for financial calculations
function analyzeFieldChange(field, newValue, oldProfile, newProfile) {
  const oldPortfolio = planningEngine.calculatePortfolioAllocation(oldProfile);
  const newPortfolio = planningEngine.calculatePortfolioAllocation(newProfile);
  
  const oldRetirement = planningEngine.calculateRetirementNeeds(oldProfile, oldProfile.currentSavings || 0);
  const newRetirement = planningEngine.calculateRetirementNeeds(newProfile, newProfile.currentSavings || 0);
  
  const impact = {
    portfolioChange: {
      expectedReturn: {
        old: oldPortfolio.expectedReturn,
        new: newPortfolio.expectedReturn,
        change: newPortfolio.expectedReturn - oldPortfolio.expectedReturn
      },
      riskLevel: {
        old: oldPortfolio.riskLevel,
        new: newPortfolio.riskLevel,
        changed: oldPortfolio.riskLevel !== newPortfolio.riskLevel
      }
    },
    retirementChange: {
      monthlySavingsNeeded: {
        old: oldRetirement.monthlySavingsNeeded,
        new: newRetirement.monthlySavingsNeeded,
        change: newRetirement.monthlySavingsNeeded - oldRetirement.monthlySavingsNeeded
      },
      feasibilityScore: {
        old: oldRetirement.feasibilityScore,
        new: newRetirement.feasibilityScore,
        change: newRetirement.feasibilityScore - oldRetirement.feasibilityScore
      }
    }
  };
  
  // Add field-specific insights
  switch (field) {
    case 'age':
      impact.insights = [
        `Portfolio allocation shifted to ${newPortfolio.allocation.stocks}% stocks (${newPortfolio.allocation.stocks - oldPortfolio.allocation.stocks > 0 ? 'more' : 'less'} aggressive)`,
        `Expected return changed by ${(newPortfolio.expectedReturn - oldPortfolio.expectedReturn).toFixed(1)}%`,
        `Monthly retirement savings ${newRetirement.monthlySavingsNeeded > oldRetirement.monthlySavingsNeeded ? 'increased' : 'decreased'} by ${Math.abs(newRetirement.monthlySavingsNeeded - oldRetirement.monthlySavingsNeeded).toLocaleString()}`
      ];
      break;
      
    case 'income':
      const incomeChange = ((newValue - oldProfile.income) / oldProfile.income) * 100;
      impact.insights = [
        `Income ${incomeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(incomeChange).toFixed(1)}%`,
        `Retirement goal ${newRetirement.requiredNestEgg > oldRetirement.requiredNestEgg ? 'increased' : 'decreased'} by ${Math.abs(newRetirement.requiredNestEgg - oldRetirement.requiredNestEgg).toLocaleString()}`,
        `Goal feasibility score: ${newRetirement.feasibilityScore}/100 (${newRetirement.feasibilityScore - oldRetirement.feasibilityScore > 0 ? '+' : ''}${newRetirement.feasibilityScore - oldRetirement.feasibilityScore})`
      ];
      break;
      
    case 'currentSavings':
      const savingsImpact = newValue - (oldProfile.currentSavings || 0);
      impact.insights = [
        `Current savings ${savingsImpact > 0 ? 'increased' : 'decreased'} by ${Math.abs(savingsImpact).toLocaleString()}`,
        `Monthly savings needed ${newRetirement.monthlySavingsNeeded < oldRetirement.monthlySavingsNeeded ? 'reduced' : 'increased'} by ${Math.abs(newRetirement.monthlySavingsNeeded - oldRetirement.monthlySavingsNeeded).toLocaleString()}`,
        `You're now ${newRetirement.feasibilityScore}% on track for retirement`
      ];
      break;
      
    case 'monthlyExpenses':
      const emergencyOld = planningEngine.calculateEmergencyFund(oldProfile, oldProfile.monthlyExpenses || 4000);
      const emergencyNew = planningEngine.calculateEmergencyFund(newProfile, newValue);
      impact.insights = [
        `Emergency fund target ${emergencyNew.recommendedAmount > emergencyOld.recommendedAmount ? 'increased' : 'decreased'} by ${Math.abs(emergencyNew.recommendedAmount - emergencyOld.recommendedAmount).toLocaleString()}`,
        `Available for saving: ${newRetirement.monthlyAvailable.toLocaleString()}/month`,
        `Retirement feasibility: ${newRetirement.isRealistic ? 'Realistic' : 'Challenging'} (${newRetirement.feasibilityScore}/100)`
      ];
      break;
      
    case 'riskTolerance':
      impact.insights = [
        `Switched to ${newValue} risk profile`,
        `Expected return ${newPortfolio.expectedReturn > oldPortfolio.expectedReturn ? 'increased' : 'decreased'} to ${newPortfolio.expectedReturn}%`,
        `Portfolio volatility: ${newPortfolio.volatility}% (${newPortfolio.riskLevel} risk)`
      ];
      break;
      
    default:
      impact.insights = ['Profile updated successfully'];
  }
  
  return impact;
}

// Calculate financial health score (0-100) - realistic version based on profile data
function calculateFinancialHealthScore(profile, emergencyFund, retirementPlan) {
  let score = 0;
  const factors = [];

  // Emergency fund score (20 points) - based on profile savings
  const liquidSavings = profile.currentSavings * 0.8; // Estimate liquid portion of savings
  const emergencyRatio = liquidSavings / emergencyFund.recommendedAmount;
  const emergencyScore = Math.min(20, emergencyRatio * 20);
  score += emergencyScore;
  factors.push({
    category: 'Emergency Fund',
    score: Math.round(emergencyScore),
    maxScore: 20,
    description: `${Math.round(emergencyRatio * 100)}% of recommended emergency fund`
  });

  // Retirement savings score (25 points) - based on retirement plan progress
  const retirementRatio = retirementPlan.currentProjectedValue / retirementPlan.requiredNestEgg;
  const retirementScore = Math.min(25, retirementRatio * 25);
  score += retirementScore;
  factors.push({
    category: 'Retirement Readiness',
    score: Math.round(retirementScore),
    maxScore: 25,
    description: `${Math.round(retirementRatio * 100)}% of retirement goal`
  });

  // Debt-to-income ratio (20 points) - simplified calculation
  const monthlyIncome = profile.income / 12;
  const availableAfterExpenses = monthlyIncome - profile.monthlyExpenses;
  const savingsRate = Math.max(0, availableAfterExpenses / monthlyIncome);
  
  // Assume reasonable debt levels based on spending patterns
  const estimatedDebtRatio = Math.max(0, (profile.monthlyExpenses - (monthlyIncome * 0.7)) / monthlyIncome);
  const debtScore = Math.max(0, 20 - (estimatedDebtRatio * 40));
  score += debtScore;
  factors.push({
    category: 'Debt Management',
    score: Math.round(debtScore),
    maxScore: 20,
    description: savingsRate > 0.2 ? 'Healthy spending pattern' : 'Consider reducing expenses'
  });

  // Savings rate (20 points)
  const savingsScore = Math.min(20, savingsRate * 40); // 50% savings rate = full points
  score += savingsScore;
  factors.push({
    category: 'Savings Rate',
    score: Math.round(savingsScore),
    maxScore: 20,
    description: `${Math.round(savingsRate * 100)}% of income available for savings`
  });

  // Diversification score (15 points) - based on portfolio allocation
  const diversificationScore = 15; // Give full points for following recommended allocation
  score += diversificationScore;
  factors.push({
    category: 'Portfolio Strategy',
    score: diversificationScore,
    maxScore: 15,
    description: 'Following professional allocation guidelines'
  });

  return {
    totalScore: Math.round(score),
    maxScore: 100,
    grade: getGrade(score),
    factors
  };
}

function getGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function estimateMonthlyDebtPayments(liabilities) {
  return liabilities.reduce((sum, debt) => {
    // Estimate minimum payment (simplified)
    return sum + (debt.balance * 0.02); // Assume 2% minimum payment
  }, 0);
}

function generateProjections(profile, portfolioAnalysis, retirementPlan) {
  const years = parseInt(profile.timeHorizon.split(' ')[0]);
  const projections = [];
  
  const initialInvestment = profile.currentSavings || 10000; // Use actual current savings
  const monthlyContribution = retirementPlan.monthlySavingsNeeded;
  const annualReturn = portfolioAnalysis.expectedReturn / 100;
  
  for (let year = 1; year <= Math.min(years, 30); year++) {
    const totalContributions = initialInvestment + (monthlyContribution * 12 * year);
    const compoundedValue = initialInvestment * Math.pow(1 + annualReturn, year) +
                           monthlyContribution * 12 * (Math.pow(1 + annualReturn, year) - 1) / annualReturn;
    
    projections.push({
      year,
      age: profile.age + year,
      totalContributions: Math.round(totalContributions),
      projectedValue: Math.round(compoundedValue),
      gains: Math.round(compoundedValue - totalContributions)
    });
  }
  
  return projections;
}

export default router;
