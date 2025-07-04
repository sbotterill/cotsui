import * as React from 'react';
import {
  AppBar,
  TextField,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Box
} from '@mui/material'
import BasicMenu from './ContextMenu';
import ThemeSwitch from './ThemeSwitch';
import { useTheme } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import Profile from './Profile';
import { ALLOWED_EXCHANGES, isValidExchange, EXCHANGE_CODE_MAP } from '../constants';

export default function DrawerAppBar(props) {
  const theme = useTheme();
  const [showAlert, setShowAlert] = React.useState(true);
  const [showNoResults, setShowNoResults] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Format the date string directly without creating a Date object
  const formatDateString = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const readable = formatDateString(props.lastUpdated);
  const lastChecked = props.lastChecked ? new Date(props.lastChecked) : null;

  const lastCheckedReadable = lastChecked ? lastChecked.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) : null;

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

  // Normalize exchange code by trimming and ensuring consistent format
  const normalizeCode = (code) => {
    if (!code) return '';
    return code.trim();
  };

  const handleFuturesFilter = (event) => {
    try {
      const searchValue = event.target.value.trim().toLowerCase();
      setSearchTerm(searchValue);
      
      if (!searchValue) {
        handleClearSearch();
        return;
      }
      
      // Filter data based on search term
      const filtered = props.futuresData.filter(row =>
        row.commodity.toLowerCase().includes(searchValue)
      );

      // Get unique exchanges from filtered data
      const matchingExchanges = new Set();
      filtered.forEach(row => {
        if (!row.market_code) return;
        const code = normalizeCode(row.market_code);
        matchingExchanges.add(code);
      });

      const matchingExchangesList = Array.from(matchingExchanges);

      // Update filtered data
      props.setFilteredData(filtered);
      
      // During search, we want to show matching exchanges but not update the saved preferences
      // Pass false to prevent saving to server and maintain context menu state
      props.onExchangeFilterChange(matchingExchangesList, false);

      // Show no results message if needed
      setShowNoResults(filtered.length === 0);

      // Only try to switch tabs if we're in the favorites tab (index 0)
      if (filtered.length > 0 && props.selectedTab === 0) {
        const isInFavorites = filtered.some(item => props.favorites.includes(item.commodity));
        if (!isInFavorites) {
          // Switch to the first exchange tab that has matches
          const firstMatchExchange = filtered[0].market_code;
          const exchangeIndex = props.exchanges.findIndex(e => {
            const code = e.includes(' - ') ? e.split(' - ')[0].trim() : e.trim();
            return code === firstMatchExchange;
          });
          if (exchangeIndex !== -1) {
            props.onTabChange(exchangeIndex + 1); // +1 because exchange tabs start at index 1
          }
        }
      }
    } catch (error) {
      console.error('Error in handleFuturesFilter:', error);
      // On error, restore all exchanges
      handleClearSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    props.setFilteredData(props.futuresData);
    
    // When clearing search, restore all exchanges from the original list
    const allExchanges = props.exchanges.map(exchange => {
      // Handle both formats: either "CODE - NAME" or just "CODE"
      const parts = exchange.includes(' - ') ? exchange.split(' - ') : [exchange];
      const code = normalizeCode(parts[0]);
      return code;
    });
    
    // Pass false to prevent saving to server - only UI state update
    props.onExchangeFilterChange(allExchanges, false);
    setShowNoResults(false);
  };

  return (
    <>
      <AppBar position='fixed' sx={{backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#fff', borderBottom: '1px solid #444', display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between"}} elevation={1} component="div">
        <Toolbar sx={{display: "flex", flexDirection:"row", alignContent: "center", color: 'text.primary', background: 'background.paper', width: "1000px", padding: "10px 0px"}}>
          <Typography
            variant="h5"
            component="div"
            sx={{marginRight: "20px"}}
          >
            COTS UI
          </Typography>
          <TextField 
            onChange={handleFuturesFilter} 
            value={searchTerm}
            sx={{width: "250px", marginRight: "15px"}} 
            size='small' 
            id="outlined-basic" 
            label="Search" 
            variant="outlined" 
            InputLabelProps={{ style: { color: 'inherit' } }} 
            InputProps={{ 
              style: { color: 'inherit' },
              endAdornment: searchTerm && (
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  sx={{ 
                    padding: '2px',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )
            }} 
          />
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <FormControl 
              size="small" 
              sx={{ 
                width: "250px",
                marginRight: "8px",
                '& .MuiInputBase-root': {
                  height: '40px' // Match search bar height
                }
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
                    <CircularProgress
                      size={20}
                      sx={{
                        position: 'absolute',
                        right: 25,
                        color: theme.palette.primary.main
                      }}
                    />
                  ) : null
                }
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300
                    },
                    sx: {
                      '& .MuiList-root': {
                        padding: 0,
                        maxHeight: 300,
                        overflowY: 'scroll',
                        '&::-webkit-scrollbar': {
                          display: 'none'  // Safari and Chrome
                        },
                        scrollbarWidth: 'none',  // Firefox
                        msOverflowStyle: 'none',  // IE and Edge
                        '&:hover': {
                          '&::-webkit-scrollbar': {
                            display: 'none'
                          }
                        }
                      }
                    }
                  }
                }}
              >
                {props.availableDates.map((date, index) => (
                  <MenuItem key={index} value={date}>
                    {formatDateOption(date)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip 
              title={
                <React.Fragment>
                  <Typography variant="body2" component="div">
                    • This week's data available for selection Friday 3:30 PM EST
                  </Typography>
                  <Typography variant="body2" component="div">
                    • Only Tuesdays are available for selection
                  </Typography>
                </React.Fragment>
              }
            >
              <InfoOutlinedIcon 
                sx={{ 
                  fontSize: '1.2rem',
                  color: theme.palette.text.secondary,
                  cursor: 'help'
                }} 
              />
            </Tooltip>
          </div>
        </Toolbar>
        <div className='appbar-context-menu'>
          <BasicMenu commodities={props.exchanges} selected={props.displayExchanges} onFilterChange={props.onExchangeFilterChange}/>
          <Box sx={{ position: 'relative' }}>
            <Profile />
          </Box>
        </div>
      </AppBar>
      {showNoResults && (
        <Alert 
          severity="info" 
          icon={<InfoOutlinedIcon />}
          sx={{ 
            position: 'fixed',
            top: '64px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1300,
            width: 'auto',
            minWidth: '300px',
            maxWidth: '80%',
            boxShadow: 1,
            borderRadius: '0 0 4px 4px'
          }}
        >
          No results found for your search. Showing all data.
        </Alert>
      )}
      <Snackbar
        open={props.isDateLoading}
        message="Loading data for selected date..."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#fff',
            color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            border: '1px solid',
            borderColor: theme.palette.mode === 'dark' ? '#444' : '#ddd',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 2px 8px rgba(0,0,0,0.3)' 
              : '0 2px 8px rgba(0,0,0,0.1)',
            minWidth: '300px',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }
        }}
      />
    </>
  );
}
