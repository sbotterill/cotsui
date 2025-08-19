import axios from 'axios';
import { API_BASE_URL } from '../config';

export async function fetchDailyCandles(symbol, fromISO, toISO) {
  const params = {
    symbol,
    from: fromISO,
    to: toISO,
    interval: '1D',
  };
  // Debug: log outgoing request
  try {
    // eslint-disable-next-line no-console
    console.log('[priceService] GET', `${API_BASE_URL}/api/prices/candles`, params);
  } catch (_) {}
  const res = await axios.get(`${API_BASE_URL}/api/prices/candles`, { params });
  // Expect array of items with ISO time string
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows
    .map((r) => ({
      time: Math.floor(new Date(r.time).getTime() / 1000),
      open: Number(r.open),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
      volume: r.volume != null ? Number(r.volume) : undefined,
    }))
    .filter((d) => isFinite(d.time) && isFinite(d.open) && isFinite(d.high) && isFinite(d.low) && isFinite(d.close))
    .sort((a, b) => a.time - b.time);
}

export async function fetchDailyCandlesByAsset(assetId, fromISO, toISO) {
  const params = {
    asset_id: assetId,
    from: fromISO,
    to: toISO,
    interval: '1D',
  };
  try {
    // eslint-disable-next-line no-console
    console.log('[priceService] GET', `${API_BASE_URL}/api/prices/candles`, params);
  } catch (_) {}
  const res = await axios.get(`${API_BASE_URL}/api/prices/candles`, { params });
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows
    .map((r) => ({
      time: Math.floor(new Date(r.time).getTime() / 1000),
      open: Number(r.open),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
      volume: r.volume != null ? Number(r.volume) : undefined,
    }))
    .filter((d) => isFinite(d.time) && isFinite(d.open) && isFinite(d.high) && isFinite(d.low) && isFinite(d.close))
    .sort((a, b) => a.time - b.time);
}


