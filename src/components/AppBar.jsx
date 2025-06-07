import * as React from 'react';
import {AppBar, TextField, Toolbar, Typography} from '@mui/material'
import BasicMenu from './ContextMenu';
import ThemeSwitch from './ThemeSwitch';

export default function DrawerAppBar(props) {

  const rawDate = props.reportDate;
  const date = new Date(rawDate);

  const readable = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleFuturesFilter = (event) => {
    const filtered = props.futuresData.filter(row =>
      row.commodity
        .toLowerCase()
        .includes(event.target.value.trim().toLowerCase())
    );

    props.setFilteredData(filtered)
  }

  return (
    <AppBar sx={{background: 'background.paper', borderBottom: '1px solid #444', display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between"}} elevation={1} component="div">
      <Toolbar sx={{display: "flex", flexDirection:"row", alignContent: "center", color: 'text.primary', background: 'background.paper', width: "1000px", padding: "10px 0px"}}>
        <Typography
          variant="h5"
          component="div"
          sx={{marginRight: "20px"}}
        >
          COTS UI
        </Typography>
        <TextField onChange={handleFuturesFilter} sx={{width: "250px", marginRight: "15px"}} size='small' id="outlined-basic" label="Search" variant="outlined" InputLabelProps={{ style: { color: 'inherit' } }} InputProps={{ style: { color: 'inherit' } }} />
        <div style={{fontStyle: "italic", fontSize: "12px", color: "#0000052"}}>{`Last Updated: ${readable}`}</div>
      </Toolbar>
      <div className='appbar-context-menu'>
        <BasicMenu commodities={props.exchanges} selected={props.displayExchanges} onFilterChange={props.onExchangeFilterChange}/>
        <ThemeSwitch />
      </div>
    </AppBar>
  );
}
