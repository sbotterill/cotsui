import axios from 'axios';
import { API_BASE_URL } from '../config';

export async function fetchDailyCandlesByAsset(symbolName) {
  const params = {
    symbol: symbolName,
  };
 
  const res = await axios.get(`${API_BASE_URL}/seasonality_data`, { params });
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows
    .map((r) => ({
      time: Math.floor(new Date(r.time).getTime() / 1000),
      open: Number(r.open),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
    }))
    .filter((d) => isFinite(d.time) && isFinite(d.open) && isFinite(d.high) && isFinite(d.low) && isFinite(d.close))
    .sort((a, b) => a.time - b.time);
}

export async function fetchAllCandlesByAsset(symbolName) {
  const params = {
    symbol: symbolName,
  };
  const res = await axios.get(`${API_BASE_URL}/seasonality_data`, { params });
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows;
}

export async function fetchAvailableAssets() {
  const res = await axios.get(`${API_BASE_URL}/seasonality_assets`);
  return res.data.assets || [];
}