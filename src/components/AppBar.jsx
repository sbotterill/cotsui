import * as React from 'react';
import {AppBar, TextField, Toolbar, Typography, IconButton, Tooltip, CircularProgress} from '@mui/material'
import BasicMenu from './ContextMenu';
import ThemeSwitch from './ThemeSwitch';
import { useTheme } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';

export default function DrawerAppBar(props) {
  const theme = useTheme();
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
    const filtered = props.futuresData.filter(row =>
      row.commodity
        .toLowerCase()
        .includes(event.target.value.trim().toLowerCase())
    );

    props.setFilteredData(filtered)
  }

  return (
    <AppBar position='fixed' sx={{backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#fff', borderBottom: '1px solid #444', display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between"}} elevation={1} component="div">
      <Toolbar sx={{display: "flex", flexDirection:"row", alignContent: "center", color: 'text.primary', background: 'background.paper', width: "1000px", padding: "10px 0px"}}>
        <Typography
          variant="h5"
          component="div"
          sx={{marginRight: "20px"}}
        >
          COTS UI
        </Typography>
        <TextField onChange={handleFuturesFilter} sx={{width: "250px", marginRight: "15px"}} size='small' id="outlined-basic" label="Search" variant="outlined" InputLabelProps={{ style: { color: 'inherit' } }} InputProps={{ style: { color: 'inherit' } }} />
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          {!props.isLatestData && (
            <Tooltip title="Showing previous week's data">
              <WarningIcon sx={{ color: theme.palette.warning.main, fontSize: '1.2rem' }} />
            </Tooltip>
          )}
          <div style={{display: 'flex', flexDirection: 'column', fontSize: "12px", color: "#0000052"}}>
            <div style={{fontStyle: "italic"}}>
              {`Last Updated: ${readable}`}
            </div>
            {lastCheckedReadable && (
              <div style={{fontSize: "10px", opacity: 0.7}}>
                {`Last Checked: ${lastCheckedReadable}`}
              </div>
            )}
          </div>
          <Tooltip title="Refresh data">
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
          </Tooltip>
        </div>
      </Toolbar>
      <div className='appbar-context-menu'>
        <BasicMenu commodities={props.exchanges} selected={props.displayExchanges} onFilterChange={props.onExchangeFilterChange}/>
        <ThemeSwitch />
      </div>
    </AppBar>
  );
}
