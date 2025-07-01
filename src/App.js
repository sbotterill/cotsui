import React, { useState, useEffect, useMemo, createContext } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import DrawerAppBar from './components/AppBar';
import CollapsibleTable, { CollapsableTableSkeleton } from './components/CollapsableTable';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SlotsSignIn from './components/SigninPage';
import SignUpPage from './components/SignUpPage';
import VerificationPage from './components/VerificationPage';
import SubscriptionPage from './components/SubscriptionPage';
import SubscriptionGuard from './components/SubscriptionGuard';
import ForgotPassword from './components/ForgotPassword';
import { Box, CircularProgress } from '@mui/material';
import { API_BASE_URL } from './config';
import TradingViewIndicator from './components/TradingView';
import LineChartWithReferenceLines from './components/LineGraph';
import { CssBaseline } from '@mui/material';
import { EXCHANGE_CODE_MAP } from './constants';

// Context to expose toggle function for theme switch
export const ColorModeContext = createContext({ toggleColorMode: () => {} });

// Format date for API
function formatDate(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const pad = n => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} 00:00:00.000`;
}

// Check data availability for a specific date
async function checkLatestDataAvailability() {
  try {
    // Get the most recent date from availableDates
    const response = await axios.get(`${API_BASE_URL}/api/cftc/dates`);
    if (!response.data.success || !response.data.dates || response.data.dates.length === 0) {
      return {
        isAvailable: false,
        checkedAt: new Date().toISOString()
      };
    }

    const latestDate = response.data.dates[0]; // Dates are sorted in descending order
    
    // Try to get data for the latest date
    const dataResponse = await axios.get(`${API_BASE_URL}/api/cftc/data`, {
      params: {
        report_date: latestDate
      }
    });
    
    const isAvailable = dataResponse.data.data.length > 0;
    return {
      isAvailable,
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error checking data availability:', error);
    return {
      isAvailable: false,
      checkedAt: new Date().toISOString()
    };
  }
}

// Get all available report dates for dropdown
async function getAvailableReportDates() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/cftc/dates`);
    if (response.data.success && response.data.dates) {
      // Remove duplicates and sort in descending order
      const uniqueDates = [...new Set(response.data.dates)]
        .sort((a, b) => new Date(b) - new Date(a));
      return uniqueDates;
    }
    return [];
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return [];
  }
}

// Fetching and processing CFTC data
async function fetchData(selectedDate = null) {
  let exchangesList = [];
  let reportDate = null;
  let isLatestData = true;
  let lastChecked = null;

  try {
    if (!selectedDate) {
      // First try to get the latest available date
      const availabilityCheck = await checkLatestDataAvailability();
      lastChecked = availabilityCheck.checkedAt;
      
      if (availabilityCheck.isAvailable) {
        const dates = await getAvailableReportDates();
        reportDate = dates[0]; // Get the most recent date
      } else {
        // If no data available, return error
        throw new Error('No data available');
      }
    } else {
      reportDate = selectedDate;
      isLatestData = false;
    }

    // Get data for the specific report date
    const response = await axios.get(`${API_BASE_URL}/api/cftc/data`, {
      params: {
        report_date: reportDate
      }
    });

    const dataMap = [];
    const exchangeSet = new Set();
    
    for (const data of response.data.data) {
      // Ensure all required fields have at least a 0 value
      const processedData = {
        ...data,
        noncomm_positions_long_all: parseInt(data.noncomm_positions_long_all || 0),
        noncomm_positions_short_all: parseInt(data.noncomm_positions_short_all || 0),
        comm_positions_long_all: parseInt(data.comm_positions_long_all || 0),
        comm_positions_short_all: parseInt(data.comm_positions_short_all || 0),
        nonrept_positions_long_all: parseInt(data.nonrept_positions_long_all || 0),
        nonrept_positions_short_all: parseInt(data.nonrept_positions_short_all || 0),
        change_in_noncomm_long_all: parseInt(data.change_in_noncomm_long_all || 0),
        change_in_noncomm_short_all: parseInt(data.change_in_noncomm_short_all || 0),
        change_in_comm_long_all: parseInt(data.change_in_comm_long_all || 0),
        change_in_comm_short_all: parseInt(data.change_in_comm_short_all || 0),
        change_in_nonrept_long_all: parseInt(data.change_in_nonrept_long_all || 0),
        change_in_nonrept_short_all: parseInt(data.change_in_nonrept_short_all || 0)
      };

      // Calculate totals and percentages
      const commercialTotalPositions = processedData.comm_positions_long_all + processedData.comm_positions_short_all;
      const commercialPercentageLong = commercialTotalPositions ? processedData.comm_positions_long_all / commercialTotalPositions : 0;
      const commercialPercentageShort = commercialTotalPositions ? processedData.comm_positions_short_all / commercialTotalPositions : 0;
      const nonCommercialTotalPositions = processedData.noncomm_positions_long_all + processedData.noncomm_positions_short_all;
      const nonCommercialPercentageLong = nonCommercialTotalPositions ? processedData.noncomm_positions_long_all / nonCommercialTotalPositions : 0;
      const nonCommercialPercentageShort = nonCommercialTotalPositions ? processedData.noncomm_positions_short_all / nonCommercialTotalPositions : 0;
      const nonReptTotalPositions = processedData.nonrept_positions_long_all + processedData.nonrept_positions_short_all;
      const nonReptPercentageLong = nonReptTotalPositions ? processedData.nonrept_positions_long_all / nonReptTotalPositions : 0;
      const nonReptPercentageShort = nonReptTotalPositions ? processedData.nonrept_positions_short_all / nonReptTotalPositions : 0;

      const obj = {
        commodity: processedData.contract_market_name,
        contract_code: processedData.cftc_contract_market_code,
        market_code: processedData.cftc_market_code,
        report_date: reportDate,
        commerical_long: processedData.comm_positions_long_all,
        commerical_long_change: processedData.change_in_comm_long_all || 0,
        commerical_short: processedData.comm_positions_short_all,
        commerical_short_change: processedData.change_in_comm_short_all || 0,
        commerical_total: commercialTotalPositions,
        commerical_percentage_long: commercialPercentageLong,
        commerical_percentage_short: commercialPercentageShort,
        non_commercial_long: processedData.noncomm_positions_long_all,
        non_commercial_long_change: processedData.change_in_noncomm_long_all || 0,
        non_commercial_short: processedData.noncomm_positions_short_all,
        non_commercial_short_change: processedData.change_in_noncomm_short_all || 0,
        non_commercial_total: nonCommercialTotalPositions,
        non_commercial_percentage_long: nonCommercialPercentageLong,
        non_commercial_percentage_short: nonCommercialPercentageShort,
        non_reportable_long: processedData.nonrept_positions_long_all,
        non_reportable_long_change: processedData.change_in_nonrept_long_all || 0,
        non_reportable_short: processedData.nonrept_positions_short_all,
        non_reportable_short_change: processedData.change_in_nonrept_short_all || 0,
        non_reportable_total: nonReptTotalPositions,
        non_reportable_percentage_long: nonReptPercentageLong,
        non_reportable_percentage_short: nonReptPercentageShort,
        total_reportable_long: processedData.tot_rept_positions_long_all || 0,
        total_reportable_short: processedData.tot_rept_positions_short || 0,
        total_long: (processedData.nonrept_positions_long_all || 0) + (processedData.tot_rept_positions_long_all || 0),
        total_short: (processedData.nonrept_positions_short_all || 0) + (processedData.tot_rept_positions_short || 0)
      };

      dataMap.push(obj);
      exchangeSet.add(obj.market_code);
    }

    exchangesList = Array.from(exchangeSet).sort();  // Sort alphabetically
    
    const result = {
      data: dataMap,
      exchanges: exchangesList,
      reportDate,
      isLatestData,
      lastChecked
    };
    
    return result;
  } catch (error) {
    console.error('Error in fetchData:', error);
    throw error;
  }
}

// Main App component
export default function App() {
  const [mode, setMode] = useState('dark');
  const [authorized, setAuthorization] = useState(() => {
    return !!localStorage.getItem('userEmail');
  });
  const [error, setError] = useState(null);
  const [exchanges, setExchanges] = useState([]);
  const [displayExchanges, setDisplayExchanges] = useState([]);
  const [futuresData, setFuturesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLatestData, setIsLatestData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [commericalChartData, setCommericalChartData] = useState([]);
  const [nonCommercialChartData, setNonCommercialChartData] = useState([]);
  const [nonReportableChartData, setNonReportableChartData] = useState([]);
  const [chartDates, setChartDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const initialFavorites = localStorage.getItem('initialFavorites');
    return initialFavorites ? JSON.parse(initialFavorites) : [];
  });
  const [tableFilters, setTableFilters] = useState([]);
  const [isDateLoading, setIsDateLoading] = React.useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Theme state & toggle
  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode(prev => (prev === 'light' ? 'dark' : 'light'));
    },
  }), []);
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  useEffect(() => {
    document.documentElement.style.backgroundColor = theme.palette.background.default;
  }, [theme.palette.background.default]);
  
  // Add effect to handle authorization changes
  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setAuthorization(!!email);
  }, []);

  // Load available dates on mount
  useEffect(() => {
    const loadAvailableDates = async () => {
      if (!authorized) return;
      try {
        const dates = await getAvailableReportDates();
        setAvailableDates(dates);
      } catch (error) {
        console.error('Error loading available dates:', error);
      }
    };
    loadAvailableDates();
  }, [authorized]);
  
  // Add a call counter and initial load flag
  const fetchCallCount = React.useRef(0);
  const initialLoadComplete = React.useRef(false);
  const isInitialDateSet = React.useRef(false);

  // Load data on mount or when selectedDate changes
  useEffect(() => {
    const loadData = async () => {
      if (!authorized) {
        return;
      }

      // Skip if this is a redundant call due to selectedDate being set during initial load
      if (fetchCallCount.current > 0 && !selectedDate) {
        return;
      }
      
      try {
        setIsLoading(true);
        const result = await fetchData(selectedDate);

        // Load table filters first
        const email = localStorage.getItem('userEmail');
        let filteredExchanges = result.exchanges;
        
        if (email) {
          try {
            const response = await axios.get(`${API_BASE_URL}/preferences/table_filters?email=${email}`);
            if (response.data.success && response.data.table_filters && response.data.table_filters.selected) {
              // Normalize the loaded filters
              filteredExchanges = response.data.table_filters.selected.map(code => code.trim());
            } else {
            }
          } catch (error) {
            console.error('Error loading table filters:', error);
          }
        }

        // Filter data based on selected exchanges
        const filteredData = result.data.filter(item => {
          const included = filteredExchanges.includes(item.market_code?.trim());
          return included;
        });

        // Set all states at once to minimize re-renders
        setExchanges(result.exchanges);
        setDisplayExchanges(filteredExchanges);
        setFuturesData(result.data);
        setFilteredData(filteredData);
        setLastUpdated(result.reportDate);
        setIsLatestData(result.isLatestData);
        setLastChecked(result.lastChecked);
        
        // Set selectedDate to match the report date on initial load only
        if (!selectedDate && !initialLoadComplete.current) {
          initialLoadComplete.current = true;
          isInitialDateSet.current = true;
          setSelectedDate(result.reportDate);
        }
      } catch (error) {
        console.error('Error in loadData:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authorized]);

  // Handle date changes in a separate effect
  useEffect(() => {
    if (selectedDate && initialLoadComplete.current) {
      if (isInitialDateSet.current) {
        // If this is the initial date set, just clear the flag and don't reload
        isInitialDateSet.current = false;
        return;
      }

      handleDateChange(selectedDate);
    }
  }, [selectedDate]);

  // Handle favorites toggle
  const handleToggleFavorite = async (commodity) => {
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        return;
      }

      const newFavorites = favorites.includes(commodity)
        ? favorites.filter(f => f !== commodity)
        : [...favorites, commodity];

      setFavorites(newFavorites);
      localStorage.setItem('initialFavorites', JSON.stringify(newFavorites));

      const response = await fetch(`${API_BASE_URL}/preferences/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          favorites: {
            selected: newFavorites
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
    }
  };

  const getChartData = async (marketCode) => {
    const response = await axios.get(
      `https://publicreporting.cftc.gov/resource/6dca-aqww.json?cftc_contract_market_code=${marketCode}&$order=report_date_as_yyyy_mm_dd DESC&$limit=1000`
    );
    
    // Format dates to MM/DD/YY
    const formattedData = response.data.map(item => ({
      ...item,
      report_date_as_yyyy_mm_dd: new Date(item.report_date_as_yyyy_mm_dd).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      })
    }));

    setChartDates(formattedData.map(item => item.report_date_as_yyyy_mm_dd));
    setCommericalChartData(formattedData.map(item => item.comm_positions_long_all - item.comm_positions_short_all));
    setNonCommercialChartData(formattedData.map(item => item.noncomm_positions_long_all - item.noncomm_positions_short_all));
    setNonReportableChartData(formattedData.map(item => item.nonrept_positions_long_all - item.nonrept_positions_short_all));
  };

  const loadFavorites = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        return;
      }

      // Check for initial favorites first
      const initialFavorites = localStorage.getItem('initialFavorites');
      if (initialFavorites) {
        setFavorites(JSON.parse(initialFavorites));
        // Clear initial favorites after using them
        localStorage.removeItem('initialFavorites');
      }

      const response = await fetch(`${API_BASE_URL}/preferences/favorites?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        throw new Error('Failed to load favorites');
      }
      const data = await response.json();
      
      // Load favorites
      if (data.favorites && data.favorites.selected) {
        setFavorites(data.favorites.selected);
      }
    } catch (error) {
    }
  };

  // Exchange filter handler
  const handleExchangeFilterChange = async (newList, shouldSaveToServer = true) => {
    setDisplayExchanges(newList);
    if (shouldSaveToServer) {
      try {
        const email = localStorage.getItem('userEmail');
        const response = await fetch(`${API_BASE_URL}/preferences/table_filters`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: email,
            table_filters: {
              selected: newList
            }
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
      }
    }
  };

  // Refresh data handler
  const handleRefresh = async () => {
    fetchCallCount.current += 1;
    setIsRefreshing(true);
    
    try {
      const result = await fetchData(selectedDate);
      setExchanges(result.exchanges);
      setDisplayExchanges(result.exchanges);
      setFuturesData(result.data);
      setFilteredData(result.data);
      setLastUpdated(result.reportDate);
      setIsLatestData(result.isLatestData);
      setLastChecked(result.lastChecked);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(error.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCommoditySelect = async (marketCode, commodityName) => {
    setSelectedCommodity(commodityName);
    await getChartData(marketCode);
  };

  // Update loading state when data is ready
  useEffect(() => {
    if (futuresData.length > 0 && exchanges.length > 0) {
      setIsLoading(false);
    }
  }, [futuresData, exchanges]);

  const handleDateChange = async (newDate) => {
    fetchCallCount.current += 1;
    setIsDateLoading(true);
    setSelectedDate(newDate);
    
    try {
      const result = await fetchData(newDate);
      setExchanges(result.exchanges);
      setDisplayExchanges(result.exchanges);
      setFuturesData(result.data);
      setFilteredData(result.data);
      setLastUpdated(result.reportDate);
      setIsLatestData(result.isLatestData);
      setLastChecked(result.lastChecked);
    } catch (error) {
      console.error('Error changing date:', error);
      setError(error.message);
    } finally {
      setIsDateLoading(false);
    }
  };

  const renderCollapsibleTable = () => {

    // Group data by exchange code and get a sample commodity for each
    const exchangeGroups = {};
    filteredData.forEach(item => {
      if (!item.market_code) return;
      const code = item.market_code.trim();
      if (!exchangeGroups[code]) {
        exchangeGroups[code] = {
          code,
          fullName: EXCHANGE_CODE_MAP[code] || code,
          sampleCommodity: item.commodity
        };
      }
    });

    // Format exchanges with proper names and sort them
    const formattedExchanges = Object.values(exchangeGroups)
      .map(({ code, fullName }) => `${code} - ${fullName}`)
      .sort((a, b) => {
        // Sort by the full name part after the " - "
        const aName = a.split(' - ')[1];
        const bName = b.split(' - ')[1];
        return aName.localeCompare(bName);
      });

    return (
      <CollapsibleTable
        key={`table-${favorites.length}-${formattedExchanges.length}`}
        futuresData={filteredData}
        exchanges={formattedExchanges}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        onCommoditySelect={handleCommoditySelect}
        displayExchanges={displayExchanges}
      />
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={
          <>
            {!authorized ? (
              <SlotsSignIn setAuthorization={setAuthorization} />
            ) : (
              <SubscriptionGuard>
                <ColorModeContext.Provider value={colorMode}>
                  <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                      <DrawerAppBar
                        futuresData={futuresData}
                        setFilteredData={setFilteredData}
                        exchanges={exchanges}
                        displayExchanges={displayExchanges}
                        onExchangeFilterChange={handleExchangeFilterChange}
                        lastUpdated={lastUpdated}
                        selectedDate={selectedDate}
                        onDateChange={handleDateChange}
                        isDateLoading={isDateLoading}
                        availableDates={availableDates}
                        isLatestData={isLatestData}
                        lastChecked={lastChecked}
                      />
                      <Box
                        component="main"
                        sx={{
                          flexGrow: 1,
                          pt: { xs: '56px', sm: '64px' }, // Responsive top padding based on AppBar height
                          px: 2, // Add some horizontal padding
                          width: '100%',
                          overflow: 'hidden' // Prevent any potential scrollbar issues
                        }}
                      >
                        {isLoading ? (
                          <CollapsableTableSkeleton />
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', height: '100%' }}>
                            {renderCollapsibleTable()}
                            <LineChartWithReferenceLines 
                              commericalChartData={commericalChartData} 
                              nonCommercialChartData={nonCommercialChartData} 
                              nonReportableChartData={nonReportableChartData} 
                              chartDates={chartDates}
                              selectedCommodity={selectedCommodity}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </ThemeProvider>
                </ColorModeContext.Provider>
              </SubscriptionGuard>
            )}
          </>
        } />
      </Routes>
    </Router>
  );
}