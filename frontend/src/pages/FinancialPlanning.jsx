// src/pages/FinancialPlanning.jsx
import { useState, useEffect, useCallback } from 'react';
import Card from '../components/Card';
import InteractiveQuestionnaire from '../components/InteractiveQuestionnaire';
import { fetchPlaidData, recommendStocks } from '../services/plaidService';
import { fetchRealTimeStockData, fetchFinancialProjections } from '../services/stockAnalysisService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

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

function FinancialPlanning() {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [userProfile, setUserProfile] = useState({
    monthlyIncome: 0,
    recurringExpenses: 0,
    monthlyInvestment: 0,
    financialGoals: '',
    riskTolerance: 'Moderate',
    savingsSurplus: 0,
    age: 0,
    currentSavings: 0,
    lumpSum: 0,
    riskAppetite: 'Medium',
    investmentHorizon: '5+ years',
    savingsRate: ''
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [financialPlan, setFinancialPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [realTimeInsights, setRealTimeInsights] = useState([]);
  const [inputChanged, setInputChanged] = useState(false);
  const [goalProgress, setGoalProgress] = useState(null);
  const [userInput, setUserInput] = useState(null);
  const [stockRecommendations, setStockRecommendations] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [aiTips, setAiTips] = useState([]);
  const [stockSuggestions, setStockSuggestions] = useState([]);
  const [projections, setProjections] = useState({
    retirement: [],
    investment: [],
    savings: []
  });
  const [portfolioAllocation, setPortfolioAllocation] = useState([]);
  const [riskAnalysis, setRiskAnalysis] = useState({
    score: 0,
    breakdown: []
  });


  // Check if user has completed the questionnaire
  const hasValidProfile = () => {
    return userProfile.age > 0 && 
           userProfile.income > 0 && 
           userProfile.riskTolerance && 
           userProfile.investmentGoal && 
           userProfile.timeHorizon;
  };



  // Show questionnaire if profile is incomplete
  useEffect(() => {
    if (!hasValidProfile()) {
      setShowQuestionnaire(true);
    }
  }, []);



  const handleQuestionnaireComplete = (profile) => {
    setUserProfile(profile);
    setShowQuestionnaire(false);
    setInputChanged(true);
  };

  // Debounced function for real-time analysis
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Real-time analysis when user changes input
  const analyzeChange = useCallback(
    debounce(async (field, value, currentProfile) => {
      try {
        const response = await fetch('http://localhost:5000/api/financial-planning/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: field,
            value: value,
            currentProfile: currentProfile
          })
        });

        if (response.ok) {
          const result = await response.json();
          setRealTimeInsights(prev => [
            {
              id: Date.now(),
              field,
              impact: result.data.impact,
              realisticImpact: result.data.realisticImpact, // Added realistic impact
              timestamp: new Date().toLocaleString()
            },
            ...prev.slice(0, 4) // Keep only last 5 insights
          ]);
        }
      } catch (error) {
        console.error('Real-time analysis error:', error);
      }
    }, 800),
    []
  );

  // Load financial plan on component mount and when profile changes significantly
  useEffect(() => {
    if (inputChanged) {
      generateFinancialPlan();
      setInputChanged(false);
    }
  }, [userProfile.age, userProfile.income, userProfile.riskTolerance, userProfile.investmentGoal, userProfile.currentSavings]);

  // Initial load
  useEffect(() => {
    generateFinancialPlan();
  }, []);

  const generateFinancialPlan = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/financial-planning/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: userProfile
        })
      });

      if (response.ok) {
        const result = await response.json();
        setFinancialPlan({
          ...result.data,
          realisticProjection: result.data.realisticProjection // Added realistic projection
        });
      } else {
        console.error('Error generating financial plan:', response.statusText);
      }
    } catch (error) {
      console.error('Error generating financial plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackGoalProgress = async () => {
    try {
      // Validate numeric values before sending
      const currentSavings = parseFloat(userProfile.currentSavings) || 0;
      const monthlyContribution = parseFloat(userProfile.monthlyInvestment) || userProfile.savingsSurplus;
      const targetAmount = parseFloat(userProfile.income) * 10 || 500000; // 10x income rule for retirement
      const timeframe = parseInt(userProfile.timeHorizon.split(' ')[0]) || 30;

      if (isNaN(currentSavings) || isNaN(monthlyContribution) || isNaN(targetAmount) || isNaN(timeframe)) {
        console.warn('Invalid numeric values for goal tracking');
        return;
      }

      const response = await fetch('http://localhost:5000/api/financial-planning/track-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSavings,
          monthlyContribution,
          targetAmount,
          timeframe,
          profile: userProfile
        })
      });

      if (response.ok) {
        const result = await response.json();
        setGoalProgress(result.data);
      } else {
        const error = await response.json();
        console.error('Goal tracking failed:', error);
      }
    } catch (error) {
      console.error('Goal tracking error:', error);
    }
  };

  const handleProfileChange = (field, value) => {
    const oldProfile = { ...userProfile };
    
    // Validate and convert numeric values
    let processedValue = value;
    if (['age', 'monthlyIncome', 'recurringExpenses', 'currentSavings', 'monthlyInvestment', 'lumpSum'].includes(field)) {
      // If the input is empty, keep it as empty string for display, but store as 0 for calculations
      if (value === '' || value === null || value === undefined) {
        processedValue = 0;
      } else {
        processedValue = parseFloat(value) || 0;
        if (isNaN(processedValue)) {
          processedValue = 0;
        }
      }
    }
    
    const newProfile = { ...userProfile, [field]: processedValue };
    
    // Calculate savings surplus when income or expenses change
    if (field === 'monthlyIncome' || field === 'recurringExpenses') {
      newProfile.savingsSurplus = (newProfile.monthlyIncome || 0) - (newProfile.recurringExpenses || 0);
    }
    
    setUserProfile(newProfile);
    setInputChanged(true);
    
    // Trigger real-time analysis only if we have valid values
    if (!isNaN(processedValue) && processedValue !== '' && processedValue !== null && processedValue > 0) {
      analyzeChange(field, processedValue, oldProfile);
    }
  };

  const simulateScenarios = async () => {
    const scenarios = [
      {
        name: 'Higher Income (+20%)',
        changes: { income: userProfile.income * 1.2 }
      },
      {
        name: 'More Aggressive Risk',
        changes: { riskTolerance: 'Aggressive' }
      },
      {
        name: 'Earlier Retirement',
        changes: { timeHorizon: `${Math.max(10, parseInt(userProfile.timeHorizon.split(' ')[0]) - 5)} years` }
      },
      {
        name: 'Lower Expenses (-15%)',
        changes: { monthlyExpenses: userProfile.monthlyExpenses * 0.85 }
      }
    ];

    try {
      const response = await fetch('http://localhost:5000/api/financial-planning/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarios,
          baseProfile: userProfile
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.data.scenarios;
      }
    } catch (error) {
      console.error('Simulation error:', error);
    }
    return [];
  };

  const portfolioOptions = {
    'Conservative': {
      expectedReturn: '6-8%',
      risk: 'Low',
      color: 'from-green-500 to-emerald-600',
      description: 'Lower volatility, steady growth'
    },
    'Moderate': {
      expectedReturn: '8-10%',
      risk: 'Medium',
      color: 'from-blue-500 to-indigo-600',
      description: 'Balanced risk and growth potential'
    },
    'Aggressive': {
      expectedReturn: '10-12%',
      risk: 'High',
      color: 'from-purple-500 to-pink-600',
      description: 'Higher volatility, maximum growth'
    }
  };

  // Fetch real-time financial data from Plaid API when user input is available
  useEffect(() => {
    if (userInput) {
      fetchPlaidData(userInput).then(data => {
        setFinancialPlan(data);
        setStockRecommendations(recommendStocks(data));
      });
    }
  }, [userInput]);

  // Calculate savings surplus and update user profile
  const calculateSurplus = () => {
    const surplus = userProfile.monthlyIncome - userProfile.recurringExpenses;
    setUserProfile(prev => ({ ...prev, savingsSurplus: surplus }));
  };

  // Generate dashboard data based on user profile
  const generateDashboardData = () => {
    const monthlyInvestment = parseFloat(userProfile.monthlyInvestment) || userProfile.savingsSurplus;
    setDashboardData({
      surplus: userProfile.savingsSurplus,
      monthlyInvestment: monthlyInvestment,
      deficit: userProfile.savingsSurplus < 0,
      expenseBreakdown: userProfile.recurringExpenses,
      goalTracking: userProfile.financialGoals
    });
  };

  // Generate AI tips based on user profile
  const generateAiTips = () => {
    const tips = [];
    const {
      monthlyIncome,
      recurringExpenses,
      monthlyInvestment,
      savingsSurplus,
      riskAppetite,
      lumpSum,
      age,
      investmentHorizon
    } = userProfile;

    // Savings and Investment Insights
    if (savingsSurplus > 0) {
      if (monthlyInvestment < savingsSurplus * 0.5) {
        tips.push(`You have potential to invest more. Consider increasing your monthly investment from ₹${monthlyInvestment} to at least ₹${Math.round(savingsSurplus * 0.5)} to build long-term wealth.`);
      }
      if (!monthlyInvestment) {
        tips.push(`You can save ₹${savingsSurplus} monthly. Start with a systematic investment plan (SIP) of ₹${Math.round(savingsSurplus * 0.3)} in mutual funds.`);
      }
    } else {
      const expenseRatio = recurringExpenses / monthlyIncome;
      if (expenseRatio > 0.7) {
        tips.push(`Your expenses are ${Math.round(expenseRatio * 100)}% of income. Try to reduce non-essential expenses to maintain the 50-30-20 budget rule.`);
      }
    }

    // Risk-based Portfolio Insights
    if (riskAppetite) {
      const portfolioSuggestions = {
        Low: "Consider balanced mutual funds with 60:40 debt to equity ratio for stable returns.",
        Medium: "Mix of index funds and actively managed mutual funds can provide good growth with managed risk.",
        High: "Look into sectoral funds and mid-cap stocks for higher growth potential."
      };
      tips.push(portfolioSuggestions[riskAppetite]);
    }

    // Age-based Insights
    if (age) {
      if (age < 30) {
        tips.push("Your young age allows for more risk. Consider allocating 70-80% to equity investments for long-term growth.");
      } else if (age > 45) {
        tips.push("As you approach retirement, gradually increase debt allocation. Consider shifting 40-50% of portfolio to debt instruments.");
      }
    }

    // Lump Sum Insights
    if (lumpSum > 50000) {
      tips.push(`Consider staggering your lump sum investment of ₹${lumpSum} through Systematic Transfer Plan (STP) to average out market risks.`);
    }

    // Investment Horizon Insights
    if (investmentHorizon) {
      const horizonTips = {
        '<1 year': "For short-term goals, focus on liquid funds and short-term debt funds to maintain capital safety.",
        '1-3 years': "Consider hybrid funds with dynamic asset allocation for medium-term goals.",
        '5+ years': "Long-term horizon allows for higher equity exposure. Look into multi-cap funds for diversified growth."
      };
      tips.push(horizonTips[investmentHorizon]);
    }

    // Tax Efficiency Tips
    if (monthlyIncome * 12 > 500000) {
      tips.push("Maximize tax benefits through ELSS mutual funds under Section 80C and NPS additional deduction under 80CCD(1B).");
    }

    // Emergency Fund Check
    const recommendedEmergencyFund = recurringExpenses * 6;
    if (!lumpSum || lumpSum < recommendedEmergencyFund) {
      tips.push(`Build an emergency fund of ₹${Math.round(recommendedEmergencyFund)}(6 months of expenses) before aggressive investing.`);
    }

    // Investment Diversification Tips
    if (monthlyInvestment > 10000) {
      tips.push("Consider diversifying across asset classes: 60% equity mutual funds, 20% debt funds, 10% gold ETF, and 10% high-interest savings.");
    }

    // If just starting out
    if (!monthlyInvestment && !lumpSum && savingsSurplus > 0) {
      tips.push("Start your investment journey with low-cost index funds. They provide broad market exposure with minimal fees.");
    }

    setAiTips(tips);
  };

  // Generate stock suggestions based on user profile
  const generateStockSuggestions = () => {
    const suggestions = recommendStocks(userProfile);
    setStockSuggestions(suggestions);
  };

  const generateRealisticProjections = async () => {
    setLoading(true);
    try {
      const response = await fetchFinancialProjections(userProfile);
      if (response.ok) {
        const result = await response.json();
        setFinancialPlan(result.data);
      } else {
        console.error('Error fetching realistic projections:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching realistic projections:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRealisticStockSuggestions = async () => {
    try {
      const response = await fetchRealTimeStockData(userProfile.riskTolerance);
      if (response.ok) {
        const result = await response.json();
        setStockSuggestions(result.data);
      } else {
        console.error('Error fetching stock suggestions:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching stock suggestions:', error);
    }
  };

  // Calculate retirement projections with detailed metrics
  const calculateRetirementProjections = () => {
    const years = 30;
    const inflationRate = 0.06;  // 6% average inflation
    const taxRate = 0.30;        // 30% tax bracket
    const epfRate = 0.0825;      // 8.25% EPF returns
    
    // Adjust returns based on risk appetite
    const returnRates = {
      Low: {
        conservative: 0.06,  // 6% for conservative
        moderate: 0.08,      // 8% for moderate
        aggressive: 0.10     // 10% for aggressive
      },
      Medium: {
        conservative: 0.08,  // 8% for conservative
        moderate: 0.12,      // 12% for moderate
        aggressive: 0.15     // 15% for aggressive
      },
      High: {
        conservative: 0.10,  // 10% for conservative
        moderate: 0.15,      // 15% for moderate
        aggressive: 0.20     // 20% for aggressive
      }
    };
    
    const riskLevel = userProfile.riskAppetite || 'Medium';
    const conservativeReturn = returnRates[riskLevel].conservative;
    const moderateReturn = returnRates[riskLevel].moderate;
    const aggressiveReturn = returnRates[riskLevel].aggressive;
    
    const monthlyContribution = parseFloat(userProfile.monthlyInvestment) || userProfile.savingsSurplus;
    const currentAge = userProfile.age || 30;
    let initialBalance = userProfile.lumpSum || 0;
    let epfBalance = userProfile.epfBalance || 0;
    
    const projectionData = [];
    
    // Calculate different scenarios with compound interest
    for (let year = 1; year <= years; year++) {
      const age = currentAge + year;
      
      // EPF calculation with compound interest
      const epfYearlyContribution = Math.min(userProfile.monthlyIncome * 0.12 * 12, 180000); // 12% of basic, max 15k monthly
      epfBalance = (epfBalance + epfYearlyContribution) * (1 + epfRate);
      
      // Investment portfolio calculations with monthly compounding
      const monthlyRate = {
        conservative: conservativeReturn / 12,
        moderate: moderateReturn / 12,
        aggressive: aggressiveReturn / 12
      };
      
      // Compound interest with monthly contributions
      const conservative = initialBalance * Math.pow(1 + monthlyRate.conservative, 12) + 
        monthlyContribution * ((Math.pow(1 + monthlyRate.conservative, 12) - 1) / monthlyRate.conservative);
      
      const moderate = initialBalance * Math.pow(1 + monthlyRate.moderate, 12) + 
        monthlyContribution * ((Math.pow(1 + monthlyRate.moderate, 12) - 1) / monthlyRate.moderate);
      
      const aggressive = initialBalance * Math.pow(1 + monthlyRate.aggressive, 12) + 
        monthlyContribution * ((Math.pow(1 + monthlyRate.aggressive, 12) - 1) / monthlyRate.aggressive);
      
      // Calculate inflation adjusted values
      const inflationAdjusted = moderate / Math.pow(1 + inflationRate, year);
      
      // Calculate required retirement corpus considering inflation and tax
      const yearsToRetirement = Math.max(0, 60 - age);
      const monthlyExpenseAtRetirement = userProfile.recurringExpenses * Math.pow(1 + inflationRate, yearsToRetirement);
      const requiredCorpus = (monthlyExpenseAtRetirement * 12 * 25); // 25 years post retirement
      
      // Calculate tax implications
      const taxableAmount = moderate * 0.8; // Assuming 80% of returns are taxable
      const taxPayable = taxableAmount * taxRate;
      const postTaxValue = moderate - taxPayable;
      
      projectionData.push({
        year,
        age,
        conservativeValue: Math.round(conservative),
        projectedValue: Math.round(moderate),
        aggressiveValue: Math.round(aggressive),
        inflationAdjustedValue: Math.round(inflationAdjusted),
        requiredCorpus: Math.round(requiredCorpus),
        epfBalance: Math.round(epfBalance),
        postTaxValue: Math.round(postTaxValue),
        monthly: Math.round(inflationAdjusted / (25 * 12)), // Monthly income at retirement
        totalSavings: Math.round(moderate + epfBalance),
        shortfall: Math.round(Math.max(0, requiredCorpus - (moderate + epfBalance)))
      });
      
      // Update balance for next iteration
      initialBalance = moderate;
    }
    
    setProjections(prev => ({ ...prev, retirement: projectionData }));
  };

  // Calculate portfolio allocation based on risk appetite
  const calculatePortfolioAllocation = () => {
    const allocations = {
      Low: [
        { name: 'Fixed Deposits', value: 40 },
        { name: 'Government Bonds', value: 30 },
        { name: 'Blue Chip Stocks', value: 20 },
        { name: 'Gold', value: 10 }
      ],
      Medium: [
        { name: 'Stocks', value: 40 },
        { name: 'Mutual Funds', value: 30 },
        { name: 'Bonds', value: 20 },
        { name: 'Cash', value: 10 }
      ],
      High: [
        { name: 'Growth Stocks', value: 50 },
        { name: 'International Stocks', value: 20 },
        { name: 'Cryptocurrency', value: 20 },
        { name: 'Bonds', value: 10 }
      ]
    };

    setPortfolioAllocation(allocations[userProfile.riskAppetite || 'Medium']);
  };

  // Calculate risk score
  const calculateRiskAnalysis = () => {
    let score = 0;
    const factors = [];

    // Age factor
    const age = userProfile.age || 30;
    const ageFactor = Math.max(0, Math.min(100 - age, 100)) / 100;
    score += ageFactor * 25;
    factors.push({ name: 'Age Factor', score: Math.round(ageFactor * 25) });

    // Income stability
    const incomeStability = userProfile.monthlyIncome > 0 ? 25 : 0;
    score += incomeStability;
    factors.push({ name: 'Income Stability', score: incomeStability });

    // Debt ratio
    const debtRatio = userProfile.recurringExpenses / userProfile.monthlyIncome;
    const debtScore = Math.max(0, 25 * (1 - debtRatio));
    score += debtScore;
    factors.push({ name: 'Debt Management', score: Math.round(debtScore) });

    // Investment horizon
    const horizonScore = {
      '<1 year': 5,
      '1-3 years': 15,
      '5+ years': 25
    }[userProfile.investmentHorizon] || 15;
    score += horizonScore;
    factors.push({ name: 'Investment Horizon', score: horizonScore });

    setRiskAnalysis({ score: Math.round(score), breakdown: factors });
  };

  useEffect(() => {
    if (userProfile.monthlyIncome > 0) {
      calculateRetirementProjections();
      calculatePortfolioAllocation();
      calculateRiskAnalysis();
    }
  }, [userProfile, userProfile.riskAppetite]);

  useEffect(() => {
    calculateSurplus();
    generateDashboardData();
    generateAiTips();
    generateStockSuggestions();
    generateRealisticProjections();
    generateRealisticStockSuggestions();
  }, [userProfile.monthlyIncome, userProfile.recurringExpenses, userProfile.financialGoals, userProfile.riskTolerance]);

  if (loading && !financialPlan) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your personalized financial plan...</p>
        </div>
      </div>
    );
  }

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-purple-700 mb-6">Professional Financial Planning</h1>
      
      {/* Grid layout for the dashboard */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Input Form and Additional Components - Takes 1/4 of the width on xl screens */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Financial Profile</h2>
          {/* ... existing input form ... */}
          <label className="block mb-2">Monthly Income:</label>
          <input
            type="number"
            className="w-full p-2 border rounded mb-4"
            placeholder="Enter your monthly income"
            value={userProfile.monthlyIncome === 0 ? '' : userProfile.monthlyIncome}
            onChange={(e) => handleProfileChange('monthlyIncome', e.target.value)}
          />
          <label className="block mb-2">Monthly Fixed Expenses:</label>
          <input
            type="number"
            className="w-full p-2 border rounded mb-4"
            placeholder="Enter your monthly expenses"
            value={userProfile.recurringExpenses === 0 ? '' : userProfile.recurringExpenses}
            onChange={(e) => handleProfileChange('recurringExpenses', e.target.value)}
          />
          <label className="block mb-2">Monthly Investment Amount:</label>
          <input
            type="number"
            className="w-full p-2 border rounded mb-4"
            placeholder="How much can you invest monthly?"
            value={userProfile.monthlyInvestment === 0 ? '' : userProfile.monthlyInvestment}
            onChange={(e) => handleProfileChange('monthlyInvestment', e.target.value)}
          />
          <div className="mb-4 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Savings Surplus: ₹{userProfile.savingsSurplus}</span>
              <button
                className="text-purple-600 hover:text-purple-800"
                onClick={() => handleProfileChange('monthlyInvestment', userProfile.savingsSurplus)}
              >
                Use This Amount
              </button>
            </div>
          </div>
          <label className="block mb-2">Target Savings Rate (% or ₹):</label>
          <input
            type="text"
            className="w-full p-2 border rounded mb-4"
            value={userProfile.savingsRate}
            onChange={(e) => handleProfileChange('savingsRate', e.target.value)}
          />
          <label className="block mb-2">Investment Horizon:</label>
          <select
            className="w-full p-2 border rounded mb-4"
            value={userProfile.investmentHorizon}
            onChange={(e) => handleProfileChange('investmentHorizon', e.target.value)}
          >
            <option value="<1 year">&lt;1 year</option>
            <option value="1-3 years">1–3 years</option>
            <option value="5+ years">5+ years</option>
          </select>
          <label className="block mb-2">Risk Appetite:</label>
          <select
            className="w-full p-2 border rounded mb-4"
            value={userProfile.riskAppetite}
            onChange={(e) => handleProfileChange('riskAppetite', e.target.value)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <label className="block mb-2">Financial Goals (Optional):</label>
          <textarea
            className="w-full p-2 border rounded mb-4"
            value={userProfile.financialGoals}
            onChange={(e) => handleProfileChange('financialGoals', e.target.value)}
          ></textarea>
          <label className="block mb-2">Lump Sum Available:</label>
          <input
            type="number"
            className="w-full p-2 border rounded mb-4"
            placeholder="Enter any lump sum amount available"
            value={userProfile.lumpSum === 0 ? '' : userProfile.lumpSum}
            onChange={(e) => handleProfileChange('lumpSum', e.target.value)}
          />
          <label className="block mb-2">Current Age:</label>
          <input
            type="number"
            className="w-full p-2 border rounded mb-4"
            placeholder="Enter your current age"
            value={userProfile.age === 0 ? '' : userProfile.age}
            onChange={(e) => handleProfileChange('age', e.target.value)}
          />
          <label className="block mb-2">Current Savings:</label>
          <input
            type="number"
            className="w-full p-2 border rounded mb-4"
            placeholder="Total current savings/investments"
            value={userProfile.currentSavings === 0 ? '' : userProfile.currentSavings}
            onChange={(e) => handleProfileChange('currentSavings', e.target.value)}
          />
          </div>

          {/* Additional Components Below the Form */}
          <div className="space-y-4">
            {/* Quick Financial Health Indicators */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Financial Health Check</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Savings Rate</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`h-2 rounded-full ${
                          ((userProfile.savingsSurplus || 0) / (userProfile.monthlyIncome || 1) * 100) >= 20 
                            ? 'bg-green-500' 
                            : ((userProfile.savingsSurplus || 0) / (userProfile.monthlyIncome || 1) * 100) >= 10 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, (userProfile.savingsSurplus || 0) / (userProfile.monthlyIncome || 1) * 100))}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">
                      {userProfile.monthlyIncome > 0 ? ((userProfile.savingsSurplus || 0) / userProfile.monthlyIncome * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Emergency Fund</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`h-2 rounded-full ${
                          ((userProfile.currentSavings || 0) / ((userProfile.recurringExpenses || 0) * 6 || 1)) >= 1 
                            ? 'bg-green-500' 
                            : ((userProfile.currentSavings || 0) / ((userProfile.recurringExpenses || 0) * 6 || 1)) >= 0.5 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, (userProfile.currentSavings || 0) / ((userProfile.recurringExpenses || 0) * 6 || 1) * 100))}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">
                      {(userProfile.recurringExpenses > 0) ? ((userProfile.currentSavings || 0) / (userProfile.recurringExpenses * 6) * 100).toFixed(0) : '0'}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Investment Ratio</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`h-2 rounded-full ${
                          ((userProfile.monthlyInvestment || 0) / (userProfile.monthlyIncome || 1) * 100) >= 15 
                            ? 'bg-green-500' 
                            : ((userProfile.monthlyInvestment || 0) / (userProfile.monthlyIncome || 1) * 100) >= 10 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, (userProfile.monthlyInvestment || 0) / (userProfile.monthlyIncome || 1) * 100))}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">
                      {userProfile.monthlyIncome > 0 ? ((userProfile.monthlyInvestment || 0) / userProfile.monthlyIncome * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Goal Progress Tracker */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Goal Progress</h3>
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-blue-800">Retirement Goal</span>
                    <span className="text-xs text-blue-600">
                      {userProfile.investmentHorizon ? `${userProfile.investmentHorizon}` : 'Set timeline'}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, Math.max(0, (() => {
                          const currentSavings = userProfile.currentSavings || 0;
                          const monthlyInvestment = userProfile.monthlyInvestment || 0;
                          const years = userProfile.investmentHorizon === '5+ years' ? 10 : 
                                       userProfile.investmentHorizon === '1-3 years' ? 3 : 1;
                          const returnRate = 0.12; // 12% annual return
                          
                          // Future value calculation with compound interest
                          const futureValue = currentSavings * Math.pow(1 + returnRate, years) + 
                            monthlyInvestment * 12 * (Math.pow(1 + returnRate, years) - 1) / returnRate;
                          
                          return (futureValue / 10000000) * 100; // Target: 1 Cr
                        })()))}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-blue-600 mt-1">
                    <span>₹{(() => {
                      const currentSavings = userProfile.currentSavings || 0;
                      const monthlyInvestment = userProfile.monthlyInvestment || 0;
                      const years = userProfile.investmentHorizon === '5+ years' ? 10 : 
                                   userProfile.investmentHorizon === '1-3 years' ? 3 : 1;
                      const returnRate = 0.12;
                      
                      const futureValue = currentSavings * Math.pow(1 + returnRate, years) + 
                        monthlyInvestment * 12 * (Math.pow(1 + returnRate, years) - 1) / returnRate;
                      
                      return (futureValue/100000).toFixed(1);
                    })()}L</span>
                    <span>Target: ₹1Cr</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-green-800">Emergency Fund</span>
                    <span className="text-xs text-green-600">6 months expenses</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, Math.max(0, ((userProfile.currentSavings || 0) / ((userProfile.recurringExpenses || 0) * 6 || 1)) * 100))}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-green-600 mt-1">
                    <span>₹{((userProfile.currentSavings || 0)/1000).toFixed(0)}K</span>
                    <span>Target: ₹{(((userProfile.recurringExpenses || 0) * 6)/1000).toFixed(0)}K</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-purple-800">Monthly Investment Target</span>
                    <span className="text-xs text-purple-600">20% of income</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, Math.max(0, ((userProfile.monthlyInvestment || 0) / (((userProfile.monthlyIncome || 0) * 0.2) || 1)) * 100))}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-purple-600 mt-1">
                    <span>₹{(userProfile.monthlyInvestment || 0).toLocaleString()}</span>
                    <span>Target: ₹{(((userProfile.monthlyIncome || 0) * 0.2)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>



            {/* Recent Changes Log */}
            {realTimeInsights.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Recent Updates</h3>
                <div className="space-y-2">
                  {realTimeInsights.slice(0, 3).map((insight, index) => (
                    <div key={insight.id} className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-2 h-2 rounded-full ${
                          insight.impact === 'positive' ? 'bg-green-500' : 
                          insight.impact === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 capitalize">
                          {insight.field.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-xs text-gray-500">{insight.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main dashboard area - Takes 3/4 of the width on xl screens */}
        <div className="xl:col-span-3 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700">Risk Score</h3>
              <div className="text-3xl font-bold text-purple-600">{riskAnalysis.score}/100</div>
              <div className="text-sm text-gray-500">Based on your profile</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700">Monthly Surplus</h3>
              <div className="text-3xl font-bold text-green-600">₹{userProfile.savingsSurplus || 0}</div>
              <div className="text-sm text-gray-500">Available for investment</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold text-gray-700">Investment Potential</h3>
              <div className="text-3xl font-bold text-blue-600">
                ₹{Math.round((parseFloat(userProfile.monthlyInvestment) || userProfile.savingsSurplus || 0) * 12 * 1.15)}
              </div>
              <div className="text-sm text-gray-500">Annual potential with returns</div>
            </div>
          </div>

          {/* Retirement Projection Chart */}
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Retirement Projection</h3>
            <div className="h-[400px] lg:h-[500px]">
              {projections.retirement.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={projections.retirement}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="age" 
                      label={{ value: 'Age', position: 'bottom', offset: -10 }}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Portfolio Value (₹L)', 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: -5
                      }}
                      tickFormatter={(value) => `₹${(value/100000).toFixed(0)}L`}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        const formattedValue = (value/100000).toFixed(2);
                        const labels = {
                          aggressiveValue: 'Aggressive Growth',
                          projectedValue: 'Expected Growth',
                          conservativeValue: 'Conservative Growth',
                          inflationAdjustedValue: 'Inflation Adjusted',
                          requiredCorpus: 'Required Corpus',
                          epfBalance: 'EPF Balance',
                          postTaxValue: 'Post-Tax Value'
                        };
                        return [`₹${formattedValue}L`, labels[name] || name];
                      }}
                      labelFormatter={(age) => `Age: ${age} years`}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    <Line 
                      type="monotone" 
                      dataKey="aggressiveValue" 
                      name="Aggressive Growth" 
                      stroke="#ff4d4d" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="projectedValue" 
                      name="Expected Growth" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="conservativeValue" 
                      name="Conservative Growth" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="epfBalance" 
                      name="EPF Balance" 
                      stroke="#40a9ff" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="postTaxValue" 
                      name="Post-Tax Value" 
                      stroke="#722ed1" 
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="4 4"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="inflationAdjustedValue" 
                      name="Inflation Adjusted" 
                      stroke="#ffc658" 
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="requiredCorpus" 
                      name="Required Corpus" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="3 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h4 className="text-lg font-medium mb-2">Retirement Projection</h4>
                  <p className="text-center text-sm">Fill in your financial details to see your retirement projection chart</p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded mr-1"></div>
                      Aggressive Growth
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded mr-1"></div>
                      Expected Growth
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded mr-1"></div>
                      Conservative Growth
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Retirement Summary Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {projections.retirement.length > 0 && (
                <>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-600">Expected Corpus at 60</h4>
                    <p className="text-2xl font-bold text-purple-600">
                      ₹{(projections.retirement[Math.min(30, projections.retirement.length - 1)]?.totalSavings/100000 || 0).toFixed(1)}L
                    </p>
                    <p className="text-xs text-gray-500">Including EPF balance</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-600">Monthly Income at Retirement</h4>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{(projections.retirement[Math.min(30, projections.retirement.length - 1)]?.monthly/1000 || 0).toFixed(1)}K
                    </p>
                    <p className="text-xs text-gray-500">Inflation adjusted</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-600">Required Corpus</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{(projections.retirement[Math.min(30, projections.retirement.length - 1)]?.requiredCorpus/100000 || 0).toFixed(1)}L
                    </p>
                    <p className="text-xs text-gray-500">For desired lifestyle</p>
                  </div>
                  <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-600">Projected Shortfall</h4>
                    <p className="text-2xl font-bold text-red-600">
                      ₹{(projections.retirement[Math.min(30, projections.retirement.length - 1)]?.shortfall/100000 || 0).toFixed(1)}L
                    </p>
                    <p className="text-xs text-gray-500">Additional savings needed</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Portfolio Allocation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 lg:p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Recommended Portfolio</h3>
              <div className="h-[250px] lg:h-[300px]">
                {portfolioAllocation.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolioAllocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {portfolioAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                    <h4 className="text-lg font-medium mb-2">Portfolio Allocation</h4>
                    <p className="text-center text-sm mb-4">Enter your risk appetite to see recommended portfolio allocation</p>
                    <div className="flex flex-wrap gap-2 justify-center text-xs">
                      <span className="flex items-center px-3 py-1 bg-blue-100 text-blue-600 rounded-full">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Stocks
                      </span>
                      <span className="flex items-center px-3 py-1 bg-green-100 text-green-600 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Bonds
                      </span>
                      <span className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                        Gold
                      </span>
                      <span className="flex items-center px-3 py-1 bg-purple-100 text-purple-600 rounded-full">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        Cash
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Risk Analysis Breakdown */}
            <div className="bg-white p-4 lg:p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Risk Analysis</h3>
              <div className="space-y-4">
                {riskAnalysis.breakdown.length > 0 ? (
                  riskAnalysis.breakdown.map((factor, index) => (
                    <div key={index}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{factor.name}</span>
                        <span className="text-sm font-medium text-gray-700">{factor.score}/25</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-purple-600 h-2.5 rounded-full"
                          style={{ width: `${(factor.score / 25) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-lg font-medium mb-2">Risk Assessment</h4>
                    <p className="text-center text-sm mb-4">Complete your profile to see personalized risk analysis</p>
                    <div className="space-y-3 w-full max-w-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Age Factor</span>
                        <span className="text-xs text-gray-400">--/25</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-gray-300 h-2 rounded-full w-0"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Income Stability</span>
                        <span className="text-xs text-gray-400">--/25</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-gray-300 h-2 rounded-full w-0"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Debt Management</span>
                        <span className="text-xs text-gray-400">--/25</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-gray-300 h-2 rounded-full w-0"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Investment Horizon</span>
                        <span className="text-xs text-gray-400">--/25</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-gray-300 h-2 rounded-full w-0"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Insights and Recommendations */}
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Professional Insights</h3>
            <div className="space-y-4">
              {aiTips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-700">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinancialPlanning;