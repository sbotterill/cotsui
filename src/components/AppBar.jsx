import * as React from 'react';
import {AppBar, TextField, Toolbar, Typography, IconButton, Tooltip, CircularProgress, Alert} from '@mui/material'
import BasicMenu from './ContextMenu';
import ThemeSwitch from './ThemeSwitch';
import { useTheme } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import Profile from './Profile';
import ProfileCard from './ProfileCard';

export default function DrawerAppBar(props) {
  const theme = useTheme();
  const [showAlert, setShowAlert] = React.useState(true);
  const [showProfileCard, setShowProfileCard] = React.useState(false);
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

  const handleFuturesFilter = (event) => {
    try {
      const searchValue = event.target.value.trim().toLowerCase();
      setSearchTerm(event.target.value);
      const filtered = props.futuresData.filter(row =>
        row.commodity.toLowerCase().includes(searchValue)
      );

      // Show no results message if search term exists but no results found
      if (searchValue && filtered.length === 0) {
        setShowNoResults(true);
        // Hide the message after 3 seconds
        setTimeout(() => setShowNoResults(false), 3000);
      } else {
        setShowNoResults(false);
      }

      // If no results found, show all data instead of empty list
      props.setFilteredData(filtered.length > 0 ? filtered : props.futuresData);
    } catch (error) {
      console.error('Error filtering data:', error);
      // On error, show all data
      props.setFilteredData(props.futuresData);
      setShowNoResults(false);
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('');
    props.setFilteredData(props.futuresData);
    setShowNoResults(false);
  };

  // Close profile card when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileCard && !event.target.closest('.profile-container')) {
        setShowProfileCard(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileCard]);

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
            {!props.isLatestData && (
              <Tooltip sx={{width: "1500px"}} title="Showing previous week's data, new data available Friday 15:30 EST.">
                <WarningIcon sx={{ color: theme.palette.warning.main, fontSize: '1.2rem' }} />
              </Tooltip>
            )}
            <div style={{display: 'flex', flexDirection: 'column', fontSize: "12px", color: "#0000052"}}>
              <div style={{fontStyle: "italic"}}>
                {`Report Date: ${readable}`}
              </div>
              {/* {lastCheckedReadable && (
                <div style={{fontSize: "10px", opacity: 0.7}}>
                  {`Last Checked: ${lastCheckedReadable}`}
                </div>
              )} */}
            </div>
            {/* <Tooltip title="Refresh data">
              <IconButton 
                onClick={props.onRefresh} 
                disabled={props.isRefreshing}
                size="small"
                sx={{ ml: 1 }}
              >
                {props.isRefreshing ? (
                  <CircularProgress size={20} />
                ) : (
                  <RefreshIcon />
                )}
              </IconButton>
            </Tooltip> */}
          </div>
        </Toolbar>
        <div className='appbar-context-menu'>
          <BasicMenu commodities={props.exchanges} selected={props.displayExchanges} onFilterChange={props.onExchangeFilterChange}/>
          <div className="profile-container" style={{display: 'flex', alignItems: 'center', gap: '8px', position: 'relative'}}>
            <Profile onProfileClick={() => setShowProfileCard(!showProfileCard)} />
            <ProfileCard open={showProfileCard} onClose={() => setShowProfileCard(false)} />
          </div>
        </div>
      </AppBar>
      {showNoResults && (
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
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
      {!props.isLatestData && showAlert && (
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowAlert(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
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
          <Typography variant="body2">
            New data for this week is not yet available. Showing data from {readable}.
            <br />
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              The CFTC typically releases new data on Friday afternoons.
            </Typography>
          </Typography>
        </Alert>
      )}
    </>
  );
}
