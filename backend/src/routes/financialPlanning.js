import express from 'express';
import logger from '../utils/logger.js';
import plaidService from '../services/mockPlaidService.js';

const router = express.Router();

// Comprehensive financial planning calculations based on 20 years of financial expertise
class FinancialPlanningEngine {
  constructor() {
    this.inflationRate = 0.025; // 2.5% annual average
    this.taxRates = {
      income: 0.22, // Marginal tax rate for middle-class earners
      capitalGains: 0.15, // Long-term capital gains
      retirement: 0.12 // Effective tax rate in retirement
    };
  }

  // Calculate comprehensive portfolio recommendations
  calculatePortfolioAllocation(profile) {
    const { age, riskTolerance, timeHorizon, investmentGoal, income } = profile;
    
    // Age-based allocation (100 - age rule with modern adjustments)
    const baseStockAllocation = Math.max(60, 120 - age);
    
    // Risk tolerance adjustments
    const riskMultipliers = {
      'Conservative': 0.7,
      'Moderate': 1.0,
      'Aggressive': 1.3
    };
    
    const riskAdjustedStock = Math.min(90, baseStockAllocation * riskMultipliers[riskTolerance]);
    
    // Goal-based adjustments
    const goalAdjustments = {
      'Retirement': { stocks: 0, bonds: 5, cash: -3 },
      'House': { stocks: -10, bonds: 5, cash: 5 },
      'Education': { stocks: -5, bonds: 0, cash: 5 },
      'Emergency Fund': { stocks: -20, bonds: 10, cash: 10 },
      'Wealth Building': { stocks: 5, bonds: -5, cash: 0 }
    };
    
    const adjustments = goalAdjustments[investmentGoal] || { stocks: 0, bonds: 0, cash: 0 };
    
    // Calculate final allocation
    let stocks = Math.max(30, Math.min(90, riskAdjustedStock + adjustments.stocks));
    let bonds = Math.max(5, Math.min(50, (100 - stocks) * 0.7 + adjustments.bonds));
    let realEstate = Math.max(5, Math.min(20, income > 100000 ? 12 : 8));
    let cash = Math.max(3, 100 - stocks - bonds - realEstate + adjustments.cash);
    
    // Ensure total equals 100%
    const total = stocks + bonds + realEstate + cash;
    stocks = Math.round((stocks / total) * 100);
    bonds = Math.round((bonds / total) * 100);
    realEstate = Math.round((realEstate / total) * 100);
    cash = 100 - stocks - bonds - realEstate;
    
    // Expected returns based on historical data and current market conditions
    const expectedReturn = (
      (stocks / 100) * 0.10 + 
      (bonds / 100) * 0.04 + 
      (realEstate / 100) * 0.08 + 
      (cash / 100) * 0.02
    );
    
    const volatility = (
      (stocks / 100) * 0.20 + 
      (bonds / 100) * 0.05 + 
      (realEstate / 100) * 0.15 + 
      (cash / 100) * 0.01
    );
    
    return {
      allocation: { stocks, bonds, realEstate, cash },
      expectedReturn: Math.round(expectedReturn * 1000) / 10,
      volatility: Math.round(volatility * 1000) / 10,
      riskLevel: this.calculateRiskLevel(volatility)
    };
  }

  calculateRiskLevel(volatility) {
    if (volatility < 0.08) return 'Low';
    if (volatility < 0.15) return 'Medium';
    return 'High';
  }

  // Calculate retirement needs using real user data and dynamic analysis
  calculateRetirementNeeds(profile, currentAssets = 0) {
    const { age, income, timeHorizon, currentSavings = 0, monthlyExpenses = 0 } = profile;
    const yearsToRetirement = parseInt(timeHorizon.split(' ')[0]);
    
    // Dynamic replacement ratio based on current spending patterns
    let replacementRatio = 0.8; // Default 80%
    if (monthlyExpenses > 0) {
      const annualExpenses = monthlyExpenses * 12;
      replacementRatio = Math.min(0.9, Math.max(0.6, annualExpenses / income));
    }
    
    // Adjust replacement ratio for income level (higher income = lower replacement ratio)
    if (income > 150000) replacementRatio *= 0.85;
    if (income < 50000) replacementRatio *= 1.1;
    
    const annualRetirementNeed = income * replacementRatio;
    
    // Use actual current savings from user input
    const totalCurrentAssets = currentAssets + currentSavings;
    
    // Adjust for inflation to retirement date
    const inflationAdjustedNeed = annualRetirementNeed * Math.pow(1 + this.inflationRate, yearsToRetirement);
    
    // Calculate required nest egg with dynamic withdrawal rate
    const withdrawalRate = yearsToRetirement > 30 ? 0.04 : yearsToRetirement > 20 ? 0.035 : 0.03;
    const requiredNestEgg = inflationAdjustedNeed / withdrawalRate / (1 - this.taxRates.retirement);
    
    // Current savings growth projection with user's actual portfolio
    const portfolio = this.calculatePortfolioAllocation(profile);
    const projectedCurrentAssets = totalCurrentAssets * Math.pow(1 + (portfolio.expectedReturn / 100), yearsToRetirement);
    
    // Required additional savings
    const shortfall = Math.max(0, requiredNestEgg - projectedCurrentAssets);
    
    // Monthly savings needed with dynamic calculation
    const annualSavingsNeeded = this.calculateAnnualSavingsNeeded(shortfall, yearsToRetirement, portfolio.expectedReturn / 100);
    const monthlySavingsNeeded = annualSavingsNeeded / 12;
    
    // Calculate what user can realistically save
    const monthlyIncome = income / 12;
    const availableForSaving = monthlyExpenses > 0 ? monthlyIncome - monthlyExpenses : monthlyIncome * 0.2;
    const feasibilityRatio = availableForSaving / monthlySavingsNeeded;
    
    return {
      requiredNestEgg: Math.round(requiredNestEgg),
      currentProjectedValue: Math.round(projectedCurrentAssets),
      shortfall: Math.round(shortfall),
      monthlySavingsNeeded: Math.round(monthlySavingsNeeded),
      annualRetirementIncome: Math.round(inflationAdjustedNeed),
      replacementRatio: Math.round(replacementRatio * 100),
      withdrawalRate: withdrawalRate,
      feasibilityScore: Math.min(100, Math.round(feasibilityRatio * 100)),
      monthlyAvailable: Math.round(availableForSaving),
      isRealistic: feasibilityRatio >= 0.8
    };
  }

  calculateAnnualSavingsNeeded(futureValue, years, interestRate) {
    if (interestRate === 0) return futureValue / years;
    return futureValue * interestRate / (Math.pow(1 + interestRate, years) - 1);
  }

  // Calculate emergency fund recommendations
  calculateEmergencyFund(profile, monthlyExpenses) {
    const { riskTolerance, income } = profile;
    
    // Recommended months of expenses based on risk tolerance and job stability
    const monthsNeeded = {
      'Conservative': 8,
      'Moderate': 6,
      'Aggressive': 4
    };
    
    // Adjust based on income (higher income = more stability)
    const incomeAdjustment = income > 150000 ? -1 : income < 50000 ? 1 : 0;
    const recommendedMonths = monthsNeeded[riskTolerance] + incomeAdjustment;
    
    const recommendedAmount = monthlyExpenses * recommendedMonths;
    
    return {
      recommendedAmount: Math.round(recommendedAmount),
      recommendedMonths,
      highYieldSavingsTarget: Math.round(recommendedAmount * 0.7),
      liquidInvestmentTarget: Math.round(recommendedAmount * 0.3)
    };
  }

  // Calculate house down payment strategy
  calculateHouseDownPayment(profile, targetHomePrice, timeHorizon) {
    const years = parseInt(timeHorizon.split(' ')[0]);
    
    // Conservative down payment recommendations
    const downPaymentPercent = profile.income > 100000 ? 0.20 : 0.15;
    const targetDownPayment = targetHomePrice * downPaymentPercent;
    
    // Closing costs (typically 2-5% of home price)
    const closingCosts = targetHomePrice * 0.03;
    const totalNeeded = targetDownPayment + closingCosts;
    
    // Conservative investment approach for house funds
    const expectedReturn = years > 5 ? 0.06 : 0.04; // Lower risk for shorter timeframes
    
    const monthlyContribution = this.calculateAnnualSavingsNeeded(totalNeeded, years, expectedReturn) / 12;
    
    return {
      targetDownPayment: Math.round(targetDownPayment),
      closingCosts: Math.round(closingCosts),
      totalNeeded: Math.round(totalNeeded),
      monthlyContribution: Math.round(monthlyContribution),
      downPaymentPercent: Math.round(downPaymentPercent * 100),
      timeHorizon: years
    };
  }

  // Generate professional financial recommendations
  generateRecommendations(profile, plaidData) {
    const recommendations = [];
    
    // Portfolio rebalancing
    if (plaidData.investments && plaidData.investments.length > 0) {
      const currentAllocation = this.analyzeCurrentAllocation(plaidData.investments);
      const recommendedAllocation = this.calculatePortfolioAllocation(profile);
      
      if (this.needsRebalancing(currentAllocation, recommendedAllocation.allocation)) {
        recommendations.push({
          type: 'portfolio',
          priority: 'high',
          title: 'Portfolio Rebalancing Needed',
          description: 'Your current allocation deviates significantly from optimal targets.',
          action: 'Consider rebalancing to improve risk-adjusted returns.',
          impact: 'Could improve returns by 0.5-1.5% annually'
        });
      }
    }

    // Emergency fund assessment
    if (plaidData.accounts) {
      const liquidSavings = this.calculateLiquidSavings(plaidData.accounts);
      const monthlyExpenses = this.estimateMonthlyExpenses(plaidData.transactions || []);
      const emergencyFund = this.calculateEmergencyFund(profile, monthlyExpenses);
      
      if (liquidSavings < emergencyFund.recommendedAmount * 0.8) {
        recommendations.push({
          type: 'emergency_fund',
          priority: 'high',
          title: 'Build Emergency Fund',
          description: `Increase emergency savings to ${emergencyFund.recommendedAmount.toLocaleString()}`,
          action: `Save an additional ${Math.round(emergencyFund.recommendedAmount - liquidSavings).toLocaleString()}`,
          impact: 'Provides financial security and peace of mind'
        });
      }
    }

    // Tax optimization
    if (profile.income > 50000) {
      recommendations.push({
        type: 'tax',
        priority: 'medium',
        title: 'Tax-Advantaged Account Optimization',
        description: 'Maximize contributions to 401(k), IRA, and HSA accounts.',
        action: 'Consider increasing pre-tax contributions to reduce current tax burden.',
        impact: `Could save ${Math.round(profile.income * 0.22 * 0.15).toLocaleString()} annually in taxes`
      });
    }

    // Debt optimization
    if (plaidData.liabilities && plaidData.liabilities.length > 0) {
      const highInterestDebt = plaidData.liabilities.filter(debt => debt.interestRate > 0.06);
      if (highInterestDebt.length > 0) {
        recommendations.push({
          type: 'debt',
          priority: 'high',
          title: 'High-Interest Debt Paydown',
          description: 'Focus on eliminating high-interest debt before investing.',
          action: 'Consider debt avalanche or snowball strategy.',
          impact: 'Guaranteed return equal to interest rate saved'
        });
      }
    }

    return recommendations;
  }

  analyzeCurrentAllocation(investments) {
    // Simplified allocation analysis
    let totalValue = investments.reduce((sum, inv) => sum + inv.value, 0);
    let stocks = 0, bonds = 0, other = 0;
    
    investments.forEach(inv => {
      if (inv.type === 'equity' || inv.category === 'stock') {
        stocks += inv.value;
      } else if (inv.type === 'bond' || inv.category === 'bond') {
        bonds += inv.value;
      } else {
        other += inv.value;
      }
    });
    
    return {
      stocks: Math.round((stocks / totalValue) * 100),
      bonds: Math.round((bonds / totalValue) * 100),
      other: Math.round((other / totalValue) * 100)
    };
  }

  needsRebalancing(current, target) {
    const threshold = 5; // 5% threshold for rebalancing
    return Math.abs(current.stocks - target.stocks) > threshold ||
           Math.abs(current.bonds - target.bonds) > threshold;
  }

  calculateLiquidSavings(accounts) {
    return accounts
      .filter(acc => acc.subtype === 'savings' || acc.subtype === 'checking')
      .reduce((sum, acc) => sum + acc.balances.current, 0);
  }

  estimateMonthlyExpenses(transactions) {
    // Estimate monthly expenses from transaction data
    const expenses = transactions
      .filter(t => t.amount > 0 && !t.category?.includes('Transfer'))
      .reduce((sum, t) => sum + t.amount, 0);
    
    // If we have 3+ months of data, use average; otherwise estimate
    return expenses > 0 ? expenses / 3 : 4000; // Default estimate
  }
}

const planningEngine = new FinancialPlanningEngine();

// Get comprehensive financial plan
router.post('/plan', async (req, res) => {
  try {
    const { profile, accessToken } = req.body;
    
    if (!profile) {
      return res.status(400).json({
        success: false,
        error: 'User profile is required'
      });
    }

    // Validate and sanitize profile data
    const sanitizedProfile = {
      age: parseInt(profile.age) || 25,
      income: parseFloat(profile.income) || 50000,
      riskTolerance: profile.riskTolerance || 'Moderate',
      investmentGoal: profile.investmentGoal || 'Retirement',
      timeHorizon: profile.timeHorizon || '30 years',
      currentSavings: parseFloat(profile.currentSavings) || 0,
      monthlyExpenses: parseFloat(profile.monthlyExpenses) || 3000,
      monthlySavings: parseFloat(profile.monthlySavings) || 500,
      hasEmergencyFund: Boolean(profile.hasEmergencyFund),
      has401k: Boolean(profile.has401k),
      employerMatch: parseFloat(profile.employerMatch) || 0
    };

    // Validate numeric ranges
    if (sanitizedProfile.age < 18 || sanitizedProfile.age > 100) {
      sanitizedProfile.age = Math.max(18, Math.min(100, sanitizedProfile.age));
    }
    
    if (sanitizedProfile.income < 0) {
      sanitizedProfile.income = 0;
    }

    logger.info('Generating comprehensive financial plan for validated profile');

    let plaidData = {
      accounts: [],
      transactions: [],
      investments: [],
      liabilities: []
    };

    // Fetch Plaid data if access token provided
    if (accessToken) {
      try {
        // Get accounts
        const accountsResponse = await plaidService.getAccounts(accessToken);
        plaidData.accounts = accountsResponse.accounts || [];

        // Get recent transactions (last 3 months)
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const transactionsResponse = await plaidService.getTransactions(
          accessToken, startDate, endDate, null, 500, 0
        );
        plaidData.transactions = transactionsResponse.transactions || [];

        // Get investment holdings if available
        try {
          const investmentsResponse = await plaidService.getInvestmentHoldings(accessToken);
          plaidData.investments = investmentsResponse.holdings || [];
        } catch (err) {
          logger.warn('Investment data not available or accessible');
        }

      } catch (error) {
        logger.warn('Failed to fetch Plaid data, using profile data only:', error.message);
      }
    }

    // Calculate portfolio recommendations
    const portfolioAnalysis = planningEngine.calculatePortfolioAllocation(sanitizedProfile);
    
    // Calculate current net worth from Plaid data
    const currentAssets = plaidData.accounts.reduce((sum, acc) => sum + acc.balances.current, 0);
    const investmentValue = plaidData.investments.reduce((sum, inv) => sum + (inv.value || 0), 0);
    const totalAssets = currentAssets + investmentValue;

    // Calculate retirement planning
    const retirementPlan = planningEngine.calculateRetirementNeeds(sanitizedProfile, totalAssets);

    // Calculate emergency fund needs
    const monthlyExpenses = planningEngine.estimateMonthlyExpenses(plaidData.transactions);
    const emergencyFund = planningEngine.calculateEmergencyFund(sanitizedProfile, monthlyExpenses);

    // Calculate house down payment if that's a goal
    let housePlan = null;
    if (sanitizedProfile.investmentGoal === 'House') {
      const targetHomePrice = sanitizedProfile.income * 3.5; // Conservative estimate
      housePlan = planningEngine.calculateHouseDownPayment(sanitizedProfile, targetHomePrice, sanitizedProfile.timeHorizon);
    }

    // Generate professional recommendations
    const recommendations = planningEngine.generateRecommendations(sanitizedProfile, plaidData);

    // Calculate financial health score
    const healthScore = calculateFinancialHealthScore(sanitizedProfile, plaidData, emergencyFund, retirementPlan);

    const response = {
      success: true,
      data: {
        profile: sanitizedProfile,
        portfolioAnalysis,
        retirementPlan,
        emergencyFund,
        housePlan,
        currentFinancials: {
          totalAssets: Math.round(totalAssets),
          liquidSavings: Math.round(planningEngine.calculateLiquidSavings(plaidData.accounts)),
          monthlyExpenses: Math.round(monthlyExpenses),
          netWorth: Math.round(totalAssets) // Simplified - would subtract liabilities
        },
        recommendations,
        healthScore,
        projections: generateProjections(sanitizedProfile, portfolioAnalysis, retirementPlan),
        lastUpdated: new Date().toISOString()
      }
    };

    res.json(response);

  } catch (error) {
    logger.error('Error generating financial plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate financial plan',
      message: error.message
    });
  }
});

// Real-time analysis endpoint for immediate feedback
router.post('/analyze', async (req, res) => {
  try {
    const { field, value, currentProfile } = req.body;
    
    if (!field || value === undefined || !currentProfile) {
      return res.status(400).json({
        success: false,
        error: 'Field, value, and current profile are required'
      });
    }

    // Create updated profile with the new value
    const updatedProfile = { ...currentProfile, [field]: value };
    
    // Calculate immediate impact of this change
    const analysis = analyzeFieldChange(field, value, currentProfile, updatedProfile);
    
    res.json({
      success: true,
      data: {
        field,
        oldValue: currentProfile[field],
        newValue: value,
        impact: analysis,
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

// Dynamic portfolio simulation endpoint
router.post('/simulate', async (req, res) => {
  try {
    const { scenarios, baseProfile } = req.body;
    
    if (!scenarios || !baseProfile) {
      return res.status(400).json({
        success: false,
        error: 'Scenarios and base profile are required'
      });
    }

    const results = [];
    
    for (const scenario of scenarios) {
      const testProfile = { ...baseProfile, ...scenario.changes };
      const portfolioAnalysis = planningEngine.calculatePortfolioAllocation(testProfile);
      const retirementPlan = planningEngine.calculateRetirementNeeds(testProfile, testProfile.currentSavings || 0);
      
      results.push({
        name: scenario.name,
        changes: scenario.changes,
        results: {
          expectedReturn: portfolioAnalysis.expectedReturn,
          monthlyNeeded: retirementPlan.monthlySavingsNeeded,
          feasibilityScore: retirementPlan.feasibilityScore,
          isRealistic: retirementPlan.isRealistic
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        baseProfile,
        scenarios: results,
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

// Real-time goal tracking endpoint
router.post('/track-progress', async (req, res) => {
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

// Calculate financial health score (0-100)
function calculateFinancialHealthScore(profile, plaidData, emergencyFund, retirementPlan) {
  let score = 0;
  const factors = [];

  // Emergency fund score (20 points)
  const liquidSavings = planningEngine.calculateLiquidSavings(plaidData.accounts);
  const emergencyRatio = liquidSavings / emergencyFund.recommendedAmount;
  const emergencyScore = Math.min(20, emergencyRatio * 20);
  score += emergencyScore;
  factors.push({
    category: 'Emergency Fund',
    score: Math.round(emergencyScore),
    maxScore: 20,
    description: `${Math.round(emergencyRatio * 100)}% of recommended emergency fund`
  });

  // Retirement savings score (25 points)
  const retirementRatio = retirementPlan.currentProjectedValue / retirementPlan.requiredNestEgg;
  const retirementScore = Math.min(25, retirementRatio * 25);
  score += retirementScore;
  factors.push({
    category: 'Retirement Readiness',
    score: Math.round(retirementScore),
    maxScore: 25,
    description: `${Math.round(retirementRatio * 100)}% of retirement goal`
  });

  // Debt-to-income ratio (20 points)
  const debtPayments = estimateMonthlyDebtPayments(plaidData.liabilities || []);
  const monthlyIncome = profile.income / 12;
  const debtRatio = debtPayments / monthlyIncome;
  const debtScore = Math.max(0, 20 - (debtRatio * 40)); // Lose points for high debt ratio
  score += debtScore;
  factors.push({
    category: 'Debt Management',
    score: Math.round(debtScore),
    maxScore: 20,
    description: `${Math.round(debtRatio * 100)}% debt-to-income ratio`
  });

  // Savings rate (20 points)
  const monthlyExpenses = planningEngine.estimateMonthlyExpenses(plaidData.transactions);
  const savingsRate = Math.max(0, (monthlyIncome - monthlyExpenses) / monthlyIncome);
  const savingsScore = Math.min(20, savingsRate * 40); // 50% savings rate = full points
  score += savingsScore;
  factors.push({
    category: 'Savings Rate',
    score: Math.round(savingsScore),
    maxScore: 20,
    description: `${Math.round(savingsRate * 100)}% of income saved`
  });

  // Diversification score (15 points)
  const diversificationScore = 15; // Simplified - would analyze actual portfolio
  score += diversificationScore;
  factors.push({
    category: 'Portfolio Diversification',
    score: diversificationScore,
    maxScore: 15,
    description: 'Well-diversified portfolio recommended'
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
