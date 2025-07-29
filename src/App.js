import React, { useState, useEffect, useMemo, createContext } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import DrawerAppBar from './components/AppBar';
import CollapsibleTable, { CollapsableTableSkeleton } from './components/CollapsableTable';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SignUpPage from './components/SignUpPage';
import VerificationPage from './components/VerificationPage';
import SubscriptionPage from './components/SubscriptionPage';
import SubscriptionGuard from './components/SubscriptionGuard';
import ForgotPassword from './components/ForgotPassword';
import LandingPage from './components/LandingPage';
import { Box, CircularProgress } from '@mui/material';
import { API_BASE_URL } from './config';
import TradingViewIndicator from './components/TradingView';
import LineChartWithReferenceLines from './components/LineGraph';
import { CssBaseline } from '@mui/material';
import { EXCHANGE_CODE_MAP } from './constants';
import SigninPage from './components/SigninPage';
import Profile from './components/Profile';
import Loading from './components/Loading';
import { useMediaQuery } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TableChartIcon from '@mui/icons-material/TableChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { getCommercialExtremes } from './services/cftcService';

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
        market_code: (data.cftc_market_code || '').trim(),  // Trim market code here
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
        change_in_nonrept_short_all: parseInt(data.change_in_nonrept_short_all || 0),
        open_interest_all: parseInt(data.open_interest_all || 0),
        change_in_open_interest_all: parseInt(data.change_in_open_interest_all || 0)
      };

      // Consolidate ICE exchanges
      const marketCode = processedData.market_code;
      if (marketCode === 'ICEU' || marketCode === 'ICUS' || marketCode === 'IFED') {
        processedData.market_code = 'ICE';
      }

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
        market_code: processedData.market_code,
        report_date: reportDate,
        // Open Interest fields
        open_interest_all: processedData.open_interest_all,
        change_in_open_interest_all: processedData.change_in_open_interest_all,
        // Commercial fields
        commercial_long: processedData.comm_positions_long_all,
        commercial_long_change: processedData.change_in_comm_long_all || 0,
        commercial_short: processedData.comm_positions_short_all,
        commercial_short_change: processedData.change_in_comm_short_all || 0,
        commercial_total: commercialTotalPositions,
        commercial_percentage_long: commercialPercentageLong,
        commercial_percentage_short: commercialPercentageShort,
        // Non-commercial fields
        non_commercial_long: processedData.noncomm_positions_long_all,
        non_commercial_long_change: processedData.change_in_noncomm_long_all || 0,
        non_commercial_short: processedData.noncomm_positions_short_all,
        non_commercial_short_change: processedData.change_in_noncomm_short_all || 0,
        non_commercial_total: nonCommercialTotalPositions,
        non_commercial_percentage_long: nonCommercialPercentageLong,
        non_commercial_percentage_short: nonCommercialPercentageShort,
        // Non-reportable fields
        non_reportable_long: processedData.nonrept_positions_long_all,
        non_reportable_long_change: processedData.change_in_nonrept_long_all || 0,
        non_reportable_short: processedData.nonrept_positions_short_all,
        non_reportable_short_change: processedData.change_in_nonrept_short_all || 0,
        non_reportable_total: nonReptTotalPositions,
        non_reportable_percentage_long: nonReptPercentageLong,
        non_reportable_percentage_short: nonReptPercentageShort,
        // Percentage of Open Interest fields
        pct_of_oi_noncomm_long_all: parseFloat(processedData.pct_of_oi_noncomm_long_all || 0),
        pct_of_oi_noncomm_short_all: parseFloat(processedData.pct_of_oi_noncomm_short_all || 0),
        pct_of_oi_comm_long_all: parseFloat(processedData.pct_of_oi_comm_long_all || 0),
        pct_of_oi_comm_short_all: parseFloat(processedData.pct_of_oi_comm_short_all || 0),
        pct_of_oi_nonrept_long_all: parseFloat(processedData.pct_of_oi_nonrept_long_all || 0),
        pct_of_oi_nonrept_short_all: parseFloat(processedData.pct_of_oi_nonrept_short_all || 0),
        // Total fields
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
  
  // Theme state & toggle
  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode(prev => (prev === 'light' ? 'dark' : 'light'));
    },
  }), []);
  
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [mobileView, setMobileView] = useState('table');
  const [authorized, setAuthorization] = useState(() => {
    return !!localStorage.getItem('userEmail');
  });
  const [error, setError] = useState(null);
  const [exchanges, setExchanges] = useState([]);
  const [userExchanges, setUserExchanges] = useState({});
  const [displayExchanges, setDisplayExchanges] = useState([]);
  const [futuresData, setFuturesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
  // Add logging to track filteredData changes
  const setFilteredDataWithLogging = (newData) => {
    setFilteredData(newData);
  };
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLatestData, setIsLatestData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [commercialChartData, setCommercialChartData] = useState([]);
  const [nonCommercialChartData, setNonCommercialChartData] = useState([]);
  const [nonReportableChartData, setNonReportableChartData] = useState([]);
  const [chartDates, setChartDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [favorites, setFavorites] = useState([]);  // Start with empty array, will load from backend
  const [tableFilters, setTableFilters] = useState([]);
  const [isDateLoading, setIsDateLoading] = React.useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isChartLoading, setIsChartLoading] = useState(false);  // New state for chart loading
  const [commercialExtremes, setCommercialExtremes] = useState({});
  const [isLoadingExtremes, setIsLoadingExtremes] = useState(false);

  useEffect(() => {
    document.documentElement.style.backgroundColor = theme.palette.background.default;
  }, [theme.palette.background.default]);
  
  // Add effect to handle authorization changes
  useEffect(() => {
    const checkAuth = () => {
      const email = localStorage.getItem('userEmail');
      setAuthorization(!!email);
    };

    // Check initially
    checkAuth();

    // Add event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'userEmail') {
        checkAuth();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Load available dates and initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!authorized) return;
      
      try {
        setIsLoading(true);
        // First get available dates
        const dates = await getAvailableReportDates();
        setAvailableDates(dates);
        
        if (dates && dates.length > 0) {
          // Get the latest date
          const latestDate = dates[0];
          
          // Load data for the latest date
          const result = await fetchData(latestDate);
          
          // Load table filters
          const email = localStorage.getItem('userEmail');
          let filteredExchanges = result.exchanges.map(code => code.trim());
          
          if (email) {
            try {
              const response = await axios.get(`${API_BASE_URL}/preferences/table_filters?email=${email}`);
              if (response.data.success && response.data.table_filters && response.data.table_filters.selected) {
                filteredExchanges = response.data.table_filters.selected.map(code => code.trim());
              }
            } catch (error) {
              console.error('Error loading table filters:', error);
            }
          }

          // Set the complete data first
          setFuturesData(result.data);
          setExchanges(result.exchanges);
          setDisplayExchanges(filteredExchanges);
          setUserExchanges(filteredExchanges);
          setLastUpdated(result.reportDate);
          setIsLatestData(result.isLatestData);
          setLastChecked(result.lastChecked);
          setSelectedDate(latestDate);

          // Then filter from the complete dataset
          const newFilteredData = result.data.filter(item => {
            const marketCode = item.market_code;
            // Special handling for ICE exchanges
            if (filteredExchanges.includes('ICE')) {
              if (marketCode === 'ICEU' || marketCode === 'ICUS' || marketCode === 'IFED' || marketCode === 'ICE') {
                return true;
              }
            }
            return filteredExchanges.includes(marketCode);
          });

          // Set filtered data after
          setFilteredData(newFilteredData);
          
          // Load favorites
          await loadFavorites();

          setIsLoadingExtremes(true);
          try {
            const extremes = await getCommercialExtremes(result.data);
            setCommercialExtremes(extremes);
          } catch (error) {
            console.error('❌ Error loading commercial extremes:', error);
          } finally {
            setIsLoadingExtremes(false);
          }
        }
      } catch (error) {
        console.error('❌ Error loading initial data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [authorized]);

  // Force refresh function
  const forceRefresh = async () => {    
    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('commercialExtremes_')) {
        localStorage.removeItem(key);
      }
    });

    // Clear state
    setCommercialExtremes({});
    setFuturesData([]);
    setFilteredData([]);
    
    // Reload data
    if (!authorized) return;
      
    try {
      setIsLoading(true);
      // First get available dates
      const dates = await getAvailableReportDates();
      setAvailableDates(dates);
      
      if (dates && dates.length > 0) {
        // Get the latest date
        const latestDate = dates[0];
        
        // Load data for the latest date
        const result = await fetchData(latestDate);
        
        // Load table filters
        const email = localStorage.getItem('userEmail');
        let filteredExchanges = result.exchanges.map(code => code.trim());
        
        if (email) {
          try {
            const response = await axios.get(`${API_BASE_URL}/preferences/table_filters?email=${email}`);
            if (response.data.success && response.data.table_filters && response.data.table_filters.selected) {
              filteredExchanges = response.data.table_filters.selected.map(code => code.trim());
            }
          } catch (error) {
            console.error('Error loading table filters:', error);
          }
        }

        // Set the complete data first
        setFuturesData(result.data);
        setExchanges(result.exchanges);
        setDisplayExchanges(filteredExchanges);
        setUserExchanges(filteredExchanges);
        setLastUpdated(result.reportDate);
        setIsLatestData(result.isLatestData);
        setLastChecked(result.lastChecked);
        setSelectedDate(latestDate);

        // Then filter from the complete dataset
        const newFilteredData = result.data.filter(item => {
          const marketCode = item.market_code;
          // Special handling for ICE exchanges
          if (filteredExchanges.includes('ICE')) {
            if (marketCode === 'ICEU' || marketCode === 'ICUS' || marketCode === 'IFED' || marketCode === 'ICE') {
              return true;
            }
          }
          return filteredExchanges.includes(marketCode);
        });

        // Set filtered data after
        setFilteredData(newFilteredData);
        
        // Load favorites
        await loadFavorites();

        // Load commercial extremes
        setIsLoadingExtremes(true);
        try {
          const extremes = await getCommercialExtremes(result.data);
          setCommercialExtremes(extremes);
        } catch (error) {
          console.error('❌ Error loading commercial extremes:', error);
        } finally {
          setIsLoadingExtremes(false);
        }
      }
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this effect to force refresh when component mounts
  useEffect(() => {
    forceRefresh();
  }, []); // Empty dependency array means this runs once on mount

  // Handle subsequent date changes
  useEffect(() => {
    const handleDateUpdate = async () => {
      if (!selectedDate || !authorized) return;
      
      try {
        setIsLoading(true);
        setIsDateLoading(true);
        const result = await fetchData(selectedDate);
        
        // Load table filters
        const email = localStorage.getItem('userEmail');
        let filteredExchanges = displayExchanges.length > 0 ? displayExchanges : result.exchanges;
        
        if (email && displayExchanges.length === 0) {
          try {
            const response = await axios.get(`${API_BASE_URL}/preferences/table_filters?email=${email}`);
            if (response.data.success && response.data.table_filters && response.data.table_filters.selected) {
              filteredExchanges = response.data.table_filters.selected.map(code => code.trim());
            }
          } catch (error) {
            console.error('Error loading table filters:', error);
          }
        }

        // Set complete data first
        setFuturesData(result.data);
        setExchanges(result.exchanges);
        setDisplayExchanges(filteredExchanges);
        setLastUpdated(result.reportDate);
        setIsLatestData(result.isLatestData);
        setLastChecked(result.lastChecked);

        // Then filter from complete dataset
        const newFilteredData = result.data.filter(item => {
          const marketCode = item.market_code;
          // Special handling for ICE exchanges
          if (filteredExchanges.includes('ICE')) {
            if (marketCode === 'ICEU' || marketCode === 'ICUS' || marketCode === 'IFED' || marketCode === 'ICE') {
              return true;
            }
          }
          return filteredExchanges.includes(marketCode);
        });

        // Set filtered data after
        setFilteredData(newFilteredData);
      } catch (error) {
        console.error('Error updating data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
        setIsDateLoading(false);
      }
    };

    handleDateUpdate();
  }, [selectedDate, authorized]);

  // Load favorites from backend
  const loadFavorites = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/preferences/favorites?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to load favorites');
      }
      
      const data = await response.json();
      
      if (data.success && data.favorites && data.favorites.selected) {
        setFavorites(data.favorites.selected);
        // Update localStorage to match backend
        localStorage.setItem('initialFavorites', JSON.stringify(data.favorites.selected));
      } else {
        console.log('No favorites found in backend response');
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      // On error, try to load from localStorage as fallback
      const initialFavorites = localStorage.getItem('initialFavorites');
      if (initialFavorites) {
        setFavorites(JSON.parse(initialFavorites));
      }
    }
  };

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
      

      // Update state and localStorage immediately for responsive UI
      setFavorites(newFavorites);
      localStorage.setItem('initialFavorites', JSON.stringify(newFavorites));

      const requestBody = {
        email: email,
        favorites: {
          selected: newFavorites
        }
      };

      const response = await fetch(`${API_BASE_URL}/preferences/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      // Reload favorites from backend to ensure consistency
      await loadFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // On error, revert to previous state
      const savedFavorites = localStorage.getItem('initialFavorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    }
  };

  const getChartData = async (marketCode) => {
    setIsChartLoading(true);  // Set loading to true when starting
    try {
      const response = await axios.get(
        `https://publicreporting.cftc.gov/resource/6dca-aqww.json?cftc_contract_market_code=${marketCode}&$order=report_date_as_yyyy_mm_dd DESC&$limit=1000`
      );
      
      // Format dates and ensure numeric values
      const formattedData = response.data.map((item, index) => {
        
        return {
          ...item,
          report_date_as_yyyy_mm_dd: new Date(item.report_date_as_yyyy_mm_dd).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          comm_positions_long_all: parseInt(item.comm_positions_long_all || 0),
          comm_positions_short_all: parseInt(item.comm_positions_short_all || 0),
          noncomm_positions_long_all: parseInt(item.noncomm_positions_long_all || 0),
          noncomm_positions_short_all: parseInt(item.noncomm_positions_short_all || 0),
          nonrept_positions_long_all: parseInt(item.nonrept_positions_long_all || 0),
          nonrept_positions_short_all: parseInt(item.nonrept_positions_short_all || 0)
        };
      });

      // Calculate net positions and ensure they are numbers
      const commercialNet = formattedData.map((item, index) => {
        const net = item.comm_positions_long_all - item.comm_positions_short_all;
        return net;
      });
      
      const nonCommercialNet = formattedData.map((item, index) => {
        const net = item.noncomm_positions_long_all - item.noncomm_positions_short_all;
        return net;
      });
      
      const nonReportableNet = formattedData.map((item, index) => {
        const net = item.nonrept_positions_long_all - item.nonrept_positions_short_all;
        return net;
      });

      // Update chart data states
      setChartDates(formattedData.map(item => item.report_date_as_yyyy_mm_dd));
      setCommercialChartData(commercialNet);
      setNonCommercialChartData(nonCommercialNet);
      setNonReportableChartData(nonReportableNet);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Reset chart data on error
      setChartDates([]);
      setCommercialChartData([]);
      setNonCommercialChartData([]);
      setNonReportableChartData([]);
    } finally {
      setIsChartLoading(false);  // Set loading to false when done
    }
  };

  // Exchange filter handler
  const handleExchangeFilterChange = async (newList, shouldSaveToServer = true) => {
    setDisplayExchanges(newList);

    // Always filter from the complete data set
    const newFilteredData = futuresData.filter(item => {
      const marketCode = item.market_code;
      // Special handling for ICE exchanges
      if (newList.includes('ICE')) {
        if (marketCode === 'ICEU' || marketCode === 'ICUS' || marketCode === 'IFED' || marketCode === 'ICE') {
          return true;
        }
      }
      return newList.includes(marketCode);
    });
    setFilteredData(newFilteredData);

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

  const handleDateChange = async (newDate) => {
    setSelectedDate(newDate);
  };

  const handleMobileViewChange = (event, newView) => {
    if (newView !== null) {
      setMobileView(newView);
    }
  };

  const renderCollapsibleTable = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', height: '100%' }}>
        <DrawerAppBar
          futuresData={futuresData}
          userExchanges={userExchanges}
          setFilteredData={setFilteredDataWithLogging}
          exchanges={exchanges}
          setDisplayExchanges={setDisplayExchanges}
          displayExchanges={displayExchanges}
          onExchangeFilterChange={handleExchangeFilterChange}
          lastUpdated={lastUpdated}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          isDateLoading={isDateLoading}
          availableDates={availableDates}
          isLatestData={isLatestData}
          lastChecked={lastChecked}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
          favorites={favorites}
        />
        {isLoading ? (
          <CollapsableTableSkeleton />
        ) : (
          <>
            {isMobile && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mt: 1,
                position: 'sticky',
                top: '64px',
                zIndex: 1,
                backgroundColor: theme.palette.background.default,
                py: 1
              }}>
                <ToggleButtonGroup
                  value={mobileView}
                  exclusive
                  onChange={handleMobileViewChange}
                  aria-label="mobile view"
                  size="small"
                >
                  <ToggleButton value="table" aria-label="table view">
                    <TableChartIcon sx={{ mr: 1 }} />
                    Table
                  </ToggleButton>
                  <ToggleButton value="chart" aria-label="chart view">
                    <ShowChartIcon sx={{ mr: 1 }} />
                    Chart
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}
            
            {(!isMobile || mobileView === 'table') && (
              <CollapsibleTable
                futuresData={futuresData}
                filteredFuturesData={filteredData}
                userExchanges={userExchanges}
                exchanges={exchanges}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onCommoditySelect={handleCommoditySelect}
                displayExchanges={displayExchanges}
                selectedTab={selectedTab}
                onTabChange={setSelectedTab}
                commercialExtremes={commercialExtremes}
                isLoadingExtremes={isLoadingExtremes}
              />
            )}
            
            {(!isMobile || mobileView === 'chart') && (
              <Box sx={{ 
                position: 'relative', 
                minHeight: isMobile ? 'calc(100vh - 180px)' : '400px',
                mt: isMobile ? 1 : 2
              }}>
                {isChartLoading && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      zIndex: 1,
                      borderRadius: 1
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}
                <LineChartWithReferenceLines 
                  commercialChartData={commercialChartData} 
                  nonCommercialChartData={nonCommercialChartData} 
                  nonReportableChartData={nonReportableChartData} 
                  chartDates={chartDates}
                  selectedCommodity={selectedCommodity}
                />
              </Box>
            )}
          </>
        )}
      </Box>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUpPage setAuthorization={setAuthorization} />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/subscription" element={<SubscriptionPage setAuthorization={setAuthorization} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/sign-in" element={<SigninPage setAuthorization={setAuthorization} />} />
        <Route path="/dashboard" element={
          <>
            {!authorized ? (
              <Navigate to="/sign-in" replace />
            ) : (
              <SubscriptionGuard>
                <ColorModeContext.Provider value={colorMode}>
                  <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                      <DrawerAppBar
                        futuresData={futuresData}
                        setFilteredData={setFilteredDataWithLogging}
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
                        selectedTab={selectedTab}
                        onTabChange={setSelectedTab}
                        favorites={favorites}
                      />
                      <Box
                        component="main"
                        sx={{
                          flexGrow: 1,
                          pt: { xs: '56px', sm: '64px' },
                          px: 2,
                          width: '100%',
                          overflow: 'hidden'
                        }}
                      >
                        {renderCollapsibleTable()}
                      </Box>
                    </Box>
                  </ThemeProvider>
                </ColorModeContext.Provider>
              </SubscriptionGuard>
            )}
          </>
        } />
        <Route path="/" element={
          authorized ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <ColorModeContext.Provider value={colorMode}>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <LandingPage />
              </ThemeProvider>
            </ColorModeContext.Provider>
          )
        } />
        {/* Add catch-all route */}
        <Route path="*" element={
          authorized ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/" replace />
          )
        } />
      </Routes>
    </Router>
  );
}