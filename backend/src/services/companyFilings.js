import axios from 'axios';
import logger from '../utils/logger.js';

class CompanyFilingsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour for filings data
    this.secBaseUrl = 'https://data.sec.gov';
    this.headers = {
      'User-Agent': 'FinAI Research Bot 1.0 (contact@finai.example.com)',
      'Accept-Encoding': 'gzip, deflate',
      'Host': 'data.sec.gov',
      'Accept': 'application/json'
    };
    
    // Known CIK mappings for major companies (fallback when ticker lookup fails)
    this.knownCIKs = {
      'AAPL': { cik: '0000320193', title: 'Apple Inc.' },
      'MSFT': { cik: '0000789019', title: 'Microsoft Corporation' },
      'GOOGL': { cik: '0001652044', title: 'Alphabet Inc.' },
      'GOOG': { cik: '0001652044', title: 'Alphabet Inc.' },
      'AMZN': { cik: '0001018724', title: 'Amazon.com Inc.' },
      'TSLA': { cik: '0001318605', title: 'Tesla, Inc.' },
      'META': { cik: '0001326801', title: 'Meta Platforms, Inc.' },
      'NVDA': { cik: '0001045810', title: 'NVIDIA CORPORATION' },
      'JPM': { cik: '0000019617', title: 'JPMorgan Chase & Co.' },
      'JNJ': { cik: '0000200406', title: 'Johnson & Johnson' }
    };
  }

  // Get company CIK (Central Index Key) from ticker symbol
  async getCompanyCIK(ticker) {
    try {
      logger.info(`Getting CIK for ticker: ${ticker}`);
      
      const cacheKey = `cik_${ticker}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        logger.info(`Returning cached CIK for ${ticker}`);
        return cached.data;
      }

      // Check known CIKs first
      if (this.knownCIKs[ticker.toUpperCase()]) {
        const knownCompany = this.knownCIKs[ticker.toUpperCase()];
        const result = {
          cik: knownCompany.cik,
          ticker: ticker.toUpperCase(),
          title: knownCompany.title
        };

        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        logger.info(`Found CIK for ${ticker} in known mappings:`, result);
        return result;
      }

      // Try SEC company tickers exchange endpoint (newer working endpoint)
      try {
        const url = `https://www.sec.gov/files/company_tickers_exchange.json`;
        const response = await axios.get(url, { headers: this.headers });
        
        // Find company by ticker
        const companies = response.data.data || [];
        const company = companies.find(comp => 
          comp[2] && comp[2].toUpperCase() === ticker.toUpperCase()
        );

        if (company) {
          const result = {
            cik: company[0].toString().padStart(10, '0'), // SEC requires 10-digit CIK
            ticker: company[2],
            title: company[1]
          };

          this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });

          logger.info(`Found CIK for ${ticker} via SEC exchange API:`, result);
          return result;
        }
      } catch (apiError) {
        logger.warn(`SEC ticker lookup failed for ${ticker}:`, apiError.message);
      }

      // If all else fails, return mock data for demonstration
      const mockResult = {
        cik: '0000000000',
        ticker: ticker.toUpperCase(),
        title: `${ticker.toUpperCase()} Company (Demo Data)`
      };

      logger.info(`Returning mock CIK data for ${ticker}:`, mockResult);
      return mockResult;

    } catch (error) {
      logger.error(`Error getting CIK for ${ticker}:`, error.message);
      throw new Error(`Failed to get company CIK: ${error.message}`);
    }
  }

  // Get recent company filings
  async getCompanyFilings(ticker, limit = 10) {
    try {
      logger.info(`Getting company filings for ${ticker}`);
      
      const cacheKey = `filings_${ticker}_${limit}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        logger.info(`Returning cached filings for ${ticker}`);
        return cached.data;
      }

      // Get company CIK first
      const companyInfo = await this.getCompanyCIK(ticker);
      const cik = companyInfo.cik;

      // If mock CIK, return mock data
      if (cik === '0000000000') {
        const mockFilings = this.generateMockFilings(ticker, limit);
        this.cache.set(cacheKey, {
          data: mockFilings,
          timestamp: Date.now()
        });
        logger.info(`Returning mock filings for ${ticker}`);
        return mockFilings;
      }

      // Get company filings from SEC
      try {
        const url = `${this.secBaseUrl}/submissions/CIK${cik}.json`;
        const response = await axios.get(url, { headers: this.headers });

        const filings = response.data.filings.recent;
        const filingsList = [];

        // Process filings data
        for (let i = 0; i < Math.min(limit, filings.form.length); i++) {
          const filing = {
            accessionNumber: filings.accessionNumber[i],
            form: filings.form[i],
            filingDate: filings.filingDate[i],
            reportDate: filings.reportDate[i],
            acceptanceDateTime: filings.acceptanceDateTime[i],
            primaryDocument: filings.primaryDocument[i],
            primaryDocDescription: filings.primaryDocDescription[i],
            size: filings.size[i],
            isXBRL: filings.isXBRL[i] === 1,
            url: `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${filings.accessionNumber[i].replace(/-/g, '')}/${filings.primaryDocument[i]}`
          };
          filingsList.push(filing);
        }

        const result = {
          company: {
            cik: cik,
            ticker: companyInfo.ticker,
            name: companyInfo.title
          },
          filings: filingsList,
          totalFilings: filings.form.length,
          lastUpdated: new Date().toISOString()
        };

        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        logger.info(`Retrieved ${filingsList.length} filings for ${ticker}`);
        return result;
      } catch (secError) {
        logger.warn(`SEC filings API failed for ${ticker}, returning mock data:`, secError.message);
        
        // Fallback to mock data
        const mockFilings = this.generateMockFilings(ticker, limit);
        this.cache.set(cacheKey, {
          data: mockFilings,
          timestamp: Date.now()
        });
        return mockFilings;
      }
    } catch (error) {
      logger.error(`Error getting filings for ${ticker}:`, error.message);
      throw new Error(`Failed to get company filings: ${error.message}`);
    }
  }

  // Get specific filing types (10-K, 10-Q, 8-K, etc.)
  async getFilingsByType(ticker, formType, limit = 5) {
    try {
      logger.info(`Getting ${formType} filings for ${ticker}`);
      
      const allFilings = await this.getCompanyFilings(ticker, 50); // Get more to filter
      const filteredFilings = allFilings.filings.filter(filing => 
        filing.form === formType.toUpperCase()
      ).slice(0, limit);

      const result = {
        company: allFilings.company,
        formType: formType.toUpperCase(),
        filings: filteredFilings,
        count: filteredFilings.length,
        lastUpdated: new Date().toISOString()
      };

      logger.info(`Found ${filteredFilings.length} ${formType} filings for ${ticker}`);
      return result;
    } catch (error) {
      logger.error(`Error getting ${formType} filings for ${ticker}:`, error.message);
      throw new Error(`Failed to get ${formType} filings: ${error.message}`);
    }
  }

  // Get company facts (financial data from XBRL filings)
  async getCompanyFacts(ticker) {
    try {
      logger.info(`Getting company facts for ${ticker}`);
      
      const cacheKey = `facts_${ticker}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        logger.info(`Returning cached facts for ${ticker}`);
        return cached.data;
      }

      const companyInfo = await this.getCompanyCIK(ticker);
      const cik = companyInfo.cik;

      const url = `${this.secBaseUrl}/api/xbrl/companyfacts/CIK${cik}.json`;
      const response = await axios.get(url, { headers: this.headers });

      const facts = response.data.facts;
      const processedFacts = {};

      // Process key financial metrics
      if (facts['us-gaap']) {
        const usGaap = facts['us-gaap'];
        
        // Revenue
        if (usGaap.Revenues || usGaap.RevenueFromContractWithCustomerExcludingAssessedTax) {
          const revenueData = usGaap.Revenues || usGaap.RevenueFromContractWithCustomerExcludingAssessedTax;
          processedFacts.revenue = this.extractLatestFinancialData(revenueData);
        }

        // Net Income
        if (usGaap.NetIncomeLoss) {
          processedFacts.netIncome = this.extractLatestFinancialData(usGaap.NetIncomeLoss);
        }

        // Total Assets
        if (usGaap.Assets) {
          processedFacts.totalAssets = this.extractLatestFinancialData(usGaap.Assets);
        }

        // Total Liabilities
        if (usGaap.Liabilities) {
          processedFacts.totalLiabilities = this.extractLatestFinancialData(usGaap.Liabilities);
        }

        // Stockholders Equity
        if (usGaap.StockholdersEquity) {
          processedFacts.stockholdersEquity = this.extractLatestFinancialData(usGaap.StockholdersEquity);
        }
      }

      const result = {
        company: {
          cik: cik,
          ticker: companyInfo.ticker,
          name: companyInfo.title
        },
        financialData: processedFacts,
        lastUpdated: new Date().toISOString(),
        dataSource: 'SEC EDGAR XBRL'
      };

      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      logger.info(`Retrieved financial facts for ${ticker}`);
      return result;
    } catch (error) {
      logger.error(`Error getting company facts for ${ticker}:`, error.message);
      throw new Error(`Failed to get company facts: ${error.message}`);
    }
  }

  // Extract latest financial data from XBRL units
  extractLatestFinancialData(dataObject) {
    if (!dataObject || !dataObject.units) return null;

    const units = dataObject.units;
    let latestData = null;
    let latestDate = null;

    // Look through all unit types (USD, shares, etc.)
    Object.keys(units).forEach(unitType => {
      const unitData = units[unitType];
      unitData.forEach(item => {
        if (item.end && (!latestDate || new Date(item.end) > new Date(latestDate))) {
          latestDate = item.end;
          latestData = {
            value: item.val,
            unit: unitType,
            endDate: item.end,
            startDate: item.start || null,
            form: item.form,
            filed: item.filed
          };
        }
      });
    });

    return latestData;
  }

  // Search companies by name
  async searchCompanies(query) {
    try {
      logger.info(`Searching companies with query: ${query}`);
      
      const url = `${this.secBaseUrl}/files/company_tickers.json`;
      const response = await axios.get(url, { headers: this.headers });
      
      const companies = Object.values(response.data);
      const results = companies.filter(company => 
        company.title.toLowerCase().includes(query.toLowerCase()) ||
        (company.ticker && company.ticker.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 10);

      const searchResults = results.map(company => ({
        cik: company.cik_str.toString().padStart(10, '0'),
        ticker: company.ticker,
        name: company.title
      }));

      logger.info(`Found ${searchResults.length} companies for query: "${query}"`);
      return searchResults;
    } catch (error) {
      logger.error(`Error searching companies for "${query}":`, error.message);
      throw new Error(`Failed to search companies: ${error.message}`);
    }
  }

  // Get available filing forms information
  getFilingFormsInfo() {
    return {
      '10-K': {
        name: 'Annual Report',
        description: 'Comprehensive overview of company business and financial condition',
        frequency: 'Annual'
      },
      '10-Q': {
        name: 'Quarterly Report',
        description: 'Quarterly financial statements and updates',
        frequency: 'Quarterly'
      },
      '8-K': {
        name: 'Current Report',
        description: 'Material events or corporate changes',
        frequency: 'As needed'
      },
      'DEF 14A': {
        name: 'Proxy Statement',
        description: 'Information about annual shareholder meetings',
        frequency: 'Annual'
      },
      '20-F': {
        name: 'Annual Report (Foreign)',
        description: 'Annual report for foreign private issuers',
        frequency: 'Annual'
      },
      'S-1': {
        name: 'Registration Statement',
        description: 'Initial registration of securities',
        frequency: 'As needed'
      }
    };
  }

  // Generate mock filings for demonstration when SEC API is unavailable
  generateMockFilings(ticker, limit) {
    const currentDate = new Date();
    const mockFilings = [];
    
    const filingTypes = ['10-K', '10-Q', '8-K', 'DEF 14A'];
    
    for (let i = 0; i < limit; i++) {
      const filingDate = new Date(currentDate);
      filingDate.setDate(currentDate.getDate() - (i * 30)); // 30 days apart
      
      const formType = filingTypes[i % filingTypes.length];
      const accessionNumber = `0000000000-${(22 + i).toString().padStart(2, '0')}-000${(10 + i).toString().padStart(3, '0')}`;
      
      mockFilings.push({
        accessionNumber: accessionNumber,
        form: formType,
        filingDate: filingDate.toISOString().split('T')[0],
        reportDate: filingDate.toISOString().split('T')[0],
        acceptanceDateTime: filingDate.toISOString(),
        primaryDocument: `${ticker.toLowerCase()}-${formType.toLowerCase()}.htm`,
        primaryDocDescription: `${formType} - ${this.getFilingFormsInfo()[formType]?.name || 'Filing'}`,
        size: Math.floor(Math.random() * 1000000) + 100000,
        isXBRL: formType === '10-K' || formType === '10-Q',
        url: `https://www.sec.gov/Archives/edgar/data/0000000000/${accessionNumber.replace(/-/g, '')}/${ticker.toLowerCase()}-${formType.toLowerCase()}.htm`
      });
    }

    return {
      company: {
        cik: '0000000000',
        ticker: ticker.toUpperCase(),
        name: `${ticker.toUpperCase()} Company (Demo Data)`
      },
      filings: mockFilings,
      totalFilings: mockFilings.length,
      lastUpdated: new Date().toISOString(),
      note: 'This is demo data for testing purposes'
    };
  }
}

export default new CompanyFilingsService();
