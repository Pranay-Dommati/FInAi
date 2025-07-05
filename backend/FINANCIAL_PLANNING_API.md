# Financial Planning API Documentation

## Overview

The Financial Planning API provides comprehensive, professional-grade financial planning capabilities powered by AI and real-time data integration. Built with 20+ years of financial expertise, it offers personalized portfolio recommendations, retirement planning, goal tracking, and financial health scoring.

## Key Features

### 🎯 Professional-Grade Analysis
- Age-based portfolio allocation (100 - age rule with modern adjustments)
- Risk tolerance optimization 
- Goal-based investment strategies
- Tax-aware planning recommendations

### 📊 Comprehensive Planning
- Retirement needs calculation (25x rule with inflation adjustment)
- Emergency fund recommendations (3-8 months expenses)
- House down payment planning
- Financial health scoring (0-100 scale)

### 🔗 Plaid Integration
- Real-time account data
- Transaction analysis
- Investment portfolio assessment
- Automated expense tracking

### 🤖 AI-Powered Recommendations
- Portfolio rebalancing alerts
- Tax optimization strategies
- Debt paydown prioritization
- Savings rate optimization

## API Endpoints

### POST `/api/financial-planning/plan`

Generate a comprehensive financial plan based on user profile and optional Plaid data.

#### Request Body

```json
{
  "profile": {
    "age": 28,
    "income": 90000,
    "riskTolerance": "Moderate", // "Conservative", "Moderate", "Aggressive"
    "investmentGoal": "Retirement", // "Retirement", "House", "Education", "Emergency Fund", "Wealth Building"
    "timeHorizon": "30 years",
    "currentSavings": 25000,
    "monthlyExpenses": 4500,
    "hasEmergencyFund": false,
    "has401k": true,
    "employerMatch": 0.05
  },
  "accessToken": "optional-plaid-access-token"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "profile": { /* user profile */ },
    "portfolioAnalysis": {
      "allocation": {
        "stocks": 65,
        "bonds": 25,
        "realEstate": 8,
        "cash": 2
      },
      "expectedReturn": 8.7,
      "volatility": 14.2,
      "riskLevel": "Medium"
    },
    "retirementPlan": {
      "requiredNestEgg": 1250000,
      "currentProjectedValue": 127500,
      "shortfall": 1122500,
      "monthlySavingsNeeded": 847,
      "annualRetirementIncome": 72000,
      "replacementRatio": 80
    },
    "emergencyFund": {
      "recommendedAmount": 27000,
      "recommendedMonths": 6,
      "highYieldSavingsTarget": 18900,
      "liquidInvestmentTarget": 8100
    },
    "housePlan": { /* if investmentGoal is "House" */ },
    "currentFinancials": {
      "totalAssets": 42500,
      "liquidSavings": 12000,
      "monthlyExpenses": 4500,
      "netWorth": 42500
    },
    "recommendations": [
      {
        "type": "emergency_fund",
        "priority": "high",
        "title": "Build Emergency Fund",
        "description": "Increase emergency savings to $27,000",
        "action": "Save an additional $15,000",
        "impact": "Provides financial security and peace of mind"
      }
    ],
    "healthScore": {
      "totalScore": 72,
      "maxScore": 100,
      "grade": "B",
      "factors": [
        {
          "category": "Emergency Fund",
          "score": 8,
          "maxScore": 20,
          "description": "44% of recommended emergency fund"
        }
      ]
    },
    "projections": [
      {
        "year": 1,
        "age": 29,
        "totalContributions": 35164,
        "projectedValue": 36123,
        "gains": 959
      }
    ],
    "lastUpdated": "2025-07-05T10:30:00.000Z"
  }
}
```

## Portfolio Allocation Algorithm

### Age-Based Foundation
```
Base Stock Allocation = max(60%, 120 - age)
```

### Risk Tolerance Multipliers
- **Conservative**: 0.7x
- **Moderate**: 1.0x  
- **Aggressive**: 1.3x

### Goal-Based Adjustments
- **Retirement**: Standard allocation
- **House**: -10% stocks, +5% bonds, +5% cash
- **Education**: -5% stocks, +5% cash
- **Emergency Fund**: -20% stocks, +10% bonds, +10% cash
- **Wealth Building**: +5% stocks, -5% bonds

### Final Allocation Constraints
- Stocks: 30-90%
- Bonds: 5-50%
- Real Estate: 5-20% (higher for income >$100k)
- Cash: 3% minimum

## Expected Returns (Based on Historical Data)

- **Stocks**: 10.0% annual
- **Bonds**: 4.0% annual  
- **Real Estate**: 8.0% annual
- **Cash**: 2.0% annual

## Retirement Planning Methodology

### Replacement Ratio
- Target: 80% of pre-retirement income
- Adjusts for inflation to retirement date

### Nest Egg Calculation
```
Required Nest Egg = (Annual Income Need × 25) / (1 - Tax Rate)
```

### Savings Calculation
Uses future value of annuity formula:
```
Annual Savings = Future Value × Interest Rate / (((1 + Interest Rate)^Years) - 1)
```

## Financial Health Scoring

### Score Components (Total: 100 points)

1. **Emergency Fund** (20 points)
   - Full points at 100% of recommended amount
   
2. **Retirement Readiness** (25 points)
   - Based on progress toward retirement goal
   
3. **Debt Management** (20 points)
   - Penalty for high debt-to-income ratio
   
4. **Savings Rate** (20 points)
   - Full points at 50% savings rate
   
5. **Portfolio Diversification** (15 points)
   - Based on portfolio composition

### Grade Scale
- A+: 90-100
- A: 80-89
- B: 70-79
- C: 60-69
- D: 50-59
- F: <50

## Professional Recommendations

### Automatic Recommendations

1. **Portfolio Rebalancing**
   - Triggered when allocation deviates >5% from target
   
2. **Emergency Fund Building**
   - When liquid savings <80% of recommended
   
3. **Tax Optimization**
   - For income >$50k, suggests tax-advantaged accounts
   
4. **High-Interest Debt Paydown**
   - When debt interest rates >6%

### Priority Order

1. **Emergency Fund** (Critical)
2. **Employer 401(k) Match** (Free Money)
3. **High-Interest Debt** (>6% rates)
4. **Retirement Savings** (Long-term)
5. **Goal-Based Savings** (House, etc.)

## Integration with Plaid

### Supported Data
- Account balances and types
- Transaction history (3 months)
- Investment holdings
- Liability information

### Enhanced Features with Plaid
- Real-time net worth calculation
- Automated expense tracking
- Current portfolio analysis
- Cash flow assessment

### Privacy & Security
- No storage of sensitive financial data
- Plaid access tokens encrypted in transit
- All calculations performed server-side

## Error Handling

### Common Errors

```json
{
  "success": false,
  "error": "User profile is required",
  "timestamp": "2025-07-05T10:30:00.000Z"
}
```

### Status Codes
- `200`: Success
- `400`: Bad Request (missing/invalid profile)
- `500`: Internal Server Error

## Rate Limiting

- **Limit**: 100 requests per hour per IP
- **Headers**: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Example Usage

### Basic Financial Plan
```javascript
const response = await fetch('/api/financial-planning/plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profile: {
      age: 30,
      income: 75000,
      riskTolerance: 'Moderate',
      investmentGoal: 'Retirement',
      timeHorizon: '35 years'
    }
  })
});

const plan = await response.json();
console.log('Expected return:', plan.data.portfolioAnalysis.expectedReturn + '%');
```

### With Plaid Integration
```javascript
const planWithPlaid = await fetch('/api/financial-planning/plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profile: userProfile,
    accessToken: plaidAccessToken
  })
});
```

## Best Practices

### For Frontend Integration
1. Cache plans for 1 hour to reduce API calls
2. Update plan when profile changes significantly
3. Show loading states during plan generation
4. Handle offline scenarios gracefully

### For Mobile Apps
1. Compress request payloads
2. Implement request retry logic
3. Use progressive disclosure for complex data

## Support

For technical support or questions about the Financial Planning API:
- Email: support@finai.com
- Documentation: [API Docs](https://api.finai.com/docs)
- Status Page: [Status](https://status.finai.com)

---

*This API is designed by financial professionals and follows industry best practices for portfolio management, retirement planning, and risk assessment.*
