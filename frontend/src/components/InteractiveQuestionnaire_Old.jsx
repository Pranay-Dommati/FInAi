import { useState } from 'react';
import './InteractiveQuestionnaire.css';

const InteractiveQuestionnaire = ({ onComplete, onClose, initialProfile = {} }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState({
    age: initialProfile.age || '',
    income: initialProfile.income || '',
    riskTolerance: initialProfile.riskTolerance || '',
    investmentGoal: initialProfile.investmentGoal || '',
    timeHorizon: initialProfile.timeHorizon || '',
    currentSavings: initialProfile.currentSavings || '',
    monthlyExpenses: initialProfile.monthlyExpenses || '',
    hasEmergencyFund: initialProfile.hasEmergencyFund || false,
    has401k: initialProfile.has401k || false,
    employerMatch: initialProfile.employerMatch || ''
  });

  const [errors, setErrors] = useState({});

  const totalSteps = 6;

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!profile.age || profile.age < 18 || profile.age > 100) {
          newErrors.age = 'Please enter a valid age between 18 and 100';
        }
        break;
      case 2:
        if (!profile.income || profile.income < 0) {
          newErrors.income = 'Please enter a valid annual income';
        }
        break;
      case 3:
        if (!profile.riskTolerance) {
          newErrors.riskTolerance = 'Please select your risk tolerance';
        }
        break;
      case 4:
        if (!profile.investmentGoal) {
          newErrors.investmentGoal = 'Please select your primary investment goal';
        }
        if (!profile.timeHorizon) {
          newErrors.timeHorizon = 'Please select your investment timeline';
        }
        break;
      case 5:
        if (profile.currentSavings < 0) {
          newErrors.currentSavings = 'Current savings cannot be negative';
        }
        break;
      case 6:
        if (!profile.monthlyExpenses || profile.monthlyExpenses < 0) {
          newErrors.monthlyExpenses = 'Please enter your monthly expenses';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Final validation
    let isValid = true;
    for (let step = 1; step <= totalSteps; step++) {
      if (!validateStep(step)) {
        isValid = false;
        break;
      }
    }

    if (isValid) {
      const completedProfile = {
        ...profile,
        age: parseInt(profile.age),
        income: parseFloat(profile.income),
        currentSavings: parseFloat(profile.currentSavings) || 0,
        monthlyExpenses: parseFloat(profile.monthlyExpenses),
        employerMatch: parseFloat(profile.employerMatch) || 0
      };
      onComplete(completedProfile);
    }
  };

  const updateProfile = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getAgeGroup = (age) => {
    if (age < 25) return "Young Professional";
    if (age < 35) return "Early Career";
    if (age < 45) return "Mid Career";
    if (age < 55) return "Peak Career";
    return "Pre-Retirement";
  };

  const getIncomeRange = (income) => {
    if (income < 50000) return "Entry Level";
    if (income < 75000) return "Mid Level";
    if (income < 100000) return "Senior Level";
    if (income < 150000) return "High Earner";
    return "Top Earner";
  };

  const steps = [
    {
      id: 'age',
      title: 'Let\'s start with your age',
      subtitle: 'This helps us understand your investment timeline',
      type: 'ageGroup'
    },
    {
      id: 'income',
      title: 'What\'s your annual income?',
      subtitle: 'This helps us calculate realistic savings goals',
      type: 'incomeRange'
    },
    {
      id: 'expenses',
      title: 'What are your monthly expenses?',
      subtitle: 'Including rent, utilities, food, and other regular costs',
      type: 'input',
      inputType: 'number',
      field: 'monthlyExpenses',
      placeholder: 'e.g., 4500'
    },
    {
      id: 'savings',
      title: 'How much do you currently have saved?',
      subtitle: 'Include savings accounts, investments, retirement accounts',
      type: 'input',
      inputType: 'number',
      field: 'currentSavings',
      placeholder: 'e.g., 25000'
    },
    {
      id: 'goal',
      title: 'What\'s your primary financial goal?',
      subtitle: 'We\'ll tailor your plan based on this',
      type: 'goals'
    },
    {
      id: 'timeline',
      title: 'What\'s your investment timeline?',
      subtitle: 'When do you want to achieve your goal?',
      type: 'timeline'
    },
    {
      id: 'risk',
      title: 'How comfortable are you with investment risk?',
      subtitle: 'This affects your recommended portfolio allocation',
      type: 'risk'
    },
    {
      id: 'employment',
      title: 'Employment benefits',
      subtitle: 'Do you have access to these?',
      type: 'benefits'
    }
  ];

  const ageGroups = [
    { value: '18-25', label: 'Under 25', description: 'Just starting your career', age: 22 },
    { value: '25-35', label: '25-35', description: 'Building your foundation', age: 30 },
    { value: '35-45', label: '35-45', description: 'Peak earning years', age: 40 },
    { value: '45-55', label: '45-55', description: 'Pre-retirement planning', age: 50 },
    { value: '55+', label: '55+', description: 'Nearing or in retirement', age: 60 }
  ];

  const incomeRanges = [
    { value: '0-30000', label: 'Under $30k', description: 'Entry level', income: 25000 },
    { value: '30000-50000', label: '$30k - $50k', description: 'Early career', income: 40000 },
    { value: '50000-75000', label: '$50k - $75k', description: 'Mid-level', income: 62500 },
    { value: '75000-100000', label: '$75k - $100k', description: 'Experienced', income: 87500 },
    { value: '100000-150000', label: '$100k - $150k', description: 'Senior level', income: 125000 },
    { value: '150000+', label: '$150k+', description: 'Executive level', income: 200000 }
  ];

  const goals = [
    { value: 'Retirement', label: '🏖️ Retirement', description: 'Long-term wealth building' },
    { value: 'House', label: '🏠 Buy a Home', description: 'Save for down payment' },
    { value: 'Education', label: '🎓 Education', description: 'Fund education expenses' },
    { value: 'Emergency Fund', label: '🛡️ Emergency Fund', description: 'Build financial safety net' },
    { value: 'Wealth Building', label: '💰 Wealth Building', description: 'General investment growth' }
  ];

  const timelines = [
    { value: '5 years', label: '5 years', description: 'Short-term goal' },
    { value: '10 years', label: '10 years', description: 'Medium-term goal' },
    { value: '20 years', label: '20 years', description: 'Long-term goal' },
    { value: '30 years', label: '30+ years', description: 'Very long-term goal' }
  ];

  const riskLevels = [
    { 
      value: 'Conservative', 
      label: '🛡️ Conservative', 
      description: 'Minimize risk, accept lower returns',
      details: 'Mostly bonds and stable investments'
    },
    { 
      value: 'Moderate', 
      label: '⚖️ Moderate', 
      description: 'Balanced approach to risk and return',
      details: 'Mix of stocks and bonds'
    },
    { 
      value: 'Aggressive', 
      label: '🚀 Aggressive', 
      description: 'Higher risk for potentially higher returns',
      details: 'Mostly stocks and growth investments'
    }
  ];

  const updateProfile = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Convert profile to final format
      const finalProfile = {
        ...profile,
        age: parseInt(profile.age) || (ageGroups.find(g => g.value === profile.ageGroup)?.age || 30),
        income: parseInt(profile.income) || (incomeRanges.find(r => r.value === profile.incomeRange)?.income || 50000),
        currentSavings: parseInt(profile.currentSavings) || 0,
        monthlyExpenses: parseInt(profile.monthlyExpenses) || 3000,
        employerMatch: parseFloat(profile.employerMatch) || 0
      };
      onComplete(finalProfile);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = () => {
    const step = steps[currentStep];
    switch (step.type) {
      case 'ageGroup':
        return profile.ageGroup;
      case 'incomeRange':
        return profile.incomeRange;
      case 'input':
        return profile[step.field];
      case 'goals':
        return profile.investmentGoal;
      case 'timeline':
        return profile.timeHorizon;
      case 'risk':
        return profile.riskTolerance;
      case 'benefits':
        return true; // Optional step
      default:
        return true;
    }
  };

  const renderStep = () => {
    const step = steps[currentStep];

    switch (step.type) {
      case 'ageGroup':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ageGroups.map((group) => (
              <button
                key={group.value}
                onClick={() => {
                  updateProfile('ageGroup', group.value);
                  updateProfile('age', group.age);
                }}
                className={`p-6 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                  profile.ageGroup === group.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-lg">{group.label}</div>
                <div className="text-gray-600 text-sm mt-1">{group.description}</div>
              </button>
            ))}
          </div>
        );

      case 'incomeRange':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => {
                  updateProfile('incomeRange', range.value);
                  updateProfile('income', range.income);
                }}
                className={`p-6 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                  profile.incomeRange === range.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-lg">{range.label}</div>
                <div className="text-gray-600 text-sm mt-1">{range.description}</div>
              </button>
            ))}
          </div>
        );

      case 'input':
        return (
          <div className="max-w-md mx-auto">
            <input
              type={step.inputType}
              value={profile[step.field]}
              onChange={(e) => updateProfile(step.field, e.target.value)}
              placeholder={step.placeholder}
              className="w-full p-4 text-lg border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            {step.field === 'monthlyExpenses' && (
              <div className="mt-2 text-sm text-gray-600">
                Include rent, utilities, food, transportation, and other regular expenses
              </div>
            )}
          </div>
        );

      case 'goals':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => (
              <button
                key={goal.value}
                onClick={() => updateProfile('investmentGoal', goal.value)}
                className={`p-6 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                  profile.investmentGoal === goal.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-lg">{goal.label}</div>
                <div className="text-gray-600 text-sm mt-1">{goal.description}</div>
              </button>
            ))}
          </div>
        );

      case 'timeline':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {timelines.map((timeline) => (
              <button
                key={timeline.value}
                onClick={() => updateProfile('timeHorizon', timeline.value)}
                className={`p-6 rounded-lg border-2 text-center transition-all hover:shadow-md ${
                  profile.timeHorizon === timeline.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-lg">{timeline.label}</div>
                <div className="text-gray-600 text-sm mt-1">{timeline.description}</div>
              </button>
            ))}
          </div>
        );

      case 'risk':
        return (
          <div className="space-y-4">
            {riskLevels.map((risk) => (
              <button
                key={risk.value}
                onClick={() => updateProfile('riskTolerance', risk.value)}
                className={`w-full p-6 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                  profile.riskTolerance === risk.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-lg">{risk.label}</div>
                <div className="text-gray-600 text-sm mt-1">{risk.description}</div>
                <div className="text-gray-500 text-xs mt-2">{risk.details}</div>
              </button>
            ))}
          </div>
        );

      case 'benefits':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">401(k) or workplace retirement plan</div>
                <div className="text-sm text-gray-600">Access to employer-sponsored retirement savings</div>
              </div>
              <button
                onClick={() => updateProfile('has401k', !profile.has401k)}
                className={`px-4 py-2 rounded ${
                  profile.has401k ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}
              >
                {profile.has401k ? 'Yes' : 'No'}
              </button>
            </div>
            
            {profile.has401k && (
              <div className="p-4 border rounded-lg">
                <label className="block font-medium mb-2">
                  Employer match percentage (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max="1"
                  value={profile.employerMatch}
                  onChange={(e) => updateProfile('employerMatch', e.target.value)}
                  placeholder="e.g., 0.05 for 5%"
                  className="w-full p-2 border rounded"
                />
                <div className="text-sm text-gray-600 mt-1">
                  Enter as decimal (0.05 for 5% match)
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">Emergency fund</div>
                <div className="text-sm text-gray-600">Do you have 3-6 months of expenses saved?</div>
              </div>
              <button
                onClick={() => updateProfile('hasEmergencyFund', !profile.hasEmergencyFund)}
                className={`px-4 py-2 rounded ${
                  profile.hasEmergencyFund ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}
              >
                {profile.hasEmergencyFund ? 'Yes' : 'No'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">{currentStepData.title}</h2>
        <p className="text-gray-600 text-lg">{currentStepData.subtitle}</p>
      </div>

      <div className="mb-8">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={`px-6 py-3 rounded-lg ${
            currentStep === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-500 text-white hover:bg-gray-600'
          }`}
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={!isStepComplete()}
          className={`px-6 py-3 rounded-lg ${
            !isStepComplete()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {currentStep === steps.length - 1 ? 'Generate My Plan' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default InteractiveQuestionnaire;
