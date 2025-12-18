import axios from 'axios';

// Constants
const BATCH_SIZE = 50;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const Z_SCORE_THRESHOLD = 1.5; // Z-score threshold for extreme positions
// Use stable cache keys; manage freshness via stored timestamps
const CACHE_KEY = 'commercialStatsCache_v2'; // v2 includes 5-year stats
const RETAIL_CACHE_KEY = 'retailStatsCache_v2'; // v2 includes 5-year stats

// Calculate mean of an array
function calculateMean(values) {
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

// Calculate standard deviation
function calculateStandardDeviation(values, mean) {
  const squareDiffs = values.map(value => {
    const diff = value - mean;
    return diff * diff;
  });
  const avgSquareDiff = calculateMean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

// Calculate Z-score
function calculateZScore(value, mean, stdDev) {
  return stdDev === 0 ? 0 : (value - mean) / stdDev;
}

// Get cached statistics
function getCachedStats() {
  try {
    // Clear old cache keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('commercialStats_') && key !== CACHE_KEY) {
        localStorage.removeItem(key);
      }
    });

    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error reading cached statistics:', error);
    return null;
  }
}

// Set cached statistics
function setCachedStats(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('❌ Error caching statistics:', error);
  }
}

// Retail cache helpers
function getCachedRetailStats() {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('retailStats_') && key !== RETAIL_CACHE_KEY) {
        localStorage.removeItem(key);
      }
    });

    const cached = localStorage.getItem(RETAIL_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    if (age > CACHE_DURATION) {
      localStorage.removeItem(RETAIL_CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error reading cached retail statistics:', error);
    return null;
  }
}

function setCachedRetailStats(data) {
  try {
    localStorage.setItem(RETAIL_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('❌ Error caching retail statistics:', error);
  }
}

export async function getCommercialExtremes(commodities) {

  // First check cache
  const cached = getCachedStats();
  if (cached) {
    return cached;
  }

  // If no cache, fetch from API
  const marketCodes = [...new Set(commodities.map(c => c.contract_code))];
  
  const results = {};
  
  // Fire all requests in parallel with a concurrency cap to avoid locking the main thread
  const CONCURRENCY = 8;
  let index = 0;
  const runNext = async () => {
    while (index < marketCodes.length) {
      const current = index++;
      const code = marketCodes[current];
      try {
        const data = await getHistoricalNetPositions(code);
        if (data && data.stats) {
          results[code] = data;
        }
      } catch (err) {
        // Continue others even if one fails
      }
    }
  };

  // Launch workers
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, marketCodes.length) }, runNext));


  setCachedStats(results);
  return results;
}

async function getHistoricalNetPositions(marketCode) {
  try {
    const query = `
      SELECT
        report_date_as_yyyy_mm_dd,
        comm_positions_long_all,
        comm_positions_short_all
      WHERE
        cftc_contract_market_code = '${marketCode}'
      ORDER BY
        report_date_as_yyyy_mm_dd DESC
      LIMIT 1000
    `.replace(/\s+/g, ' ').trim();

    const url = `https://publicreporting.cftc.gov/resource/6dca-aqww.json?$query=${encodeURIComponent(query)}`;
    const response = await axios.get(url);
    
    if (!response.data || !Array.isArray(response.data)) {
      return null;
    }

    // Calculate net positions with dates
    const dataWithDates = response.data.map(d => {
      const long = parseInt(d.comm_positions_long_all) || 0;
      const short = parseInt(d.comm_positions_short_all) || 0;
      return {
        date: d.report_date_as_yyyy_mm_dd,
        net: long - short
      };
    }).filter(item => !isNaN(item.net));

    if (dataWithDates.length === 0) return null;

    const netPositions = dataWithDates.map(d => d.net);

    // Calculate all-time statistics
    const mean = calculateMean(netPositions);
    const stdDev = calculateStandardDeviation(netPositions, mean);

    // Calculate 5-year statistics
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const fiveYearData = dataWithDates.filter(d => {
      const itemDate = new Date(d.date);
      return itemDate >= fiveYearsAgo;
    });

    let stats5y = null;
    if (fiveYearData.length > 0) {
      const netPositions5y = fiveYearData.map(d => d.net);
      const mean5y = calculateMean(netPositions5y);
      const stdDev5y = calculateStandardDeviation(netPositions5y, mean5y);
      stats5y = {
        mean: mean5y,
        stdDev: stdDev5y,
        count: netPositions5y.length
      };
    }

    return {
      netPositions,
      stats: {
        mean,
        stdDev,
        count: netPositions.length
      },
      stats5y
    };
  } catch (error) {
    console.error(`Error fetching data for ${marketCode}:`, error);
    return null;
  }
}

export function getCommercialTrackerData(data, historicalData) {

  const enriched = data.map(item => {
    // Get historical data for this commodity
    const history = historicalData[item.contract_code];
    if (!history || !history.stats) {
      return null;
    }

    // Calculate current net position
    const longPosition = parseInt(item.commercial_long) || 0;
    const shortPosition = parseInt(item.commercial_short) || 0;
    const currentNet = longPosition - shortPosition;

    if (isNaN(currentNet)) {
      return null;
    }

    // Calculate all-time Z-score
    const zScore = calculateZScore(currentNet, history.stats.mean, history.stats.stdDev);

    // Calculate 5-year Z-score if available
    let zScore5y = null;
    if (history.stats5y) {
      zScore5y = calculateZScore(currentNet, history.stats5y.mean, history.stats5y.stdDev);
      zScore5y = Number(zScore5y.toFixed(2));
    }

    // Check if position is extreme based on Z-score
    const extremeType = zScore >= Z_SCORE_THRESHOLD ? 'BULLISH' : 
                        zScore <= -Z_SCORE_THRESHOLD ? 'BEARISH' : 'NORMAL';

    // Return enriched item regardless; we'll filter below
    return {
      ...item,
      zScore: Number(zScore.toFixed(2)),
      zScore5y,
      extremeType
    };
  });

  // Keep only extremes for the tracker
  return enriched.filter(x => x && Math.abs(x.zScore) >= Z_SCORE_THRESHOLD);
} 

// Retail extremes based on non-reportable (retail) positions
export async function getRetailExtremes(commodities) {
  const cached = getCachedRetailStats();
  if (cached) {
    return cached;
  }

  const marketCodes = [...new Set(commodities.map(c => c.contract_code))];
  const results = {};

  // Parallel with concurrency cap
  const CONCURRENCY = 8;
  let index = 0;
  const runNext = async () => {
    while (index < marketCodes.length) {
      const current = index++;
      const code = marketCodes[current];
      try {
        const data = await getHistoricalRetailNetPositions(code);
        if (data && data.stats) {
          results[code] = data;
        }
      } catch (err) {
        // continue
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, marketCodes.length) }, runNext));

  setCachedRetailStats(results);
  return results;
}

async function getHistoricalRetailNetPositions(marketCode) {
  try {
    const query = `
      SELECT
        report_date_as_yyyy_mm_dd,
        nonrept_positions_long_all,
        nonrept_positions_short_all
      WHERE
        cftc_contract_market_code = '${marketCode}'
      ORDER BY
        report_date_as_yyyy_mm_dd DESC
      LIMIT 1000
    `.replace(/\s+/g, ' ').trim();

    const url = `https://publicreporting.cftc.gov/resource/6dca-aqww.json?$query=${encodeURIComponent(query)}`;
    const response = await axios.get(url);

    if (!response.data || !Array.isArray(response.data)) {
      return null;
    }

    // Calculate net positions with dates
    const dataWithDates = response.data.map(d => {
      const long = parseInt(d.nonrept_positions_long_all) || 0;
      const short = parseInt(d.nonrept_positions_short_all) || 0;
      return {
        date: d.report_date_as_yyyy_mm_dd,
        net: long - short
      };
    }).filter(item => !isNaN(item.net));

    if (dataWithDates.length === 0) return null;

    const netPositions = dataWithDates.map(d => d.net);

    // Calculate all-time statistics
    const mean = calculateMean(netPositions);
    const stdDev = calculateStandardDeviation(netPositions, mean);

    // Calculate 5-year statistics
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const fiveYearData = dataWithDates.filter(d => {
      const itemDate = new Date(d.date);
      return itemDate >= fiveYearsAgo;
    });

    let stats5y = null;
    if (fiveYearData.length > 0) {
      const netPositions5y = fiveYearData.map(d => d.net);
      const mean5y = calculateMean(netPositions5y);
      const stdDev5y = calculateStandardDeviation(netPositions5y, mean5y);
      stats5y = {
        mean: mean5y,
        stdDev: stdDev5y,
        count: netPositions5y.length
      };
    }

    return {
      netPositions,
      stats: {
        mean,
        stdDev,
        count: netPositions.length
      },
      stats5y
    };
  } catch (error) {
    console.error(`Error fetching retail data for ${marketCode}:`, error);
    return null;
  }
}

export function getRetailTrackerData(data, historicalData) {
  const enriched = data.map(item => {
    const history = historicalData[item.contract_code];
    if (!history || !history.stats) {
      return null;
    }

    const longPosition = parseInt(item.non_reportable_long) || 0;
    const shortPosition = parseInt(item.non_reportable_short) || 0;
    const currentNet = longPosition - shortPosition;

    if (isNaN(currentNet)) {
      return null;
    }

    // Calculate all-time Z-score
    const zScore = calculateZScore(currentNet, history.stats.mean, history.stats.stdDev);

    // Calculate 5-year Z-score if available
    let zScore5y = null;
    if (history.stats5y) {
      zScore5y = calculateZScore(currentNet, history.stats5y.mean, history.stats5y.stdDev);
      zScore5y = Number(zScore5y.toFixed(2));
    }

    const extremeType = zScore >= Z_SCORE_THRESHOLD ? 'BULLISH' :
                        zScore <= -Z_SCORE_THRESHOLD ? 'BEARISH' : 'NORMAL';

    return {
      ...item,
      zScore: Number(zScore.toFixed(2)),
      zScore5y,
      extremeType
    };
  });

  return enriched.filter(x => x && Math.abs(x.zScore) >= Z_SCORE_THRESHOLD);
}