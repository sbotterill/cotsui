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
import Paper from '@mui/material/Paper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import FavoriteButton from './FavoriteButton';

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

// Inlined "Row" from before:
function Row({ name, data, favorites, onToggleFavorite }) {
  const [open, setOpen] = React.useState(false);
  const theme = useTheme();
  const fmt = new Intl.NumberFormat('en-US');
  const rows = data.filter(d => name.includes(d.market_code.trim()));
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
              my: 1,
              mx: 0.5,
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
                      minWidth: '150px',
                      backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                    }}>Commodity</TableCell>
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
                          minWidth: '100px',
                          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                          ...(i === 5 ? { borderRight: `2px solid ${theme.palette.divider}` } : {})
                        }}
                      >
                        {lbl}
                      </TableCell>
                    ))}
                    {['Long','Change','Short','Change','Total','% Long'].map((lbl,i) => (
                      <TableCell
                        key={`h2-${i}`}
                        sx={{
                          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                          minWidth: '100px',
                          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                          ...(i === 5 ? { borderRight: `2px solid ${theme.palette.divider}` } : {})
                        }}
                      >
                        {lbl}
                      </TableCell>
                    ))}
                    {['Long','Change','Short','Change','Total','% Long'].map((lbl,i) => (
                      <TableCell 
                        key={`h3-${i}`} 
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                          minWidth: '100px',
                          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                        }}
                      >
                        {lbl}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(r => (
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
                        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          {r.commodity}
                          <FavoriteButton
                            initial={favorites.includes(r.commodity)}
                            onToggle={() => onToggleFavorite(r.commodity)}
                          />
                        </Box>
                      </TableCell>

                      {/* Non-commercial */}
                      <TableCell align="right">{fmt.format(r.non_commercial_long)}</TableCell>
                      <TableCell align="right" sx={{ color: r.non_commercial_long_change < 0 ? 'red' : 'green' }}>
                        {fmt.format(r.non_commercial_long_change)}
                      </TableCell>
                      <TableCell align="right">{fmt.format(r.non_commercial_short)}</TableCell>
                      <TableCell align="right" sx={{ color: r.non_commercial_short_change < 0 ? 'red' : 'green' }}>
                        {fmt.format(r.non_commercial_short_change)}
                      </TableCell>
                      <TableCell align="right">{fmt.format(r.non_commercial_total)}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: getPercentageColor(r.non_commercial_percentage_long),
                          borderRight: `2px solid ${theme.palette.divider}`,
                        }}
                      >
                        {formatPercentage(r.non_commercial_percentage_long)}
                      </TableCell>

                      {/* Commercial */}
                      <TableCell align="right">{fmt.format(r.commerical_long)}</TableCell>
                      <TableCell align="right" sx={{ color: r.commerical_long_change < 0 ? 'red' : 'green' }}>
                        {fmt.format(r.commerical_long_change)}
                      </TableCell>
                      <TableCell align="right">{fmt.format(r.commerical_short)}</TableCell>
                      <TableCell align="right" sx={{ color: r.commerical_short_change < 0 ? 'red' : 'green' }}>
                        {fmt.format(r.commerical_short_change)}
                      </TableCell>
                      <TableCell align="right">{fmt.format(r.commerical_total)}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: getPercentageColor(r.commerical_percentage_long),
                          borderRight: `2px solid ${theme.palette.divider}`,
                        }}
                      >
                        {formatPercentage(r.commerical_percentage_long)}
                      </TableCell>

                      {/* Non-reportable */}
                      <TableCell align="right">{fmt.format(r.non_reportable_long)}</TableCell>
                      <TableCell align="right" sx={{ color: r.non_reportable_long_change < 0 ? 'red' : 'green' }}>
                        {fmt.format(r.non_reportable_long_change)}
                      </TableCell>
                      <TableCell align="right">{fmt.format(r.non_reportable_short)}</TableCell>
                      <TableCell align="right" sx={{ color: r.non_reportable_short_change < 0 ? 'red' : 'green' }}>
                        {fmt.format(r.non_reportable_short_change)}
                      </TableCell>
                      <TableCell align="right">{fmt.format(r.non_reportable_total)}</TableCell>
                      <TableCell align="right" sx={{ color: getPercentageColor(r.non_reportable_percentage_long) }}>
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
  const favoriteRows = futuresData.filter(r => favorites.includes(r.commodity));
  const fmt = new Intl.NumberFormat('en-US');
  const [open, setOpen] = React.useState(false);

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        boxShadow: 'none',
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
                      my: 1,
                      mx: 0.5,
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
                              minWidth: '150px',
                              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                            }}>Commodity</TableCell>
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
                                  minWidth: '100px',
                                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                                  ...(i === 5 ? { borderRight: `2px solid ${theme.palette.divider}` } : {})
                                }}
                              >
                                {lbl}
                              </TableCell>
                            ))}
                            {['Long','Change','Short','Change','Total','% Long'].map((lbl,i) => (
                              <TableCell
                                key={`f-h2-${i}`}
                                sx={{
                                  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                                  minWidth: '100px',
                                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                                  ...(i === 5 ? { borderRight: `2px solid ${theme.palette.divider}` } : {})
                                }}
                              >
                                {lbl}
                              </TableCell>
                            ))}
                            {['Long','Change','Short','Change','Total','% Long'].map((lbl,i) => (
                              <TableCell 
                                key={`f-h3-${i}`} 
                                sx={{ 
                                  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                                  minWidth: '100px',
                                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                                }}
                              >
                                {lbl}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {favoriteRows.map(r => (
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
                                <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                  {r.commodity}
                                  <FavoriteButton
                                    initial={favorites.includes(r.commodity)}
                                    onToggle={() => onToggleFavorite(r.commodity)}
                                  />
                                </Box>
                              </TableCell>

                              {/* Non-commercial */}
                              <TableCell align="right">{fmt.format(r.non_commercial_long)}</TableCell>
                              <TableCell
                                align="right"
                                sx={{ color: r.non_commercial_long_change < 0 ? 'red' : 'green' }}
                              >
                                {fmt.format(r.non_commercial_long_change)}
                              </TableCell>
                              <TableCell align="right">{fmt.format(r.non_commercial_short)}</TableCell>
                              <TableCell
                                align="right"
                                sx={{ color: r.non_commercial_short_change < 0 ? 'red' : 'green' }}
                              >
                                {fmt.format(r.non_commercial_short_change)}
                              </TableCell>
                              <TableCell align="right">{fmt.format(r.non_commercial_total)}</TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  color: getPercentageColor(r.non_commercial_percentage_long),
                                  borderRight: `2px solid ${theme.palette.divider}`,
                                }}
                              >
                                {formatPercentage(r.non_commercial_percentage_long)}
                              </TableCell>

                              {/* Commercial */}
                              <TableCell align="right">{fmt.format(r.commerical_long)}</TableCell>
                              <TableCell
                                align="right"
                                sx={{ color: r.commerical_long_change < 0 ? 'red' : 'green' }}
                              >
                                {fmt.format(r.commerical_long_change)}
                              </TableCell>
                              <TableCell align="right">{fmt.format(r.commerical_short)}</TableCell>
                              <TableCell
                                align="right"
                                sx={{ color: r.commerical_short_change < 0 ? 'red' : 'green' }}
                              >
                                {fmt.format(r.commerical_short_change)}
                              </TableCell>
                              <TableCell align="right">{fmt.format(r.commerical_total)}</TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  color: getPercentageColor(r.commerical_percentage_long),
                                  borderRight: `2px solid ${theme.palette.divider}`,
                                }}
                              >
                                {formatPercentage(r.commerical_percentage_long)}
                              </TableCell>

                              {/* Non-reportable */}
                              <TableCell align="right">{fmt.format(r.non_reportable_long)}</TableCell>
                              <TableCell
                                align="right"
                                sx={{ color: r.non_reportable_long_change < 0 ? 'red' : 'green' }}
                              >
                                {fmt.format(r.non_reportable_long_change)}
                              </TableCell>
                              <TableCell align="right">{fmt.format(r.non_reportable_short)}</TableCell>
                              <TableCell
                                align="right"
                                sx={{ color: r.non_reportable_short_change < 0 ? 'red' : 'green' }}
                              >
                                {fmt.format(r.non_reportable_short_change)}
                              </TableCell>
                              <TableCell align="right">{fmt.format(r.non_reportable_total)}</TableCell>
                              <TableCell
                                align="right"
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
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}