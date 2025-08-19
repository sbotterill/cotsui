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
import { EXCHANGE_CODE_MAP, REMOVED_EXCHANGE_CODES } from './constants';
import SigninPage from './components/SigninPage';
import Profile from './components/Profile';
import Loading from './components/Loading';
import { useMediaQuery } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TableChartIcon from '@mui/icons-material/TableChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { getCommercialExtremes, getRetailExtremes } from './services/cftcService';

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

// Group definitions for categorizing commodities
const GROUP_DEFINITIONS = [
  { name: 'Currencies', keywords: ['DOLLAR', 'EURO', 'YEN', 'FRANC', 'POUND', 'PESO', 'REAL', 'RAND', 'KRONA', 'KRONE', 'LIRA', 'RUBLE', 'RUBEL', 'DOLLAR INDEX', 'USD INDEX', 'CURRENCY', 'SWISS', 'BRITISH', 'AUSTRALIAN', 'CANADIAN', 'NEW ZEALAND'] },
  { name: 'Energies', keywords: ['CRUDE', 'WTI', 'BRENT', 'GASOLINE', 'HEATING OIL', 'NATURAL GAS', 'PROPANE', 'ETHANOL'] },
  { name: 'Grains', keywords: ['CORN', 'SOYBEAN', 'SOYBEANS', 'SOYBEAN OIL', 'SOYBEAN MEAL', 'WHEAT', 'OATS', 'ROUGH RICE', 'RICE', 'CANOLA'] },
  { name: 'Meats', keywords: ['LIVE CATTLE', 'FEEDER CATTLE', 'LEAN HOG', 'LEAN HOGS', 'CATTLE', 'HOGS'] },
  { name: 'Metals', keywords: ['GOLD', 'SILVER', 'COPPER', 'PLATINUM', 'PALLADIUM', 'ALUMINUM', 'NICKEL', 'ZINC'] },
  { name: 'Softs', keywords: ['COFFEE', 'COCOA', 'SUGAR', 'COTTON', 'ORANGE JUICE', 'OJ', 'RUBBER', 'LUMBER'] },
  { name: 'Stock Indices', keywords: ['S&P', 'SP 500', 'E-MINI S&P', 'NASDAQ', 'DOW', 'RUSSELL', 'NIKKEI', 'FTSE', 'DAX'] },
  { name: 'Interest Rates', keywords: ['TREASURY', 'BOND', 'NOTE', 'SOFR', 'EURODOLLAR', 'FED FUNDS', 'BOBL', 'BUND', 'SCHATZ', 'GILT', 'EURIBOR'] },
  { name: 'Dairy', keywords: ['MILK', 'BUTTER', 'CHEESE'] },
];

const getGroupForRow = (row) => {
  const name = (row?.commodity || '').toUpperCase();
  // Overrides first
  if (OVERRIDE_GROUPS_EXACT[name]) return OVERRIDE_GROUPS_EXACT[name];
  for (const { pattern, group } of OVERRIDE_GROUPS_CONTAINS) {
    if (name.includes(pattern)) return group;
  }
  for (const group of GROUP_DEFINITIONS) {
    for (const kw of group.keywords) {
      if (name.includes(kw)) return group.name;
    }
  }
  return 'Other';
};

const getGroupsFromData = (data) => {
  const present = new Set();
  (data || []).forEach(row => present.add(getGroupForRow(row)));
  const ordered = GROUP_DEFINITIONS.map(g => g.name).filter(n => present.has(n));
  if (present.has('Other')) ordered.push('Other');
  return ordered;
};

// Removal and overrides based on user list
const REMOVED_COMMODITY_EXACT = new Set([
  'ARGUS CIF ARA LG FINL PROPANE',
  'ARGUS PROPANE FAR EAST INDEX',
  'CRUDE DIFF-WCS HOUSTON/WTI 1ST',
  'ETHANOL T2 FOB INCL DUTY',
  'MISO INDIANA OFF-PEAK',
  'MARINE .5% FOB USGC/BRENT 1ST',
  'WTI MIDLAND ARGUS VS WTI TRADE',
  'MISO INDIANA OFF-PEAK',
  'ALUMINIUM EURO PREM DUTY-PAID',
  'NIKKEI STOCK AVERAGE YEN DENOM',
  'NORTH EURO HOT-ROLL COIL STEEL',
  'PROPANE OPIS CONWAY INWELL FP',
  'PROPANE OPIS MT BELV NONTET FP',
  'USGC HSFO-PLATTS/BRENT 1ST LN',
  'E-MINI S&P COMMUNICATION INDEX',
  'S&P 500 CONSOLIDATED',
  'CIG ROCKIES FINANCIAL INDEX',
  'CONDENSATE DIF-TMX C5 1A INDEX',
  'FUEL OIL-3% USGC/3.5% FOB RDAM',
  'GULF COAST CBOB GAS A2 PL RBOB',
  'HOUSTON SHIP CHANNEL (INDEX)',
  'MISO INDIANA OFF-PEAK',
  '10 YEAR ERIS SOFR SWAP',
  '2 YEAR ERIS SOFR SWAP',
  '5 YEAR ERIS SOFR SWAP',
  'DJIA CONSOLIDATED',
  'DJIA X $5',
  'DOW JONES U.S. REAL ESTATE IDX',
  'MICRO 10 YEAR YIELD',
  'MICRO E-MINI DJIA (X$0.5)',
  'ALUMINIUM EURO PREM DUTY-PAI',
  'ERCOT N 345KV REAL T PK DALY M',
  'EURO FX/BRITISH POUND XRATE',
  'EURO SHORT TERM RATE',
  'MISO IN. REAL-TIME OFF-PEAK',
  'NIKKEI STOCK AVERAGE YEN DEN',
  'NORTH EURO HOT-ROLL COIL STE',
  'PJM WEST HUB REAL TIME PK MI',
  'SO AFRICAN RAND',
  'MT BELV NAT GASOLINE OPIS',
  'PROPANE ARGUS CIF ARA MINI',
  'PROPANE ARGUS FAR EAST MINI',
  'PROPANE ARGUS SAUDI CP FP',
  'PROPANE ARGUS SAUDI CP MINI',
  'PROPANE NON-LDH MT BEL',
  'PROPANE OPIS CONWAY INWELL',
  'PROPANE OPIS MT BELV NONTET',
  'PROPANE OPIS MT BELVIEU TET FP',
  'USD MALAYSIAN CRUDE PALM OIL C',
  'ARGUS FAR EAST PROPANE',
  'CONWAY PROPANE (OPIS)',
  'CRUDE DIFF-TMX SW 1A INDEX',
  'CRUDE DIFF-TMX WCS 1A INDEX',
  'CRUDE DIFF-WCS HOUSTON/WTI',
  'GASOLINE CRK-RBOB/BRENT 1ST',
  'E-MINI S&P 400 STOCK INDEX',
  'E-MINI S&P COMMUNICATION IND',
  'E-MINI S&P CONSU STAPLES INDEX',
  'E-MINI S&P ENERGY INDEX',
  'UP DOWN GC ULSD VS HO SPR',
  'S&P 500 QUARTERLY DIVIDEND IND',
  'S&P 500 ANNUAL DIVIDEND INDEX',
  'RUSSELL 2000 ANNUAL DIVIDEND',
  'NASDAQ-100 CONSOLIDATED',
  'EMINI RUSSELL 1000 VALUE INDEX',
  'E-MINI S&P UTILITIES INDEX',
  'E-MINI S&P TECHNOLOGY INDEX',
  'E-MINI S&P INDUSTRIAL INDEX',
  'E-MINI S&P HEALTH CARE INDEX',
  'E-MINI S&P FINANCIAL INDEX',
  'E-MINI S&P ENERGY INDEX',
  'E-MINI S&P CONSU STAPLES INDEX',
  'E-MINI S&P COMMUNICATION IND',
  'AEP DAYTON HUB DA PEAK DAILY',
  'ALGONQUIN CITYGATES BASIS',
  'ALGONQUIN CITYGATES INDEX',
  'BBG COMMODITY',
  'BUTANE OPIS MT BELV NONTET FP',
  'CG MAINLINE BASIS',
  'CG-MAINLINE FINANCIAL INDEX',
  'CHICAGO CITYGATE (INDEX)',
  'CHICAGO FIN BASIS',
  'CIG ROCKIES BASIS',
  'COBALT',
  'CONDENSATE DIF-TMX C5 1A IND',
  'CT RECS CLASS 1',
  'D4 BIODIESEL RINS OPIS CURR YR',
  'D6 RINS OPIS CURRENT YEAR',
  'DOMINION - SOUTH POINT',
  'DOMINION - SOUTH POINT (BASIS)',
  'EP SAN JUAN BASIS',
  'ETHANE, MT. BELV-ENTERPRISE',
  'ETHER CASH SETTLED',
  'FUEL OIL-3% USGC/3.5% FOB RDA',
  'GULF JET NY HEAT OIL SPR',
  'GULF COAST CBOB GAS A2 PL RB',
  'GULF # 6 FUEL OIL CRACK',
  'HENRY HUB BASIS',
  'HENRY HUB INDEX',
  'HENRY HUB LAST DAY FIN',
  'HENRY HUB PENULTIMATE FIN',
  'HENRY HUB PENULTIMATE NAT G',
  'HSC FIN BASIS',
  'ISO NE MASS HUB DA OFF-PK FIXD',
  'ISO NE MASS HUB DA PEAK',
  'LITHIUM HYDROXIDE',
  'MALIN (BASIS)',
  'MARYLAND COMPLIANCE REC TIER1',
  'MASS COMPLIANCE RECS CLASS 1',
  'MICHCON BASIS',
  'MICHCON FINANCIAL INDEX',
  'MID-C DAY-AHEAD OFF-PEAK',
  'MID-C DAY-AHEAD PEAK',
  'MISO ARKANSAS DA PEAK FIXED',
  'MISO IN. DAY-AHEAD PEAK',
  'MISO INDIANA OFF-PEAK',
  'MISO INDIANA HUB RT PEAK',
  'MSCI EAFE',
  'MSCI EM INDEX',
  'MT BELV NORM BUTANE OPIS',
  'MT BELVIEU ETHANE OPIS',
  'NAT GAS ICE PEN',
  'NAT GAS LD1 FOR GDD -TEXOK',
  'NAT GASLNE OPIS MT B NONTET FP',
  'NEPOOL DUAL RECS CLASS 1',
  'NGPL MIDCONT BASIS',
  'NGPL TXOK BASIS',
  'NJ SRECS',
  'NNG VENTURA BASIS',
  'NWP ROCKIES FIN BASIS',
  'NY HARBOR ULSD',
  'NYISO ZONE A DA OFF-PK FIX PR',
  'NYISO ZONE A DA PEAK',
  'NYISO ZONE G DA OFF-PK',
  'NYISO ZONE G DA PEAK',
  'NYISO ZONE J DA OFF-PK FIXED',
  'NYISO ZONE J DA PEAK',
  'ONEOK GAS TRANSPORTATION BASIS',
  'PA COMPLIANCE AECS TIER1',
  'PA SOLAR ALTER ENERGY CREDIT',
  'PALO VERDE DA OFF-PK FIXED PR',
  'PALO VERDE DA PEAK',
  'PANHANDLE BASIS',
  'PG&E CITYGATE FIN BASIS',
  'PGP PROPYLENE (PCW) CAL',
  'PJM AEP DAYTON DA PEAK',
  'PJM AEP DAYTON HUB DA OFF-PK',
  'PJM AEP DAYTON RT OFF-PK FIXED',
  'PJM AEP DAYTON RT PEAK FIXED',
  'PJM N. IL HUB DA OFF-PK',
  'PJM N. IL HUB DA PEAK',
  'PJM N. IL HUB RT PEAK',
  'PJM NI HUB RT OFF-PK FIXED',
  'PJM PSEG DAY-AHEAD PEAK',
  'PJM TRI-RECS CLASS 1',
  'PJM WESTERN HUB DA OFF-PK',
  'PJM WESTERN HUB DA PEAK',
  'PJM WESTERN HUB RT OFF',
  'PJM WESTERN HUB RT PEAK MINI',
  'REX ZONE 3 BASIS',
  'REX ZONE 3 INDEX',
  'RGGI V2025',
  'SOCAL (INDEX)',
  'SOCAL BORDER FIN BASIS',
  'SOCAL CITYGATE FINANCIAL BASIS',
  'SONAT - TIER 1 POOL (ZONE 0)',
  'SP15 FIN DA PEAK FIXED',
  'STEEL-HRC',
  'TCO BASIS',
  'TETCO M2 BASIS (RECEIPTS)',
  'TETCO M2 INDEX (RECEIPTS)',
  'TETCO M3 BASIS',
  'TETCO M3 INDEX',
  'TETCO WLA BASIS',
  'TGT ZONE 1 BASIS',
  'TRANSCO LEIDY BASIS',
  'TRANSCO STATION 85-ZONE 4 BASI',
  'TRANSCO STN 85 MONTHLY INDEX',
  'TRANSCO ZONE 6 BASIS',
  'TRANSCO ZONE 6 MONTHLY INDEX',
  'TRANSCO ZONE 5 SOUTH BASIS',
  'USGC HSFO (PLATTS)',
  'WAHA FIN BASIS',
  'WAHA INDEX',
  'WASHINGTON CARBON ALL V2025',
]);

const REMOVED_COMMODITY_CONTAINS = ['CAISO', 'CALIF', 'ERCOT', 'PJM'];

const OVERRIDE_GROUPS_EXACT = {
  'BITCOIN': 'Currencies',
  'MICRO BITCOIN': 'Currencies',
  'MICRO ETHER': 'Currencies',
  'XRP': 'Currencies',
  'SOL': 'Currencies',
  'ULTRA UST 10Y': 'Interest Rates',
};

const OVERRIDE_GROUPS_CONTAINS = [
  { pattern: 'AECO', group: 'Energies' },
  { pattern: 'HENRY HUB', group: 'Energies' },
  { pattern: 'NAT GAS ICE LD1', group: 'Energies' },
  { pattern: 'NAT GAS NYME', group: 'Energies' },
];

const normalizeTitle = (s) => (s || '')
  .toUpperCase()
  .replace(/[–—]/g, '-') // normalize en/em dashes to hyphen
  .replace(/\s+/g, ' ')  // collapse whitespace
  .trim();

const shouldRemoveRow = (row) => {
  const raw = row?.commodity || '';
  const name = raw.toUpperCase();
  const normalized = normalizeTitle(raw);
  if (REMOVED_COMMODITY_EXACT.has(name) || REMOVED_COMMODITY_EXACT.has(normalized)) return true;
  return REMOVED_COMMODITY_CONTAINS.some(p => name.includes(p) || normalized.includes(p));
};

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

      // Skip any rows belonging to removed exchanges or explicit removals
      if (!REMOVED_EXCHANGE_CODES.includes(obj.market_code) && !shouldRemoveRow(obj)) {
        dataMap.push(obj);
        exchangeSet.add(obj.market_code);
      }
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
  const [retailExtremes, setRetailExtremes] = useState({});
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
          
          // Build groups and load table filters (now interpreted as groups)
          const groupsList = getGroupsFromData(result.data);
          const email = localStorage.getItem('userEmail');
          let filteredGroups = [...groupsList];
          if (email) {
            try {
              const response = await axios.get(`${API_BASE_URL}/preferences/table_filters?email=${email}`);
              if (response.data.success && response.data.table_filters && response.data.table_filters.selected) {
                const selectedGroups = response.data.table_filters.selected.map(s => (s || '').trim());
                // Keep only groups that exist in current dataset; preserve order by groupsList
                filteredGroups = groupsList.filter(g => selectedGroups.includes(g));
                if (filteredGroups.length === 0) filteredGroups = [...groupsList];
              }
            } catch (error) {
              console.error('Error loading table filters:', error);
            }
          }

          // Set the complete data first
          setFuturesData(result.data);
          setExchanges(groupsList);
          setDisplayExchanges(filteredGroups);
          setUserExchanges(filteredGroups);
          setLastUpdated(result.reportDate);
          setIsLatestData(result.isLatestData);
          setLastChecked(result.lastChecked);
          setSelectedDate(latestDate);

          // Then filter from the complete dataset
          const newFilteredData = result.data.filter(item => filteredGroups.includes(getGroupForRow(item)));

          // Set filtered data after
          setFilteredData(newFilteredData);
          
          // Load favorites
          await loadFavorites();

          // Load extremes (commercial + retail) in parallel
          setIsLoadingExtremes(true);
          try {
            const [commHist, retailHist] = await Promise.all([
              getCommercialExtremes(result.data),
              getRetailExtremes(result.data)
            ]);
            setCommercialExtremes(commHist);
            setRetailExtremes(retailHist);
          } catch (error) {
            console.error('❌ Error loading extremes:', error);
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
      if (key.startsWith('commercialExtremes_') || key.startsWith('retailExtremes_')) {
        localStorage.removeItem(key);
      }
    });

    // Clear state
    setCommercialExtremes({});
    setRetailExtremes({});
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
        
        // Build groups and load table filters (as groups)
        const groupsList = getGroupsFromData(result.data);
        const email = localStorage.getItem('userEmail');
        let filteredGroups = (displayExchanges.length > 0 ? displayExchanges : groupsList);
        if (email && displayExchanges.length === 0) {
          try {
            const response = await axios.get(`${API_BASE_URL}/preferences/table_filters?email=${email}`);
            if (response.data.success && response.data.table_filters && response.data.table_filters.selected) {
              const selectedGroups = response.data.table_filters.selected.map(s => (s || '').trim());
              filteredGroups = groupsList.filter(g => selectedGroups.includes(g));
              if (filteredGroups.length === 0) filteredGroups = [...groupsList];
            }
          } catch (error) {
            console.error('Error loading table filters:', error);
          }
        }

        // Set the complete data first
        setFuturesData(result.data);
        setExchanges(groupsList);
        setDisplayExchanges(filteredGroups);
        setUserExchanges(filteredGroups);
        setLastUpdated(result.reportDate);
        setIsLatestData(result.isLatestData);
        setLastChecked(result.lastChecked);
        setSelectedDate(latestDate);

        // Then filter from the complete dataset
        const newFilteredData = result.data.filter(item => filteredGroups.includes(getGroupForRow(item)));

        // Set filtered data after
        setFilteredData(newFilteredData);
        
        // Load favorites
        await loadFavorites();

        // Load extremes (commercial + retail) in parallel
        setIsLoadingExtremes(true);
        try {
          const [commHist, retailHist] = await Promise.all([
            getCommercialExtremes(result.data),
            getRetailExtremes(result.data)
          ]);
          setCommercialExtremes(commHist);
          setRetailExtremes(retailHist);
        } catch (error) {
          console.error('❌ Error loading extremes:', error);
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
        
        // Build groups and load table filters (as groups)
        const groupsList = getGroupsFromData(result.data);
        const email = localStorage.getItem('userEmail');
        let filteredGroups = (displayExchanges.length > 0 ? displayExchanges : groupsList);
        if (email && displayExchanges.length === 0) {
          try {
            const response = await axios.get(`${API_BASE_URL}/preferences/table_filters?email=${email}`);
            if (response.data.success && response.data.table_filters && response.data.table_filters.selected) {
              const selectedGroups = response.data.table_filters.selected.map(s => (s || '').trim());
              filteredGroups = groupsList.filter(g => selectedGroups.includes(g));
              if (filteredGroups.length === 0) filteredGroups = [...groupsList];
            }
          } catch (error) {
            console.error('Error loading table filters:', error);
          }
        }

        // Set complete data first
        setFuturesData(result.data);
        setExchanges(groupsList);
        setDisplayExchanges(filteredGroups);
        setLastUpdated(result.reportDate);
        setIsLatestData(result.isLatestData);
        setLastChecked(result.lastChecked);

        // Then filter from complete dataset
        const newFilteredData = result.data.filter(item => filteredGroups.includes(getGroupForRow(item)));

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

    // Now newList is a list of group names
    const newFilteredData = futuresData.filter(item => newList.includes(getGroupForRow(item)));
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

  const [preferredChartSeries, setPreferredChartSeries] = useState(null);

  const handleCommoditySelect = async (marketCode, commodityName, preferredSeries) => {
    setSelectedCommodity(commodityName);
    setPreferredChartSeries(preferredSeries || null);
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
                retailExtremes={retailExtremes}
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
                  preferredSeries={preferredChartSeries}
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