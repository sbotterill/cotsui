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
import { Box, CircularProgress } from '@mui/material';
import { API_BASE_URL } from './config';

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
      `https://publicreporting.cftc.gov/resource/6dca-aqww.json?$limit=1&report_date_as_yyyy_mm_dd=${thisWeekTuesday}`
    );
    const isAvailable = response.data.length > 0;
    return {
      isAvailable,
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error checking data availability:", error);
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
      console.log('This week\'s data not available, falling back to last week');
      isLatestData = false;
      reportDate = await getLastWeeksTuesday();
    }

    console.log('Fetching data for date:', reportDate);
    const firstResponse = await axios.get(
      "https://publicreporting.cftc.gov/resource/6dca-aqww.json"
    );

    const requests = firstResponse.data.map(async element => {
      try {
        let response = await axios.get(
          `https://publicreporting.cftc.gov/resource/6dca-aqww.json?cftc_contract_market_code=${element.cftc_contract_market_code}&report_date_as_yyyy_mm_dd=${reportDate}`
        );

        if (response.data.length === 0) {
          console.warn(`No data found for ${element.contract_market_name} on ${reportDate}`);
          return;
        }

        const data = response.data[0];
        if (!data || !data.noncomm_positions_long_all || !data.noncomm_positions_short_all || data.noncomm_positions_long_all === "undefined") {
          console.warn(`Invalid data for ${element.contract_market_name} on ${reportDate}`);
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
        console.warn(`Failed to fetch data for ${element.contract_market_name}:`, err.message);
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
    console.error("Error fetching data:", error);
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
  // Theme state & toggle
  const [mode, setMode] = useState('dark');
  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode(prev => (prev === 'light' ? 'dark' : 'light'));
    },
  }), []);
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  useEffect(() => {
    document.documentElement.style.backgroundColor = theme.palette.background.default;
  }, [theme.palette.background.default]);
  
  // Data state
  const [futuresData, setFuturesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [displayExchanges, setDisplayExchanges] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [authorized, setAuthorization] = useState(false);
  const [isLatestData, setIsLatestData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  // Favorites
  const [favorites, setFavorites] = useState([]);

  const handleToggleFavorite = async (commodity) => {
    try {
      const newFavorites = favorites.includes(commodity)
        ? favorites.filter(f => f !== commodity)
        : [...favorites, commodity];
      
      setFavorites(newFavorites);
      
      // Save favorites immediately
      const response = await fetch(`${API_BASE_URL}/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: localStorage.getItem('userEmail'),
          preferences: {},
          favorites: { selected: newFavorites }
        }),
      });

      if (!response.ok) {
        console.error('Failed to save favorites');
        // Optionally revert the state if save fails
        setFavorites(favorites);
      }
    } catch (error) {
      console.error('Error saving favorites:', error);
      // Optionally revert the state if save fails
      setFavorites(favorites);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/preferences?email=${localStorage.getItem('userEmail')}`);
      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }
      const data = await response.json();
      console.log('Loaded preferences:', data);  // Debug log
      
      // Load favorites
      if (data.favorites && data.favorites.selected) {
        setFavorites(data.favorites.selected);
      }
      
      // Load table filters
      if (data.preferences && data.preferences.table_filters && data.preferences.table_filters.selected) {
        setDisplayExchanges(data.preferences.table_filters.selected);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const [exchs, futs, date, latest, checked] = await fetchData();
      setExchanges(exchs);
      setDisplayExchanges(exchs);
      setFuturesData(futs);
      setFilteredData(futs);
      setLastUpdated(date);
      setIsLatestData(latest);
      setLastChecked(checked);
      await loadFavorites();
    };
    loadData();
  }, []);

  // Exchange filter handler
  const handleExchangeFilterChange = newList => {
    setDisplayExchanges(newList);
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

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/" element={
          <>
            {!authorized ? (
              <SlotsSignIn setAuthorization={setAuthorization} />
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
                      {filteredData.length > 0 && exchanges.length > 0 ? (
                        <CollapsibleTable
                          futuresData={filteredData}
                          exchanges={displayExchanges}
                          favorites={favorites}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 90px)' }}>
                          <CircularProgress />
                        </Box>
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