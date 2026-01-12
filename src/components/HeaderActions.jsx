import * as React from 'react';
import { Box, TextField, IconButton, FormControl, InputLabel, Select, MenuItem, CircularProgress, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BasicMenu from './ContextMenu';
import { REMOVED_EXCHANGE_CODES } from '../constants';
import Autocomplete from '@mui/material/Autocomplete';
import { SearchContext } from '../App';

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
  // Use context for search state to avoid focus loss from component remounting
  const searchContext = React.useContext(SearchContext);
  const searchTerm = searchContext?.searchTerm ?? '';
  const setSearch = searchContext?.setSearchTerm ?? (() => {});
  // Get filteredData from context as well
  const filteredDataFromContext = searchContext?.filteredData;
  const [showNoResults, setShowNoResults] = React.useState(false);
  const isChart = props.activeSection === 'chart' || props.activeSection === 'seasonality';
  const isSeasonality = props.activeSection === 'seasonality';
  const isAIAgent = props.activeSection === 'ai-agent';
  const isMobileChartView = isMobile && props.activeSection === 'cots-report' && props.mobileView === 'chart';
  const isMobileSeasonality = isMobile && isSeasonality;

  // Use dynamic symbols from props, fallback to defaults (must be before early return for hooks)
  const flatOptions = props.seasonalitySymbols?.length > 0 ? props.seasonalitySymbols : DEFAULT_SYMBOL_OPTIONS;
  const selectedOption = flatOptions.find(o => o.value === (props.selectedSymbol || 'CL')) || flatOptions[0] || null;

  // Compute available lookback years based on the selected symbol's data range
  const availableLookbackYears = React.useMemo(() => {
    if (!selectedOption?.firstDate) {
      // Default options when no date info available
      return [5, 10];
    }
    
    const firstDate = new Date(selectedOption.firstDate);
    const lastDate = selectedOption.lastDate ? new Date(selectedOption.lastDate) : new Date();
    const yearsAvailable = Math.floor((lastDate - firstDate) / (365.25 * 24 * 60 * 60 * 1000));
    
    // Generate lookback options: 5, 10, 15, 20, etc. up to available years
    const options = [];
    const possibleYears = [3, 5, 7, 10, 15, 20, 25, 30];
    
    for (const y of possibleYears) {
      if (y <= yearsAvailable) {
        options.push(y);
      }
    }
    
    // Always include at least one option (the max available if less than 5 years)
    if (options.length === 0 && yearsAvailable >= 1) {
      options.push(yearsAvailable);
    } else if (options.length === 0) {
      options.push(5); // fallback
    }
    
    // Add a "Max" option if yearsAvailable is greater than the largest standard option
    // and isn't already in the list
    if (yearsAvailable > (options[options.length - 1] || 0) && !options.includes(yearsAvailable)) {
      options.push(yearsAvailable);
    }
    
    return options;
  }, [selectedOption?.firstDate, selectedOption?.lastDate]);

  // Auto-adjust lookback if current value exceeds available years
  React.useEffect(() => {
    if (props.activeSection === 'seasonality' && availableLookbackYears.length > 0) {
      const currentLookback = props.seasonalityLookback || 10;
      const maxAvailable = Math.max(...availableLookbackYears);
      
      // If current lookback exceeds available, switch to max available
      if (currentLookback > maxAvailable) {
        props.onSeasonalityLookbackChange?.(maxAvailable);
      }
      // If current lookback is not in the options, pick the closest available
      else if (!availableLookbackYears.includes(currentLookback)) {
        // Find the closest option that doesn't exceed current preference
        const closest = availableLookbackYears.reduce((prev, curr) => 
          Math.abs(curr - currentLookback) < Math.abs(prev - currentLookback) ? curr : prev
        );
        props.onSeasonalityLookbackChange?.(closest);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption?.value, availableLookbackYears, props.activeSection]);

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

  return (
    <Box
      sx={{
        // Hide on mobile for chart section only, not seasonality
        display: (isMobile && isChart && !isSeasonality) ? 'none' : 'flex',
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
      {/* Mobile Chart View: Show commodity dropdown instead of search */}
      {isMobileChartView && filteredDataFromContext?.length > 0 && (
        <Autocomplete
          size="small"
          options={[...(filteredDataFromContext || [])].sort((a, b) => (a.commodity || '').localeCompare(b.commodity || ''))}
          getOptionLabel={(option) => option.commodity || ''}
          value={filteredDataFromContext?.find(item => item.commodity === props.selectedCommodity) || null}
          onChange={(event, newValue) => {
            if (newValue) {
              props.onCommoditySelect?.(newValue.contract_code, newValue.commodity);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select commodity..."
              size="small"
            />
          )}
          sx={{
            flex: '1 1 100%',
            '& .MuiAutocomplete-inputRoot': {
              height: '40px',
            }
          }}
        />
      )}
      {/* Desktop or Mobile Table View: Show search field */}
      {!isChart && !isMobileChartView && (
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
      {isChart && !isMobileSeasonality ? (
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
      ) : !isMobileSeasonality && (
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
          {/* Symbol selector - full width on mobile, first row */}
          {isMobileSeasonality && (
            <Autocomplete
              size="small"
              options={flatOptions}
              value={selectedOption}
              onChange={(_, option) => props.onChartSelectionChange?.({ symbol: option?.value || 'CL' })}
              getOptionLabel={(option) => option?.label || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Symbol"
                  size="small"
                />
              )}
              sx={{
                flex: '1 1 100%',
                mb: 0.5,
                '& .MuiAutocomplete-inputRoot': {
                  height: '40px',
                }
              }}
            />
          )}
          <FormControl size="small" sx={{ minWidth: isMobile ? 100 : 140, flex: isMobile ? '1 1 45%' : '0 0 auto' }}>
            <InputLabel id="seasonality-lookback-label">Lookback</InputLabel>
            <Select
              labelId="seasonality-lookback-label"
              value={availableLookbackYears.includes(props.seasonalityLookback) ? props.seasonalityLookback : (availableLookbackYears[availableLookbackYears.length - 1] || 10)}
              label="Lookback"
              onChange={(e) => props.onSeasonalityLookbackChange?.(Number(e.target.value))}
            >
              {availableLookbackYears.map((years) => (
                <MenuItem key={years} value={years}>
                  {years} years
                </MenuItem>
              ))}
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
