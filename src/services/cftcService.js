import axios from 'axios';

// Constants
const BATCH_SIZE = 50;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const Z_SCORE_THRESHOLD = 1.5; // Z-score threshold for extreme positions
const CACHE_KEY = `commercialStats_${Date.now()}`; // Dynamic cache key with timestamp

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

export async function getCommercialExtremes(commodities) {
  console.log('🔄 Starting historical data analysis');
  console.log('📊 Input commodities:', commodities.length);

  // First check cache
  const cached = getCachedStats();
  if (cached) {
    console.log('📦 Using cached statistics');
    return cached;
  }

  // If no cache, fetch from API
  const marketCodes = [...new Set(commodities.map(c => c.contract_code))];
  console.log(`🎯 Unique market codes to process: ${marketCodes.length}`);
  
  const results = {};
  
  for (let i = 0; i < marketCodes.length; i += BATCH_SIZE) {
    const batch = marketCodes.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(marketCodes.length/BATCH_SIZE)}`);
    
    const batchPromises = batch.map(code => getHistoricalNetPositions(code));
    
    try {
      const batchResults = await Promise.all(batchPromises);
      
      // Process each result
      batch.forEach((marketCode, index) => {
        const data = batchResults[index];
        if (data && data.stats) {
          results[marketCode] = data;
        }
      });

      // Add delay between batches to respect rate limits
      if (i + BATCH_SIZE < marketCodes.length) {
        console.log('⏳ Adding delay between batches...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Error processing batch starting at index ${i}:`, error);
    }
  }

  console.log('\n📈 Processing summary:', {
    total: marketCodes.length,
    success: Object.keys(results).length,
    coverage: `${((Object.keys(results).length / marketCodes.length) * 100).toFixed(1)}%`
  });

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

    // Calculate net positions
    const netPositions = response.data.map(d => {
      const long = parseInt(d.comm_positions_long_all) || 0;
      const short = parseInt(d.comm_positions_short_all) || 0;
      return long - short;
    }).filter(net => !isNaN(net));

    if (netPositions.length === 0) return null;

    // Calculate statistics
    const mean = calculateMean(netPositions);
    const stdDev = calculateStandardDeviation(netPositions, mean);

    return {
      netPositions,
      stats: {
        mean,
        stdDev,
        count: netPositions.length
      }
    };
  } catch (error) {
    console.error(`Error fetching data for ${marketCode}:`, error);
    return null;
  }
}

export function getCommercialTrackerData(data, historicalData) {
  console.log('\n📊 Processing commercial tracker data:', {
    commodities: data.length,
    historicalDataAvailable: Object.keys(historicalData).length
  });

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

    // Calculate Z-score
    const zScore = calculateZScore(currentNet, history.stats.mean, history.stats.stdDev);

    // Check if position is extreme based on Z-score
    const isExtreme = Math.abs(zScore) >= Z_SCORE_THRESHOLD;
    const extremeType = zScore >= Z_SCORE_THRESHOLD ? 'BULLISH' : 
                        zScore <= -Z_SCORE_THRESHOLD ? 'BEARISH' : 'NORMAL';

    // Log calculation for each commodity
    console.log(`\n🧮 ${item.commodity} (${item.contract_code}):`, {
      current: {
        long: longPosition,
        short: shortPosition,
        net: currentNet
      },
      historical: {
        mean: history.stats.mean.toFixed(2),
        stdDev: history.stats.stdDev.toFixed(2),
        sampleSize: history.stats.count
      },
      zScore: zScore.toFixed(2),
      isExtreme: {
        value: isExtreme,
        type: extremeType
      }
    });

    // Return enriched item regardless; we'll filter below
    return {
      ...item,
      zScore: Number(zScore.toFixed(2)),
      extremeType
    };
  });

  // Keep only extremes for the tracker
  return enriched.filter(x => x && Math.abs(x.zScore) >= Z_SCORE_THRESHOLD);
} 