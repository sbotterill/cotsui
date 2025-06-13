import * as React from 'react';
import { Box } from '@mui/material';
import { LineChartPro, ChartZoomSlider } from '@mui/x-charts-pro';
import { LicenseInfo } from '@mui/x-license';

LicenseInfo.setLicenseKey("f66e40461091cc90836adea4ece3cdfaTz0xMTQ2NDAsRT0xNzgxNDgxNTk5MDAwLFM9cHJvLExNPXN1YnNjcmlwdGlvbixQVj1RMy0yMDI0LEtWPTI=");

export default function LineChartWithReferenceLines(props) {
  const total = props.chartDates.length;
  const initialPoints = 100;
  const endPct = Math.min(100, (initialPoints / total) * 100);

  return (
    <Box sx={{ width: '100%', height: '47vh' }}>
      <LineChartPro
        sx={{ width: '100%', height: '100%' }}
        series={[
          { data: props.commericalChartData, label: 'Commercials', type: 'line' },
          { data: props.nonCommercialChartData, label: 'Non-Commercials', type: 'line' },
          { data: props.nonReportableChartData, label: 'Non-Reportables', type: 'line' },
        ]}
        // ← full zoom object here:
        xAxis={[{
          data: props.chartDates,
          scaleType: 'point',
          zoom: {
            minStart: 0,       // start at 0%
            maxEnd:   endPct,  // show ~50 points
            panning:  true,    // ← enable drag panning
          },
        }]}
        yAxis={[{ zoom: true }]}      // y-axis can zoom/pan too if you like
        margin={{ right: 24, top: 20, bottom: 20, left: 50 }}
        tooltip={{ trigger: 'axis' }}
        slotProps={{
          legend: { direction: 'row', position: { vertical: 'top', horizontal: 'right' } },
        }}
      />
    </Box>
  );
}
