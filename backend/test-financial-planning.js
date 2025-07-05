// Test script for financial planning API
const testFinancialPlanning = async () => {
  const baseURL = 'http://localhost:5000';
  
  console.log('🧪 Testing Financial Planning API...\n');
  
  // Test data
  const testProfile = {
    age: 32,
    income: 85000,
    riskTolerance: 'Moderate',
    investmentGoal: 'Retirement',
    timeHorizon: '30 years',
    currentSavings: 45000,
    monthlyExpenses: 4200,
    hasEmergencyFund: false,
    has401k: true,
    employerMatch: 0.05
  };

  try {
    // Test 1: Generate financial plan without Plaid
    console.log('📊 Test 1: Generate financial plan (no Plaid)');
    const response1 = await fetch(`${baseURL}/api/financial-planning/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: testProfile })
    });
    
    if (response1.ok) {
      const result1 = await response1.json();
      console.log('✅ Plan generated successfully');
      console.log(`   Portfolio allocation: ${JSON.stringify(result1.data.portfolioAnalysis.allocation)}`);
      console.log(`   Expected return: ${result1.data.portfolioAnalysis.expectedReturn}%`);
      console.log(`   Retirement shortfall: $${result1.data.retirementPlan.shortfall.toLocaleString()}`);
      console.log(`   Monthly savings needed: $${result1.data.retirementPlan.monthlySavingsNeeded.toLocaleString()}`);
      console.log(`   Emergency fund target: $${result1.data.emergencyFund.recommendedAmount.toLocaleString()}`);
      console.log(`   Financial health score: ${result1.data.healthScore.totalScore}/100 (${result1.data.healthScore.grade})`);
      console.log(`   Recommendations: ${result1.data.recommendations.length} items`);
    } else {
      console.log('❌ Failed to generate plan');
    }

    // Test 2: Generate plan with mock Plaid token
    console.log('\n📊 Test 2: Generate financial plan (with mock Plaid)');
    const response2 = await fetch(`${baseURL}/api/financial-planning/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        profile: testProfile,
        accessToken: 'mock-access-token-123'
      })
    });
    
    if (response2.ok) {
      const result2 = await response2.json();
      console.log('✅ Plan with Plaid data generated successfully');
      console.log(`   Total assets: $${result2.data.currentFinancials.totalAssets.toLocaleString()}`);
      console.log(`   Liquid savings: $${result2.data.currentFinancials.liquidSavings.toLocaleString()}`);
      console.log(`   Net worth: $${result2.data.currentFinancials.netWorth.toLocaleString()}`);
    } else {
      console.log('❌ Failed to generate plan with Plaid');
    }

    // Test 3: Test different risk tolerances
    console.log('\n📊 Test 3: Test different risk tolerances');
    const riskTolerances = ['Conservative', 'Moderate', 'Aggressive'];
    
    for (const risk of riskTolerances) {
      const testRiskProfile = { ...testProfile, riskTolerance: risk };
      const response = await fetch(`${baseURL}/api/financial-planning/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: testRiskProfile })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`   ${risk}: ${result.data.portfolioAnalysis.expectedReturn}% expected return, ${result.data.portfolioAnalysis.riskLevel} risk`);
      }
    }

    // Test 4: Test different investment goals
    console.log('\n📊 Test 4: Test different investment goals');
    const investmentGoals = ['Retirement', 'House', 'Education', 'Emergency Fund'];
    
    for (const goal of investmentGoals) {
      const testGoalProfile = { ...testProfile, investmentGoal: goal };
      const response = await fetch(`${baseURL}/api/financial-planning/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: testGoalProfile })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`   ${goal}: ${result.data.portfolioAnalysis.allocation.stocks}% stocks, ${result.data.portfolioAnalysis.allocation.bonds}% bonds`);
        
        if (goal === 'House' && result.data.housePlan) {
          console.log(`     House plan: $${result.data.housePlan.totalNeeded.toLocaleString()} needed, $${result.data.housePlan.monthlyContribution.toLocaleString()}/month`);
        }
      }
    }

    // Test 5: Test edge cases
    console.log('\n📊 Test 5: Test edge cases');
    
    // Young aggressive investor
    const youngProfile = { ...testProfile, age: 22, riskTolerance: 'Aggressive', timeHorizon: '40 years' };
    const youngResponse = await fetch(`${baseURL}/api/financial-planning/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: youngProfile })
    });
    
    if (youngResponse.ok) {
      const youngResult = await youngResponse.json();
      console.log(`   Young investor: ${youngResult.data.portfolioAnalysis.allocation.stocks}% stocks (should be high)`);
    }

    // Near retirement conservative
    const nearRetirementProfile = { ...testProfile, age: 55, riskTolerance: 'Conservative', timeHorizon: '10 years' };
    const nearRetirementResponse = await fetch(`${baseURL}/api/financial-planning/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: nearRetirementProfile })
    });
    
    if (nearRetirementResponse.ok) {
      const nearRetirementResult = await nearRetirementResponse.json();
      console.log(`   Near retirement: ${nearRetirementResult.data.portfolioAnalysis.allocation.stocks}% stocks (should be lower)`);
    }

    // High income earner
    const highIncomeProfile = { ...testProfile, income: 250000, currentSavings: 150000 };
    const highIncomeResponse = await fetch(`${baseURL}/api/financial-planning/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: highIncomeProfile })
    });
    
    if (highIncomeResponse.ok) {
      const highIncomeResult = await highIncomeResponse.json();
      console.log(`   High income: ${highIncomeResult.data.healthScore.totalScore}/100 health score`);
    }

    // Test 6: Invalid requests
    console.log('\n📊 Test 6: Invalid request handling');
    
    const invalidResponse = await fetch(`${baseURL}/api/financial-planning/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Missing profile
    });
    
    if (invalidResponse.status === 400) {
      console.log('✅ Invalid request properly rejected');
    } else {
      console.log('❌ Invalid request handling failed');
    }

    console.log('\n🎉 Financial Planning API tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFinancialPlanning();
}

export default testFinancialPlanning;
