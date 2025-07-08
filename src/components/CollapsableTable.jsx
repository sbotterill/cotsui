// src/components/CollapsableTable.jsx
import * as React from 'react';
import { useTheme } from '@mui/material/styles';
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
import { ALLOWED_EXCHANGES, isValidExchange, EXCHANGE_CODE_MAP } from '../constants';
import Skeleton from '@mui/material/Skeleton';

function formatPercentage(value) {
  if (value == null) return '-';
  // Convert to number and check if it's already a percentage
  const numValue = Number(value);
  if (isNaN(numValue)) return '-';
  // If value is already in percentage form (> 1), don't multiply by 100
  const finalValue = numValue > 1 ? numValue : numValue * 100;
  return `${finalValue.toFixed(1)}%`;
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

function descendingComparator(a, b, orderBy) {
  if (orderBy === 'non_commercial_percentage_long' || 
      orderBy === 'commerical_percentage_long' || 
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
  onTabChange
}) {
  
  const theme = useTheme();
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('commodity');
  const initialLoadDone = React.useRef(false);
  const fmt = new Intl.NumberFormat('en-US');

  // Debug log for props
  React.useEffect(() => {
    console.log('CollapsibleTable Props:', {
      futuresData: futuresData?.length,
      filteredFuturesData: filteredFuturesData?.length,
      exchanges,
      displayExchanges,
      selectedTab
    });
  }, [futuresData, filteredFuturesData, exchanges, displayExchanges, selectedTab]);

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

  // Filter exchanges to only include allowed ones
  const filteredExchanges = React.useMemo(() => {

    // First format all exchanges with their full names
    const formatted = exchanges.map(exchange => {
      // If the exchange is already formatted (contains " - "), just use it as is
      if (exchange.includes(" - ")) {
        return exchange;
      }
      const code = normalizeCode(exchange);
      const fullName = EXCHANGE_CODE_MAP[code] || code;
      return `${code} - ${fullName}`;
    });

    // Filter to only show exchanges that are in displayExchanges
    const filtered = formatted.filter(exchange => {
      const code = normalizeCode(exchange.split(' - ')[0]);
      const isIncluded = displayExchanges.some(d => normalizeCode(d) === code);

      return isIncluded;
    });

    // Sort by the exchange code
    return filtered.sort((a, b) => {
      const aCode = normalizeCode(a.split(' - ')[0]);
      const bCode = normalizeCode(b.split(' - ')[0]);
      return aCode.localeCompare(bCode);
    });
  }, [exchanges, displayExchanges]);

  // Initialize selected tab
  React.useEffect(() => {
    if (!initialLoadDone.current && futuresData?.length > 0 && filteredExchanges.length > 0) {
      // If no favorites, select first exchange tab
      const initialTab = favorites.length > 0 ? 0 : 1;
      onTabChange(initialTab);
      
      // Select first commodity in the current tab
      const currentExchange = initialTab === 0 ? 'Favorites' : filteredExchanges[0];
      const filteredData = getFilteredData(currentExchange);
      
      if (filteredData.length > 0) {
        // Sort the data the same way as in the table
        const sortedData = [...filteredData].sort((a, b) => {
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
  }, [futuresData, filteredExchanges, favorites]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleTabChange = (event, newValue) => {
    onTabChange(newValue);
  };

  const getFilteredData = (exchange) => {    
    if (!exchange) return [];

    console.log('Getting filtered data for exchange:', exchange);
    console.log('Available futures data:', filteredFuturesData);

    if (exchange === 'Favorites') {
      // Use complete futuresData for favorites to show all favorited items regardless of exchange
      const filtered = futuresData?.filter(d => favorites.includes(d.commodity)) || [];
      return filtered;
    }
    
    // Get just the exchange code (e.g., "CME" from "CME - CHICAGO MERCANTILE EXCHANGE")
    const exchangeCode = exchange.split(' - ')[0];
    console.log('Exchange code to match:', exchangeCode);
    
    // Use filteredFuturesData for exchange tabs to respect exchange filtering
    const filtered = filteredFuturesData?.filter(row => {
      const rowMarketCode = row.market_code?.trim() || '';
      console.log('Checking row market code:', rowMarketCode, 'for commodity:', row.commodity);
      
      // Special handling for ICE exchanges
      if (exchangeCode === 'ICE') {
        const isMatch = rowMarketCode === 'ICEU' || rowMarketCode === 'ICUS' || rowMarketCode === 'IFED' || rowMarketCode === 'ICE';
        console.log('ICE match check:', isMatch, 'for', rowMarketCode);
        return isMatch;
      }
      
      const isMatch = rowMarketCode === exchangeCode;
      console.log('Regular match check:', isMatch, 'for', rowMarketCode);
      return isMatch;
    }) || [];

    console.log('Filtered results:', filtered);
    return filtered;
  };

  // Get the current exchange's data
  const currentExchangeData = React.useMemo(() => {
    const currentExchange = selectedTab === 0 ? 'Favorites' : filteredExchanges[selectedTab - 1];
    const data = getFilteredData(currentExchange);

    return data;
  }, [futuresData, filteredExchanges, selectedTab, favorites]);

  // Sort the current exchange's data
  const sortedData = React.useMemo(() => {
    const sorted = [...currentExchangeData].sort(getComparator(order, orderBy));
    return sorted;
  }, [currentExchangeData, order, orderBy]);

  const handleRowClick = (commodity) => {
    // Find the selected commodity's data
    const selectedData = futuresData.find(r => r.commodity === commodity);
    if (selectedData && onCommoditySelect) {
      onCommoditySelect(selectedData.contract_code, selectedData.commodity);
    }
  };

  // Update tab selection when displayExchanges changes
  React.useEffect(() => {
    if (selectedTab > 0) {
      const currentExchange = filteredExchanges[selectedTab - 1];
      const currentCode = normalizeCode(currentExchange?.split(' - ')[0]);
      
      // Check if current tab's exchange is still in displayExchanges
      const isCurrentExchangeVisible = displayExchanges.some(e => normalizeCode(e) === currentCode);
      
      if (!isCurrentExchangeVisible && displayExchanges.length > 0) {
        onTabChange(1);
      }
    }
  }, [displayExchanges, filteredExchanges, selectedTab]);

  // Add this at the start of the component
  React.useEffect(() => {
    // Log all unique market codes in the data
    const uniqueMarketCodes = [...new Set(futuresData?.map(d => d.market_code))];
    
    // Log sample data for each unique market code
    uniqueMarketCodes.forEach(code => {
      const sample = futuresData?.find(d => d.market_code === code);
    });
  }, [futuresData]);

  const renderTable = () => {    
    return (
      <Table size="small" aria-label="futures data" sx={{ 
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        minWidth: '100%',
        border: `1px solid ${theme.palette.divider}`,
        '& .MuiTableCell-root': {
          textAlign: 'center',
          paddingLeft: '2px',
          paddingRight: '2px'
        },
        '& thead': {
          position: 'sticky',
          top: '-1px',
          zIndex: 1
        },
        '& .MuiTableSortLabel-root': {
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          paddingRight: '16px',  // Add padding to account for the sort icon
          '& .MuiTableSortLabel-icon': {
            position: 'absolute',
            right: 0
          }
        }
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
            <TableCell colSpan={2} align="center" sx={{ 
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
              paddingLeft: '2px'
            }}>Open Interest</TableCell>
            <TableCell colSpan={8} align="center" sx={{ 
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
              paddingLeft: '2px'
            }}>Non-commercial</TableCell>
            <TableCell colSpan={8} align="center" sx={{ 
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
              paddingLeft: '2px'
            }}>Commercial</TableCell>
            <TableCell colSpan={8} align="center" sx={{ 
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
            {['Long','Change','Short','Change','Total','% Long','% OI Long','% OI Short'].map((lbl,i) => (
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
            {['Long','Change','Short','Change','Total','% Long','% OI Long','% OI Short'].map((lbl,i) => (
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
                  active={orderBy === `commerical_${lbl.toLowerCase() === 'change' ? 'long_change' : 
                    lbl === '% OI Long' ? 'pct_of_oi_comm_long_all' :
                    lbl === '% OI Short' ? 'pct_of_oi_comm_short_all' :
                    lbl.toLowerCase().replace('% ', 'percentage_')}`}
                  direction={orderBy === `commerical_${lbl.toLowerCase() === 'change' ? 'long_change' : 
                    lbl === '% OI Long' ? 'pct_of_oi_comm_long_all' :
                    lbl === '% OI Short' ? 'pct_of_oi_comm_short_all' :
                    lbl.toLowerCase().replace('% ', 'percentage_')}` ? order : 'asc'}
                  onClick={() => handleRequestSort(`commerical_${lbl.toLowerCase() === 'change' ? 'long_change' : 
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
            {['Long','Change','Short','Change','Total','% Long','% OI Long','% OI Short'].map((lbl,i) => (
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
          {sortedData.map(r => {
            return (
              <TableRow
                key={r.commodity}
                onClick={() => handleRowClick(r.commodity)}
                sx={{
                  height: '30px !important',
                  width: '100px !important',
                  '& td': { 
                    border: 'none',
                    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                    position: 'relative',
                    height: '30px !important',
                    padding: '4px', // Reduce padding to help maintain height
                  },
                  '& td:first-of-type': {
                    padding: '0 10px',
                  },
                  '&:nth-of-type(odd) td': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
                  },
                  '&:nth-of-type(even) td': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
                  },
                  '&:hover td': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#3c3c3c' : '#e0e0e0',
                    cursor: 'pointer',
                    boxShadow: `inset 0 0 0 1px ${theme.palette.mode === 'dark' ? '#ffd700' : '#1976d2'}`,
                  },
                  '&:hover td:first-of-type': {
                    boxShadow: `inset 0 0 0 1px ${theme.palette.mode === 'dark' ? '#ffd700' : '#1976d2'}, inset 2px 0 0 0 ${theme.palette.mode === 'dark' ? '#ffd700' : '#1976d2'}`,
                  },
                  '&:hover td:last-of-type': {
                    boxShadow: `inset 0 0 0 1px ${theme.palette.mode === 'dark' ? '#ffd700' : '#1976d2'}, inset -2px 0 0 0 ${theme.palette.mode === 'dark' ? '#ffd700' : '#1976d2'}`,
                  }
                }}
              >
                <TableCell sx={{ minWidth: '200px', maxWidth: '300px' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'row',
                    width: '100%',
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                  }}>
                    <Typography 
                      sx={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.2,
                        pr: 1,
                        fontSize: '0.75rem',
                        flex: 1
                      }}
                    >
                      {r.commodity}
                    </Typography>
                    <FavoriteButton
                      initial={favorites.includes(r.commodity)}
                      onToggle={() => onToggleFavorite(r.commodity)}
                      sx={{ flexShrink: 0 }}
                    />
                  </Box>
                </TableCell>

                {/* Open Interest */}
                <TableCell align="center" sx={{ 
                  padding: '8px 4px 8px 10px', 
                  fontSize: '0.75rem',
                  borderLeft: `2px solid ${theme.palette.divider}`,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '10%',
                    height: '80%',
                    width: '1px',
                    backgroundColor: theme.palette.divider
                  }
                }}>
                  {r.open_interest_all !== undefined && r.open_interest_all !== null ? fmt.format(r.open_interest_all) : '-'}
                </TableCell>
                <TableCell align="center" sx={{ 
                  color: r.change_in_open_interest_all < 0 ? 'red' : 'green', 
                  padding: '8px 4px', 
                  fontSize: '0.75rem',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: 0,
                    top: '10%',
                    height: '80%',
                    width: '1px',
                    backgroundColor: theme.palette.divider
                  }
                }}>
                  {r.change_in_open_interest_all !== undefined && r.change_in_open_interest_all !== null ? fmt.format(r.change_in_open_interest_all) : '-'}
                </TableCell>

                {/* Non-commercial */}
                <TableCell align="center" sx={{ 
                  padding: '8px 4px 8px 10px', 
                  fontSize: '0.75rem',
                  borderLeft: `2px solid ${theme.palette.divider}`,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '10%',
                    height: '80%',
                    width: '1px',
                    backgroundColor: theme.palette.divider
                  }
                }}>{fmt.format(r.non_commercial_long)}</TableCell>
                <TableCell align="center" sx={{ color: r.non_commercial_long_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.non_commercial_long_change)}
                </TableCell>
                <TableCell align="center" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.non_commercial_short)}</TableCell>
                <TableCell align="center" sx={{ color: r.non_commercial_short_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.non_commercial_short_change)}
                </TableCell>
                <TableCell align="center" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.non_commercial_total)}
                </TableCell>
                <TableCell align="center" sx={{ color: getPercentageColor(r.non_commercial_percentage_long), padding: '8px 4px', fontSize: '0.75rem' }}>
                  {formatPercentage(r.non_commercial_percentage_long)}
                </TableCell>
                <TableCell align="center" sx={{ color: getPercentageColor(r.pct_of_oi_noncomm_long_all), padding: '8px 4px', fontSize: '0.75rem' }}>
                  {formatPercentage(r.pct_of_oi_noncomm_long_all)}
                </TableCell>
                <TableCell align="center" sx={{ 
                  color: getPercentageColor(r.pct_of_oi_noncomm_short_all), 
                  padding: '8px 4px', 
                  fontSize: '0.75rem',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: 0,
                    top: '10%',
                    height: '80%',
                    width: '1px',
                    backgroundColor: theme.palette.divider
                  }
                }}>
                  {formatPercentage(r.pct_of_oi_noncomm_short_all)}
                </TableCell>

                {/* Commercial */}
                <TableCell align="center" sx={{ padding: '8px 4px 8px 10px', fontSize: '0.75rem' }}>{fmt.format(r.commerical_long)}</TableCell>
                <TableCell align="center" sx={{ color: r.commerical_long_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.commerical_long_change)}
                </TableCell>
                <TableCell align="center" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.commerical_short)}</TableCell>
                <TableCell align="center" sx={{ color: r.commerical_short_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.commerical_short_change)}
                </TableCell>
                <TableCell align="center" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.commerical_total)}</TableCell>
                <TableCell align="center" sx={{ color: getPercentageColor(r.commerical_percentage_long), padding: '8px 4px', fontSize: '0.75rem' }}>
                  {formatPercentage(r.commerical_percentage_long)}
                </TableCell>
                <TableCell align="center" sx={{ color: getPercentageColor(r.pct_of_oi_comm_long_all), padding: '8px 4px', fontSize: '0.75rem' }}>
                  {formatPercentage(r.pct_of_oi_comm_long_all)}
                </TableCell>
                <TableCell align="center" sx={{ 
                  color: getPercentageColor(r.pct_of_oi_comm_short_all), 
                  padding: '8px 4px', 
                  fontSize: '0.75rem',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: 0,
                    top: '10%',
                    height: '80%',
                    width: '1px',
                    backgroundColor: theme.palette.divider
                  }
                }}>
                  {formatPercentage(r.pct_of_oi_comm_short_all)}
                </TableCell>

                {/* Non-reportable */}
                <TableCell align="center" sx={{ padding: '8px 4px 8px 10px', fontSize: '0.75rem' }}>{fmt.format(r.non_reportable_long)}</TableCell>
                <TableCell align="center" sx={{ color: r.non_reportable_long_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.non_reportable_long_change)}
                </TableCell>
                <TableCell align="center" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.non_reportable_short)}</TableCell>
                <TableCell align="center" sx={{ color: r.non_reportable_short_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                  {fmt.format(r.non_reportable_short_change)}
                </TableCell>
                <TableCell align="center" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.non_reportable_total)}</TableCell>
                <TableCell align="center" sx={{ color: getPercentageColor(r.non_reportable_percentage_long), padding: '8px 4px', fontSize: '0.75rem' }}>
                  {formatPercentage(r.non_reportable_percentage_long)}
                </TableCell>
                <TableCell align="center" sx={{ color: getPercentageColor(r.pct_of_oi_nonrept_long_all), padding: '8px 4px', fontSize: '0.75rem' }}>
                  {formatPercentage(r.pct_of_oi_nonrept_long_all)}
                </TableCell>
                <TableCell align="center" sx={{ color: getPercentageColor(r.pct_of_oi_nonrept_short_all), padding: '8px 4px', fontSize: '0.75rem' }}>
                  {formatPercentage(r.pct_of_oi_nonrept_short_all)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  // Render the tabs with cleaner formatting
  const renderTabs = () => {
    return (
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
        <Tab 
          key="favorites" 
          label={
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1
            }}>
              <span>Favorites</span>
              {favorites.length > 0 && (
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
                  {favorites.length}
                </Box>
              )}
            </Box>
          } 
          id="tab-0" 
        />
        {filteredExchanges.map((exchange, index) => {
          const code = normalizeCode(exchange.split(' - ')[0]);
          return (
            <Tab 
              key={exchange} 
              label={
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center'
                }}>
                  <span className="market-code">{code}</span>
                </Box>
              } 
              id={`tab-${index + 1}`}
            />
          );
        })}
      </Tabs>
    );
  };

  return (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      height: '45vh',
      borderRadius: 1,
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
      }}>
        {renderTabs()}
      </Box>
      <TableContainer component={Paper} sx={{ 
        border: 'none',
        '& .MuiPaper-root': {
          border: 'none'
        }
      }}>
        {selectedTab === 0 && <div key="favorites-table">{renderTable()}</div>}
        {filteredExchanges.map((exchange, index) => (
          selectedTab === index + 1 && <div key={`table-${exchange}`}>{renderTable()}</div>
        ))}
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
          {[...Array(3)].map((_, i) => (
            <Tab key={`skeleton-tab-${i}`} label={<Skeleton width={100} height={24} />} id={`tab-${i+1}`} />
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