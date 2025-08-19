import * as React from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { createChart } from 'lightweight-charts';
import { fetchDailyCandlesByAsset } from '../services/priceService';

// Widget-safe options now controlled by header, not inside this component

const PROXY_MAP = [
  // Indices futures
  { match: /\b(ES|MES)/i, proxy: 'AMEX:SPY' },
  { match: /\b(NQ|MNQ)/i, proxy: 'NASDAQ:QQQ' },
  { match: /\b(YM|MYM)/i, proxy: 'AMEX:DIA' },
  { match: /\b(RTY|TF)/i, proxy: 'AMEX:IWM' },
  { match: /NIKKEI|NKD/i, proxy: 'AMEX:EWJ' },
  { match: /FTSE/i, proxy: 'AMEX:EWU' },
  { match: /DAX/i, proxy: 'AMEX:EWG' },
  // Energies
  { match: /\b(CL|MCL)\b|CRUDE|WTI/i, proxy: 'TVC:USOIL' },
  { match: /BRENT|\b(BZ|BRN)\b/i, proxy: 'TVC:UKOIL' },
  { match: /\b(NG|QG)\b|NAT(URAL)? GAS/i, proxy: 'TVC:NATGAS' },
  { match: /\b(RB|RBOB)\b|GASOLINE/i, proxy: 'AMEX:UGA' },
  { match: /\b(HO)\b|HEATING OIL/i, proxy: 'AMEX:UHN' },
  // Metals
  { match: /\b(GC|MGC)\b|GOLD/i, proxy: 'TVC:GOLD' },
  { match: /\b(SI)\b|SILVER/i, proxy: 'TVC:SILVER' },
  { match: /\b(HG)\b|COPPER/i, proxy: 'TVC:COPPER' },
  { match: /\b(PL)\b|PLATINUM/i, proxy: 'TVC:PLATINUM' },
  { match: /\b(PA)\b|PALLADIUM/i, proxy: 'TVC:PALLADIUM' },
  { match: /ALUMINUM|ALUMINIUM/i, proxy: 'TVC:ALUMINUM' },
  // Grains
  { match: /\b(ZC|CORN)\b/i, proxy: 'AMEX:CORN' },
  { match: /\b(ZS|SOYBEAN|SOYBEANS)\b/i, proxy: 'AMEX:SOYB' },
  { match: /\b(ZW|WHEAT)\b/i, proxy: 'AMEX:WEAT' },
  { match: /\b(ZM|MEAL)\b/i, proxy: 'AMEX:SOYB' },
  { match: /\b(ZL|SOYBEAN OIL)\b/i, proxy: 'AMEX:DBA' },
  { match: /\b(ZO|OATS)\b/i, proxy: 'AMEX:DBA' },
  { match: /\b(ZR|RICE|ROUGH RICE)\b/i, proxy: 'AMEX:DBA' },
  { match: /CANOLA|RAPESEED|\b(RS)\b/i, proxy: 'AMEX:DBA' },
  // Softs
  { match: /\b(KC|COFFEE)\b/i, proxy: 'AMEX:JO' },
  { match: /\b(SB|SUGAR)\b/i, proxy: 'AMEX:CANE' },
  { match: /\b(CC|COCOA)\b/i, proxy: 'AMEX:NIB' },
  { match: /\b(CT|COTTON)\b/i, proxy: 'AMEX:BAL' },
  { match: /\b(OJ|ORANGE JUICE)\b/i, proxy: 'AMEX:DBA' },
  { match: /LUMBER|\b(LB)\b/i, proxy: 'AMEX:WOOD' },
  // Livestock / dairy
  { match: /\b(LE|LIVE CATTLE|GF|FEEDER CATTLE|HE|LEAN HOGS?)\b/i, proxy: 'AMEX:COW' },
  { match: /MILK|DAIRY/i, proxy: 'AMEX:DBA' },
  // Currencies
  { match: /\b6E\b|EURO FX|EURUSD/i, proxy: 'FX:EURUSD' },
  { match: /\b6B\b|BRITISH POUND|GBPUSD/i, proxy: 'FX:GBPUSD' },
  { match: /\b6J\b|JAPANESE YEN|USDJPY/i, proxy: 'FX:USDJPY' },
  { match: /\b6A\b|AUSTRALIAN DOLLAR|AUDUSD/i, proxy: 'FX:AUDUSD' },
  { match: /\b6C\b|CANADIAN DOLLAR|USDCAD/i, proxy: 'FX:USDCAD' },
  { match: /\b6N\b|NEW ZEALAND DOLLAR|NZDUSD/i, proxy: 'FX:NZDUSD' },
  { match: /\b6S\b|SWISS FRANC|USDCHF/i, proxy: 'FX:USDCHF' },
  { match: /\b6L\b|MEXICAN PESO|USDMXN/i, proxy: 'FX:USDMXN' },
  { match: /\b6Z\b|BRAZILIAN REAL|USDBRL/i, proxy: 'FX:USDBRL' },
  { match: /\b6R\b|RUSSIAN RUBLE|USDRUB/i, proxy: 'FX:USDRUB' },
  { match: /\b(DX)\b|DOLLAR INDEX/i, proxy: 'TVC:DXY' },
  // Rates
  { match: /\b(ZN|10[- ]?YEAR)\b/i, proxy: 'TVC:US10Y' },
  { match: /\b(ZB|30[- ]?YEAR|UB)\b/i, proxy: 'TVC:US30Y' },
  { match: /\b(ZF|5[- ]?YEAR)\b/i, proxy: 'TVC:US05Y' },
  { match: /\b(ZT|2[- ]?YEAR)\b/i, proxy: 'TVC:US02Y' },
];

function mapToProxySymbol(requested) {
  if (!requested) return null;
  for (const { match, proxy } of PROXY_MAP) {
    if (match.test(requested)) return proxy;
  }
  return null;
}

export default function TradingViewAdvancedChart({ assetId, height = 'calc(100vh - 120px)', interval = 'D', cotSeries }) {
  const theme = useTheme();
  const containerRef = React.useRef(null);
  const chartRef = React.useRef(null);
  const [priceData, setPriceData] = React.useState([]);
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        // Fixed start date per requirement
        const fromISO = '2010-01-04';
        const to = new Date();
        const toISO = to.toISOString().slice(0,10);
        const candles = await fetchDailyCandlesByAsset(assetId, fromISO, toISO);
        // Normalize to UTCTimestamp seconds to match line series times
        const normalized = (candles || [])
          .map((row) => ({
            time: Math.floor(new Date(row.time).getTime() / 1000),
            open: Number(row.open),
            high: Number(row.high),
            low: Number(row.low),
            close: Number(row.close),
          }))
          .filter((c) => Number.isFinite(c.time) && Number.isFinite(c.open) && Number.isFinite(c.high) && Number.isFinite(c.low) && Number.isFinite(c.close))
          .sort((a, b) => a.time - b.time);
        if (!cancelled) setPriceData(normalized);
      } catch (e) {
        if (!cancelled) setPriceData([]);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [assetId]);

  React.useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: theme.palette.text.primary,
      },
      grid: {
        vertLines: { color: theme.palette.mode === 'dark' ? '#2b2b2b' : '#e6e6e6' },
        horzLines: { color: theme.palette.mode === 'dark' ? '#2b2b2b' : '#e6e6e6' },
      },
      leftPriceScale: { visible: true, borderVisible: false },
      rightPriceScale: { visible: true, borderVisible: false },
      timeScale: { borderVisible: false },
      autoSize: true,
    });
    chartRef.current = chart;

    // Build ascending time data helper
    const buildData = (datesArr, valuesArr) => {
      const pts = [];
      const len = (datesArr || []).length;
      for (let i = 0; i < len; i++) {
        const t = Math.floor(new Date(datesArr[i]).getTime() / 1000);
        if (!isFinite(t)) continue;
        const v = valuesArr ? Number(valuesArr[i] || 0) : i;
        pts.push({ time: t, value: v });
      }
      pts.sort((a, b) => a.time - b.time);
      const dedup = [];
      for (const p of pts) {
        if (dedup.length && dedup[dedup.length - 1].time === p.time) dedup[dedup.length - 1] = p; else dedup.push(p);
      }
      return dedup;
    };

    // Candlestick price series (right scale)
    if (priceData && priceData.length) {
      const candles = chart.addCandlestickSeries({
        upColor: '#26a69a', downColor: '#ef5350',
        borderUpColor: '#26a69a', borderDownColor: '#ef5350',
        wickUpColor: '#26a69a', wickDownColor: '#ef5350',
        priceScaleId: 'right',
      });
      candles.setData(priceData);
    }

    // COT lines (left scale)
    if (cotSeries) {
      const comm = chart.addLineSeries({ color: '#4caf50', lineWidth: 2, priceScaleId: 'left' });
      const nonComm = chart.addLineSeries({ color: '#ff9800', lineWidth: 2, priceScaleId: 'left' });
      const nonRep = chart.addLineSeries({ color: '#9c27b0', lineWidth: 2, priceScaleId: 'left' });
      comm.setData(buildData(cotSeries.dates || [], cotSeries.commercial || []));
      nonComm.setData(buildData(cotSeries.dates || [], cotSeries.nonCommercial || []));
      nonRep.setData(buildData(cotSeries.dates || [], cotSeries.nonReportable || []));
    }

    // Expand scales and fit content
    chart.priceScale('left').applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } });
    chart.priceScale('right').applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } });
    chart.timeScale().fitContent();

    const handleResize = () => { chart.applyOptions({ autoSize: true }); };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    };
  }, [cotSeries, priceData, theme.palette.mode, theme.palette.primary.main, theme.palette.text.primary]);

  return (
    <Box sx={{ width: '100%', height, minHeight: 400 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </Box>
  );
}


