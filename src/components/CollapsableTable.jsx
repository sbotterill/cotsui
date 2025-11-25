// src/components/CollapsableTable.jsx
import * as React from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FavoriteButton from './FavoriteButton';
import Typography from '@mui/material/Typography';
import { ALLOWED_EXCHANGES, isValidExchange, EXCHANGE_CODE_MAP, REMOVED_EXCHANGE_CODES } from '../constants';
import Skeleton from '@mui/material/Skeleton';
import {
  useMediaQuery,
  Tooltip,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import { getCommercialTrackerData, getRetailTrackerData } from '../services/cftcService';
import CircularProgress from '@mui/material/CircularProgress';

function formatPercentage(value) {
  if (value == null) return '-';
  // Convert to number and check if it's already a percentage
  const numValue = Number(value);
  if (isNaN(numValue)) return '-';
  // If value is already in percentage form (> 1), don't multiply by 100
  const finalValue = numValue > 1 ? numValue : numValue * 100;
  return `${finalValue.toFixed(1)}%`;
}

// Convert stored ratio values (0-1 or already %) to 0-100 scale for progress bars
function toPercentValue(value) {
  const numValue = Number(value);
  if (!isFinite(numValue)) return 0;
  const normalized = numValue > 1 ? numValue : numValue * 100;
  return Math.max(0, Math.min(100, normalized));
}

function getPercentageColor(value) {
  const pct = Number(value);
  if (isNaN(pct)) return 'inherit';
  if (pct < 0.5) {
    const ratio = pct / 0.5;
    const r = Math.round(128 + (170 - 128) * ratio);
    const g = Math.round(0 + (85 - 0) * ratio);
    const b = Math.round(128 + (255 - 128) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const ratio = (pct - 0.5) / 0.5;
    const r = Math.round(170 + (0 - 170) * ratio);
    const g = Math.round(85 + (128 - 85) * ratio);
    const b = Math.round(255 + (255 - 255) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

// Render a compact z-score badge
function ZBadge({ z, type }) {
  const theme = useTheme();
  if (typeof z !== 'number') return null;
  const isBullish = (type || '').toUpperCase() === 'BULLISH' || z >= 0;
  const color = isBullish ? theme.palette.success.main : theme.palette.error.main;
  const bg = alpha(color, 0.12);
  const display = Math.abs(z).toFixed(2); // remove '-' visually, keep color by sign
  return (
    <Tooltip title={`Z-score: ${z.toFixed(2)}${type ? ` • ${type}` : ''}`}> 
      <Chip
        label={`z ${display}`}
        size="small"
        variant="outlined"
        sx={{
          height: 22,
          fontSize: '0.7rem',
          fontWeight: 700,
          color,
          borderColor: color,
          backgroundColor: bg,
          '& .MuiChip-label': { px: 1 }
        }}
      />
    </Tooltip>
  );
}

function descendingComparator(a, b, orderBy) {
  if (orderBy === 'non_commercial_percentage_long' || 
      orderBy === 'commercial_percentage_long' || 
      orderBy === 'non_reportable_percentage_long' ||
      orderBy === 'pct_of_oi_noncomm_long_all' ||
      orderBy === 'pct_of_oi_noncomm_short_all' ||
      orderBy === 'pct_of_oi_comm_long_all' ||
      orderBy === 'pct_of_oi_comm_short_all' ||
      orderBy === 'pct_of_oi_nonrept_long_all' ||
      orderBy === 'pct_of_oi_nonrept_short_all') {
    // Convert percentage strings to numbers, removing the % sign
    const aValue = parseFloat(a[orderBy]) || 0;
    const bValue = parseFloat(b[orderBy]) || 0;
    if (bValue < aValue) return -1;
    if (bValue > aValue) return 1;
    return 0;
  }
  
  if (typeof a[orderBy] === 'number' || !isNaN(Number(a[orderBy]))) {
    const aValue = Number(a[orderBy]) || 0;
    const bValue = Number(b[orderBy]) || 0;
    if (bValue < aValue) return -1;
    if (bValue > aValue) return 1;
    return 0;
  }
  
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function CollapsibleTable({
  futuresData,
  filteredFuturesData,
  exchanges,
  favorites,
  onToggleFavorite,
  onCommoditySelect,
  displayExchanges = [],
  selectedTab,
  onTabChange,
  commercialExtremes,
  retailExtremes,
  isLoadingExtremes
}) {
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isTabletLandscape = isTablet && isLandscape;
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('commodity');
  const [showDetails, setShowDetails] = React.useState(false);
  const initialLoadDone = React.useRef(false);
  const fmt = new Intl.NumberFormat('en-US');
  const fmtCompact = new Intl.NumberFormat('en-US', { notation: 'compact' });

  // Commercial Tracker threshold - commodities with commercial percentage over this will be tracked
  const COMMERCIAL_THRESHOLD = 0.7; // 70%

  // Group definitions based on commodity name keywords (fallback to Other)
  const GROUP_DEFINITIONS = React.useMemo(() => ([
    { name: 'Currencies', keywords: ['DOLLAR', 'EURO', 'YEN', 'FRANC', 'POUND', 'PESO', 'REAL', 'RAND', 'KRONA', 'KRONE', 'LIRA', 'RUBLE', 'RUBEL', 'DOLLAR INDEX', 'USD INDEX', 'CURRENCY', 'SWISS', 'BRITISH', 'AUSTRALIAN', 'CANADIAN', 'NEW ZEALAND'] },
    { name: 'Energies', keywords: ['CRUDE', 'WTI', 'BRENT', 'GASOLINE', 'HEATING OIL', 'NATURAL GAS', 'PROPANE', 'ETHANOL'] },
    { name: 'Grains', keywords: ['CORN', 'SOYBEAN', 'SOYBEANS', 'SOYBEAN OIL', 'SOYBEAN MEAL', 'WHEAT', 'OATS', 'ROUGH RICE', 'RICE', 'CANOLA'] },
    { name: 'Meats', keywords: ['LIVE CATTLE', 'FEEDER CATTLE', 'LEAN HOG', 'LEAN HOGS', 'CATTLE', 'HOGS'] },
    { name: 'Metals', keywords: ['GOLD', 'SILVER', 'COPPER', 'PLATINUM', 'PALLADIUM', 'ALUMINUM', 'NICKEL', 'ZINC'] },
    { name: 'Softs', keywords: ['COFFEE', 'COCOA', 'SUGAR', 'COTTON', 'ORANGE JUICE', 'OJ', 'RUBBER', 'LUMBER'] },
    { name: 'Stock Indices', keywords: ['S&P', 'SP 500', 'E-MINI S&P', 'NASDAQ', 'DOW', 'RUSSELL', 'NIKKEI', 'FTSE', 'DAX'] },
    { name: 'Interest Rates', keywords: ['TREASURY', 'BOND', 'NOTE', 'SOFR', 'EURODOLLAR', 'FED FUNDS', 'BOBL', 'BUND', 'SCHATZ', 'GILT', 'EURIBOR'] },
    { name: 'Dairy', keywords: ['MILK', 'BUTTER', 'CHEESE'] },
  ]), []);

  // Overrides to force specific instruments into desired groups
  const OVERRIDE_GROUPS_EXACT = React.useMemo(() => ({
    'BITCOIN': 'Currencies',
    'MICRO BITCOIN': 'Currencies',
    'MICRO ETHER': 'Currencies',
    'XRP': 'Currencies',
    'SOL': 'Currencies',
    'ULTRA UST 10Y': 'Interest Rates',
  }), []);

  const OVERRIDE_GROUPS_CONTAINS = React.useMemo(() => ([
    { pattern: 'AECO', group: 'Energies' },
    { pattern: 'HENRY HUB', group: 'Energies' },
    { pattern: 'NAT GAS ICE LD1', group: 'Energies' },
    { pattern: 'NAT GAS NYME', group: 'Energies' },
  ]), []);

  const getGroupForRow = React.useCallback((row) => {
    const name = (row?.commodity || '').toUpperCase();
    if (OVERRIDE_GROUPS_EXACT[name]) return OVERRIDE_GROUPS_EXACT[name];
    for (const { pattern, group } of OVERRIDE_GROUPS_CONTAINS) {
      if (name.includes(pattern)) return group;
    }
    for (const group of GROUP_DEFINITIONS) {
      for (const kw of group.keywords) {
        if (name.includes(kw)) {
          return group.name;
        }
      }
    }
    return 'Other';
  }, [GROUP_DEFINITIONS, OVERRIDE_GROUPS_EXACT, OVERRIDE_GROUPS_CONTAINS]);

  // Normalize exchange code by trimming and ensuring consistent format
  const normalizeCode = (code) => {
    if (!code) return '';
    // Log the code at each step of normalization
    const original = code;
    const trimmed = code.trim();
    const noSpaces = trimmed.replace(/\s+/g, '');
    const upper = noSpaces.toUpperCase();
    
    return upper;
  };

  // Build group list based on available data; include 'Other' last when present
  const filteredGroups = React.useMemo(() => {
    const presentGroupsSet = new Set();
    const rows = filteredFuturesData?.filter(r => !REMOVED_EXCHANGE_CODES.includes((r.market_code || '').trim())) || [];
    rows.forEach(r => {
      presentGroupsSet.add(getGroupForRow(r));
    });

    // Preserve a stable group ordering based on GROUP_DEFINITIONS
    const ordered = GROUP_DEFINITIONS.map(g => g.name).filter(name => presentGroupsSet.has(name));

    // Handle Other at the end
    if (presentGroupsSet.has('Other')) {
      ordered.push('Other');
    }
    return ordered;
  }, [filteredFuturesData, getGroupForRow, GROUP_DEFINITIONS]);

  // Get commercial tracker data
  const commercialTrackerData = React.useMemo(() => {
    
    // Validate input data
    const hasValidData = filteredFuturesData && filteredFuturesData.length > 0;
    const hasValidExtremes = commercialExtremes && Object.keys(commercialExtremes).length > 0;
    
    if (!hasValidData || !hasValidExtremes) {
      return [];
    }

    try { 
      // Use the imported function
      const data = getCommercialTrackerData(filteredFuturesData, commercialExtremes);
  

      return data;
    } catch (error) {
      console.error('❌ Error in commercial tracker:', error);
      return [];
    }
  }, [filteredFuturesData, commercialExtremes]);

  // Get retail tracker data (non-reportable)
  const retailTrackerData = React.useMemo(() => {
    const hasValidData = filteredFuturesData && filteredFuturesData.length > 0;
    const hasValidExtremes = retailExtremes && Object.keys(retailExtremes).length > 0;
    if (!hasValidData || !hasValidExtremes) {
      return [];
    }
    try {
      const data = getRetailTrackerData(filteredFuturesData, retailExtremes);
      return data;
    } catch (error) {
      console.error('❌ Error in retail tracker:', error);
      return [];
    }
  }, [filteredFuturesData, retailExtremes]);

  // Compute tab indices consistently
  const favoritesTabVisible = favorites.length > 0;
  // Always expose tracker tabs; counts may be 0 until data arrives
  const hasCommercialTracker = true;
  const hasRetailTracker = true;
  const favoritesTabIndex = favoritesTabVisible ? 0 : null;
  const commercialTabIndex = hasCommercialTracker ? (favoritesTabVisible ? 1 : 0) : null;
  const retailTabIndex = hasRetailTracker ? ((favoritesTabVisible ? 1 : 0) + (hasCommercialTracker ? 1 : 0)) : null;
  const groupStartIndex = (favoritesTabVisible ? 1 : 0) + (hasCommercialTracker ? 1 : 0) + (hasRetailTracker ? 1 : 0);

  // Initialize selected tab
  React.useEffect(() => {
    if (!initialLoadDone.current && futuresData?.length > 0 && (filteredGroups.length > 0 || favorites.length > 0)) {
      // Check if favorites tab should be shown
      const favoritesInSearch = filteredFuturesData?.filter(d => favorites.includes(d.commodity)) || [];
      const shouldShowFavorites = favoritesInSearch.length > 0;
      const shouldShowCommercialTracker = hasCommercialTracker;
      const shouldShowRetailTracker = hasRetailTracker;
      
      // Determine initial tab
      let initialTab;
      if (shouldShowFavorites) {
        initialTab = favoritesTabIndex; // Favorites tab
      } else if (shouldShowCommercialTracker) {
        initialTab = commercialTabIndex; // Commercial Tracker tab
      } else if (shouldShowRetailTracker) {
        initialTab = retailTabIndex; // Retail Tracker tab
      } else if (filteredGroups.length > 0) {
        initialTab = groupStartIndex; // First group tab
      } else {
        return; // No tabs available
      }
      
      onTabChange(initialTab);
      
      // Select first commodity in the current tab
      let currentData;
      if (favoritesTabVisible && initialTab === favoritesTabIndex) {
        currentData = favoritesInSearch;
      } else if (hasCommercialTracker && initialTab === commercialTabIndex) {
        currentData = commercialTrackerData;
      } else if (hasRetailTracker && initialTab === retailTabIndex) {
        currentData = retailTrackerData;
      } else {
        const currentGroup = filteredGroups[initialTab - groupStartIndex];
        currentData = getFilteredData(currentGroup);
      }
      
      if (currentData.length > 0) {
        // Sort the data the same way as in the table
        const sortedData = [...currentData].sort((a, b) => {
          if (b.commodity < a.commodity) return 1;
          if (b.commodity > a.commodity) return -1;
          return 0;
        });
        
        // Select the first item after sorting
        const firstCommodity = sortedData[0];
        handleRowClick(firstCommodity.commodity);
      }

      initialLoadDone.current = true;
    }
  }, [futuresData, filteredGroups, favorites, commercialTrackerData, retailTrackerData, favoritesTabIndex, commercialTabIndex, retailTabIndex, groupStartIndex, favoritesTabVisible, hasCommercialTracker, hasRetailTracker]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleTabChange = (event, newValue) => {
    onTabChange(newValue);
  };

  const getFilteredData = React.useCallback((groupLabel) => {    
    if (!groupLabel) return [];

    let result;
    if (groupLabel === 'Favorites') {
      result = filteredFuturesData?.filter(d => favorites.includes(d.commodity)) || [];
    } else if (groupLabel === 'Commercial Tracker') {
      result = commercialTrackerData;
    } else if (groupLabel === 'Retail Tracker') {
      result = retailTrackerData;
    } else {
      result = filteredFuturesData?.filter(row => getGroupForRow(row) === groupLabel) || [];
    }
    
    return result;
  }, [filteredFuturesData, favorites, commercialTrackerData, retailTrackerData, getGroupForRow]);

  // Get the current exchange's data
  const currentGroupData = React.useMemo(() => {
    // Check if favorites tab should be shown
    const favoritesInSearch = getFilteredData('Favorites');
    const shouldShowFavorites = favoritesInSearch.length > 0;
    const shouldShowCommercialTracker = hasCommercialTracker;
    const shouldShowRetailTracker = hasRetailTracker;

    let currentGroup;
    if (favoritesTabVisible && selectedTab === favoritesTabIndex) {
      currentGroup = 'Favorites';
    } else if (hasCommercialTracker && selectedTab === commercialTabIndex) {
      currentGroup = 'Commercial Tracker';
    } else if (hasRetailTracker && selectedTab === retailTabIndex) {
      currentGroup = 'Retail Tracker';
    } else {
      const groupIndex = selectedTab - groupStartIndex;
      currentGroup = filteredGroups[groupIndex];
    }
        
    const data = getFilteredData(currentGroup);
    return data;
  }, [futuresData, filteredFuturesData, filteredGroups, selectedTab, favorites, commercialTrackerData, retailTrackerData, favoritesTabIndex, commercialTabIndex, retailTabIndex, groupStartIndex, favoritesTabVisible, hasCommercialTracker, hasRetailTracker, getFilteredData]);

  const currentGroupDataLength = currentGroupData.length;
  const commercialTrackerCount = commercialTrackerData.length;
  const retailTrackerCount = retailTrackerData.length;

  React.useEffect(() => {
    if (!filteredFuturesData) return;

    const tabCandidates = [];

    if (favoritesTabVisible && favoritesTabIndex != null) {
      tabCandidates.push({
        index: favoritesTabIndex,
        length: getFilteredData('Favorites').length,
      });
    }

    if (hasCommercialTracker && commercialTabIndex != null) {
      tabCandidates.push({
        index: commercialTabIndex,
        length: commercialTrackerCount,
      });
    }

    if (hasRetailTracker && retailTabIndex != null) {
      tabCandidates.push({
        index: retailTabIndex,
        length: retailTrackerCount,
      });
    }

    filteredGroups.forEach((groupName, idx) => {
      tabCandidates.push({
        index: groupStartIndex + idx,
        length: getFilteredData(groupName).length,
      });
    });

    const firstTabWithData = tabCandidates.find(tab => tab.length > 0);
    if (!firstTabWithData) {
      return;
    }

    if (currentGroupDataLength === 0 && selectedTab !== firstTabWithData.index) {
      onTabChange(firstTabWithData.index);
    }
  }, [
    filteredFuturesData,
    favoritesTabVisible,
    favoritesTabIndex,
    hasCommercialTracker,
    commercialTabIndex,
    hasRetailTracker,
    retailTabIndex,
    filteredGroups,
    groupStartIndex,
    getFilteredData,
    currentGroupDataLength,
    selectedTab,
    onTabChange,
    commercialTrackerCount,
    retailTrackerCount,
  ]);

  // Determine if Commercial Tracker is selected
  const isCommercialTrackerSelected = React.useMemo(() => {
    if (!hasCommercialTracker || commercialTabIndex == null) return false;
    return selectedTab === commercialTabIndex;
  }, [selectedTab, commercialTabIndex, hasCommercialTracker]);

  const isRetailTrackerSelected = React.useMemo(() => {
    if (!hasRetailTracker || retailTabIndex == null) return false;
    return selectedTab === retailTabIndex;
  }, [selectedTab, retailTabIndex, hasRetailTracker]);

  // Sort the current exchange's data
  const sortedData = React.useMemo(() => {
    const sorted = [...currentGroupData]
      .filter(r => !REMOVED_EXCHANGE_CODES.includes((r.market_code || '').trim()))
      .sort(getComparator(order, orderBy));
    return sorted;
  }, [currentGroupData, order, orderBy]);

  // If user leaves tracker while sorting by zScore, reset to commodity
  React.useEffect(() => {
    if (!(isCommercialTrackerSelected || isRetailTrackerSelected) && orderBy === 'zScore') {
      setOrderBy('commodity');
      setOrder('asc');
    }
  }, [isCommercialTrackerSelected, isRetailTrackerSelected]);

  const handleRowClick = (commodity) => {
    // Find the selected commodity's data
    const selectedData = futuresData.find(r => r.commodity === commodity);
    if (selectedData && onCommoditySelect) {
      // Auto-select chart series based on tab: Retail => Non-Reportables, else Commercials
      const preferredSeries = isRetailTrackerSelected ? 'Non-Reportables' : 'Commercials';
      onCommoditySelect(selectedData.contract_code, selectedData.commodity, preferredSeries);
    }
  };

  // Update tab selection when displayExchanges changes or when search filters out current tab
  React.useEffect(() => {
    // Check if favorites tab should be shown
    const favoritesInSearch = filteredFuturesData?.filter(d => favorites.includes(d.commodity)) || [];
    const shouldShowFavorites = favoritesInSearch.length > 0;
    const shouldShowCommercialTracker = hasCommercialTracker;
    const shouldShowRetailTracker = hasRetailTracker;
    
    // Check if current tab is still valid
    let isCurrentTabValid = false;
    
    if (favoritesTabVisible && selectedTab === (favoritesTabIndex ?? 0)) {
      // Always consider favorites tab valid if there are any favorites, even if they don't match the search
      isCurrentTabValid = favorites.length > 0;
    } else if (hasCommercialTracker && selectedTab === commercialTabIndex) {
      isCurrentTabValid = shouldShowCommercialTracker;
    } else if (hasRetailTracker && selectedTab === retailTabIndex) {
      isCurrentTabValid = shouldShowRetailTracker;
    } else {
      const groupIndex = selectedTab - groupStartIndex;
      isCurrentTabValid = groupIndex >= 0 && groupIndex < filteredGroups.length;
    }
    
    // If current tab is not valid, switch to first available tab
    if (!isCurrentTabValid) {
      if (favorites.length > 0) {
        onTabChange(favoritesTabIndex ?? 0);
      } else if (hasCommercialTracker) {
        onTabChange(commercialTabIndex ?? 0);
      } else if (hasRetailTracker) {
        onTabChange(retailTabIndex ?? 0);
      } else if (filteredGroups.length > 0) {
        onTabChange(groupStartIndex);
      }
    }
  }, [filteredGroups, selectedTab, futuresData, filteredFuturesData, favorites, commercialTrackerData, retailTrackerData, favoritesTabVisible, hasCommercialTracker, hasRetailTracker, favoritesTabIndex, commercialTabIndex, retailTabIndex, groupStartIndex]);

  // Add this at the start of the component
  React.useEffect(() => {
    // Log all unique market codes in the data
    const uniqueMarketCodes = [...new Set(futuresData?.map(d => d.market_code))];
    
    // Log sample data for each unique market code
    uniqueMarketCodes.forEach(code => {
      const sample = futuresData?.find(d => d.market_code === code);
    });
  }, [futuresData]);

  const renderPositionSection = (label, longValue, shortValue, percentageValue, color) => {
    const safeLong = longValue ?? 0;
    const safeShort = shortValue ?? 0;
    const net = safeLong - safeShort;
    const netColor = net >= 0 ? theme.palette.success.main : theme.palette.error.main;

    return (
      <Box
        key={label}
        sx={{
          borderRadius: 2,
          p: 1.25,
          backgroundColor: alpha(color, 0.08),
          border: `1px solid ${alpha(color, 0.18)}`
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{label}</Typography>
          <Typography variant="caption" color="text.secondary">
            {formatPercentage(percentageValue)}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={toPercentValue(percentageValue)}
          sx={{
            height: 6,
            borderRadius: 4,
            backgroundColor: alpha(color, 0.15),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: color
            }
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            Long {fmtCompact.format(safeLong)}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: netColor }}>
            Net {net >= 0 ? '+' : ''}{fmtCompact.format(net)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Short {fmtCompact.format(safeShort)}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderMobileCards = () => {
    if (sortedData.length === 0) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            textAlign: 'center',
            border: `1px dashed ${alpha(theme.palette.text.primary, 0.2)}`
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            No contracts to show
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try a different group or search to see matching positions.
          </Typography>
        </Paper>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, flex: 1, minHeight: 0 }}>
        {sortedData.map((row) => {
          const sectionConfigs = [
            {
              label: 'Non-commercial',
              long: row.non_commercial_long,
              short: row.non_commercial_short,
              pct: row.non_commercial_percentage_long,
              color: theme.palette.info.main,
            },
            {
              label: 'Commercial',
              long: row.commercial_long,
              short: row.commercial_short,
              pct: row.commercial_percentage_long,
              color: theme.palette.success.main,
            },
            {
              label: 'Non-reportable',
              long: row.non_reportable_long,
              short: row.non_reportable_short,
              pct: row.non_reportable_percentage_long,
              color: theme.palette.warning.main,
            }
          ];

          const netCommercial = (row.commercial_long || 0) - (row.commercial_short || 0);

          return (
            <Paper
              key={row.commodity}
              elevation={0}
              onClick={() => handleRowClick(row.commodity)}
              sx={{
                p: 2,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.95),
                boxShadow: `0 12px 30px ${alpha('#000', theme.palette.mode === 'dark' ? 0.4 : 0.08)}`,
                cursor: 'pointer',
                transition: 'transform 120ms ease, border-color 120ms ease',
                '&:active': {
                  transform: 'scale(0.995)'
                },
                '&:hover': {
                  borderColor: theme.palette.primary.main
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }} noWrap>
                    {row.commodity}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    <Chip
                      size="small"
                      label={getGroupForRow(row)}
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={row.market_code || '—'}
                    />
                    {!(isCommercialTrackerSelected || isRetailTrackerSelected) && (
                      <ZBadge z={row.zScore} type={row.extremeType} />
                    )}
                  </Box>
                </Box>
                <FavoriteButton
                  initial={favorites.includes(row.commodity)}
                  onToggle={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(row.commodity);
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                <Chip
                  size="small"
                  color="primary"
                  label={`OI ${fmt.format(row.open_interest_all)}`}
                />
                <Chip
                  size="small"
                  color={row.change_in_open_interest_all >= 0 ? 'success' : 'error'}
                  label={`Δ ${fmt.format(row.change_in_open_interest_all)}`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Comm Net ${fmtCompact.format(netCommercial)}`}
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              <Divider sx={{ my: 1.25 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {sectionConfigs.map(section => (
                  renderPositionSection(section.label, section.long, section.short, section.pct, section.color)
                ))}
              </Box>
            </Paper>
          );
        })}
      </Box>
    );
  };

  const renderTable = () => {    
    if (isMobile) {
      return renderMobileCards();
    }

    if (isTablet) {
      return (
        <Table size="small" aria-label="futures data tablet" sx={{ 
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          width: '100%',
          border: `1px solid ${theme.palette.divider}`,
          '& .MuiTableCell-root': {
            padding: isTabletLandscape ? '12px 10px' : '10px 8px',
            fontSize: isTabletLandscape ? '0.95rem' : '0.85rem',
            whiteSpace: 'nowrap'
          }
        }}>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  position: 'sticky',
                  left: 0,
                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                  zIndex: 2,
                  minWidth: isTabletLandscape ? '260px' : '200px'
                }}
              >
                <TableSortLabel
                  active={orderBy === 'commodity'}
                  direction={orderBy === 'commodity' ? order : 'asc'}
                  onClick={() => handleRequestSort('commodity')}
                  sx={{ justifyContent: 'center' }}
                >
                  Commodity
                </TableSortLabel>
              </TableCell>
              {(isCommercialTrackerSelected || isRetailTrackerSelected) && (
                <TableCell align="center">
                  <TableSortLabel
                    active={orderBy === 'zScore'}
                    direction={orderBy === 'zScore' ? order : 'asc'}
                    onClick={() => handleRequestSort('zScore')}
                    sx={{ justifyContent: 'center' }}
                  >
                    zScore
                  </TableSortLabel>
                </TableCell>
              )}
              <TableCell colSpan={2} align="center">Open Interest</TableCell>
              <TableCell colSpan={isTabletLandscape ? 4 : 3} align="center">Non-commercial</TableCell>
              <TableCell colSpan={isTabletLandscape ? 4 : 3} align="center">Commercial</TableCell>
              <TableCell colSpan={3} align="center">Non-reportable</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ position: 'sticky', left: 0, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5', zIndex: 1 }} />
              {(isCommercialTrackerSelected || isRetailTrackerSelected) && (
                <TableCell align="center">zScore</TableCell>
              )}
              <TableCell align="center">Total</TableCell>
              <TableCell align="center">Change</TableCell>
              <TableCell align="center">Long</TableCell>
              <TableCell align="center">Short</TableCell>
              <TableCell align="center">%L</TableCell>
              {isTabletLandscape && <TableCell align="center">% OI L</TableCell>}
              <TableCell align="center">Long</TableCell>
              <TableCell align="center">Short</TableCell>
              <TableCell align="center">%L</TableCell>
              {isTabletLandscape && <TableCell align="center">% OI L</TableCell>}
              <TableCell align="center">Long</TableCell>
              <TableCell align="center">Short</TableCell>
              <TableCell align="center">%L</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((row) => (
              <TableRow
                key={row.commodity}
                onClick={() => handleRowClick(row.commodity)}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { 
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                    '& td': {
                      borderTop: `2px solid ${theme.palette.primary.main}`,
                      borderBottom: `2px solid ${theme.palette.primary.main}`
                    },
                    '& td:first-of-type': {
                      borderLeft: `2px solid ${theme.palette.primary.main}`
                    },
                    '& td:last-of-type': {
                      borderRight: `2px solid ${theme.palette.primary.main}`
                    }
                  } 
                }}
              >
                <TableCell 
                  sx={{ 
                    position: 'sticky',
                    left: 0,
                    backgroundColor: theme.palette.background.paper,
                    zIndex: 1,
                    borderRight: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FavoriteButton
                      initial={favorites.includes(row.commodity)}
                      onToggle={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(row.commodity);
                      }}
                    />
                    <Typography noWrap sx={{ fontWeight: 600 }}>{row.commodity}</Typography>
                  </Box>
                </TableCell>
                {(isCommercialTrackerSelected || isRetailTrackerSelected) && (
                  <TableCell align="center"><ZBadge z={row.zScore} type={row.extremeType} /></TableCell>
                )}
                {/* Open Interest */}
                <TableCell align="right">{isTabletLandscape ? fmt.format(row.open_interest_all) : fmtCompact.format(row.open_interest_all)}</TableCell>
                <TableCell align="right" sx={{ color: row.change_in_open_interest_all < 0 ? 'error.main' : 'success.main' }}>{fmt.format(row.change_in_open_interest_all)}</TableCell>
                {/* Non-commercial */}
                <TableCell align="right">{fmt.format(row.non_commercial_long)}</TableCell>
                <TableCell align="right">{fmt.format(row.non_commercial_short)}</TableCell>
                <TableCell align="right">{formatPercentage(row.non_commercial_percentage_long)}</TableCell>
                {isTabletLandscape && (
                  <TableCell align="right">{formatPercentage(row.pct_of_oi_noncomm_long_all)}</TableCell>
                )}
                {/* Commercial */}
                <TableCell align="right">{fmt.format(row.commercial_long)}</TableCell>
                <TableCell align="right">{fmt.format(row.commercial_short)}</TableCell>
                <TableCell align="right">{formatPercentage(row.commercial_percentage_long)}</TableCell>
                {isTabletLandscape && (
                  <TableCell align="right">{formatPercentage(row.pct_of_oi_comm_long_all)}</TableCell>
                )}
                {/* Non-reportable */}
                <TableCell align="right">{fmt.format(row.non_reportable_long)}</TableCell>
                <TableCell align="right">{fmt.format(row.non_reportable_short)}</TableCell>
                <TableCell align="right">{formatPercentage(row.non_reportable_percentage_long)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    // Original desktop table render
    return (
      <Table size="small" aria-label="futures data" sx={{ 
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        minWidth: isMobile ? '1200px' : '100%',
        border: `1px solid ${theme.palette.divider}`,
        '& .MuiTableCell-root': {
          ...(isMobile ? {
            padding: '8px 4px',
            fontSize: '0.75rem'
          } : {
            textAlign: 'center',
            paddingLeft: isMobile ? '8px' : '2px',
            paddingRight: isMobile ? '8px' : '2px',
            ...(isMobile && {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.85rem',
              height: '48px',
              '&.highlight-cell': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)'
              }
            })
          })
        },
        '& thead': {
          position: 'sticky',
          top: '-1px',
          zIndex: 1,
          '& th': {
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
            ...(isMobile && {
              fontSize: '0.85rem',
              padding: '12px 8px',
              fontWeight: 600,
              height: '56px',
              borderBottom: `2px solid ${theme.palette.divider}`
            })
          }
        },
        '& tbody': {
          ...(isMobile && {
            '& tr': {
              '&:nth-of-type(odd)': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.02)' 
                  : 'rgba(0, 0, 0, 0.01)'
              },
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.04)'
              }
            },
            '& td': {
              borderBottom: `1px solid ${theme.palette.divider}`
            }
          })
        },
        ...(isMobile && {
          '& .commodity-column': {
            position: 'sticky',
            left: 0,
            backgroundColor: theme.palette.background.paper,
            zIndex: 2,
            boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
            fontWeight: 500,
            minWidth: '200px',
            maxWidth: '250px'
          },
          '& .percentage-column': {
            fontWeight: 500,
            fontSize: '0.9rem'
          },
          '& .change-column': {
            fontStyle: 'italic'
          }
        })
      }}>
        <TableHead>
            <TableRow sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
            '& th': {
              border: 'none',
              fontWeight: 'bold',
              height: '50px',
            }
          }}>
            <TableCell rowSpan={2} sx={{ 
              color: theme.palette.mode === 'dark' ? '#fff' : '#000', 
              minWidth: '200px !important',
              maxWidth: '300px !important',
              width: '250px !important',
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              position: 'sticky',
              left: 0,
              zIndex: 2,
              borderLeft: 'none !important',
              borderTop: 'none !important',
              borderBottom: 'none !important',
              '& .MuiTableSortLabel-root': {
                width: '100%',
                display: 'flex'
              }
            }}>
              <TableSortLabel
                active={orderBy === 'commodity'}
                direction={orderBy === 'commodity' ? order : 'asc'}
                onClick={() => handleRequestSort('commodity')}
                sx={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingRight: '16px',
                  '& .MuiTableSortLabel-icon': {
                    position: 'absolute',
                    right: 0
                  }
                }}
              >
                Commodity
              </TableSortLabel>
            </TableCell>
            {(isCommercialTrackerSelected || isRetailTrackerSelected) && (
              <TableCell
                align="center"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                  minWidth: '90px'
                }}
              />
            )}
            <TableCell colSpan={2} align="center" sx={{ 
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
              paddingLeft: '2px'
            }}>Open Interest</TableCell>
            <TableCell colSpan={showDetails ? 8 : 3} align="center" sx={{ 
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
              paddingLeft: '2px'
            }}>Non-commercial</TableCell>
            <TableCell colSpan={showDetails ? 8 : 3} align="center" sx={{ 
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
              paddingLeft: '2px'
            }}>Commercial</TableCell>
            <TableCell colSpan={showDetails ? 8 : 3} align="center" sx={{ 
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
              paddingLeft: '2px'
            }}>Non-reportable</TableCell>
          </TableRow>
          <TableRow sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
            '& th': {
              border: 'none',
              fontWeight: 'bold',
              height: '50px'
            }
          }}>
            {/* Open Interest Headers */}
            {(isCommercialTrackerSelected || isRetailTrackerSelected) && (
              <TableCell
                align="center"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                  minWidth: '70px',
                  maxWidth: '80px',
                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                  padding: '8px 4px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                <TableSortLabel
                  active={orderBy === 'zScore'}
                  direction={orderBy === 'zScore' ? order : 'asc'}
                  onClick={() => handleRequestSort('zScore')}
                  sx={{ justifyContent: 'center' }}
                >
                  zScore
                </TableSortLabel>
              </TableCell>
            )}
            <TableCell
              align="center"
              sx={{
                color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                minWidth: '70px',
                maxWidth: '80px',
                backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                padding: '8px 4px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <TableSortLabel
                active={orderBy === 'open_interest_all'}
                direction={orderBy === 'open_interest_all' ? order : 'asc'}
                onClick={() => handleRequestSort('open_interest_all')}
                sx={{ justifyContent: 'center' }}
              >
                Total
              </TableSortLabel>
            </TableCell>
            <TableCell
              align="center"
              sx={{
                color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                minWidth: '60px',
                maxWidth: '70px',
                backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                padding: '8px 4px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <TableSortLabel
                active={orderBy === 'change_in_open_interest_all'}
                direction={orderBy === 'change_in_open_interest_all' ? order : 'asc'}
                onClick={() => handleRequestSort('change_in_open_interest_all')}
                sx={{ justifyContent: 'center' }}
              >
                Change
              </TableSortLabel>
            </TableCell>
            {/* Non-commercial Headers */}
            {(showDetails ? ['Long','Change','Short','Change','Total','% Long','% OI Long','% OI Short'] : ['Long','Short','% Long']).map((lbl,i) => (
              <TableCell
                key={`h1-${i}`}
                align="center"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                  minWidth: lbl === 'Change' ? '60px' : '70px',
                  maxWidth: lbl === 'Change' ? '70px' : '80px',
                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                  padding: lbl === 'Long' ? '8px 4px 8px 10px' : '8px 4px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                <TableSortLabel
                  active={orderBy === `non_commercial_${lbl.toLowerCase() === 'change' ? 'long_change' : 
                    lbl === '% OI Long' ? 'pct_of_oi_noncomm_long_all' :
                    lbl === '% OI Short' ? 'pct_of_oi_noncomm_short_all' :
                    lbl.toLowerCase().replace('% ', 'percentage_')}`}
                  direction={orderBy === `non_commercial_${lbl.toLowerCase() === 'change' ? 'long_change' : 
                    lbl === '% OI Long' ? 'pct_of_oi_noncomm_long_all' :
                    lbl === '% OI Short' ? 'pct_of_oi_noncomm_short_all' :
                    lbl.toLowerCase().replace('% ', 'percentage_')}` ? order : 'asc'}
                  onClick={() => handleRequestSort(`non_commercial_${lbl.toLowerCase() === 'change' ? 'long_change' : 
                    lbl === '% OI Long' ? 'pct_of_oi_noncomm_long_all' :
                    lbl === '% OI Short' ? 'pct_of_oi_noncomm_short_all' :
                    lbl.toLowerCase().replace('% ', 'percentage_')}`)}
                  sx={{ justifyContent: 'center' }}
                >
                  {lbl}
                </TableSortLabel>
              </TableCell>
            ))}
            {/* Commercial Headers */}
            {(showDetails ? ['Long','Change','Short','Change','Total','% Long','% OI Long','% OI Short'] : ['Long','Short','% Long']).map((lbl,i) => (
              <TableCell
                key={`h2-${i}`}
                align="center"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                  minWidth: lbl === 'Change' ? '60px' : '70px',
                  maxWidth: lbl === 'Change' ? '70px' : '80px',
                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                  padding: lbl === 'Long' ? '8px 4px 8px 10px' : '8px 4px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                <TableSortLabel
                  active={orderBy === `commercial_${lbl.toLowerCase() === 'change' ? 'long_change' : 
                    lbl === '% OI Long' ? 'pct_of_oi_comm_long_all' :
                    lbl === '% OI Short' ? 'pct_of_oi_comm_short_all' :
                    lbl.toLowerCase().replace('% ', 'percentage_')}`}
                  direction={orderBy === `commercial_${lbl.toLowerCase() === 'change' ? 'long_change' : 
                    lbl === '% OI Long' ? 'pct_of_oi_comm_long_all' :
                    lbl === '% OI Short' ? 'pct_of_oi_comm_short_all' :
                    lbl.toLowerCase().replace('% ', 'percentage_')}` ? order : 'asc'}
                  onClick={() => handleRequestSort(`commercial_${lbl.toLowerCase() === 'change' ? 'long_change' : 
                    lbl === '% OI Long' ? 'pct_of_oi_comm_long_all' :
                    lbl === '% OI Short' ? 'pct_of_oi_comm_short_all' :
                    lbl.toLowerCase().replace('% ', 'percentage_')}`)}
                  sx={{ justifyContent: 'center' }}
                >
                  {lbl}
                </TableSortLabel>
              </TableCell>
            ))}
            {/* Non-reportable Headers */}
            {(showDetails ? ['Long','Change','Short','Change','Total','% Long','% OI Long','% OI Short'] : ['Long','Short','% Long']).map((lbl,i) => (
              <TableCell
                key={`h3-${i}`}
                align="center"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                  minWidth: lbl === 'Change' ? '60px' : '70px',
                  maxWidth: lbl === 'Change' ? '70px' : '80px',
                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                  padding: lbl === 'Long' ? '8px 4px 8px 10px' : '8px 4px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                <TableSortLabel
                  active={orderBy === `non_reportable_${lbl.toLowerCase() === 'change' ? 'long_change' : 
                    lbl === '% OI Long' ? 'pct_of_oi_nonrept_long_all' :
                    lbl === '% OI Short' ? 'pct_of_oi_nonrept_short_all' :
                    lbl.toLowerCase().replace('% ', 'percentage_')}`}
                  direction={orderBy === `non_reportable_${lbl.toLowerCase() === 'change' ? 'long_change' : 
                    lbl === '% OI Long' ? 'pct_of_oi_nonrept_long_all' :
                    lbl === '% OI Short' ? 'pct_of_oi_nonrept_short_all' :
                    lbl.toLowerCase().replace('% ', 'percentage_')}` ? order : 'asc'}
                  onClick={() => handleRequestSort(`non_reportable_${lbl.toLowerCase() === 'change' ? 'long_change' : 
                    lbl === '% OI Long' ? 'pct_of_oi_nonrept_long_all' :
                    lbl === '% OI Short' ? 'pct_of_oi_nonrept_short_all' :
                    lbl.toLowerCase().replace('% ', 'percentage_')}`)}
                  sx={{ justifyContent: 'center' }}
                >
                  {lbl}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((r, index) => (
            <TableRow
              key={r.commodity}
              onClick={() => handleRowClick(r.commodity)}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                  '& td': {
                    borderTop: `2px solid ${theme.palette.primary.main}`,
                    borderBottom: `2px solid ${theme.palette.primary.main}`
                  },
                  '& td:first-of-type': {
                    borderLeft: `2px solid ${theme.palette.primary.main}`
                  },
                  '& td:last-of-type': {
                    borderRight: `2px solid ${theme.palette.primary.main}`
                  }
                },
                ...(isMobile && {
                  '&:active': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'rgba(0, 0, 0, 0.08)'
                  }
                })
              }}
            >
              <TableCell 
                className="commodity-column"
                sx={{ 
                  padding: isMobile ? '12px 16px' : '4px',
                  ...(isMobile && {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  })
                }}
              >
                {isMobile ? (
                  <>
                    <FavoriteButton
                      initial={favorites.includes(r.commodity)}
                      onToggle={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(r.commodity);
                      }}
                      sx={{ 
                        padding: '4px',
                        '& svg': { fontSize: '1.2rem' }
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {r.commodity}
                    </Typography>
                  </>
                ) : (
                  // Original desktop layout with z-score badge when available
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Typography sx={{ pr: 1, fontSize: '0.75rem' }} noWrap>{r.commodity}</Typography>
                      {!(isCommercialTrackerSelected || isRetailTrackerSelected) && (
                        <ZBadge z={r.zScore} type={r.extremeType} />
                      )}
                    </Box>
                    <FavoriteButton
                      initial={favorites.includes(r.commodity)}
                      onToggle={() => onToggleFavorite(r.commodity)}
                    />
                  </Box>
                )}
              </TableCell>
              {(isCommercialTrackerSelected || isRetailTrackerSelected) && (
                <TableCell align="center" sx={{ 
                  padding: '8px 4px', 
                  fontSize: '0.75rem',
                  borderLeft: `2px solid ${theme.palette.divider}`
                }}>
                  <ZBadge z={r.zScore} type={r.extremeType} />
                </TableCell>
              )}
              
              {/* Open Interest */}
              <TableCell align="center" sx={{ 
                padding: '8px 4px 8px 10px', 
                fontSize: '0.75rem',
                borderLeft: `2px solid ${theme.palette.divider}`
              }}>
                {r.open_interest_all !== undefined && r.open_interest_all !== null ? fmt.format(r.open_interest_all) : '-'}
              </TableCell>
              <TableCell align="center" sx={{ 
                color: r.change_in_open_interest_all < 0 ? 'red' : 'green', 
                padding: '8px 4px', 
                fontSize: '0.75rem'
              }}>
                {r.change_in_open_interest_all !== undefined && r.change_in_open_interest_all !== null ? fmt.format(r.change_in_open_interest_all) : '-'}
              </TableCell>

              {/* Non-commercial */}
              <TableCell align="center" sx={{ 
                padding: '8px 4px 8px 10px', 
                fontSize: '0.75rem',
                borderLeft: `2px solid ${theme.palette.divider}`
              }}>{fmt.format(r.non_commercial_long)}</TableCell>
              {showDetails && (
                <TableCell align="center" sx={{ color: r.non_commercial_long_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.non_commercial_long_change)}
                </TableCell>
              )}
              <TableCell align="center" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.non_commercial_short)}</TableCell>
              {showDetails && (
                <TableCell align="center" sx={{ color: r.non_commercial_short_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.non_commercial_short_change)}
                </TableCell>
              )}
              {showDetails && (
                <TableCell align="center" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.non_commercial_total)}
                </TableCell>
              )}
              <TableCell align="center" sx={{ color: getPercentageColor(r.non_commercial_percentage_long), padding: '8px 4px', fontSize: '0.75rem' }}>
                {formatPercentage(r.non_commercial_percentage_long)}
              </TableCell>
              {showDetails && (
                <TableCell align="center" sx={{ color: getPercentageColor(r.pct_of_oi_noncomm_long_all), padding: '8px 4px', fontSize: '0.75rem' }}>
                  {formatPercentage(r.pct_of_oi_noncomm_long_all)}
                </TableCell>
              )}
              {showDetails && (
                <TableCell align="center" sx={{ 
                  color: getPercentageColor(r.pct_of_oi_noncomm_short_all), 
                  padding: '8px 4px', 
                  fontSize: '0.75rem'
                }}>
                  {formatPercentage(r.pct_of_oi_noncomm_short_all)}
                </TableCell>
              )}

              {/* Commercial */}
              <TableCell align="center" sx={{ padding: '8px 4px 8px 10px', fontSize: '0.75rem', borderLeft: `2px solid ${theme.palette.divider}` }}>{fmt.format(r.commercial_long)}</TableCell>
              {showDetails && (
                <TableCell align="center" sx={{ color: r.commercial_long_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.commercial_long_change)}
                </TableCell>
              )}
              <TableCell align="center" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.commercial_short)}</TableCell>
              {showDetails && (
                <TableCell align="center" sx={{ color: r.commercial_short_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.commercial_short_change)}
                </TableCell>
              )}
              {showDetails && (
                <TableCell align="center" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.commercial_total)}
                </TableCell>
              )}
              <TableCell align="center" sx={{ color: getPercentageColor(r.commercial_percentage_long), padding: '8px 4px', fontSize: '0.75rem' }}>
                {formatPercentage(r.commercial_percentage_long)}
              </TableCell>
              {showDetails && (
                <TableCell align="center" sx={{ color: getPercentageColor(r.pct_of_oi_comm_long_all), padding: '8px 4px', fontSize: '0.75rem' }}>
                  {formatPercentage(r.pct_of_oi_comm_long_all)}
                </TableCell>
              )}
              {showDetails && (
                <TableCell align="center" sx={{ 
                  color: getPercentageColor(r.pct_of_oi_comm_short_all), 
                  padding: '8px 4px', 
                  fontSize: '0.75rem'
                }}>
                  {formatPercentage(r.pct_of_oi_comm_short_all)}
                </TableCell>
              )}

              {/* Non-reportable */}
              <TableCell align="center" sx={{ padding: '8px 4px 8px 10px', fontSize: '0.75rem', borderLeft: `2px solid ${theme.palette.divider}` }}>{fmt.format(r.non_reportable_long)}</TableCell>
              {showDetails && (
                <TableCell align="center" sx={{ color: r.non_reportable_long_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.non_reportable_long_change)}
                </TableCell>
              )}
              <TableCell align="center" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.non_reportable_short)}</TableCell>
              {showDetails && (
                <TableCell align="center" sx={{ color: r.non_reportable_short_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.non_reportable_short_change)}
                </TableCell>
              )}
              {showDetails && (
                <TableCell align="center" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.non_reportable_total)}
                </TableCell>
              )}
              <TableCell align="center" sx={{ color: getPercentageColor(r.non_reportable_percentage_long), padding: '8px 4px', fontSize: '0.75rem' }}>
                {formatPercentage(r.non_reportable_percentage_long)}
              </TableCell>
              {showDetails && (
                <TableCell align="center" sx={{ color: getPercentageColor(r.pct_of_oi_nonrept_long_all), padding: '8px 4px', fontSize: '0.75rem' }}>
                  {formatPercentage(r.pct_of_oi_nonrept_long_all)}
                </TableCell>
              )}
              {showDetails && (
                <TableCell align="center" sx={{ color: getPercentageColor(r.pct_of_oi_nonrept_short_all), padding: '8px 4px', fontSize: '0.75rem' }}>
                  {formatPercentage(r.pct_of_oi_nonrept_short_all)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Render the tabs and Details toggle (desktop)
  const renderTabs = () => {
    // Always show favorites tab if there are any favorites
    const shouldShowFavorites = favorites.length > 0;
    const favoritesInSearch = filteredFuturesData?.filter(d => favorites.includes(d.commodity)) || [];

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: '48px',
            borderBottom: 1,
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            '& .MuiTabs-flexContainer': {
              height: '48px'
            },
            '& .MuiTab-root': {
              color: theme.palette.text.secondary,
              textTransform: 'none',
              minWidth: 'auto',
              minHeight: '48px',
              padding: '12px 24px',
              fontSize: '0.875rem',
              fontWeight: 500,
              '& .market-code': {
                fontWeight: 600
              },
              '&:hover': {
                color: theme.palette.text.primary,
                opacity: 1
              }
            },
            '& .Mui-selected': {
              color: theme.palette.primary.main
            },
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
              height: 2
            }
          }}
        >
        {shouldShowFavorites && (
          <Tab 
            key="favorites" 
            label={
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                opacity: favoritesInSearch.length === 0 ? 0.5 : 1 // Dim the tab if no favorites match search
              }}>
                <span>Favorites</span>
                <Box
                  sx={{
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.12)' 
                      : 'rgba(0, 0, 0, 0.08)',
                    color: theme.palette.text.primary,
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    lineHeight: 1,
                    fontWeight: 500
                  }}
                >
                  {favoritesInSearch.length}/{favorites.length}
                </Box>
              </Box>
            } 
            id="tab-0" 
          />
        )}
        <Tab 
          key="commercial-tracker" 
          label={
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1
            }}>
              <span>Commercial Tracker</span>
              {isLoadingExtremes ? (
                <CircularProgress size={16} />
              ) : (
                <Box
                  sx={{
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.12)' 
                      : 'rgba(0, 0, 0, 0.08)',
                    color: theme.palette.text.primary,
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    lineHeight: 1,
                    fontWeight: 500
                  }}
                >
                  {commercialTrackerData.length}
                </Box>
              )}
            </Box>
          } 
          id="tab-1" 
        />
        {/* Retail Tracker Tab follows Commercial if present, otherwise takes its place */}
        <Tab 
          key="retail-tracker" 
          label={
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              opacity: retailTrackerData.length === 0 ? 0.5 : 1
            }}>
              <span>Retail Tracker</span>
              {isLoadingExtremes ? (
                <CircularProgress size={16} />
              ) : (
                <Box
                  sx={{
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.12)' 
                      : 'rgba(0, 0, 0, 0.08)',
                    color: theme.palette.text.primary,
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    lineHeight: 1,
                    fontWeight: 500
                  }}
                >
                  {retailTrackerData.length}
                </Box>
              )}
            </Box>
          } 
          id="tab-2"
        />
        {filteredGroups.map((groupName, index) => {
          const preTabsCount = (shouldShowFavorites ? 1 : 0) + 1 + 1;
          const tabIndex = index + preTabsCount;
          return (
            <Tab 
              key={groupName} 
              label={
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center'
                }}>
                  <span className="market-code">{groupName}</span>
                </Box>
              } 
              id={`tab-${tabIndex}`}
            />
          );
        })}
        </Tabs>
        {!isMobile && (
          <FormControlLabel 
            control={<Switch size="small" checked={showDetails} onChange={(e) => setShowDetails(e.target.checked)} />}
            label="Details"
            sx={{ ml: 1 }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      height: isMobile ? 'calc(var(--app-mobile-viewport, 100vh) - 210px)' : '45vh',
      minHeight: isMobile ? 420 : '45vh',
      maxHeight: isMobile ? 'calc(var(--app-mobile-viewport, 100vh) - 120px)' : undefined,
      flex: '1 1 auto',
      borderRadius: 1,
      overflow: 'hidden',
      ...(isMobile && {
        '& .MuiTableContainer-root': {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5'
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' ? '#444' : '#ccc',
            borderRadius: '3px'
          }
        }
      })
    }}>
    <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
        ...(isMobile && {
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        })
      }}>
        {renderTabs()}
      </Box>
      <TableContainer 
        component={Paper} 
        sx={{ 
          border: 'none',
          flex: 1,
          height: '100%',
          '& .MuiPaper-root': {
            border: 'none'
          },
          ...(isMobile && {
            overflowX: 'auto',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': {
              height: '8px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.mode === 'dark' ? '#444' : '#ccc',
              borderRadius: '4px'
            }
          })
        }}
      >
        {renderTable()}
      </TableContainer>
    </Box>
  );
}

// Skeleton loader for the CollapsableTable
export function CollapsableTableSkeleton() {
  // Simulate 8 rows and the same tab structure
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', height: '45vh', borderRadius: 1, overflow: 'hidden' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs value={0} variant="scrollable" scrollButtons="auto">
          <Tab key="favorites" label={<Skeleton width={80} height={24} />} id="tab-0" />
          <Tab key="commercial-tracker" label={<Skeleton width={150} height={24} />} id="tab-1" />
          {[...Array(3)].map((_, i) => (
            <Tab key={`skeleton-tab-${i}`} label={<Skeleton width={100} height={24} />} id={`tab-${i+2}`} />
          ))}
        </Tabs>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small" aria-label="skeleton-table">
          <TableHead>
            <TableRow>
              <TableCell><Skeleton width={120} /></TableCell>
              {[...Array(18)].map((_, i) => (
                <TableCell key={`sk-head-${i}`}><Skeleton width={60} /></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(8)].map((_, rowIdx) => (
              <TableRow key={`sk-row-${rowIdx}`}> 
                <TableCell><Skeleton width={180} /></TableCell>
                {[...Array(18)].map((_, i) => (
                  <TableCell key={`sk-cell-${rowIdx}-${i}`}><Skeleton width={50} /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}