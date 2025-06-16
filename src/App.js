import React, { useState, useEffect, useMemo, createContext } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import DrawerAppBar from './components/AppBar';
import CollapsibleTable from './components/CollapsableTable';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SlotsSignIn from './components/SigninPage';
import SignUpPage from './components/SignUpPage';
import VerificationPage from './components/VerificationPage';
import ForgotPassword from './components/ForgotPassword';
import { Box, CircularProgress } from '@mui/material';
import { API_BASE_URL } from './config';
import TradingViewIndicator from './components/TradingView';
import LineChartWithReferenceLines from './components/LineGraph';

// Context to expose toggle function for theme switch
export const ColorModeContext = createContext({ toggleColorMode: () => {} });

// Utility functions for report dates
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
async function fetchData() {
  let fullList = [];
  let exchangesList = [];
  let reportDate = await getThisWeeksTuesday();
  let isLatestData = true;
  let lastChecked = null;

  try {
    // First check if this week's data is available
    const availabilityCheck = await checkLatestDataAvailability();
    lastChecked = availabilityCheck.checkedAt;
    
    if (!availabilityCheck.isAvailable) {
      isLatestData = false;
      reportDate = await getLastWeeksTuesday();
    }

    const firstResponse = await axios.get(
      "https://publicreporting.cftc.gov/resource/6dca-aqww.json"
    );

    const requests = firstResponse.data.map(async element => {
      try {
        let response = await axios.get(
          `https://publicreporting.cftc.gov/resource/6dca-aqww.json?cftc_contract_market_code=${element.cftc_contract_market_code}&report_date_as_yyyy_mm_dd=${reportDate}`
        );

        if (response.data.length === 0) {
          return;
        }

        const data = response.data[0];
        if (!data || !data.noncomm_positions_long_all || !data.noncomm_positions_short_all || data.noncomm_positions_long_all === "undefined") {
          return;
        }

        // Calculate totals and percentages...
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

        if (!fullList.some(item => item.commodity === obj.commodity)) {
          fullList.push(obj);
        }

        const market_exchange_full_name = element.market_and_exchange_names.split("-");
        const words = [
          "CHICAGO MERCANTILE EXCHANGE",
          "CHICAGO BOARD OF TRADE",
          "COMMODITY EXCHANGE INC",
          "CBOE FUTURES EXCHANGE",
          "ICE FUTURES U.S.",
          "NEW YORK MERCANTILE EXCHANGE"
        ];
        if (words.some(word => market_exchange_full_name[1].includes(word))) {
          const tag = `${element.cftc_market_code.trim()} - ${market_exchange_full_name[1].trim()}`;
          if (!exchangesList.includes(tag)) {
            exchangesList.push(tag);
          }
        }

      } catch (err) {
      }
    });

    await Promise.all(requests);

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
  const [favorites, setFavorites] = useState(() => {
    const initialFavorites = localStorage.getItem('initialFavorites');
    console.log('Initializing favorites state with:', initialFavorites);
    return initialFavorites ? JSON.parse(initialFavorites) : [];
  });
  const [tableFilters, setTableFilters] = useState([]);

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
  
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // First load futures data
        const [exchs, futs, date, latest, checked] = await fetchData();
        setExchanges(exchs);
        setDisplayExchanges(exchs);
        setFuturesData(futs);
        setFilteredData(futs);
        setLastUpdated(date);
        setIsLatestData(latest);
        setLastChecked(checked);

        // Then load favorites
        const email = localStorage.getItem('userEmail');
        if (email) {
          console.log('Loading favorites for email:', email);
          // Fetch latest favorites from server
          const response = await fetch(`${API_BASE_URL}/preferences/favorites?email=${encodeURIComponent(email)}`);
          if (response.ok) {
            const data = await response.json();
            console.log('Favorites data received from server:', data);
            if (data.favorites?.selected) {
              console.log('Setting favorites from server:', data.favorites.selected);
              setFavorites(data.favorites.selected);
              // Update localStorage with latest favorites
              localStorage.setItem('initialFavorites', JSON.stringify(data.favorites.selected));
            }
          }
        }

        // Finally load table filters
        await loadTableFilters();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Debug favorites state changes
  useEffect(() => {
    console.log('Favorites state updated:', favorites);
  }, [favorites]);

  // Handle favorites toggle
  const handleToggleFavorite = async (commodity) => {
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        console.error('No email found in localStorage');
        return;
      }

      const newFavorites = favorites.includes(commodity)
        ? favorites.filter(f => f !== commodity)
        : [...favorites, commodity];

      console.log('Updating favorites to:', newFavorites);
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
      console.error('Error updating favorites:', error);
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
      console.error('Error loading favorites:', error);
    }
  };

  const loadTableFilters = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/preferences?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check for preferences.selected first (direct array)
      if (data.preferences?.selected) {
        setDisplayExchanges(data.preferences.selected);
      }
      // Fallback to table_filters.selected if direct selected array is not present
      else if (data.preferences?.table_filters?.selected) {
        setDisplayExchanges(data.preferences.table_filters.selected);
      }
    } catch (error) {
    }
  };

  // Exchange filter handler
  const handleExchangeFilterChange = async (newList, shouldSaveToServer = true) => {
    setDisplayExchanges(newList);
    if (shouldSaveToServer) {
      try {
        const response = await fetch(`${API_BASE_URL}/preferences/table_filters`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: localStorage.getItem('userEmail'),
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
    setIsRefreshing(true);
    const [exchs, futs, date, latest, checked] = await fetchData();
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

  // Add loading state
  const [isLoading, setIsLoading] = React.useState(true);

  // Update loading state when data is ready
  useEffect(() => {
    if (futuresData.length > 0 && exchanges.length > 0) {
      setIsLoading(false);
    }
  }, [futuresData, exchanges]);

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={
          <>
            {!authorized ? (
              <div style={{ display: 'flex', flexDirection: 'column'}}>
                <SlotsSignIn 
                  setAuthorization={setAuthorization} 
                  setError={setError}
                />
              </div>
            ) : (
              <ColorModeContext.Provider value={colorMode}>
                <ThemeProvider theme={theme}>
                  <div className="app-js-container">
                    <DrawerAppBar
                      exchanges={exchanges}
                      displayExchanges={displayExchanges}
                      onExchangeFilterChange={handleExchangeFilterChange}
                      futuresData={futuresData}
                      setFilteredData={setFilteredData}
                      reportDate={lastUpdated}
                      isLatestData={isLatestData}
                      onRefresh={handleRefresh}
                      isRefreshing={isRefreshing}
                      lastChecked={lastChecked}
                    />
                    <div style={{ paddingTop: 90, width: '100%' }}>
                      {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 90px)' }}>
                          <CircularProgress />
                        </Box>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', height: '100%' }}>
                          <CollapsibleTable
                            key={`table-${favorites.length}`}
                            futuresData={filteredData}
                            exchanges={displayExchanges}
                            favorites={favorites}
                            onToggleFavorite={handleToggleFavorite}
                            onCommoditySelect={handleCommoditySelect}
                          />
                          <LineChartWithReferenceLines 
                            commericalChartData={commericalChartData} 
                            nonCommercialChartData={nonCommercialChartData} 
                            nonReportableChartData={nonReportableChartData} 
                            chartDates={chartDates}
                            selectedCommodity={selectedCommodity}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </ThemeProvider>
              </ColorModeContext.Provider>
            )}
          </>
        } />
      </Routes>
    </Router>
  );
}