// src/components/CollapsableTable.jsx
import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import FavoriteButton from './FavoriteButton';
import Typography from '@mui/material/Typography';

function formatPercentage(value) {
  return value != null
    ? `${(Number(value) * 100).toFixed(1)}%`
    : '-';
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
  // Remove debug log
  // console.log('Row structure:', a);

  // Handle percentage fields - check for exact field names
  if (orderBy === 'non_commercial_percentage_long' || 
      orderBy === 'commerical_percentage_long' || 
      orderBy === 'non_reportable_percentage_long') {
    const aValue = parseFloat(a[orderBy]) || 0;
    const bValue = parseFloat(b[orderBy]) || 0;
    if (bValue < aValue) return -1;
    if (bValue > aValue) return 1;
    return 0;
  }
  
  // Handle numeric fields
  if (typeof a[orderBy] === 'number' || !isNaN(Number(a[orderBy]))) {
    const aValue = Number(a[orderBy]) || 0;
    const bValue = Number(b[orderBy]) || 0;
    if (bValue < aValue) return -1;
    if (bValue > aValue) return 1;
    return 0;
  }
  
  // Handle string fields (like commodity names)
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

// Inlined "Row" from before:
function Row({ name, data, favorites, onToggleFavorite, order, orderBy, onRequestSort }) {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const fmt = new Intl.NumberFormat('en-US');
  const rows = data.filter(d => name.includes(d.market_code.trim()));
  
  // Move useMemo outside of conditional
  const sortedRows = React.useMemo(() => {
    if (!rows.length) return [];
    return [...rows].sort(getComparator(order, orderBy));
  }, [rows, order, orderBy]);

  if (!rows.length) return null;

  return (
    <React.Fragment>
      <TableRow
        onClick={() => setOpen(o => !o)}
        sx={{
          cursor: 'pointer',
          '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f9f9f9',
          },
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f0f0f0',
          },
        }}
      >
        <TableCell sx={{ width: 50, borderBottom: 'none' }}>
          <IconButton
            size="small"
            onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }} colSpan={21}>
          {name}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={22} sx={{ p: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ 
              overflowX: 'auto',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: '4px',
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 2px 4px rgba(0,0,0,0.2)' 
                : '0 2px 4px rgba(0,0,0,0.05)',
              my: 0.5,
              mx: 0.25,
              maxHeight: '400px',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.mode === 'dark' ? '#444' : '#888',
                borderRadius: '4px',
                '&:hover': {
                  background: theme.palette.mode === 'dark' ? '#555' : '#999',
                },
              },
            }}>
              <Table size="small" aria-label="details" sx={{ 
                borderCollapse: 'separate', 
                borderSpacing: 0,
                '& thead': {
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }
              }}>
                <TableHead>
                  <TableRow sx={{ 
                    backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                    '& th': {
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      fontWeight: 'bold'
                    }
                  }}>
                    <TableCell rowSpan={2} sx={{ 
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000', 
                      minWidth: '120px',
                      backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                    }}>
                      <TableSortLabel
                        active={orderBy === 'commodity'}
                        direction={orderBy === 'commodity' ? order : 'asc'}
                        onClick={() => onRequestSort('commodity')}
                      >
                        Commodity
                      </TableSortLabel>
                    </TableCell>
                    <TableCell colSpan={6} align="center" sx={{ 
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                    }}>Non-commercial</TableCell>
                    <TableCell colSpan={6} align="center" sx={{ 
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                    }}>Commercial</TableCell>
                    <TableCell colSpan={6} align="center" sx={{ 
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                    }}>Non-reportable</TableCell>
                  </TableRow>
                  <TableRow sx={{ 
                    backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                    '& th': {
                      borderBottom: `2px solid ${theme.palette.divider}`,
                      fontWeight: 'bold'
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
                          ...(i === 5 ? { borderRight: `2px solid ${theme.palette.divider}` } : {}),
                          padding: lbl === 'Long' ? '8px 4px 8px 10px' : '8px 4px',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <TableSortLabel
                          active={orderBy === `non_commercial_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase()}`}
                          direction={orderBy === `non_commercial_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase()}` ? order : 'asc'}
                          onClick={() => onRequestSort(`non_commercial_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase()}`)}
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
                          ...(i === 5 ? { borderRight: `2px solid ${theme.palette.divider}` } : {}),
                          padding: lbl === 'Long' ? '8px 4px 8px 10px' : '8px 4px',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <TableSortLabel
                          active={orderBy === `commerical_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase()}`}
                          direction={orderBy === `commerical_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase()}` ? order : 'asc'}
                          onClick={() => onRequestSort(`commerical_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase()}`)}
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
                          active={orderBy === `non_reportable_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase()}`}
                          direction={orderBy === `non_reportable_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase()}` ? order : 'asc'}
                          onClick={() => onRequestSort(`non_reportable_${lbl.toLowerCase() === 'change' ? 'long_change' : lbl.toLowerCase()}`)}
                      >
                        {lbl}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedRows.map(r => (
                    <TableRow
                      key={r.commodity}
                      sx={{
                        '& td': { 
                          border: 'none',
                          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                          position: 'relative'
                        },
                        '&:nth-of-type(odd) td': {
                          backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
                        },
                        '&:nth-of-type(even) td': {
                          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
                        },
                        '&:hover td': {
                          backgroundColor: theme.palette.mode === 'dark' ? '#3c3c3c' : '#e0e0e0',
                          cursor: 'default',
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
                      <TableCell>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          minWidth: '100px',
                          maxWidth: '150px',
                          padding: '4px 2px',
                        }}>
                          <Typography 
                            sx={{ 
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.2,
                              pr: 1,
                              fontSize: '0.75rem'
                            }}
                          >
                            {r.commodity}
                          </Typography>
                          <FavoriteButton
                            initial={favorites.includes(r.commodity)}
                            onToggle={() => onToggleFavorite(r.commodity)}
                          />
                        </Box>
                      </TableCell>

                      {/* Non-commercial */}
                      <TableCell align="left" sx={{ padding: '8px 4px', fontSize: '0.75rem' }}>{fmt.format(r.non_commercial_long)}</TableCell>
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
                          borderRight: `2px solid ${theme.palette.divider}`,
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
                          borderRight: `2px solid ${theme.palette.divider}`,
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
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function CollapsableTable({
  futuresData,
  exchanges,
  favorites,
  onToggleFavorite,
}) {
  const theme = useTheme();
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('commodity');
  const favoriteRows = futuresData.filter(r => favorites.includes(r.commodity));
  const fmt = new Intl.NumberFormat('en-US');
  const [open, setOpen] = React.useState(false);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Sort favorite rows
  const sortedFavoriteRows = React.useMemo(() => {
    return [...favoriteRows].sort(getComparator(order, orderBy));
  }, [favoriteRows, order, orderBy]);

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        boxShadow: 'none',
        maxWidth: '100%',
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.mode === 'dark' ? '#444' : '#888',
          borderRadius: '4px',
          '&:hover': {
            background: theme.palette.mode === 'dark' ? '#555' : '#999',
          },
        },
      }}
    >
      <Table
        size="medium"
        aria-label="collapsible table"
        sx={{ borderCollapse: 'separate', borderSpacing: 0 }}
      >
        <TableBody>
          {favoriteRows.length > 0 && (
            <React.Fragment>
              <TableRow
                onClick={() => setOpen(o => !o)}
                sx={{
                  cursor: 'pointer',
                  '&:nth-of-type(odd)': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f9f9f9',
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f0f0f0',
                  },
                }}
              >
                <TableCell sx={{ width: 50, borderBottom: 'none' }}>
                  <IconButton
                    size="small"
                    onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
                  >
                    {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                  </IconButton>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }} colSpan={21}>
                  FAVORITES
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell colSpan={22} sx={{ p: 0 }}>
                  <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box sx={{ 
                      overflowX: 'auto',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: '4px',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 2px 4px rgba(0,0,0,0.2)' 
                        : '0 2px 4px rgba(0,0,0,0.05)',
                      my: 0.5,
                      mx: 0.25,
                      maxHeight: '400px',
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': {
                        width: '8px',
                        height: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f1f1f1',
                        borderRadius: '4px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: theme.palette.mode === 'dark' ? '#444' : '#888',
                        borderRadius: '4px',
                        '&:hover': {
                          background: theme.palette.mode === 'dark' ? '#555' : '#999',
                        },
                      },
                    }}>
                      <Table
                        size="small"
                        aria-label="My Favorites"
                        sx={{ borderCollapse: 'separate', borderSpacing: 0 }}
                      >
                        <TableHead>
                          <TableRow sx={{ 
                            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                            '& th': {
                              borderBottom: `2px solid ${theme.palette.divider}`,
                              fontWeight: 'bold'
                            }
                          }}>
                            <TableCell rowSpan={2} sx={{ 
                              color: theme.palette.mode === 'dark' ? '#fff' : '#000', 
                              minWidth: '120px',
                              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                            }}>
                              <TableSortLabel
                                active={orderBy === 'commodity'}
                                direction={orderBy === 'commodity' ? order : 'asc'}
                                onClick={() => handleRequestSort('commodity')}
                              >
                                Commodity
                              </TableSortLabel>
                            </TableCell>
                            <TableCell colSpan={6} align="center" sx={{ 
                              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                            }}>
                              Non-commercial
                            </TableCell>
                            <TableCell colSpan={6} align="center" sx={{ 
                              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                            }}>
                              Commercial
                            </TableCell>
                            <TableCell colSpan={6} align="center" sx={{ 
                              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                            }}>
                              Non-reportable
                            </TableCell>
                          </TableRow>
                          <TableRow sx={{ 
                            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                            '& th': {
                              borderBottom: `2px solid ${theme.palette.divider}`,
                              fontWeight: 'bold'
                            }
                          }}>
                            {['Long','Change','Short','Change','Total','% Long'].map((lbl,i) => (
                              <TableCell
                                key={`f-h1-${i}`}
                                sx={{
                                  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                                  minWidth: '80px',
                                  maxWidth: '120px',
                                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                                  ...(i === 5 ? { borderRight: `2px solid ${theme.palette.divider}` } : {}),
                                  padding: '8px 4px',
                                  fontSize: '0.875rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                <TableSortLabel
                                  active={orderBy === `non_commercial_percentage_long`}
                                  direction={orderBy === `non_commercial_percentage_long` ? order : 'asc'}
                                  onClick={() => handleRequestSort(`non_commercial_percentage_long`)}
                              >
                                {lbl}
                                </TableSortLabel>
                              </TableCell>
                            ))}
                            {['Long','Change','Short','Change','Total','% Long'].map((lbl,i) => (
                              <TableCell
                                key={`f-h2-${i}`}
                                sx={{
                                  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                                  minWidth: '80px',
                                  maxWidth: '120px',
                                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                                  ...(i === 5 ? { borderRight: `2px solid ${theme.palette.divider}` } : {}),
                                  padding: '8px 4px',
                                  fontSize: '0.875rem',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                <TableSortLabel
                                  active={orderBy === `commerical_percentage_long`}
                                  direction={orderBy === `commerical_percentage_long` ? order : 'asc'}
                                  onClick={() => handleRequestSort(`commerical_percentage_long`)}
                              >
                                {lbl}
                                </TableSortLabel>
                              </TableCell>
                            ))}
                            {['Long','Change','Short','Change','Total','% Long'].map((lbl,i) => (
                              <TableCell 
                                key={`f-h3-${i}`} 
                                sx={{ 
                                  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                                  minWidth: '80px',
                                  maxWidth: '120px',
                                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                                }}
                              >
                                <TableSortLabel
                                  active={orderBy === `non_reportable_percentage_long`}
                                  direction={orderBy === `non_reportable_percentage_long` ? order : 'asc'}
                                  onClick={() => handleRequestSort(`non_reportable_percentage_long`)}
                              >
                                {lbl}
                                </TableSortLabel>
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sortedFavoriteRows.map(r => (
                            <TableRow
                              key={r.commodity}
                              sx={{
                                '& td': { 
                                  border: 'none',
                                  transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                                  position: 'relative'
                                },
                                '&:nth-of-type(odd) td': {
                                  backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                                },
                                '&:nth-of-type(even) td': {
                                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
                                },
                                '&:hover td': {
                                  backgroundColor: theme.palette.mode === 'dark' ? '#3c3c3c' : '#e0e0e0',
                                  cursor: 'default',
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
                              <TableCell>
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  minWidth: '120px',
                                  maxWidth: '200px',
                                  padding: '8px 4px',
                                }}>
                                  <Typography 
                                    sx={{ 
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      lineHeight: 1.2,
                                      pr: 1,
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    {r.commodity}
                                  </Typography>
                                  <FavoriteButton
                                    initial={favorites.includes(r.commodity)}
                                    onToggle={() => onToggleFavorite(r.commodity)}
                                  />
                                </Box>
                              </TableCell>

                              {/* Non-commercial */}
                              <TableCell align="left">{fmt.format(r.non_commercial_long)}</TableCell>
                              <TableCell
                                align="left"
                                sx={{ color: r.non_commercial_long_change < 0 ? 'red' : 'green' }}
                              >
                                {fmt.format(r.non_commercial_long_change)}
                              </TableCell>
                              <TableCell align="left">{fmt.format(r.non_commercial_short)}</TableCell>
                              <TableCell
                                align="left"
                                sx={{ color: r.non_commercial_short_change < 0 ? 'red' : 'green' }}
                              >
                                {fmt.format(r.non_commercial_short_change)}
                              </TableCell>
                              <TableCell align="left">{fmt.format(r.non_commercial_total)}</TableCell>
                              <TableCell
                                align="left"
                                sx={{
                                  color: getPercentageColor(r.non_commercial_percentage_long),
                                  borderRight: `2px solid ${theme.palette.divider}`,
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
                                }}
                              >
                                {formatPercentage(r.non_commercial_percentage_long)}
                              </TableCell>

                              {/* Commercial */}
                              <TableCell align="left">{fmt.format(r.commerical_long)}</TableCell>
                              <TableCell
                                align="left"
                                sx={{ color: r.commerical_long_change < 0 ? 'red' : 'green' }}
                              >
                                {fmt.format(r.commerical_long_change)}
                              </TableCell>
                              <TableCell align="left">{fmt.format(r.commerical_short)}</TableCell>
                              <TableCell
                                align="left"
                                sx={{ color: r.commerical_short_change < 0 ? 'red' : 'green' }}
                              >
                                {fmt.format(r.commerical_short_change)}
                              </TableCell>
                              <TableCell align="left">{fmt.format(r.commerical_total)}</TableCell>
                              <TableCell
                                align="left"
                                sx={{
                                  color: getPercentageColor(r.commerical_percentage_long),
                                  borderRight: `2px solid ${theme.palette.divider}`,
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
                                }}
                              >
                                {formatPercentage(r.commerical_percentage_long)}
                              </TableCell>

                              {/* Non-reportable */}
                              <TableCell align="left">{fmt.format(r.non_reportable_long)}</TableCell>
                              <TableCell
                                align="left"
                                sx={{ color: r.non_reportable_long_change < 0 ? 'red' : 'green' }}
                              >
                                {fmt.format(r.non_reportable_long_change)}
                              </TableCell>
                              <TableCell align="left">{fmt.format(r.non_reportable_short)}</TableCell>
                              <TableCell
                                align="left"
                                sx={{ color: r.non_reportable_short_change < 0 ? 'red' : 'green' }}
                              >
                                {fmt.format(r.non_reportable_short_change)}
                              </TableCell>
                              <TableCell align="left">{fmt.format(r.non_reportable_total)}</TableCell>
                              <TableCell
                                align="left"
                                sx={{ color: getPercentageColor(r.non_reportable_percentage_long) }}
                              >
                                {formatPercentage(r.non_reportable_percentage_long)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          )}

          {/* then your existing per‐exchange groups */}
          {exchanges.map(e => (
            <Row
              key={e}
              name={e}
              data={futuresData}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}