import * as React from 'react';
import { Box, TextField, IconButton, FormControl, InputLabel, Select, MenuItem, CircularProgress, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BasicMenu from './ContextMenu';
import { REMOVED_EXCHANGE_CODES } from '../constants';

export default function HeaderActions(props) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showNoResults, setShowNoResults] = React.useState(false);

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
      />
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
    </Box>
  );
}


