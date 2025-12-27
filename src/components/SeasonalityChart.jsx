import * as React from 'react';
import { Box, CircularProgress, Stack, Typography, useTheme, useMediaQuery } from '@mui/material';
import { LineChartPro, BarChartPro } from '@mui/x-charts-pro';
import { LicenseInfo } from '@mui/x-license';
import { fetchDailyCandlesByAsset, fetchAllCandlesByAsset } from '../services/priceService';

LicenseInfo.setLicenseKey("f66e40461091cc90836adea4ece3cdfaTz0xMTQ2NDAsRT0xNzgxNDgxNTk5MDAwLFM9cHJvLExNPXN1YnNjcmlwdGlvbixQVj1RMy0yMDI0LEtWPTI=");

function computeSeasonality(candles) {
  // candles: [{ time: seconds, close: number }, ascending]
  if (!candles || candles.length < 50) return null;

  // Use a non-leap-year day count for consistent 365-day mapping
  const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const isLeapDay = (date) => date.getUTCMonth() === 1 && date.getUTCDate() === 29;
  const dayOfYearIndex = (date) => {
    const m = date.getUTCMonth();
    const d = date.getUTCDate();
    if (m === 1 && d === 29) return null; // skip Feb 29
    let idx = d - 1;
    for (let i = 0; i < m; i++) idx += monthDays[i];
    return idx; // 0..364
  };

  // Precompute month start indices for axis ticks
  const monthStartIndices = [];
  let acc = 0;
  for (let i = 0; i < monthDays.length; i++) {
    monthStartIndices.push(acc);
    acc += monthDays[i];
  }

  // Group candles by year
  const candlesByYear = new Map();
  for (const c of candles) {
    const date = new Date(c.time * 1000);
    const year = date.getUTCFullYear();
    if (!candlesByYear.has(year)) candlesByYear.set(year, []);
    candlesByYear.get(year).push({ ...c, date });
  }
  for (const [y, arr] of candlesByYear) {
    arr.sort((a, b) => a.time - b.time);
  }

  // Collect daily returns attributed to the calendar day-of-year of the current trading day
  const returnsByIndex = Array.from({ length: 365 }, () => []);
  for (const [year, arr] of candlesByYear) {
    if (!arr || arr.length < 2) continue;
    let prev = arr[0];
    for (let i = 1; i < arr.length; i++) {
      const curr = arr[i];
      const idx = dayOfYearIndex(curr.date);
      if (idx === null) { prev = curr; continue; }
      if (isFinite(prev.close) && isFinite(curr.close) && prev.close > 0) {
        const r = curr.close / prev.close - 1;
        returnsByIndex[idx].push(r);
      }
      prev = curr;
    }
  }

  // Average return per calendar day-of-year
  const avgReturns = returnsByIndex.map(list => {
    if (!list.length) return 0;
    return list.reduce((s, v) => s + v, 0) / list.length;
  });

  // Build cumulative index with 365 points; day 0 is baseline 100 (to match other charts)
  const dailySeasonality = new Array(365);
  let cumulativeIndex = 100;
  dailySeasonality[0] = cumulativeIndex;
  for (let i = 1; i < 365; i++) {
    const r = isFinite(avgReturns[i]) ? avgReturns[i] : 0;
    cumulativeIndex = cumulativeIndex * (1 + r);
    dailySeasonality[i] = cumulativeIndex;
  }

  return {
    dailySeasonality,
    monthStartIndices,
  };
}

export default function SeasonalityChart({ symbol, lookbackYears = 15, cycleFilter = 'all', startDate, endDate, onEffectiveRange, symbolInfo }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [loading, setLoading] = React.useState(false);
  const [seriesData, setSeriesData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [avgByWeekday, setAvgByWeekday] = React.useState(null);
  const [avgByMonth, setAvgByMonth] = React.useState(null);

  // Check if this asset has limited historical data (started after 2018)
  const hasLimitedData = React.useMemo(() => {
    if (!symbolInfo?.firstDate) return false;
    const firstYear = new Date(symbolInfo.firstDate).getFullYear();
    return firstYear > 2018;
  }, [symbolInfo]);

  const limitedDataMessage = React.useMemo(() => {
    if (!hasLimitedData || !symbolInfo?.firstDate) return null;
    const firstDate = new Date(symbolInfo.firstDate);
    const formattedDate = firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `Limited data: This asset started trading on ${formattedDate}. Seasonality analysis may be less reliable with fewer years of historical data.`;
  }, [hasLimitedData, symbolInfo]);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!symbol) return;
      setLoading(true);
      setError(null);
      try {
        let candles = await fetchDailyCandlesByAsset(symbol);
        if (!candles || candles.length === 0) {
          // Debug: fetch all rows ignoring date filters
          const raw = await fetchAllCandlesByAsset(symbol);
          // Normalize for computation path
          candles = (raw || []).map(r => ({
            time: Math.floor(new Date(r.time).getTime() / 1000),
            close: Number(r.close),
          })).filter(x => isFinite(x.time) && isFinite(x.close)).sort((a,b) => a.time - b.time);
        }
        if (cancelled) return;
       
        // Determine end date as the latest candle on or before today
        const now = new Date();
        const nowSec = Math.floor(now.getTime() / 1000);
        let endIdx = candles.length - 1;
        while (endIdx > 0 && candles[endIdx].time > nowSec) endIdx--;
        if (endIdx < 0) endIdx = candles.length - 1; // fallback to last available
        const endCandle = candles[endIdx];
        const endDateObj = new Date(endCandle.time * 1000);
        const endDateISO = `${endDateObj.getUTCFullYear()}-${String(endDateObj.getUTCMonth()+1).padStart(2,'0')}-${String(endDateObj.getUTCDate()).padStart(2,'0')}`;
        const electionCycle = (year) => {
          // US Presidential cycle: election years divisible by 4 (e.g., 2020, 2024)
          const mod = year % 4;
          if (mod === 0) return 'election';
          if (mod === 1) return 'post';
          if (mod === 2) return 'midterm';
          return 'pre'; // mod === 3
        };
        let filtered = candles;
        // Custom range path
        if (startDate || endDate) {
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : endDateObj;
          // Enforce max 15 years window
          let effectiveStart = start;
          let effectiveEnd = end;
          if (effectiveStart && effectiveEnd) {
            const ms15y = 15 * 365 * 24 * 60 * 60 * 1000;
            if (effectiveEnd - effectiveStart > ms15y) {
              // shrink start to last 15y from end
              effectiveStart = new Date(effectiveEnd.getTime() - ms15y);
            }
          } else if (effectiveStart && !effectiveEnd) {
            effectiveEnd = endDateObj;
            const ms15y = 15 * 365 * 24 * 60 * 60 * 1000;
            if (effectiveEnd - effectiveStart > ms15y) {
              effectiveStart = new Date(effectiveEnd.getTime() - ms15y);
            }
          } else if (!effectiveStart && effectiveEnd) {
            const ms15y = 15 * 365 * 24 * 60 * 60 * 1000;
            effectiveStart = new Date(effectiveEnd.getTime() - ms15y);
          } else {
            // neither provided: fallback to lookback below
          }
          if (effectiveStart || effectiveEnd) {
            const startSec = effectiveStart ? Math.floor(effectiveStart.getTime() / 1000) : -Infinity;
            const endSec = effectiveEnd ? Math.floor(effectiveEnd.getTime() / 1000) : Infinity;
            filtered = candles.filter(c => c.time >= startSec && c.time <= endSec);
            if (onEffectiveRange && effectiveStart && effectiveEnd) {
              const fmt = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
              onEffectiveRange({ from: fmt(effectiveStart), to: fmt(effectiveEnd) });
            }
          }
        }
        // Lookback + cycle path if no custom range applied
        if (!startDate && !endDate) {
          const years = Number(lookbackYears) || 15;
          // Proposed start: exactly N years before endDate (same month/day)
          const startCandidate = new Date(Date.UTC(
            endDateObj.getUTCFullYear() - years,
            endDateObj.getUTCMonth(),
            endDateObj.getUTCDate()
          ));
          const startCandidateSec = Math.floor(startCandidate.getTime() / 1000);
          // Find the closest prior candle at or before startCandidate
          let startIdx = 0;
          // binary search for last c.time <= startCandidateSec
          let lo = 0, hi = endIdx;
          while (lo <= hi) {
            const mid = Math.floor((lo + hi) / 2);
            if (candles[mid].time <= startCandidateSec) {
              startIdx = mid;
              lo = mid + 1;
            } else {
              hi = mid - 1;
            }
          }
          filtered = candles.slice(startIdx, endIdx + 1);
          if (onEffectiveRange && filtered.length) {
            const fmt = (sec) => {
              const d = new Date(sec * 1000);
              return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
            };
            onEffectiveRange({ from: fmt(filtered[0].time), to: fmt(filtered[filtered.length-1].time) });
          }
        }
        // Apply election cycle filter within the selected window if needed
        if (cycleFilter && cycleFilter !== 'all' && filtered.length) {
          const allowedYears = new Set();
          filtered.forEach(c => {
            const y = new Date(c.time * 1000).getUTCFullYear();
            if (electionCycle(y) === cycleFilter) allowedYears.add(y);
          });
          if (allowedYears.size > 0) {
            filtered = filtered.filter(c => allowedYears.has(new Date(c.time * 1000).getUTCFullYear()));
          }
        }
        const mapped = filtered.map(c => ({ time: c.time, open: c.open, close: c.close }));
        const computed = computeSeasonality(mapped);
        if (!computed || !computed.dailySeasonality) {
          if (!cancelled) setError('Failed to compute seasonality data');
          return;
        }
        // Compute average same-day return by weekday and month using filtered candles
        if (mapped.length > 0) {
          // Weekday: (close - open)/open for each trading day, group by weekday Mon..Fri
          const weekdayBuckets = new Array(7).fill(0).map(() => []);
          for (let i = 0; i < mapped.length; i++) {
            const d = new Date(mapped[i].time * 1000);
            const wd = d.getUTCDay(); // 0..6
            const o = mapped[i].open;
            const c = mapped[i].close;
            if (wd >= 1 && wd <= 5 && isFinite(o) && isFinite(c) && o !== 0) {
              weekdayBuckets[wd].push(c / o - 1);
            }
          }
          // Monthly: first day open to last day close for each month-year, then bucket by month
          const monthlyFirstOpen = new Map(); // key: yyyy-mm -> open
          const monthlyLastClose = new Map(); // key: yyyy-mm -> close
          for (let i = 0; i < mapped.length; i++) {
            const d = new Date(mapped[i].time * 1000);
            const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
            if (!monthlyFirstOpen.has(ym)) monthlyFirstOpen.set(ym, mapped[i].open);
            monthlyLastClose.set(ym, mapped[i].close);
          }
          const monthBuckets = new Array(12).fill(0).map(() => []);
          for (const [ym, o] of monthlyFirstOpen.entries()) {
            const c = monthlyLastClose.get(ym);
            if (!isFinite(o) || !isFinite(c) || o === 0) continue;
            const [y, m] = ym.split('-');
            const mi = Number(m) - 1; // 0..11
            monthBuckets[mi].push(c / o - 1);
          }
          const avg = (arr) => arr.length ? arr.reduce((s,v)=>s+v,0)/arr.length : 0;
          const weekdays = [
            { key: 'Mon', idx: 1 },
            { key: 'Tue', idx: 2 },
            { key: 'Wed', idx: 3 },
            { key: 'Thu', idx: 4 },
            { key: 'Fri', idx: 5 },
          ];
          const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const byWd = weekdays.map(({ key, idx }) => ({ label: key, value: avg(weekdayBuckets[idx]) }));
          const byMo = months.map((m, i) => ({ label: m, value: avg(monthBuckets[i]) }));
          setAvgByWeekday(byWd);
          setAvgByMonth(byMo);
        } else {
          setAvgByWeekday(null);
          setAvgByMonth(null);
        }
        setSeriesData(computed);
      } catch (e) {
        if (!cancelled) setError('Failed to load seasonality');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [symbol, lookbackYears, cycleFilter]);

  // Memoize series data similar to CFTC charts
  const series = React.useMemo(() => {
    if (!seriesData) return [];
    return [{
      data: seriesData.dailySeasonality,
      label: 'Historical Seasonality',
      type: 'line',
      color: '#4A148C',
      showMark: false,
      area: true,
      curve: 'linear',
      lineWidth: 1,
    }];
  }, [seriesData]);

  // Compute y-axis min/max with padding to match existing line graph
  const { minValue, maxValue, padding } = React.useMemo(() => {
    if (!seriesData?.dailySeasonality?.length) return { minValue: undefined, maxValue: undefined, padding: 0 };
    const values = seriesData.dailySeasonality;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.1;
    return { minValue: min, maxValue: max, padding: pad };
  }, [seriesData]);

  // Format numbers to K format like LineGraph
  const formatNumber = React.useCallback((value) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      const formattedValue = Math.round(absValue / 1000);
      return value < 0 ? `-${formattedValue}K` : `${formattedValue}K`;
    }
    return value.toString();
  }, []);

  // Axis helpers
  const xData = React.useMemo(() => Array.from({ length: 365 }, (_, i) => i), []);
  const monthStartSet = React.useMemo(() => new Set(seriesData?.monthStartIndices || []), [seriesData]);

  return (
    <Box sx={{ 
      width: '100%', 
      height: isMobile ? 'auto' : '100%',
      minHeight: isMobile ? 'calc(100vh - 180px)' : undefined,
      position: 'relative', 
      mt: isMobile ? 0 : 2, 
      display: 'flex', 
      flexDirection: 'column',
      pb: isMobile ? 2 : 0
    }}>
      {loading && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Box sx={{ p: isMobile ? 1 : 2 }}>
          <Typography color="error" variant={isMobile ? "body2" : "body1"}>{error}</Typography>
        </Box>
      )}
      {hasLimitedData && limitedDataMessage && (
        <Box sx={{ 
          p: isMobile ? 1 : 1.5, 
          mx: isMobile ? 1 : 2,
          mb: 1,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 167, 38, 0.12)' : 'rgba(255, 152, 0, 0.12)',
          borderRadius: 1,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 167, 38, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Typography 
            variant={isMobile ? "caption" : "body2"} 
            sx={{ 
              color: theme.palette.mode === 'dark' ? '#ffb74d' : '#f57c00',
              fontWeight: 500
            }}
          >
            ⚠️ {limitedDataMessage}
          </Typography>
        </Box>
      )}
      {!loading && seriesData && seriesData.dailySeasonality && (
        <>
          <Stack 
            direction="row" 
            spacing={2} 
            sx={{ 
              position: 'absolute', 
              top: isMobile ? 10 : 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1,
              backgroundColor: 'transparent',
              padding: isMobile ? '2px 4px' : '4px 8px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'default',
                padding: isMobile ? '2px 4px' : '4px 8px',
                borderRadius: '4px',
                userSelect: 'none',
              }}
            >
              <Box
                sx={{
                  width: isMobile ? 8 : 10,
                  height: isMobile ? 8 : 10,
                  borderRadius: '50%',
                  backgroundColor: '#4A148C',
                  marginRight: 1,
                }}
              />
              <Typography variant={isMobile ? "caption" : "body2"}>Historical Seasonality</Typography>
            </Box>
          </Stack>
          <Box sx={{ 
            flex: isMobile ? '0 0 auto' : 1, 
            minHeight: isMobile ? '300px' : 0,
            height: isMobile ? '300px' : 'auto'
          }}>
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
                },
                '& .MuiAreaElement-root': {
                  fillOpacity: 0.3,
                }
              }}
              hideLegend={true}
              series={series}
              xAxis={[{
                data: xData,
                scaleType: 'point',
                valueFormatter: (index) => {
                  // Convert 0..364 index to a month/day label in a non-leap-year reference (UTC)
                  const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                  let remaining = index;
                  let month = 0;
                  while (month < 12 && remaining >= monthDays[month]) {
                    remaining -= monthDays[month];
                    month++;
                  }
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const day = remaining + 1;
                  return `${monthNames[month]} ${day}`;
                },
                tickNumber: 12,
                tickInterval: (index) => monthStartSet.has(index),
                gridLines: {
                  style: {
                    stroke: 'rgba(128, 128, 128, 0.06)',
                    strokeWidth: 1,
                  },
                },
              }]}
              yAxis={[{ 
                min: minValue !== undefined ? (minValue - padding) : undefined,
                max: maxValue !== undefined ? (maxValue + padding) : undefined,
                scaleType: 'linear',
                valueFormatter: formatNumber,
                gridLines: {
                  style: {
                    stroke: 'rgba(128, 128, 128, 0.06)',
                    strokeWidth: 1,
                  },
                },
              }]}
              grid={{
                horizontal: true,
                vertical: true,
                style: {
                  stroke: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  strokeWidth: 1,
                }
              }}
              margin={{ 
                right: isMobile ? 5 : 10, 
                top: isMobile ? 35 : 50, 
                bottom: isMobile ? 5 : 10, 
                left: isMobile ? 5 : 10 
              }}
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
          <Stack 
            direction={isMobile ? "column" : "row"} 
            spacing={2} 
            sx={{ 
              mt: isMobile ? 1 : 2,
              px: isMobile ? 1 : 0 
            }}
          >
            <Box sx={{ flex: 1, width: '100%' }}>
              <Typography 
                variant={isMobile ? "caption" : "body2"} 
                sx={{ 
                  mb: 0.5,
                  fontWeight: 500,
                  fontSize: isMobile ? '0.75rem' : undefined
                }}
              >
                Avg Return by Weekday
              </Typography>
              {avgByWeekday && (
                <BarChartPro
                  xAxis={[{ 
                    scaleType: 'band', 
                    data: avgByWeekday.map(x => x.label),
                    tickLabelStyle: {
                      fontSize: isMobile ? 10 : 12,
                    }
                  }]}
                  series={[
                    { 
                      data: avgByWeekday.map(x => (x.value > 0 ? x.value : 0)), 
                      color: '#2e7d32', 
                      stack: 'ret',
                      valueFormatter: (v) => `${(v * 100).toFixed(2)}%`,
                    },
                    { 
                      data: avgByWeekday.map(x => (x.value < 0 ? x.value : 0)), 
                      color: '#d32f2f', 
                      stack: 'ret',
                      valueFormatter: (v) => `${(v * 100).toFixed(2)}%`,
                    },
                  ]}
                  yAxis={[{ 
                    valueFormatter: (v) => `${(v * 100).toFixed(2)}%`,
                    tickLabelStyle: {
                      fontSize: isMobile ? 10 : 12,
                    }
                  }]}
                  height={isMobile ? 180 : (isTablet ? 200 : 220)}
                  margin={{
                    left: isMobile ? 40 : 50,
                    right: isMobile ? 10 : 20,
                    top: isMobile ? 10 : 20,
                    bottom: isMobile ? 30 : 40
                  }}
                />
              )}
            </Box>
            <Box sx={{ flex: 1, width: '100%' }}>
              <Typography 
                variant={isMobile ? "caption" : "body2"} 
                sx={{ 
                  mb: 0.5,
                  fontWeight: 500,
                  fontSize: isMobile ? '0.75rem' : undefined
                }}
              >
                Avg Return by Month
              </Typography>
              {avgByMonth && (
                <BarChartPro
                  xAxis={[{ 
                    scaleType: 'band', 
                    data: avgByMonth.map(x => x.label),
                    tickLabelStyle: {
                      fontSize: isMobile ? 9 : 12,
                      angle: isMobile ? -45 : 0,
                    }
                  }]}
                  series={[
                    { 
                      data: avgByMonth.map(x => (x.value > 0 ? x.value : 0)), 
                      color: '#2e7d32', 
                      stack: 'ret',
                      valueFormatter: (v) => `${(v * 100).toFixed(2)}%`,
                    },
                    { 
                      data: avgByMonth.map(x => (x.value < 0 ? x.value : 0)), 
                      color: '#d32f2f', 
                      stack: 'ret',
                      valueFormatter: (v) => `${(v * 100).toFixed(2)}%`,
                    },
                  ]}
                  yAxis={[{ 
                    valueFormatter: (v) => `${(v * 100).toFixed(2)}%`,
                    tickLabelStyle: {
                      fontSize: isMobile ? 10 : 12,
                    }
                  }]}
                  height={isMobile ? 180 : (isTablet ? 200 : 220)}
                  margin={{
                    left: isMobile ? 40 : 50,
                    right: isMobile ? 10 : 20,
                    top: isMobile ? 10 : 20,
                    bottom: isMobile ? 40 : 40
                  }}
                />
              )}
            </Box>
          </Stack>
        </>
      )}
    </Box>
  );
}


