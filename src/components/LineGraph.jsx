import * as React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { LineChartPro } from '@mui/x-charts-pro';
import { LicenseInfo } from '@mui/x-license';

LicenseInfo.setLicenseKey("f66e40461091cc90836adea4ece3cdfaTz0xMTQ2NDAsRT0xNzgxNDgxNTk5MDAwLFM9cHJvLExNPXN1YnNjcmlwdGlvbixQVj1RMy0yMDI0LEtWPTI=");

export default function LineChartWithReferenceLines(props) {
  const theme = useTheme();
  // Reverse the data arrays to show oldest data on the left
  const reversedDates = React.useMemo(() => [...props.chartDates].reverse(), [props.chartDates]);
  const reversedCommercialData = React.useMemo(() => [...props.commericalChartData].reverse(), [props.commericalChartData]);
  const reversedNonCommercialData = React.useMemo(() => [...props.nonCommercialChartData].reverse(), [props.nonCommercialChartData]);
  const reversedNonReportableData = React.useMemo(() => [...props.nonReportableChartData].reverse(), [props.nonReportableChartData]);

  // State to track which series are visible
  const [visibleSeries, setVisibleSeries] = React.useState({
    'Commercials': true,
    'Non-Commercials': false,
    'Non-Reportables': false
  });

  console.log('Current visibleSeries state:', visibleSeries);

  // Memoize calculations to prevent unnecessary recalculations
  const { minValue, maxValue, padding } = React.useMemo(() => {
    const allData = [
      ...(visibleSeries['Commercials'] ? reversedCommercialData : []),
      ...(visibleSeries['Non-Commercials'] ? reversedNonCommercialData : []),
      ...(visibleSeries['Non-Reportables'] ? reversedNonReportableData : [])
    ];
    const min = Math.min(...allData);
    const max = Math.max(...allData);
    return {
      minValue: min,
      maxValue: max,
      padding: (max - min) * 0.1
    };
  }, [reversedCommercialData, reversedNonCommercialData, reversedNonReportableData, visibleSeries]);

  // Memoize unique years calculation
  const uniqueYears = React.useMemo(() => 
    [...new Set(reversedDates.map(date => new Date(date).getFullYear()))].sort(),
    [reversedDates]
  );

  // Memoize series data
  const series = React.useMemo(() => [
    { 
      data: visibleSeries['Commercials'] ? reversedCommercialData : [],
      label: 'Commercials', 
      type: 'line',
      color: '#2962FF',
      showMark: false,
      area: false,
      curve: 'linear',
      lineWidth: 2,
    },
    { 
      data: visibleSeries['Non-Commercials'] ? reversedNonCommercialData : [],
      label: 'Non-Commercials', 
      type: 'line',
      color: '#FF6D00',
      showMark: false,
      area: false,
      curve: 'linear',
      lineWidth: 2,
    },
    { 
      data: visibleSeries['Non-Reportables'] ? reversedNonReportableData : [],
      label: 'Non-Reportables', 
      type: 'line',
      color: '#00C853',
      showMark: false,
      area: false,
      curve: 'linear',
      lineWidth: 2,
    },
  ], [reversedCommercialData, reversedNonCommercialData, reversedNonReportableData, visibleSeries]);

  const handleLegendClick = (event) => {
    console.log('Legend clicked event:', event);
    
    // Get the clicked series label from the event
    const clickedLabel = event.target.textContent;
    console.log('Clicked label:', clickedLabel);

    if (!clickedLabel || !visibleSeries.hasOwnProperty(clickedLabel)) {
      console.log('Invalid label:', clickedLabel);
      return;
    }

    setVisibleSeries(prev => {
      const newState = {
        ...prev,
        [clickedLabel]: !prev[clickedLabel]
      };
      console.log('New visibleSeries state:', newState);
      return newState;
    });
  };

  // Format numbers to K format
  const formatNumber = (value) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      const formattedValue = Math.round(absValue / 1000);
      return value < 0 ? `-${formattedValue}K` : `${formattedValue}K`;
    }
    return value.toString();
  };

  return (
    <Box sx={{ width: '100%', height: '47vh', position: 'relative' }}>
      {props.selectedCommodity && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 1,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(26, 26, 26, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            padding: '4px 12px',
            borderRadius: 1,
            boxShadow: 1,
            border: '1px solid',
            borderColor: theme.palette.divider,
            marginBottom: '10px',
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
          '& .MuiChartsLegend-label': {
            userSelect: 'none',
          },
          '& .MuiChartsAxis-tick': {
            userSelect: 'none',
          }
        }}
        series={series}
        xAxis={[{
          data: reversedDates,
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
            const year = new Date(reversedDates[index]).getFullYear();
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
        margin={{ right: 10, top: 10, bottom: 10, left: 10 }}
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
        axisPointer={{
          type: 'cross',
          animation: false,
          label: {
            backgroundColor: theme.palette.mode === 'dark' ? '#6a7985' : '#8796A5'
          }
        }}
        slotProps={{
          legend: { 
            direction: 'row', 
            position: { vertical: 'top', horizontal: 'right' },
            sx: {
              '& .MuiChartsLegend-mark': {
                width: 10,
                height: 10,
                transition: 'all 0.2s ease-in-out',
              },
              '& .MuiChartsLegend-item': {
                marginRight: 20,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s ease-in-out',
                userSelect: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  '& .MuiChartsLegend-mark': {
                    transform: 'scale(1.2)',
                  }
                },
                '&:active': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                }
              },
              '& .MuiChartsLegend-label': {
                transition: 'all 0.2s ease-in-out',
                userSelect: 'none',
                '&:hover': {
                  opacity: 0.8,
                }
              }
            },
            onClick: handleLegendClick
          },
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
        // crosshair={{
        //   horizontal: {
        //     enabled: true,
        //     style: {
        //       stroke: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        //       strokeWidth: 1,
        //       strokeDasharray: '5 5',
        //     },
        //   },
        //   vertical: {
        //     enabled: true,
        //     style: {
        //       stroke: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        //       strokeWidth: 1,
        //       strokeDasharray: '5 5',
        //     },
        //   },
        // }}
      />
    </Box>
  );
}
