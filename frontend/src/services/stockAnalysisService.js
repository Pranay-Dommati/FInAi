export const fetchRealTimeStockData = async (riskTolerance) => {
  try {
    const response = await fetch(`https://api.example.com/stocks?riskTolerance=${riskTolerance}`);
    if (!response.ok) {
      throw new Error('Failed to fetch stock data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching real-time stock data:', error);
    throw error;
  }
};

export const fetchFinancialProjections = async (userProfile) => {
  try {
    const response = await fetch('https://api.example.com/financial-projections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userProfile),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch financial projections');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching financial projections:', error);
    throw error;
  }
};
