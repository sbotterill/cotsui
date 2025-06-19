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
import { ALLOWED_EXCHANGES, isValidExchange } from '../constants';

function formatPercentage(value) {
  if (value == null) return '-';
  // Convert to number and format to 1 decimal place
  const numValue = Number(value);
  if (isNaN(numValue)) return '-';
  return `${(numValue * 100).toFixed(1)}%`;
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
      orderBy === 'non_reportable_percentage_long') {
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

export default function TabbedTable({
  futuresData,
  exchanges,
  favorites,
  onToggleFavorite,
  onCommoditySelect,
}) {
  const theme = useTheme();
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('commodity');
  const [selectedTab, setSelectedTab] = React.useState(0);
  const [selectedCommodity, setSelectedCommodity] = React.useState(null);
  const [initialLoadDone, setInitialLoadDone] = React.useState(false);
  const fmt = new Intl.NumberFormat('en-US');

  // Filter exchanges to only include allowed ones
  const filteredExchanges = React.useMemo(() => 
    exchanges.filter(exchange => {
      // No need to filter anymore, we're handling consolidation in fetchData
      return true;
    }), [exchanges]);

  // Handle initial load behavior
  React.useEffect(() => {
    const shouldInitialize = !initialLoadDone && futuresData.length > 0 && filteredExchanges.length > 0;
    
    if (shouldInitialize) {
      const initializeSelection = () => {
        if (favorites.length > 0) {
          // If user has favorites, select favorites tab and first favorite item
          setSelectedTab(0);
          const firstFavorite = futuresData.find(d => favorites.includes(d.commodity));
          if (firstFavorite && onCommoditySelect) {
            onCommoditySelect(firstFavorite.contract_code, firstFavorite.commodity);
          }
        } else {
          // If no favorites, select first exchange tab and first item
          setSelectedTab(1);
          const firstExchange = filteredExchanges[0];
          const firstExchangeData = getFilteredData(firstExchange);
          if (firstExchangeData.length > 0 && onCommoditySelect) {
            const firstItem = firstExchangeData[0];
            onCommoditySelect(firstItem.contract_code, firstItem.commodity);
          }
        }
        setInitialLoadDone(true);
      };

      initializeSelection();
    }
  }, [favorites, filteredExchanges, futuresData, onCommoditySelect, initialLoadDone]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const getFilteredData = (exchange) => {
    if (!exchange) {
      return [];
    }

    if (exchange === 'Favorites') {
      const filtered = futuresData?.filter(d => favorites.includes(d.commodity)) || [];
      return filtered;
    }
    
    // Extract the market code from the exchange name (format: "CODE - EXCHANGE NAME")
    const parts = exchange.split(' - ');
    if (parts.length < 2) {
      return [];
    }
    
    const exchangePrefix = parts[0].trim();
    
    // Try to match the market code prefix with the data
    const filtered = futuresData?.filter(d => {
      const dataMarketCode = d.market_code?.trim() || '';
      return dataMarketCode.startsWith(exchangePrefix);
    }) || [];
    
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

  const renderTable = () => {
    return (
      <Table size="small" aria-label="futures data" sx={{ 
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        minWidth: '100%',
        border: `1px solid ${theme.palette.divider}`,
        '& .MuiTableCell-root': {
          paddingLeft: '2px',
        },
        '& thead': {
          position: 'sticky',
          top: '-1px',
          zIndex: 1
        },
        '& .MuiTableSortLabel-root': {
          width: '100%',
          justifyContent: 'flex-start'
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
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                Commodity
              </TableSortLabel>
            </TableCell>
            <TableCell colSpan={6} align="center" sx={{ 
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
              paddingLeft: '2px'
            }}>Non-commercial</TableCell>
            <TableCell colSpan={6} align="center" sx={{ 
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
              paddingLeft: '2px'
            }}>Commercial</TableCell>
            <TableCell colSpan={6} align="center" sx={{ 
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
            {['Long','Change','Short','Change','Total','% Long'].map((lbl,i) => (
              <TableCell
                key={`h1-${i}`}
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
                  active={orderBy === `non_commercial_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase().replace('% ', 'percentage_')}`}
                  direction={orderBy === `non_commercial_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase().replace('% ', 'percentage_')}` ? order : 'asc'}
                  onClick={() => handleRequestSort(`non_commercial_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase().replace('% ', 'percentage_')}`)}
                >
                  {lbl}
                </TableSortLabel>
              </TableCell>
            ))}
            {['Long','Change','Short','Change','Total','% Long'].map((lbl,i) => (
              <TableCell
                key={`h2-${i}`}
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
                  active={orderBy === `commerical_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase().replace('% ', 'percentage_')}`}
                  direction={orderBy === `commerical_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase().replace('% ', 'percentage_')}` ? order : 'asc'}
                  onClick={() => handleRequestSort(`commerical_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase().replace('% ', 'percentage_')}`)}
                >
                  {lbl}
                </TableSortLabel>
              </TableCell>
            ))}
            {['Long','Change','Short','Change','Total','% Long'].map((lbl,i) => (
              <TableCell 
                key={`h3-${i}`} 
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
                  active={orderBy === `non_reportable_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase().replace('% ', 'percentage_')}`}
                  direction={orderBy === `non_reportable_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase().replace('% ', 'percentage_')}` ? order : 'asc'}
                  onClick={() => handleRequestSort(`non_reportable_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase().replace('% ', 'percentage_')}`)}
                >
                  {lbl}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map(r => (
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

              {/* Non-commercial */}
              <TableCell align="left" sx={{ 
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
              <TableCell align="left" sx={{ color: r.non_commercial_long_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                {fmt.format(r.non_commercial_long_change)}
              </TableCell>
              <TableCell align="left" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.non_commercial_short)}</TableCell>
              <TableCell align="left" sx={{ color: r.non_commercial_short_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                {fmt.format(r.non_commercial_short_change)}
              </TableCell>
              <TableCell align="left" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.non_commercial_total)}</TableCell>
              <TableCell
                align="left"
                sx={{
                  color: getPercentageColor(r.non_commercial_percentage_long),
                  position: 'relative',
                  padding: '8px 4px',
                  fontSize: '0.75rem',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: 0,
                    top: '10%',
                    height: '80%',
                    width: '1px',
                    backgroundColor: theme.palette.divider
                  }
                }}
              >
                {formatPercentage(r.non_commercial_percentage_long)}
              </TableCell>

              {/* Commercial */}
              <TableCell align="left" sx={{ padding: '8px 4px 8px 10px', fontSize: '0.75rem' }}>{fmt.format(r.commerical_long)}</TableCell>
              <TableCell align="left" sx={{ color: r.commerical_long_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                {fmt.format(r.commerical_long_change)}
              </TableCell>
              <TableCell align="left" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.commerical_short)}</TableCell>
              <TableCell align="left" sx={{ color: r.commerical_short_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                {fmt.format(r.commerical_short_change)}
              </TableCell>
              <TableCell align="left" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.commerical_total)}</TableCell>
              <TableCell
                align="left"
                sx={{
                  color: getPercentageColor(r.commerical_percentage_long),
                  position: 'relative',
                  padding: '8px 4px',
                  fontSize: '0.75rem',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: 0,
                    top: '10%',
                    height: '80%',
                    width: '1px',
                    backgroundColor: theme.palette.divider
                  }
                }}
              >
                {formatPercentage(r.commerical_percentage_long)}
              </TableCell>

              {/* Non-reportable */}
              <TableCell align="left" sx={{ padding: '8px 4px 8px 10px', fontSize: '0.75rem' }}>{fmt.format(r.non_reportable_long)}</TableCell>
              <TableCell align="left" sx={{ color: r.non_reportable_long_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                {fmt.format(r.non_reportable_long_change)}
              </TableCell>
              <TableCell align="left" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.non_reportable_short)}</TableCell>
              <TableCell align="left" sx={{ color: r.non_reportable_short_change < 0 ? 'red' : 'green', padding: '8px 4px', fontSize: '0.75rem' }}>
                {fmt.format(r.non_reportable_short_change)}
              </TableCell>
              <TableCell align="left" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.non_reportable_total)}</TableCell>
              <TableCell align="left" sx={{ color: getPercentageColor(r.non_reportable_percentage_long), padding: '8px 4px', fontSize: '0.75rem' }}>
                {formatPercentage(r.non_reportable_percentage_long)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      height: '45vh',
      borderRadius: 1,
      overflow: 'hidden' // Prevent content from spilling out
    }}>
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
      }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              textTransform: 'none',
              minWidth: 100,
              fontSize: '0.875rem',
            },
            '& .Mui-selected': {
              color: theme.palette.primary.main,
            },
          }}
        >
          <Tab 
            key="favorites" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Favorites</span>
                {favorites.length > 0 && (
                  <Box
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      borderRadius: '12px',
                      padding: '0 8px',
                      fontSize: '0.75rem',
                      minWidth: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {favorites.length}
                  </Box>
                )}
              </Box>
            } 
            id="tab-0" 
          />
          {filteredExchanges.map((exchange, index) => (
            <Tab key={exchange} label={exchange} id={`tab-${index + 1}`} />
          ))}
        </Tabs>
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