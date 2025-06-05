import * as React from 'react';
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

function formatPercentage(value) {
  return value ? `${(Number(value) * 100).toFixed(1)}%` : '-';
}

function getPercentageColor(value) {
  const percent = Number(value);
  if (isNaN(percent)) return 'inherit';

  if (percent < 0.5) {
    // Deep purple to medium purple
    const ratio = percent / 0.5;
    const r = Math.round(128 + (170 - 128) * ratio);
    const g = Math.round(0 + (85 - 0) * ratio);
    const b = Math.round(128 + (255 - 128) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Medium purple to blue
    const ratio = (percent - 0.5) / 0.5;
    const r = Math.round(170 + (0 - 170) * ratio);
    const g = Math.round(85 + (128 - 85) * ratio);
    const b = Math.round(255 + (255 - 255) * ratio); // stays at 255
    return `rgb(${r}, ${g}, ${b})`;
  }
}

function Row(props) {
  const [open, setOpen] = React.useState(false);

  const filteredData = props.data.filter(dataRow =>
    props.name.includes(dataRow.market_code.trim())
  );

  if (filteredData.length === 0) return null;

  return (
    <React.Fragment>
      <TableRow
        onClick={() => setOpen(!open)}
        sx={{
          cursor: 'pointer',
          '&:nth-of-type(odd)': (theme) => ({
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f9f9f9',
          }),
        }}
      >
        <TableCell sx={{ width: '50px', borderBottom: 'none' }}>
          <IconButton aria-label="expand row" size="small" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }} colSpan={21}>{props.name}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ padding: 0 }} colSpan={22}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: "0", overflowX: 'auto' }}>
              <Table sx={{
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                  }}
                  size="small" 
                  aria-label="details"
                >
                <TableHead>
                  <TableRow sx={{ backgroundColor: (theme) => theme.palette.grey[900] }}>
                    <TableCell rowSpan={2}>Commodity</TableCell>
                    <TableCell colSpan={6} align="center">Commercial</TableCell>
                    <TableCell colSpan={6} align="center">Non-commercial</TableCell>
                    <TableCell colSpan={6} align="center">Non-reportable</TableCell>
                  </TableRow>
                  <TableRow>
                    {['Long', 'Change', 'Short', 'Change', 'Total', '% Long'].map((label, idx) => (
                      <TableCell
                        key={`commercial-${label}-${idx}`}
                        sx={idx === 5 ? { borderRight: (theme) => `2px solid ${theme.palette.divider}` } : {}}
                      >
                        {label}
                      </TableCell>
                    ))}
                    {['Long', 'Change', 'Short', 'Change', 'Total', '% Long'].map((label, idx) => (
                      <TableCell
                        key={`non-commercial-${label}-${idx}`}
                        sx={idx === 5 ? { borderRight: (theme) => `2px solid ${theme.palette.divider}` } : {}}
                      >
                        {label}
                      </TableCell>
                    ))}
                    {['Long', 'Change', 'Short', 'Change', 'Total', '% Long'].map((label, idx) => (
                      <TableCell key={`non-reportable-${label}-${idx}`}>{label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((dataRow) => (
                    <TableRow key={dataRow.commodity} sx={{
                      '& td': {
                        borderTop: '1px solid transparent',
                        borderBottom: '1px solid transparent',
                        borderRight: '1px solid transparent',
                      },
                      '& td:first-of-type': {
                        borderLeft: '4px solid transparent',
                      },
                      '&:nth-of-type(odd) td': (theme) => ({
                        backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                      }),
                      '&:nth-of-type(even) td': (theme) => ({
                        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
                      }),
                      '&:hover td': (theme) => ({
                        backgroundColor: theme.palette.mode === 'dark' ? '#3c3c3c' : '#e0e0e0',
                        borderTop: '1px solid #ffff99',
                        borderBottom: '1px solid #ffff99',
                        borderRight: '1px solid #ffff99',
                        cursor: "default"
                      }),
                      '&:hover td:first-of-type': {
                        borderLeft: '4px solid #ffff99',
                      },
                      '&:hover td:last-of-type': {
                        borderRight: '4px solid #ffff99',
                      },
                    }}>
                      <TableCell>{dataRow.commodity}</TableCell>

                      {/* Commercial */}
                      <TableCell>{dataRow.commerical_long}</TableCell>
                      <TableCell sx={{ color: dataRow.commerical_long_change < 0 ? 'red' : 'green' }}>{dataRow.commerical_long_change}</TableCell>
                      <TableCell>{dataRow.commerical_short}</TableCell>
                      <TableCell sx={{ color: dataRow.commerical_short_change < 0 ? 'red' : 'green' }}>{dataRow.commerical_short_change}</TableCell>
                      <TableCell>{dataRow.commerical_total}</TableCell>
                      <TableCell
                        sx={{
                          color: getPercentageColor(dataRow.commerical_percentage_long),
                          borderRight: (theme) => `2px solid ${theme.palette.divider}`,
                        }}
                      >
                        {formatPercentage(dataRow.commerical_percentage_long)}
                      </TableCell>

                      {/* Non-commercial */}
                      <TableCell>{dataRow.non_commercial_long}</TableCell>
                      <TableCell sx={{ color: dataRow.non_commercial_long_change < 0 ? 'red' : 'green' }}>{dataRow.non_commercial_long_change}</TableCell>
                      <TableCell>{dataRow.non_commercial_short}</TableCell>
                      <TableCell sx={{ color: dataRow.non_commercial_short_change < 0 ? 'red' : 'green' }}>{dataRow.non_commercial_short_change}</TableCell>
                      <TableCell>{dataRow.non_commercial_total}</TableCell>
                      <TableCell
                        sx={{
                          color: getPercentageColor(dataRow.non_commercial_percentage_long),
                          borderRight: (theme) => `2px solid ${theme.palette.divider}`,
                        }}
                      >
                        {formatPercentage(dataRow.non_commercial_percentage_long)}
                      </TableCell>

                      {/* Non-reportable */}
                      <TableCell>{dataRow.non_reportable_long}</TableCell>
                      <TableCell sx={{ color: dataRow.non_reportable_long_change < 0 ? 'red' : 'green' }}>{dataRow.non_reportable_long_change}</TableCell>
                      <TableCell>{dataRow.non_reportable_short}</TableCell>
                      <TableCell sx={{ color: dataRow.non_reportable_short_change < 0 ? 'red' : 'green' }}>{dataRow.non_reportable_short_change}</TableCell>
                      <TableCell>{dataRow.non_reportable_total}</TableCell>
                      <TableCell sx={{ color: getPercentageColor(dataRow.non_reportable_percentage_long) }}>
                        {formatPercentage(dataRow.non_reportable_percentage_long)}
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

export default function CollapsibleTable(props) {
  return (
    <TableContainer sx={{ width: '100%', border: 'none', boxShadow: 'none', backgroundColor: (theme) => theme.palette.background.paper }} component={Paper} elevation={0}>
      <Table aria-label="collapsible table">
        <TableBody>
          {props.exchanges.map((row, i) => (
            <Row key={row} name={row} data={props.futuresData} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
