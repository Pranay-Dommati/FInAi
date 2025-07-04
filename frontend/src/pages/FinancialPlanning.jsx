// src/pages/FinancialPlanning.jsx
import { useState } from 'react';

function FinancialPlanning() {
  const [userProfile, setUserProfile] = useState({
    age: 28,
    income: 90000,
    riskTolerance: 'Moderate',
    investmentGoal: 'Retirement',
    timeHorizon: '30 years'
  });

  const [activeTab, setActiveTab] = useState('portfolio');

  const portfolioOptions = {
    'Conservative': {
      stocks: 40,
      bonds: 50,
      realEstate: 5,
      cash: 5,
      expectedReturn: '6-8%',
      risk: 'Low',
      color: 'from-green-500 to-emerald-600'
    },
    'Moderate': {
      stocks: 60,
      bonds: 25,
      realEstate: 10,
      cash: 5,
      expectedReturn: '8-10%',
      risk: 'Medium',
      color: 'from-blue-500 to-indigo-600'
    },
    'Aggressive': {
      stocks: 80,
      bonds: 10,
      realEstate: 8,
      cash: 2,
      expectedReturn: '10-12%',
      risk: 'High',
      color: 'from-purple-500 to-pink-600'
    }
  };

  const currentPortfolio = portfolioOptions[userProfile.riskTolerance];

  const handleProfileChange = (field, value) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
          <span className="mr-3">💼</span>
          Personalized Financial Planning
        </h1>
        <p className="text-gray-600 text-lg">
          AI-powered investment strategies tailored to your goals and risk tolerance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'portfolio', label: 'Portfolio', icon: '📊' },
            { id: 'profile', label: 'Profile', icon: '👤' },
            { id: 'goals', label: 'Goals', icon: '🎯' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
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
          {activeTab === 'portfolio' && (
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
                </div>

                {/* Portfolio Breakdown */}
                <div className="space-y-4">
                  {[
                    { name: 'Stocks', percentage: currentPortfolio.stocks, icon: '📈', color: 'bg-blue-500' },
                    { name: 'Bonds', percentage: currentPortfolio.bonds, icon: '📊', color: 'bg-green-500' },
                    { name: 'Real Estate', percentage: currentPortfolio.realEstate, icon: '🏠', color: 'bg-purple-500' },
                    { name: 'Cash', percentage: currentPortfolio.cash, icon: '💰', color: 'bg-yellow-500' }
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
                    <p className="text-xl font-bold text-gray-900">{currentPortfolio.expectedReturn}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-4 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Risk Level</p>
                    <p className="text-xl font-bold text-gray-900">{currentPortfolio.risk}</p>
                  </div>
                </div>
              </div>

              {/* Visual Portfolio */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio Visualization</h2>
                
                {/* Pie Chart Placeholder */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-8 rounded-xl border-2 border-dashed border-gray-300 mb-6">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🥧</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Interactive Pie Chart</h3>
                    <p className="text-gray-500">Asset allocation breakdown with hover details</p>
                  </div>
                </div>

                {/* Performance Projection */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">30-Year Projection</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Investment</span>
                      <span className="font-semibold">$10,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Projected Value</span>
                      <span className="font-semibold text-green-600">$174,494</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Return</span>
                      <span className="font-semibold text-green-600">+1,645%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Financial Profile</h2>
              
              <div className="space-y-6">
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Investment Goal</label>
                  <select
                    value={userProfile.investmentGoal}
                    onChange={(e) => handleProfileChange('investmentGoal', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Retirement">Retirement</option>
                    <option value="House">Buying a House</option>
                    <option value="Education">Education</option>
                    <option value="Emergency Fund">Emergency Fund</option>
                    <option value="Wealth Building">Wealth Building</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Horizon</label>
                  <select
                    value={userProfile.timeHorizon}
                    onChange={(e) => handleProfileChange('timeHorizon', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="5 years">5 years</option>
                    <option value="10 years">10 years</option>
                    <option value="20 years">20 years</option>
                    <option value="30 years">30 years</option>
                    <option value="40+ years">40+ years</option>
                  </select>
                </div>

                <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Update Profile & Recalculate
                </button>
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Financial Goals & Milestones</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Goal Cards */}
                {[
                  { 
                    title: 'Emergency Fund', 
                    target: '$27,000', 
                    current: '$15,000', 
                    progress: 56,
                    timeframe: '18 months',
                    icon: '🛡️',
                    color: 'from-green-500 to-emerald-600'
                  },
                  { 
                    title: 'Retirement', 
                    target: '$1.2M', 
                    current: '$85,000', 
                    progress: 7,
                    timeframe: '30 years',
                    icon: '🏖️',
                    color: 'from-blue-500 to-indigo-600'
                  },
                  { 
                    title: 'House Down Payment', 
                    target: '$80,000', 
                    current: '$25,000', 
                    progress: 31,
                    timeframe: '5 years',
                    icon: '🏠',
                    color: 'from-purple-500 to-pink-600'
                  },
                  { 
                    title: 'Vacation Fund', 
                    target: '$10,000', 
                    current: '$3,500', 
                    progress: 35,
                    timeframe: '2 years',
                    icon: '✈️',
                    color: 'from-orange-500 to-red-500'
                  }
                ].map((goal, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${goal.color} flex items-center justify-center text-white text-xl`}>
                        {goal.icon}
                      </div>
                      <span className="text-sm text-gray-500">{goal.timeframe}</span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{goal.title}</h3>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{goal.current}</span>
                        <span>{goal.target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`bg-gradient-to-r ${goal.color} h-3 rounded-full transition-all duration-1000`}
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{goal.progress}% complete</p>
                    </div>
                    
                    <button className={`w-full bg-gradient-to-r ${goal.color} text-white font-medium py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5`}>
                      Adjust Goal
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FinancialPlanning;