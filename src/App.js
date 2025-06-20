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

// Context to expose toggle function for theme switch
export const ColorModeContext = createContext({ toggleColorMode: () => {} });

// Utility functions for report dates
function getPastTuesdays(weeks = 36) {
  const tuesdays = [];
  const today = new Date();
  let currentDate = new Date(today);
  
  // Go back to the most recent Tuesday
  const daysSinceTuesday = (currentDate.getDay() - 2 + 7) % 7;
  currentDate.setDate(currentDate.getDate() - daysSinceTuesday);
  
  // Check if it's after Friday 3:31 PM EST
  const fridayCheck = new Date(today);
  // Convert current time to EST
  const estOptions = { timeZone: 'America/New_York' };
  const estTime = new Date(fridayCheck.toLocaleString('en-US', estOptions));
  const isAfterFridayDataRelease = estTime.getDay() === 5 && 
    (estTime.getHours() > 15 || (estTime.getHours() === 15 && estTime.getMinutes() >= 31)) || 
    estTime.getDay() === 6 || 
    estTime.getDay() === 0;

  // If it's not after Friday 3:31 PM EST, skip the current week's Tuesday
  if (!isAfterFridayDataRelease) {
    currentDate.setDate(currentDate.getDate() - 7);
  }
  
  // Generate the past Tuesdays
  for (let i = 0; i < weeks; i++) {
    tuesdays.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() - 7);
  }
  
  return tuesdays;
}

async function getThisWeeksTuesday() {
  const date = new Date();
  const day = date.getDay();
  // Calculate days since last Tuesday (2 is Tuesday)
  const daysSinceTuesday = (day - 2 + 7) % 7;
  const tuesday = new Date(date);
  tuesday.setDate(date.getDate() - daysSinceTuesday);
  return formatDate(tuesday);
}

async function getLastWeeksTuesday() {
  const date = new Date();
  const day = date.getDay();
  // Calculate days since last Tuesday (2 is Tuesday)
  const daysSinceTuesday = (day - 2 + 7) % 7;
  const thisWeekTuesday = new Date(date);
  thisWeekTuesday.setDate(date.getDate() - daysSinceTuesday);
  // Subtract 7 days to get last week's Tuesday
  const lastWeekTuesday = new Date(thisWeekTuesday);
  lastWeekTuesday.setDate(thisWeekTuesday.getDate() - 7);
  return formatDate(lastWeekTuesday);
}

// Format date for API
function formatDate(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const pad = n => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00:00.000`;
}

// Add this new function to check data availability
async function checkLatestDataAvailability() {
  try {
    const thisWeekTuesday = await getThisWeeksTuesday();
    const response = await axios.get(
      `https://publicreporting.cftc.gov/resource/6dca-aqww.json?$where=report_date_as_yyyy_mm_dd>='${thisWeekTuesday}'&$order=report_date_as_yyyy_mm_dd DESC&$limit=1`
    );
    const isAvailable = response.data.length > 0;
    return {
      isAvailable,
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      isAvailable: false,
      checkedAt: new Date().toISOString()
    };
  }
}

// Fetching and processing CFTC data
async function fetchData(selectedDate = null) {
  let exchangesList = [];
  let reportDate = selectedDate || await getThisWeeksTuesday();
  let isLatestData = true;
  let lastChecked = null;

  try {
    // First check if this week's data is available
    const availabilityCheck = await checkLatestDataAvailability();
    lastChecked = availabilityCheck.checkedAt;
    
    if (!selectedDate) {
      if (!availabilityCheck.isAvailable) {
        isLatestData = false;
        reportDate = await getLastWeeksTuesday();
      }
    } else {
      isLatestData = false;
    }

    // Get only the necessary fields from the initial request
    const firstResponse = await axios.get(
      "https://publicreporting.cftc.gov/resource/6dca-aqww.json?$select=cftc_contract_market_code,contract_market_name,market_and_exchange_names,cftc_market_code"
    );

    // Use a Map to ensure uniqueness by contract_code
    const dataMap = new Map();
    const exchangeSet = new Set();
    
    // Process requests in batches
    const batchSize = 500;
    
    for (let i = 0; i < firstResponse.data.length; i += batchSize) {
      const batch = firstResponse.data.slice(i, i + batchSize);
      
      // Add a smaller delay between batches
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Process each batch
      const batchResults = await Promise.all(
        batch.map(async (element) => {
          try {
            const response = await axios.get(
              `https://publicreporting.cftc.gov/resource/6dca-aqww.json?cftc_contract_market_code=${element.cftc_contract_market_code}&report_date_as_yyyy_mm_dd=${formatDate(reportDate)}`
            );

            if (!response.data.length) return null;

            const data = response.data[0];
            if (!data || !data.noncomm_positions_long_all || !data.noncomm_positions_short_all || data.noncomm_positions_long_all === "undefined") {
              return null;
            }

            // Calculate totals and percentages
            const commercialTotalPostitions = +data.comm_positions_long_all + +data.comm_positions_short_all;
            const commercialPercentageLong = +data.comm_positions_long_all / commercialTotalPostitions;
            const commercialPercentageShort = +data.comm_positions_short_all / commercialTotalPostitions;
            const nonCommercialTotalPostitions = +data.noncomm_positions_long_all + +data.noncomm_positions_short_all;
            const nonCommercialPercentageLong = +data.noncomm_positions_long_all / nonCommercialTotalPostitions;
            const nonCommercialPercentageShort = +data.noncomm_positions_short_all / nonCommercialTotalPostitions;
            const nonReptTotalPostitions = +data.nonrept_positions_long_all + +data.nonrept_positions_short_all;
            const nonReptPercentageLong = +data.nonrept_positions_long_all / nonReptTotalPostitions;
            const nonReptPercentageShort = +data.nonrept_positions_short_all / nonReptTotalPostitions;

            const obj = {
              commodity: element.contract_market_name,
              contract_code: element.cftc_contract_market_code,
              market_and_exchange_name: element.market_and_exchange_names,
              market_code: element.cftc_market_code,
              report_date: reportDate,
              commerical_long: +data.comm_positions_long_all,
              commerical_long_change: +data.change_in_comm_long_all,
              commerical_short: +data.comm_positions_short_all,
              commerical_short_change: +data.change_in_comm_short_all,
              commerical_total: commercialTotalPostitions,
              commerical_percentage_long: commercialPercentageLong,
              commerical_percentage_short: commercialPercentageShort,
              non_commercial_long: +data.noncomm_positions_long_all,
              non_commercial_long_change: +data.change_in_noncomm_long_all,
              non_commercial_short: +data.noncomm_positions_short_all,
              non_commercial_short_change: +data.change_in_noncomm_short_all,
              non_commercial_total: nonCommercialTotalPostitions,
              non_commercial_percentage_long: nonCommercialPercentageLong,
              non_commercial_percentage_short: nonCommercialPercentageShort,
              non_reportable_long: +data.nonrept_positions_long_all,
              non_reportable_long_change: +data.change_in_nonrept_long_all,
              non_reportable_short: +data.nonrept_positions_short_all,
              non_reportable_short_change: +data.change_in_nonrept_short_all,
              non_reportable_total: nonReptTotalPostitions,
              non_reportable_percentage_long: nonReptPercentageLong,
              non_reportable_percentage_short: nonReptPercentageShort,
            };

            return obj;
          } catch (error) {
            return null;
          }
        })
      );

      // Filter out null results and add to dataMap
      const validResults = batchResults.filter(result => result !== null);
      for (const result of validResults) {
        dataMap.set(result.contract_code, result);
      }

      // Update exchangesList
      for (const element of batch) {
        // Split on the last hyphen to handle cases where commodity names contain hyphens
        const lastHyphenIndex = element.market_and_exchange_names.lastIndexOf('-');
        if (lastHyphenIndex !== -1) {
          const exchangeName = element.market_and_exchange_names.substring(lastHyphenIndex + 1).trim();
          const marketCode = element.cftc_market_code?.trim() || '';
          
          let exchangeTag;

          // Consolidate exchanges based on their prefix
          if (marketCode.startsWith('CME')) {
            exchangeTag = 'CME - CHICAGO MERCANTILE EXCHANGE';
          } else if (marketCode.startsWith('CBT')) {
            exchangeTag = 'CBT - CHICAGO BOARD OF TRADE';
          } else if (marketCode.startsWith('CMX')) {
            exchangeTag = 'CMX - COMMODITY EXCHANGE INC.';
          } else if (marketCode.startsWith('NYME')) {
            exchangeTag = 'NYME - NEW YORK MERCANTILE EXCHANGE';
          } else if (marketCode.startsWith('MGE')) {
            exchangeTag = 'MGE - MINNEAPOLIS GRAIN EXCHANGE';
          } else if (marketCode.startsWith('ICEU')) {
            exchangeTag = 'ICE - FUTURES EUROPE';
          } else if (marketCode.startsWith('ICUS')) {
            exchangeTag = 'ICUS - ICE FUTURES U.S.';
          } else if (marketCode.startsWith('IFED')) {
            exchangeTag = 'IFED - ICE FUTURES ENERGY DIV';
          } else if (marketCode.startsWith('NODX')) {
            exchangeTag = 'NODX - NODAL EXCHANGE';
          } else {
            exchangeTag = `${marketCode} - ${exchangeName}`;
          }
          
          exchangeSet.add(exchangeTag);
        }
      }
    }

    // Convert Map and Set to arrays
    const fullList = Array.from(dataMap.values());
    exchangesList = Array.from(exchangeSet);

    return [
      exchangesList.sort((a, b) => a.localeCompare(b)),
      fullList.sort((a, b) => a.commodity.localeCompare(b.commodity)),
      reportDate,
      isLatestData,
      lastChecked
    ];

  } catch (error) {
    // Return empty data with error state
    return [
      [],
      [],
      reportDate,
      false,
      lastChecked
    ];
  }
}

// Main App component
export default function App() {
  const [mode, setMode] = useState('dark');
  const [authorized, setAuthorization] = useState(() => {
    // On initial load, check if userEmail exists in localStorage
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
  const [pastTuesdays] = useState(() => getPastTuesdays());
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
        const [exchangesList, fullList, reportDate, isLatestData, lastChecked] = await fetchData(selectedDate);
        
        // Load table filters first
        const email = localStorage.getItem('userEmail');
        let filteredExchanges = exchangesList;
        
        if (email) {
          try {
            const response = await fetch(`${API_BASE_URL}/preferences?email=${encodeURIComponent(email)}`, {
              credentials: 'include'
            });
            if (response.ok) {
              const data = await response.json();
              if (data.preferences?.selected && data.preferences.selected.length > 0) {
                filteredExchanges = data.preferences.selected;
              } else if (data.preferences?.table_filters?.selected && data.preferences.table_filters.selected.length > 0) {
                filteredExchanges = data.preferences.table_filters.selected;
              }
            }
          } catch (error) {
          }
        }

        // Set all states at once to minimize re-renders
        setExchanges(exchangesList);
        setDisplayExchanges(filteredExchanges);
        setFuturesData(fullList);
        setFilteredData(fullList);
        setLastUpdated(reportDate);
        setIsLatestData(isLatestData);
        setLastChecked(lastChecked);
        
        // Set selectedDate to match the report date on initial load only
        if (!selectedDate && !initialLoadComplete.current) {
          initialLoadComplete.current = true;
          isInitialDateSet.current = true; // Mark that we're doing the initial date set
          const newDate = new Date(reportDate).toISOString();
          setSelectedDate(newDate);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authorized]); // Only depend on authorization changes

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
            selected: newList
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
    const [exchs, futs, date, latest, checked] = await fetchData(selectedDate);
    setExchanges(exchs);
    setDisplayExchanges(exchs);
    setFuturesData(futs);
    setFilteredData(futs);
    setLastUpdated(date);
    setIsLatestData(latest);
    setLastChecked(checked);
    setIsRefreshing(false);
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
    const [exchs, futs, date, latest, checked] = await fetchData(newDate);
    setExchanges(exchs);
    setDisplayExchanges(exchs);
    setFuturesData(futs);
    setFilteredData(futs);
    setLastUpdated(date);
    setIsLatestData(latest);
    setLastChecked(checked);
    setIsDateLoading(false);
  };

  const renderCollapsibleTable = () => {
    return (
      <CollapsibleTable
        key={`table-${favorites.length}`}
        futuresData={filteredData}
        exchanges={displayExchanges}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        onCommoditySelect={handleCommoditySelect}
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
                        pastTuesdays={pastTuesdays}
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