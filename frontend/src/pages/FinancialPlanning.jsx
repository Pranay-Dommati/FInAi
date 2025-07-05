// src/pages/FinancialPlanning.jsx
import { useState, useEffect, useCallback } from 'react';
import Card from '../components/Card';
import InteractiveQuestionnaire from '../components/InteractiveQuestionnaire';

function FinancialPlanning() {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [userProfile, setUserProfile] = useState({
    age: 0,
    income: 0,
    riskTolerance: '',
    investmentGoal: '',
    timeHorizon: '',
    currentSavings: 0,
    monthlyExpenses: 0,
    hasEmergencyFund: false,
    has401k: false,
    employerMatch: 0
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [financialPlan, setFinancialPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [plaidConnected, setPlaidConnected] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [realTimeInsights, setRealTimeInsights] = useState([]);
  const [inputChanged, setInputChanged] = useState(false);
  const [goalProgress, setGoalProgress] = useState(null);

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
            field,
            value,
            currentProfile
          })
        });

        if (response.ok) {
          const result = await response.json();
          setRealTimeInsights(prev => [
            {
              id: Date.now(),
              field,
              impact: result.data.impact,
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
          profile: userProfile,
          accessToken: accessToken
        })
      });

      if (response.ok) {
        const result = await response.json();
        setFinancialPlan(result.data);
        
        // Track goal progress if we have savings data
        if (userProfile.currentSavings > 0) {
          trackGoalProgress();
        }
      } else {
        console.error('Failed to generate financial plan');
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
      const monthlyContribution = 500; // Default assumption
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
    if (['age', 'income', 'currentSavings', 'monthlyExpenses', 'employerMatch'].includes(field)) {
      processedValue = parseFloat(value) || 0;
      if (isNaN(processedValue)) {
        processedValue = 0;
      }
    }
    
    const newProfile = { ...userProfile, [field]: processedValue };
    
    setUserProfile(newProfile);
    setInputChanged(true);
    
    // Trigger real-time analysis only if we have valid values
    if (!isNaN(processedValue) && processedValue !== '' && processedValue !== null) {
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

  const connectPlaid = async () => {
    // In a real implementation, this would initiate Plaid Link
    // For demo purposes, we'll simulate a connection
    setPlaidConnected(true);
    setAccessToken('mock-access-token');
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Show Interactive Questionnaire */}
      {showQuestionnaire && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                🎯 Let's Build Your Financial Plan
              </h2>
              <button
                onClick={() => setShowQuestionnaire(false)}
                className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1 rounded border border-gray-300 hover:border-gray-400 transition-colors"
              >
                Skip for now
              </button>
            </div>
            <p className="text-gray-600 mt-2">
              Answer a few quick questions to get personalized recommendations
            </p>
          </div>
          <InteractiveQuestionnaire
            onComplete={handleQuestionnaireComplete}
            initialProfile={userProfile}
          />
        </div>
      )}

      {/* Main Planning Interface */}
      {!showQuestionnaire && (
        <>
          {/* Header Section */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                  <span className="mr-3">💼</span>
                  Personalized Financial Planning
                </h1>
                <p className="text-gray-600 text-lg">
                  Professional-grade financial planning powered by AI and real-time data
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowQuestionnaire(true)}
                  className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg text-sm"
                >
                  {hasValidProfile() ? '✨ Update Profile' : '🚀 Get Started'}
                </button>
                {!plaidConnected ? (
                  <button
                    onClick={connectPlaid}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg text-sm"
                  >
                    🔗 Connect Bank
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 text-green-600">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="font-medium">Bank Connected</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Health Score */}
            {financialPlan?.healthScore && (
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Financial Health Score</h3>
                  <div className="text-3xl font-bold text-indigo-600">
                    {financialPlan.healthScore.totalScore}/100
                  </div>
                </div>
                <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 h-4 rounded-full transition-all duration-1000"
                  style={{ width: `${financialPlan.healthScore.totalScore}%` }}
                ></div>
              </div>
              <span className="text-2xl font-bold text-indigo-600">
                {financialPlan.healthScore.grade}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'portfolio', label: 'Portfolio', icon: '�' },
            { id: 'retirement', label: 'Retirement', icon: '🏖️' },
            { id: 'goals', label: 'Goals', icon: '🎯' },
            { id: 'profile', label: 'Profile', icon: '👤' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-max px-6 py-4 text-center font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* Welcome Message for Empty Profile */}
          {!hasValidProfile() && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Your Financial Journey
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Let's create a personalized financial plan tailored to your goals, risk tolerance, and timeline. 
                Our AI-powered system will provide professional-grade recommendations in just a few minutes.
              </p>
              <button
                onClick={() => setShowQuestionnaire(true)}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg text-lg font-semibold transform hover:scale-105"
              >
                🚀 Start Your Financial Plan
              </button>
            </div>
          )}

          {activeTab === 'overview' && financialPlan && (
            <div className="space-y-8">
              {/* Real-time Insights Panel */}
              {realTimeInsights.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">🔍 Real-time Analysis</h2>
                  <div className="space-y-3">
                    {realTimeInsights.map((insight) => (
                      <Card key={insight.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            📊
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              Changed: {insight.field.charAt(0).toUpperCase() + insight.field.slice(1)}
                            </h4>
                            <div className="space-y-1 text-sm">
                              {insight.impact.insights?.map((tip, index) => (
                                <p key={index} className="text-gray-700">• {tip}</p>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{insight.timestamp}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Financial Snapshot */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Live Financial Dashboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 hover:shadow-lg transition-all duration-300">
                    <div className="text-center">
                      <div className="text-3xl mb-2">💰</div>
                      <p className="text-sm text-gray-600 mb-1">Total Assets</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(financialPlan.currentFinancials.totalAssets + userProfile.currentSavings).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {plaidConnected ? 'Live Data' : 'Manual Input'}
                      </p>
                    </div>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-100 hover:shadow-lg transition-all duration-300">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🏦</div>
                      <p className="text-sm text-gray-600 mb-1">Monthly Savings Potential</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.max(0, (userProfile.income / 12) - userProfile.monthlyExpenses).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Based on current expenses
                      </p>
                    </div>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-100 hover:shadow-lg transition-all duration-300">
                    <div className="text-center">
                      <div className="text-3xl mb-2">�</div>
                      <p className="text-sm text-gray-600 mb-1">Expected Return</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {financialPlan.portfolioAnalysis.expectedReturn}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {financialPlan.portfolioAnalysis.riskLevel} Risk
                      </p>
                    </div>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-orange-50 to-red-100 hover:shadow-lg transition-all duration-300">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🎯</div>
                      <p className="text-sm text-gray-600 mb-1">Goal Feasibility</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {financialPlan.retirementPlan.feasibilityScore || 'N/A'}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {financialPlan.retirementPlan.isRealistic ? '✅ Realistic' : '⚠️ Challenging'}
                      </p>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Goal Progress Tracking */}
              {goalProgress && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Goal Progress Tracking</h2>
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <h4 className="font-semibold text-gray-900 mb-2">Current Progress</h4>
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          {goalProgress.currentSavings.toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-600">Starting Point</p>
                      </div>
                      
                      <div className="text-center">
                        <h4 className="font-semibold text-gray-900 mb-2">Projected Value</h4>
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {goalProgress.projectedFinalValue.toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-600">
                          {goalProgress.willReachGoal ? '✅ Goal Achieved' : '⚠️ Shortfall'}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <h4 className="font-semibold text-gray-900 mb-2">Monthly Needed</h4>
                        <div className="text-3xl font-bold text-purple-600 mb-1">
                          {(goalProgress.monthlyContribution + goalProgress.additionalMonthlyNeeded).toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-600">
                          {goalProgress.additionalMonthlyNeeded > 0 && (
                            <span className="text-orange-600">
                              +{goalProgress.additionalMonthlyNeeded.toLocaleString()} more needed
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress Timeline</span>
                        <span>{goalProgress.timeframe} years</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-blue-600 h-4 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${Math.min(100, (goalProgress.currentSavings / goalProgress.targetAmount) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Interactive Scenario Builder */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">🔮 What-If Scenarios</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Adjustments</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Test Monthly Contribution
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2000"
                          step="50"
                          defaultValue="500"
                          className="w-full"
                          onChange={(e) => {
                            // Real-time update for contribution impact
                            const newContribution = parseInt(e.target.value);
                            document.getElementById('contribution-display').textContent = `${newContribution}`;
                          }}
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>0</span>
                          <span id="contribution-display" className="font-semibold">500</span>
                          <span>2000</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Test Different Age
                        </label>
                        <input
                          type="range"
                          min="22"
                          max="65"
                          defaultValue={userProfile.age}
                          className="w-full"
                          onChange={(e) => {
                            const newAge = parseInt(e.target.value);
                            document.getElementById('age-display').textContent = `${newAge} years old`;
                          }}
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>22</span>
                          <span id="age-display" className="font-semibold">{userProfile.age} years old</span>
                          <span>65</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={async () => {
                          const scenarios = await simulateScenarios();
                          setRealTimeInsights(prev => [
                            {
                              id: Date.now(),
                              field: 'scenarios',
                              impact: { insights: scenarios.map(s => `${s.name}: ${s.results.isRealistic ? '✅' : '⚠️'} ${s.results.feasibilityScore}% feasible`) },
                              timestamp: new Date().toLocaleString()
                            },
                            ...prev.slice(0, 4)
                          ]);
                        }}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
                      >
                        🚀 Run Scenarios
                      </button>
                    </div>
                  </Card>
                  
                  <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Calculations</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Savings Rate:</span>
                        <span className="font-semibold">
                          {Math.round(((userProfile.income / 12 - userProfile.monthlyExpenses) / (userProfile.income / 12)) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Emergency Fund Status:</span>
                        <span className="font-semibold">
                          {financialPlan.emergencyFund && userProfile.currentSavings >= financialPlan.emergencyFund.recommendedAmount ? 
                            '✅ Adequate' : '⚠️ Needs Work'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Retirement Timeline:</span>
                        <span className="font-semibold">
                          {userProfile.age + parseInt(userProfile.timeHorizon.split(' ')[0])} years old
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Surplus:</span>
                        <span className={`font-semibold ${(userProfile.income / 12 - userProfile.monthlyExpenses) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {((userProfile.income / 12) - userProfile.monthlyExpenses).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Recommendations */}
              {financialPlan.recommendations && financialPlan.recommendations.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional Recommendations</h2>
                  <div className="space-y-4">
                    {financialPlan.recommendations.map((rec, index) => (
                      <Card key={index} className={`border-l-4 ${
                        rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                        rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-green-500 bg-green-50'
                      }`}>
                        <div className="flex items-start space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                            rec.priority === 'high' ? 'bg-red-500' :
                            rec.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}>
                            {rec.priority === 'high' ? '!' : rec.priority === 'medium' ? '⚠' : '✓'}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">{rec.title}</h3>
                            <p className="text-gray-700 mb-2">{rec.description}</p>
                            <p className="text-sm text-gray-600 mb-2"><strong>Action:</strong> {rec.action}</p>
                            <p className="text-sm text-indigo-600 font-medium">{rec.impact}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Health Score Breakdown */}
              {financialPlan.healthScore && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Health Score Breakdown</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {financialPlan.healthScore.factors.map((factor, index) => (
                      <Card key={index}>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-gray-900">{factor.category}</h3>
                          <span className="font-bold text-indigo-600">
                            {factor.score}/{factor.maxScore}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-blue-600 h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600">{factor.description}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'portfolio' && financialPlan && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Portfolio Allocation */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Portfolio</h2>
                
                {/* Risk Tolerance Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Risk Tolerance</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.keys(portfolioOptions).map((risk) => (
                      <button
                        key={risk}
                        onClick={() => handleProfileChange('riskTolerance', risk)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          userProfile.riskTolerance === risk
                            ? `bg-gradient-to-r ${portfolioOptions[risk].color} text-white shadow-lg`
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {risk}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {portfolioOptions[userProfile.riskTolerance].description}
                  </p>
                </div>

                {/* Portfolio Breakdown */}
                <div className="space-y-4">
                  {[
                    { 
                      name: 'Stocks', 
                      percentage: financialPlan.portfolioAnalysis.allocation.stocks, 
                      icon: '📈', 
                      color: 'bg-blue-500' 
                    },
                    { 
                      name: 'Bonds', 
                      percentage: financialPlan.portfolioAnalysis.allocation.bonds, 
                      icon: '📊', 
                      color: 'bg-green-500' 
                    },
                    { 
                      name: 'Real Estate', 
                      percentage: financialPlan.portfolioAnalysis.allocation.realEstate, 
                      icon: '🏠', 
                      color: 'bg-purple-500' 
                    },
                    { 
                      name: 'Cash', 
                      percentage: financialPlan.portfolioAnalysis.allocation.cash, 
                      icon: '💰', 
                      color: 'bg-yellow-500' 
                    }
                  ].map((asset) => (
                    <div key={asset.name} className="flex items-center space-x-4">
                      <div className={`w-8 h-8 ${asset.color} rounded-lg flex items-center justify-center text-white text-sm`}>
                        {asset.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-900">{asset.name}</span>
                          <span className="font-bold text-gray-900">{asset.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${asset.color} h-2 rounded-full transition-all duration-1000`}
                            style={{ width: `${asset.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Portfolio Stats */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Expected Return</p>
                    <p className="text-xl font-bold text-gray-900">{financialPlan.portfolioAnalysis.expectedReturn}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Risk Level</p>
                    <p className="text-xl font-bold text-gray-900">{financialPlan.portfolioAnalysis.riskLevel}</p>
                  </div>
                </div>
              </div>

              {/* Performance Projection */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Growth Projection</h2>
                
                {/* Projection Chart Placeholder */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-8 rounded-xl border-2 border-dashed border-gray-300 mb-6">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Growth Projection Chart</h3>
                    <p className="text-gray-500">Portfolio value over time with compound growth</p>
                  </div>
                </div>

                {/* Key Projections */}
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">10-Year Projection</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Initial Investment</p>
                        <p className="font-bold text-gray-900">${userProfile.currentSavings.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Projected Value</p>
                        <p className="font-bold text-green-600">
                          ${(userProfile.currentSavings * Math.pow(1 + financialPlan.portfolioAnalysis.expectedReturn / 100, 10)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Monthly Contribution Impact</h4>
                    <div className="text-sm">
                      <p className="text-gray-600 mb-1">With $500/month additional contribution:</p>
                      <p className="font-bold text-green-600">
                        Additional ${((500 * 12) * ((Math.pow(1 + financialPlan.portfolioAnalysis.expectedReturn / 100, 10) - 1) / (financialPlan.portfolioAnalysis.expectedReturn / 100))).toLocaleString()} over 10 years
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'retirement' && financialPlan && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Retirement Planning</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Retirement Needs */}
                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Retirement Goal</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Target Retirement Age</span>
                        <span className="font-semibold">{userProfile.age + parseInt(userProfile.timeHorizon.split(' ')[0])}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Required Nest Egg</span>
                        <span className="font-semibold text-green-600">
                          ${financialPlan.retirementPlan.requiredNestEgg.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Annual Retirement Income</span>
                        <span className="font-semibold">
                          ${financialPlan.retirementPlan.annualRetirementIncome.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-pink-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Current Progress</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Current Projected Value</span>
                        <span className="font-semibold">
                          ${financialPlan.retirementPlan.currentProjectedValue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Remaining Shortfall</span>
                        <span className="font-semibold text-red-600">
                          ${financialPlan.retirementPlan.shortfall.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-600 h-4 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${Math.max(5, (financialPlan.retirementPlan.currentProjectedValue / financialPlan.retirementPlan.requiredNestEgg) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 text-center">
                        {Math.round((financialPlan.retirementPlan.currentProjectedValue / financialPlan.retirementPlan.requiredNestEgg) * 100)}% of goal
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Action Plan */}
                <div className="space-y-6">
                  <Card>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Required Action</h3>
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-800 mb-2">Monthly Savings Needed</h4>
                        <p className="text-2xl font-bold text-yellow-900">
                          ${financialPlan.retirementPlan.monthlySavingsNeeded.toLocaleString()}
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          To reach your retirement goal by age {userProfile.age + parseInt(userProfile.timeHorizon.split(' ')[0])}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Recommended Strategy:</h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            Maximize employer 401(k) match ({(userProfile.employerMatch * 100)}%)
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            Contribute to Roth IRA for tax-free growth
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            Consider catch-up contributions after age 50
                          </li>
                          <li className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            Automate investments to dollar-cost average
                          </li>
                        </ul>
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Tax-Advantaged Accounts</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">401(k) Limit (2025)</span>
                        <span className="font-semibold">$23,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">IRA Limit (2025)</span>
                        <span className="font-semibold">$7,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Employer Match</span>
                        <span className="font-semibold text-green-600">
                          ${(userProfile.income * userProfile.employerMatch).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Total Available</span>
                          <span className="text-green-600">
                            ${(23000 + 7000 + userProfile.income * userProfile.employerMatch).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'goals' && financialPlan && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Goals & Progress Tracking</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Emergency Fund Goal */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white text-xl">
                      🛡️
                    </div>
                    <span className="text-sm text-gray-600">
                      {financialPlan.emergencyFund.recommendedMonths} months expenses
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Emergency Fund</h3>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>${financialPlan.currentFinancials.liquidSavings.toLocaleString()}</span>
                      <span>${financialPlan.emergencyFund.recommendedAmount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${Math.min(100, (financialPlan.currentFinancials.liquidSavings / financialPlan.emergencyFund.recommendedAmount) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {Math.round((financialPlan.currentFinancials.liquidSavings / financialPlan.emergencyFund.recommendedAmount) * 100)}% complete
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">High-Yield Savings</span>
                      <span className="font-medium">${financialPlan.emergencyFund.highYieldSavingsTarget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Liquid Investments</span>
                      <span className="font-medium">${financialPlan.emergencyFund.liquidInvestmentTarget.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>

                {/* Retirement Goal */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl">
                      🏖️
                    </div>
                    <span className="text-sm text-gray-600">
                      {parseInt(userProfile.timeHorizon.split(' ')[0])} years
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Retirement</h3>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>${financialPlan.retirementPlan.currentProjectedValue.toLocaleString()}</span>
                      <span>${financialPlan.retirementPlan.requiredNestEgg.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${Math.max(2, (financialPlan.retirementPlan.currentProjectedValue / financialPlan.retirementPlan.requiredNestEgg) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {Math.round((financialPlan.retirementPlan.currentProjectedValue / financialPlan.retirementPlan.requiredNestEgg) * 100)}% of goal
                    </p>
                  </div>
                  
                  <div className="text-sm">
                    <p className="text-gray-600">Monthly contribution needed:</p>
                    <p className="font-bold text-indigo-600 text-lg">
                      ${financialPlan.retirementPlan.monthlySavingsNeeded.toLocaleString()}
                    </p>
                  </div>
                </Card>

                {/* House Down Payment (if applicable) */}
                {financialPlan.housePlan && (
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white text-xl">
                        🏠
                      </div>
                      <span className="text-sm text-gray-600">
                        {financialPlan.housePlan.timeHorizon} years
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">House Down Payment</h3>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>$0</span>
                        <span>${financialPlan.housePlan.totalNeeded.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-1000 w-0"></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">0% complete</p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Down Payment ({financialPlan.housePlan.downPaymentPercent}%)</span>
                        <span className="font-medium">${financialPlan.housePlan.targetDownPayment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Closing Costs</span>
                        <span className="font-medium">${financialPlan.housePlan.closingCosts.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">Monthly Savings Needed</span>
                        <span className="font-bold text-purple-600">${financialPlan.housePlan.monthlyContribution.toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Custom Goal Template */}
                <Card className="bg-gradient-to-br from-orange-50 to-yellow-100 border-orange-200 border-dashed">
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">➕</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Add Custom Goal</h3>
                    <p className="text-gray-500 mb-4">Vacation, education, or any financial milestone</p>
                    <button className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all duration-200">
                      Create Goal
                    </button>
                  </div>
                </Card>
              </div>

              {/* Goal Strategy Recommendations */}
              <Card>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Goal Achievement Strategy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Priority Order</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                        <span className="font-medium">Emergency Fund</span>
                        <span className="text-red-600 text-sm">(Critical)</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                        <span className="font-medium">Employer 401(k) Match</span>
                        <span className="text-blue-600 text-sm">(Free Money)</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                        <span className="font-medium">Retirement Savings</span>
                        <span className="text-green-600 text-sm">(Long-term)</span>
                      </div>
                      {financialPlan.housePlan && (
                        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                          <span className="font-medium">House Down Payment</span>
                          <span className="text-purple-600 text-sm">(Goal-based)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Optimization Tips</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>Automate all savings to avoid decision fatigue</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>Use high-yield savings for emergency fund</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>Increase savings rate by 1% annually</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>Review and adjust goals quarterly</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>Consider tax-loss harvesting in taxable accounts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Financial Profile</h2>
              
              <div className="space-y-6">
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                      <input
                        type="number"
                        value={userProfile.age}
                        onChange={(e) => handleProfileChange('age', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Annual Income</label>
                      <input
                        type="number"
                        value={userProfile.income}
                        onChange={(e) => handleProfileChange('income', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Savings</label>
                      <input
                        type="number"
                        value={userProfile.currentSavings}
                        onChange={(e) => handleProfileChange('currentSavings', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Expenses</label>
                      <input
                        type="number"
                        value={userProfile.monthlyExpenses}
                        onChange={(e) => handleProfileChange('monthlyExpenses', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Preferences</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Risk Tolerance</label>
                      <select
                        value={userProfile.riskTolerance}
                        onChange={(e) => handleProfileChange('riskTolerance', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="Conservative">Conservative - Lower risk, steady growth</option>
                        <option value="Moderate">Moderate - Balanced approach</option>
                        <option value="Aggressive">Aggressive - Higher risk, maximum growth</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Primary Investment Goal</label>
                      <select
                        value={userProfile.investmentGoal}
                        onChange={(e) => handleProfileChange('investmentGoal', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="Retirement">Retirement Planning</option>
                        <option value="House">Buying a House</option>
                        <option value="Education">Education Funding</option>
                        <option value="Emergency Fund">Emergency Fund</option>
                        <option value="Wealth Building">General Wealth Building</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time Horizon</label>
                      <select
                        value={userProfile.timeHorizon}
                        onChange={(e) => handleProfileChange('timeHorizon', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="5 years">5 years - Short term</option>
                        <option value="10 years">10 years - Medium term</option>
                        <option value="20 years">20 years - Long term</option>
                        <option value="30 years">30 years - Very long term</option>
                        <option value="40 years">40+ years - Ultra long term</option>
                      </select>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Benefits</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="has401k"
                        checked={userProfile.has401k}
                        onChange={(e) => handleProfileChange('has401k', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="has401k" className="text-sm font-medium text-gray-700">
                        I have access to a 401(k) plan
                      </label>
                    </div>

                    {userProfile.has401k && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Employer Match Percentage
                        </label>
                        <select
                          value={userProfile.employerMatch}
                          onChange={(e) => handleProfileChange('employerMatch', parseFloat(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value={0}>No match</option>
                          <option value={0.03}>3% match</option>
                          <option value={0.04}>4% match</option>
                          <option value={0.05}>5% match</option>
                          <option value={0.06}>6% match</option>
                          <option value={0.075}>7.5% match</option>
                        </select>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="hasEmergencyFund"
                        checked={userProfile.hasEmergencyFund}
                        onChange={(e) => handleProfileChange('hasEmergencyFund', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="hasEmergencyFund" className="text-sm font-medium text-gray-700">
                        I have an adequate emergency fund
                      </label>
                    </div>
                  </div>
                </Card>

                <div className="flex space-x-4">
                  <button 
                    onClick={generateFinancialPlan}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    disabled={loading}
                  >
                    {loading ? 'Updating Plan...' : 'Update Financial Plan'}
                  </button>
                  
                  {!plaidConnected && (
                    <button 
                      onClick={connectPlaid}
                      className="px-6 py-3 border border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-all duration-200"
                    >
                      Connect Bank
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

export default FinancialPlanning;