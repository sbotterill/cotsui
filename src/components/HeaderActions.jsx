import * as React from 'react';
import { Box, TextField, IconButton, FormControl, InputLabel, Select, MenuItem, CircularProgress, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BasicMenu from './ContextMenu';
import { REMOVED_EXCHANGE_CODES } from '../constants';
import Autocomplete from '@mui/material/Autocomplete';

// Default fallback symbols (used while loading from API)
const DEFAULT_SYMBOL_OPTIONS = [
  { value: 'CL', label: 'CL — Crude Oil Futures' },
  { value: 'GC', label: 'GC — Gold Futures' },
  { value: 'ES', label: 'ES — E-mini S&P 500 Futures' },
  { value: 'NQ', label: 'NQ — E-mini Nasdaq-100 Futures' },
];

function HeaderActions(props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Support controlled search via props, fallback to internal state
  const isControlled = Object.prototype.hasOwnProperty.call(props, 'searchTerm');
  const [internalSearchTerm, setInternalSearchTerm] = React.useState('');
  const searchTerm = isControlled ? (props.searchTerm ?? '') : internalSearchTerm;
  const setSearch = (value) => {
    if (isControlled) {
      props.onSearchTermChange?.(value);
    } else {
      setInternalSearchTerm(value);
    }
  };
  const [showNoResults, setShowNoResults] = React.useState(false);
  const isChart = props.activeSection === 'chart' || props.activeSection === 'seasonality';
  const isAIAgent = props.activeSection === 'ai-agent';

  // AI Agent section should have no toolbar content (just hamburger menu from layout)
  if (isAIAgent) {
    return null;
  }

  const displayOnlyName = (label) => {
    if (!label) return '';
    const emDash = label.indexOf('—');
    if (emDash !== -1) return label.slice(emDash + 1).trim();
    const hy = label.indexOf(' - ');
    if (hy !== -1) return label.slice(hy + 3).trim();
    return label;
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
    setSearch('');
    // Restore full dataset without throwing if props are momentarily undefined
    const fullData = Array.isArray(props.futuresData) ? props.futuresData : [];
    props.setFilteredData(fullData);
    setShowNoResults(false);
  };

  const handleFuturesFilter = (event) => {
    const raw = event?.target?.value ?? '';
    setSearch(raw);
    const searchValue = String(raw).toLowerCase();

    if (!searchValue) {
      handleClearSearch();
      return;
    }

    try {
      const source = Array.isArray(props.futuresData) ? props.futuresData : [];
      const filtered = source
        .filter(row => row && !REMOVED_EXCHANGE_CODES.includes((row.market_code || '').trim()))
        .filter(row => (row.commodity || '').toLowerCase().includes(searchValue));
      props.setFilteredData(filtered);
      setShowNoResults(filtered.length === 0);
    } catch (error) {
      // Do not clear user input on benign errors; just show all data
      props.setFilteredData(Array.isArray(props.futuresData) ? props.futuresData : []);
      setShowNoResults(false);
    }
  };

  // Use dynamic symbols from props, fallback to defaults
  const flatOptions = props.seasonalitySymbols?.length > 0 ? props.seasonalitySymbols : DEFAULT_SYMBOL_OPTIONS;
  const selectedOption = flatOptions.find(o => o.value === (props.selectedSymbol || 'CL')) || flatOptions[0] || null;

  return (
    <Box
      sx={{
        display: isMobile && isChart ? 'none' : 'flex',
        alignItems: isMobile ? 'stretch' : 'center',
        flexWrap: 'wrap',
        columnGap: isMobile ? 1 : 1.5,
        rowGap: 1,
        width: isMobile ? '100%' : 'auto',
        maxWidth: '100%',
        justifyContent: isChart ? 'flex-end' : (isMobile ? 'center' : 'flex-start'),
        ...(isMobile && {
          position: 'sticky',
          top: { xs: '56px', sm: '64px' },
          zIndex: 4,
          backgroundColor: theme.palette.background.default,
          py: 1.5,
          px: 2,
          width: '100%',
          maxWidth: '100%',
          left: 0,
          right: 0,
          margin: 0
        })
      }}
    >
      {!isChart && (
      <TextField
        onChange={handleFuturesFilter}
        value={searchTerm}
        size="small"
        label="Search"
        variant="outlined"
        fullWidth={isMobile}
        sx={{
          minWidth: isMobile ? '100%' : 220,
          maxWidth: isMobile ? '100%' : 220,
          flex: isMobile ? '1 1 100%' : '0 0 auto'
        }}
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
        <FormControl size="small" sx={{ minWidth: isMobile ? 140 : 280, flex: isMobile ? '1 1 100%' : '0 0 auto' }}>
          <Autocomplete
            options={flatOptions}
            autoHighlight
            size="small"
            getOptionLabel={(opt) => {
              if (!opt?.label) return '';
              return isMobile ? opt.value : opt.label;
            }}
            value={selectedOption}
            onChange={(_, opt) => {
              const sym = opt?.value || null;
              props.onChartSelectionChange?.({ symbol: sym });
            }}
            renderInput={(params) => (
              <TextField {...params} label="Symbol" placeholder={isMobile ? "Symbol" : "Type to search..."} />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                {isMobile ? `${option.value} — ${displayOnlyName(option.label)}` : option.label}
              </li>
            )}
            isOptionEqualToValue={(o, v) => o?.value === v?.value}
          />
        </FormControl>
      ) : (
        <>
          <FormControl
            size="small"
            fullWidth={isMobile}
            sx={{
              minWidth: isMobile ? '100%' : 220,
              maxWidth: isMobile ? '100%' : 220,
              flex: isMobile ? '1 1 100%' : '0 0 auto'
            }}
          >
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
          {!isMobile && (
            <Tooltip title={
              <React.Fragment>
                <Typography variant="body2" component="div">• This week's data available for selection Friday 3:30 PM EST</Typography>
                <Typography variant="body2" component="div">• Only Tuesdays are available for selection</Typography>
              </React.Fragment>
            }>
              <InfoOutlinedIcon sx={{ fontSize: '1.2rem', color: theme.palette.text.secondary, cursor: 'help' }} />
            </Tooltip>
          )}
          {!isMobile && (
            <Box
              sx={{
                display: 'flex',
                flex: '0 0 auto',
                justifyContent: 'flex-start'
              }}
            >
              <BasicMenu
                commodities={props.exchanges}
                selected={props.displayExchanges}
                onFilterChange={props.onExchangeFilterChange}
              />
            </Box>
          )}
        </>
      )}
      {props.activeSection === 'seasonality' && (
        <>
          <FormControl size="small" sx={{ minWidth: isMobile ? 100 : 140, flex: isMobile ? '1 1 45%' : '0 0 auto' }}>
            <InputLabel id="seasonality-lookback-label">Lookback</InputLabel>
            <Select
              labelId="seasonality-lookback-label"
              value={props.seasonalityLookback || 10}
              label="Lookback"
              onChange={(e) => props.onSeasonalityLookbackChange?.(Number(e.target.value))}
            >
              <MenuItem value={10}>10 years</MenuItem>
              <MenuItem value={5}>5 years</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: isMobile ? 100 : 180, flex: isMobile ? '1 1 45%' : '0 0 auto' }}>
            <InputLabel id="seasonality-cycle-label">Cycle</InputLabel>
            <Select
              labelId="seasonality-cycle-label"
              value={props.seasonalityCycle || 'all'}
              label="Cycle"
              onChange={(e) => props.onSeasonalityCycleChange?.(e.target.value)}
            >
              <MenuItem value={'all'}>All years</MenuItem>
              <MenuItem value={'pre'}>Pre-election</MenuItem>
              <MenuItem value={'election'}>Election</MenuItem>
              <MenuItem value={'post'}>Post-election</MenuItem>
              <MenuItem value={'midterm'}>Midterm</MenuItem>
            </Select>
          </FormControl>
          {!isMobile && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  size="small"
                  type="date"
                  label="Start"
                  InputLabelProps={{ shrink: true }}
                  value={props.seasonalityStartDate || ''}
                  onChange={(e) => props.onSeasonalityCustomRangeChange?.({ start: e.target.value || null, end: props.seasonalityEndDate || null })}
                />
                <TextField
                  size="small"
                  type="date"
                  label="End"
                  InputLabelProps={{ shrink: true }}
                  value={props.seasonalityEndDate || ''}
                  onChange={(e) => props.onSeasonalityCustomRangeChange?.({ start: props.seasonalityStartDate || null, end: e.target.value || null })}
                />
              </Box>
              {props.seasonalityEffectiveRange?.from && props.seasonalityEffectiveRange?.to && (
                <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                  Using: {props.seasonalityEffectiveRange.from} – {props.seasonalityEffectiveRange.to}
                </Typography>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
}

export default React.memo(HeaderActions);
