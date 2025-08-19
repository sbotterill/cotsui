import * as React from 'react';
import { Box, TextField, IconButton, FormControl, InputLabel, Select, MenuItem, CircularProgress, Tooltip, Typography, ListSubheader } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BasicMenu from './ContextMenu';
import { REMOVED_EXCHANGE_CODES } from '../constants';

const CHART_SYMBOL_OPTIONS = [
  {
    group: 'Energies',
    items: [
      { asset_id: 26, value: 'CL', label: 'CL — Crude Oil WTI' },
      { asset_id: 31, value: 'ITCO', label: 'ITCO — Brent Crude' },
      { asset_id: 29, value: 'NG', label: 'NG — Natural Gas' },
      { asset_id: 27, value: 'HO', label: 'HO — NY Harbor ULSD (Heating Oil)' },
      { asset_id: 30, value: 'RB', label: 'RB — RBOB Gasoline' },
      { asset_id: 28, value: 'HU', label: 'HU — Unleaded Gasoline' },
    ]
  },
  {
    group: 'Grains',
    items: [
      { asset_id: 46, value: 'C', label: 'C — Corn' },
      { asset_id: 50, value: 'S', label: 'S — Soybeans' },
      { asset_id: 51, value: 'SM', label: 'SM — Soybean Meal' },
      { asset_id: 45, value: 'BO', label: 'BO — Soybean Oil' },
      { asset_id: 52, value: 'W', label: 'W — Wheat (Chicago SRW)' },
      { asset_id: 47, value: 'KW', label: 'KW — Wheat (KC HRW)' },
      { asset_id: 48, value: 'MW', label: 'MW — Wheat (Minneapolis HRS)' },
      { asset_id: 49, value: 'O', label: 'O — Oats' },
    ]
  },
  {
    group: 'Softs',
    items: [
      { asset_id: 4, value: 'KC', label: 'KC — Coffee' },
      { asset_id: 2, value: 'CC', label: 'CC — Cocoa' },
      { asset_id: 3, value: 'CT', label: 'CT — Cotton' },
      { asset_id: 6, value: 'JO', label: 'OJ — Orange Juice' },
      { asset_id: 7, value: 'SB', label: 'SB — Sugar #11' },
      { asset_id: 5, value: 'LB', label: 'LB — Lumber' },
      { asset_id: 99, value: 'OJ', label: 'OJ — Orange Juice' },
    ]
  },
  {
    group: 'Meats & Dairy',
    items: [
      { asset_id: 8, value: 'FC', label: 'FC — Feeder Cattle' },
      { asset_id: 9, value: 'LC', label: 'LC — Live Cattle' },
      { asset_id: 10, value: 'HE', label: 'HE — Lean Hogs' },
      { asset_id: 11, value: 'DA', label: 'DA — Milk Class III' },
      { asset_id: 92, value: 'LH', label: 'LH — Lean Hogs' },
    ]
  },
  {
    group: 'Metals',
    items: [
      { asset_id: 70, value: 'GC', label: 'GC — Gold' },
      { asset_id: 73, value: 'SI', label: 'SI — Silver' },
      { asset_id: 71, value: 'HG', label: 'HG — Copper' },
      { asset_id: 72, value: 'PL', label: 'PL — Platinum' },
    ]
  },
  {
    group: 'Currencies & Dollar',
    items: [
      { asset_id: 12, value: 'AD', label: 'AD — Australian Dollar' },
      { asset_id: 13, value: 'BP', label: 'BP — British Pound' },
      { asset_id: 14, value: 'CD', label: 'CD — Canadian Dollar' },
      { asset_id: 16, value: 'EU', label: 'EU — Euro FX' },
      { asset_id: 17, value: 'JY', label: 'JY — Japanese Yen' },
      { asset_id: 18, value: 'SF', label: 'SF — Swiss Franc' },
      { asset_id: 15, value: 'DX', label: 'DX — U.S. Dollar Index' },
    ]
  },
  {
    group: 'Stock Indices',
    items: [
      { asset_id: 58, value: 'SP', label: 'SP — S&P 500' },
      { asset_id: 56, value: 'ND', label: 'ND — Nasdaq-100' },
      { asset_id: 53, value: 'DJ', label: 'DJ — Dow Jones Industrials' },
    ]
  },
  {
    group: 'Rates',
    items: [
      { asset_id: 63, value: 'TU', label: 'TU — 2-Year T-Notes' },
      { asset_id: 61, value: 'FV', label: 'FV — 5-Year T-Notes' },
      { asset_id: 64, value: 'TY', label: 'TY — 10-Year T-Notes' },
      { asset_id: 65, value: 'US', label: 'US — 30-Year T-Bonds' },
      { asset_id: 60, value: 'ED', label: 'ED — Eurodollars' },
    ]
  },
  {
    group: 'Other',
    items: [
      { asset_id: 1, value: 'RR', label: 'RR — Rough Rice' },
      { asset_id: 54, value: 'KV', label: 'KV — (KCBT Index)' },
      { asset_id: 55, value: 'MV', label: 'MV — Value Line (Mini)' },
      { asset_id: 57, value: 'RL', label: 'RL — (CME Index code)' },
      { asset_id: 59, value: 'YU', label: 'YU — NYSE Composite (legacy NYFE)' },
      { asset_id: 62, value: 'MB', label: 'MB — Municipal Bonds' },
      { asset_id: 93, value: 'PB', label: 'PB — Pork Bellies (legacy)' },
      { asset_id: 100, value: 'RS', label: 'RS — Canola' },
      { asset_id: 101, value: 'LCC', label: 'LCC — London Cocoa (ICE EU)' },
      { asset_id: 102, value: 'LSU', label: 'LSU — London Sugar (ICE EU)' },
    ]
  }
];

export default function HeaderActions(props) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showNoResults, setShowNoResults] = React.useState(false);
  const isChart = props.activeSection === 'chart';

  const displayOnlyName = (label) => {
    if (!label) return '';
    const emDash = label.indexOf('—');
    if (emDash !== -1) return label.slice(emDash + 1).trim();
    const hy = label.indexOf(' - ');
    if (hy !== -1) return label.slice(hy + 3).trim();
    return label;
  };
  const getLabelById = (id) => {
    for (const g of CHART_SYMBOL_OPTIONS) {
      const found = g.items.find(it => it.asset_id === id);
      if (found) return displayOnlyName(found.label);
    }
    return '';
  };

  const formatDateOption = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    props.setFilteredData(props.futuresData);
    const all = props.userExchanges.map(g => (g || '').trim());
    props.onExchangeFilterChange(all, false);
    setShowNoResults(false);
  };

  const handleFuturesFilter = (event) => {
    try {
      const searchValue = event.target.value.toLowerCase();
      setSearchTerm(event.target.value);
      if (!searchValue) {
        handleClearSearch();
        return;
      }
      const filtered = props.futuresData
        .filter(row => !REMOVED_EXCHANGE_CODES.includes((row.market_code || '').trim()))
        .filter(row => row.commodity.toLowerCase().includes(searchValue));
      props.setFilteredData(filtered);
      setShowNoResults(filtered.length === 0);
    } catch (error) {
      handleClearSearch();
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {!isChart && (
      <TextField
        onChange={handleFuturesFilter}
        value={searchTerm}
        size="small"
        label="Search"
        variant="outlined"
        sx={{ minWidth: 220 }}
        InputLabelProps={{ style: { color: 'inherit' } }}
        InputProps={{
          style: { color: 'inherit' },
          endAdornment: searchTerm && (
            <IconButton size="small" onClick={handleClearSearch} sx={{ p: '2px' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )
        }}
      />)}
      {isChart ? (
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="chart-symbol-label">Symbol</InputLabel>
          <Select
            labelId="chart-symbol-label"
            value={props.chartAssetId || 26}
            label="Symbol"
            onChange={(e) => props.onChartAssetChange?.(Number(e.target.value))}
            renderValue={(val) => getLabelById(val)}
          >
            {CHART_SYMBOL_OPTIONS.map(group => (
              [
                <ListSubheader key={`h-${group.group}`}>{group.group}</ListSubheader>,
                ...group.items.map(opt => (
                  <MenuItem key={opt.asset_id} value={opt.asset_id}>{displayOnlyName(opt.label)}</MenuItem>
                ))
              ]
            ))}
          </Select>
        </FormControl>
      ) : (
        <>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="date-select-label">Report Date</InputLabel>
            <Select
              labelId="date-select-label"
              id="date-select"
              value={props.selectedDate || ''}
              label="Report Date"
              onChange={(e) => props.onDateChange(e.target.value)}
              disabled={props.isDateLoading}
              endAdornment={
                props.isDateLoading ? (
                  <CircularProgress size={20} sx={{ position: 'absolute', right: 25, color: theme.palette.primary.main }} />
                ) : null
              }
            >
              {props.availableDates.map((date) => (
                <MenuItem key={date} value={date}>
                  {formatDateOption(date)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title={
            <React.Fragment>
              <Typography variant="body2" component="div">• This week's data available for selection Friday 3:30 PM EST</Typography>
              <Typography variant="body2" component="div">• Only Tuesdays are available for selection</Typography>
            </React.Fragment>
          }>
            <InfoOutlinedIcon sx={{ fontSize: '1.2rem', color: theme.palette.text.secondary, cursor: 'help' }} />
          </Tooltip>
          <BasicMenu
            commodities={props.exchanges}
            selected={props.displayExchanges}
            onFilterChange={props.onExchangeFilterChange}
          />
        </>
      )}
    </Box>
  );
}


