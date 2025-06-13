import * as React from 'react';
import { Box } from '@mui/material';
import { LineChartPro, ChartZoomSlider } from '@mui/x-charts-pro';
import { LicenseInfo } from '@mui/x-license';

LicenseInfo.setLicenseKey("f66e40461091cc90836adea4ece3cdfaTz0xMTQ2NDAsRT0xNzgxNDgxNTk5MDAwLFM9cHJvLExNPXN1YnNjcmlwdGlvbixQVj1RMy0yMDI0LEtWPTI=");

export default function LineChartWithReferenceLines(props) {
  return (
    <Box sx={{ width: '100%', height: '47vh' }}>
      <LineChartPro
        sx={{ width: '100%', height: '100%' }}
        series={[
            { data: props.commericalChartData, label: 'Commericals', type: 'line' },
            { data: props.nonCommercialChartData, label: 'Non-Commericals', type: 'line' },
            { data: props.nonReportableChartData, label: 'Non-Reportables', type: 'line' },
        ]}
        xAxis={[{ 
            scaleType: 'point',
            data: props.chartDates,
            zoom: true,          // ← turn on zoom
            min: 0,
            max: 20, // Show last 20 data points initially
        }]}
        yAxis={[{ zoom: true }]}
        margin={{ right: 24, top: 20, bottom: 20, left: 50 }}
        slotProps={{
            legend: {
            direction: 'row',
            position: { vertical: 'top', horizontal: 'right' },
            padding: 0,
            },
        }}
        grid={{ horizontal: true }}
        tooltip={{ trigger: 'axis' }}
        >
        {/* draggable slider below the axis */}
        <ChartZoomSlider 
          sx={{
            '& .MuiChartsAxis-tickLabel': {
              fontSize: '0.75rem',
              transform: 'rotate(-45deg)',
              textAnchor: 'end',
            },
          }}
        />
        </LineChartPro>
    </Box>
  );
}
