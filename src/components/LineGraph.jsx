import * as React from 'react';
import { Box, Typography, useTheme, Stack } from '@mui/material';
import { LineChartPro } from '@mui/x-charts-pro';
import { LicenseInfo } from '@mui/x-license';

LicenseInfo.setLicenseKey("f66e40461091cc90836adea4ece3cdfaTz0xMTQ2NDAsRT0xNzgxNDgxNTk5MDAwLFM9cHJvLExNPXN1YnNjcmlwdGlvbixQVj1RMy0yMDI0LEtWPTI=");

// Define series colors outside component to prevent recreation
const SERIES_COLORS = {
  'Commercials': '#2962FF',
  'Non-Commercials': '#FF6D00',
  'Non-Reportables': '#00C853'
};

// Memoize the series options
const SERIES_OPTIONS = ['Commercials', 'Non-Commercials', 'Non-Reportables'];

export default function LineChartWithReferenceLines(props) {
  const theme = useTheme();
  
  // State to track which series is selected
  const [selectedSeries, setSelectedSeries] = React.useState('Commercials');

  // Auto-select a preferred series if provided (e.g., when clicking Retail Tracker row)
  React.useEffect(() => {
    if (props.preferredSeries && SERIES_OPTIONS.includes(props.preferredSeries)) {
      setSelectedSeries(props.preferredSeries);
    }
  }, [props.preferredSeries]);

  // Memoize reversed data arrays
  const reversedData = React.useMemo(() => ({
    dates: [...props.chartDates].reverse(),
    commercial: [...props.commercialChartData].reverse(),
    nonCommercial: [...props.nonCommercialChartData].reverse(),
    nonReportable: [...props.nonReportableChartData].reverse()
  }), [props.chartDates, props.commercialChartData, props.nonCommercialChartData, props.nonReportableChartData]);

  // Memoize the currently visible data
  const visibleData = React.useMemo(() => {
    switch(selectedSeries) {
      case 'Commercials':
        return reversedData.commercial;
      case 'Non-Commercials':
        return reversedData.nonCommercial;
      case 'Non-Reportables':
        return reversedData.nonReportable;
      default:
        return reversedData.commercial;
    }
  }, [reversedData, selectedSeries]);

  // Memoize calculations for min/max values
  const { minValue, maxValue, padding } = React.useMemo(() => {
    const min = Math.min(...visibleData);
    const max = Math.max(...visibleData);
    return {
      minValue: min,
      maxValue: max,
      padding: (max - min) * 0.1
    };
  }, [visibleData]);

  // Memoize unique years calculation
  const uniqueYears = React.useMemo(() => 
    [...new Set(reversedData.dates.map(date => new Date(date).getFullYear()))].sort(),
    [reversedData.dates]
  );

  // Memoize series data
  const series = React.useMemo(() => [{
    data: visibleData,
    label: selectedSeries,
    type: 'line',
    color: SERIES_COLORS[selectedSeries],
    showMark: false,
    area: false,
    curve: 'linear',
    lineWidth: 2,
  }], [visibleData, selectedSeries]);

  // Memoize the legend items
  const legendItems = React.useMemo(() => 
    SERIES_OPTIONS.map((label) => (
      <Box
        key={label}
        onClick={() => setSelectedSeries(label)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '4px',
          transition: 'all 0.2s ease-in-out',
          userSelect: 'none',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: SERIES_COLORS[label],
            marginRight: 1,
            transition: 'all 0.2s ease-in-out',
            transform: selectedSeries === label ? 'scale(1.2)' : 'scale(1)',
          }}
        />
        <Typography
          variant="body2"
          sx={{
            color: selectedSeries === label ? SERIES_COLORS[label] : theme.palette.text.secondary,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              opacity: 0.8,
            }
          }}
        >
          {label}
        </Typography>
      </Box>
    )), [selectedSeries, theme]);

  // Format numbers to K format
  const formatNumber = React.useCallback((value) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      const formattedValue = Math.round(absValue / 1000);
      return value < 0 ? `-${formattedValue}K` : `${formattedValue}K`;
    }
    return value.toString();
  }, []);

  return (
    <Box sx={{ 
      width: '100%', 
      height: '45vh',  // Slightly taller than table for better visualization
      position: 'relative',
      mt: 2  // Add margin top for spacing from table
    }}>
      {props.selectedCommodity && (
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            left: 10,
            zIndex: 1,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(26, 26, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            padding: '4px 12px',
            borderRadius: 1,
            boxShadow: 1,
            border: '1px solid',
            borderColor: theme.palette.divider,
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 'medium',
              color: theme.palette.text.primary,
            }}
          >
            {props.selectedCommodity}
          </Typography>
        </Box>
      )}
      <Stack 
        direction="row" 
        spacing={2} 
        sx={{ 
          position: 'absolute', 
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
          backgroundColor: 'transparent',
          padding: '4px 8px',
        }}
      >
        {legendItems}
      </Stack>
      <LineChartPro
        sx={{ 
          width: '100%', 
          height: '100%',
          '& .MuiChartsAxis-tickLabel': {
            userSelect: 'none',
          },
          '& .MuiChartsAxis-label': {
            userSelect: 'none',
          },
          '& .MuiChartsAxis-tick': {
            userSelect: 'none',
          }
        }}
        hideLegend={true}
        series={series}
        xAxis={[{
          data: reversedData.dates,
          scaleType: 'point',
          valueFormatter: (value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          },
          tickNumber: uniqueYears.length,
          tickInterval: (index) => {
            const year = new Date(reversedData.dates[index]).getFullYear();
            return uniqueYears.includes(year);
          },
          gridLines: {
            style: {
              stroke: 'rgba(128, 128, 128, 0.06)',
              strokeWidth: 1,
            },
          },
        }]}
        yAxis={[{ 
          min: minValue - padding,
          max: maxValue + padding,
          scaleType: 'linear',
          valueFormatter: formatNumber,
          gridLines: {
            style: {
              stroke: 'rgba(128, 128, 128, 0.06)',
              strokeWidth: 1,
            },
          },
        }]}
        margin={{ right: 10, top: 50, bottom: 10, left: 10 }}
        tooltip={{ 
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            animation: false,
            label: {
              backgroundColor: theme.palette.mode === 'dark' ? '#6a7985' : '#8796A5'
            }
          }
        }}
        grid={{
          horizontal: true,
          vertical: true,
          style: {
            stroke: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            strokeWidth: 1,
          }
        }}
        axisHighlight={{
          x: 'line',
          y: 'line',
          style: {
            stroke: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
            strokeWidth: 1,
            strokeDasharray: '5 5',
          }
        }}
        hover={{
          mode: 'nearest',
          intersect: true,
          axis: 'x',
          animationDuration: 200
        }}
      />
    </Box>
  );
}
