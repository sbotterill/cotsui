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
  InputLabel
} from '@mui/material'
import BasicMenu from './ContextMenu';
import ThemeSwitch from './ThemeSwitch';
import { useTheme } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import Profile from './Profile';
import { ALLOWED_EXCHANGES, isValidExchange } from '../constants';

export default function DrawerAppBar(props) {
  const theme = useTheme();
  const [showAlert, setShowAlert] = React.useState(true);
  const [showNoResults, setShowNoResults] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const rawDate = props.reportDate;
  const date = new Date(rawDate);
  const lastChecked = props.lastChecked ? new Date(props.lastChecked) : null;

  const readable = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const lastCheckedReadable = lastChecked ? lastChecked.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) : null;

  const formatDateOption = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFuturesFilter = (event) => {
    try {
      const searchValue = event.target.value.trim().toLowerCase();
      setSearchTerm(searchValue);
      
      // Filter data based on search term
      const filtered = props.futuresData.filter(row =>
        row.commodity.toLowerCase().includes(searchValue)
      );

      // Get unique exchanges that have matching data
      const matchingExchanges = new Set(
        filtered.map(row => {
          if (!row.market_and_exchange_name) {
            return null;
          }
          const parts = row.market_and_exchange_name.split("-");
          if (parts.length < 2) {
            return null;
          }
          const exchangeName = parts[1].trim();
          // Only include if it's one of our allowed exchanges
          return isValidExchange(exchangeName) ? `${row.market_code?.trim() || ''} - ${exchangeName}` : null;
        }).filter(Boolean) // Remove null values
      );

      // Update filtered data
      props.setFilteredData(filtered.length > 0 ? filtered : props.futuresData);
      
      // Update visible exchanges based on search results
      if (searchValue) {
        props.onExchangeFilterChange(Array.from(matchingExchanges), false);
      } else {
        props.onExchangeFilterChange(props.exchanges, false);
      }

      // Show no results message if needed
      if (searchValue && filtered.length === 0) {
        setShowNoResults(true);
        // Hide the message after 3 seconds
        setTimeout(() => setShowNoResults(false), 3000);
      } else {
        setShowNoResults(false);
      }
    } catch (error) {
      // On error, show all data and exchanges
      props.setFilteredData(props.futuresData);
      props.onExchangeFilterChange(props.exchanges, false);
      setShowNoResults(false);
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('');
    props.setFilteredData(props.futuresData);
    props.onExchangeFilterChange(props.exchanges, false);
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
                {props.pastTuesdays.map((tuesday, index) => (
                  <MenuItem key={index} value={tuesday.toISOString()}>
                    {formatDateOption(tuesday)}
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
          <div className="profile-container" style={{display: 'flex', alignItems: 'center', gap: '8px', position: 'relative'}}>
            <Profile />
          </div>
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
    </>
  );
}
