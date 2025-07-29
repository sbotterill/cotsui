import axios from 'axios';

// Constants
const BATCH_SIZE = 50;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const EXTREME_THRESHOLD = 0.10;
const CACHE_KEY = `commercialExtremes_${Date.now()}`; // Force new cache key on each load

// Get historical net positions for a market code
async function getHistoricalNetPositions(marketCode) {
  try {    
    // Build SoQL query for historical net positions
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
    
    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      return null;
    }

    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching data for ${marketCode}:`, {
      message: error.message,
      response: error.response?.data
    });
    return null;
  }
}

function getCachedExtremes() {
  try {
    // Clear any old cache keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('commercialExtremes_')) {
        localStorage.removeItem(key);
      }
    });

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      if (age < CACHE_DURATION) {
        return data;
      }
    }
  } catch (error) {
    console.error('❌ Error reading cached extremes:', error);
  }
  return null;
}

function setCachedExtremes(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('❌ Error caching extremes:', error);
  }
}

export async function getCommercialExtremes(commodities) {

  // First check cache
  const cached = getCachedExtremes();
  if (cached) {
    return cached;
  }

  // If no cache, fetch from API
  const marketCodes = [...new Set(commodities.map(c => c.contract_code))];

  const results = {};
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < marketCodes.length; i += BATCH_SIZE) {
    const batch = marketCodes.slice(i, i + BATCH_SIZE);    
    const batchPromises = batch.map(code => getHistoricalNetPositions(code));
    
    try {
      const batchResults = await Promise.all(batchPromises);
      
      // Process each result
      batch.forEach((marketCode, index) => {
        const data = batchResults[index];
        
        if (data && data.length > 0) {
          // Calculate extremes
          const netPositions = data.map(d => {
            const long = parseInt(d.comm_positions_long_all) || 0;
            const short = parseInt(d.comm_positions_short_all) || 0;
            return long - short;
          }).filter(net => !isNaN(net));

          if (netPositions.length === 0) {
            errorCount++;
            return;
          }

          const max = Math.max(...netPositions);
          const min = Math.min(...netPositions);

          // Get current net position from commodities array
          const currentCommodity = commodities.find(c => c.contract_code === marketCode);
          const current = currentCommodity 
            ? (parseInt(currentCommodity.commercial_long) || 0) - (parseInt(currentCommodity.commercial_short) || 0)
            : 0;
          
          results[marketCode] = { max, min, current };
          successCount++;
        } else {
          errorCount++;
        }
      });

      // Add delay between batches to respect rate limits
      if (i + BATCH_SIZE < marketCodes.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Error processing batch starting at index ${i}:`, error);
      errorCount += batch.length;
    }
  }

  if (successCount === 0) {
    console.error('❌ No historical data could be processed!');
    return {};
  }

  setCachedExtremes(results);
  return results;
}

export function getCommercialTrackerData(data, extremes) {
  console.log('\n📊 Processing commercial tracker data:', {
    commodities: data.length,
    extremesAvailable: Object.keys(extremes).length
  });

  return data.filter(item => {
    // Get extremes for this commodity
    const marketExtremes = extremes[item.contract_code];
    if (!marketExtremes || typeof marketExtremes.max !== 'number' || typeof marketExtremes.min !== 'number') {
      return false;
    }

    // Calculate current net position
    const longPosition = parseInt(item.commercial_long) || 0;
    const shortPosition = parseInt(item.commercial_short) || 0;
    const currentNet = longPosition - shortPosition;

    if (isNaN(currentNet)) {
      return false;
    }

    // Calculate threshold amounts
    const thresholdAmountMax = Math.abs(marketExtremes.max) * EXTREME_THRESHOLD;
    const thresholdAmountMin = Math.abs(marketExtremes.min) * EXTREME_THRESHOLD;

    // Calculate thresholds
    const maxThreshold = marketExtremes.max >= 0 
      ? marketExtremes.max - thresholdAmountMax  // For positive max
      : marketExtremes.max + thresholdAmountMax; // For negative max

    const minThreshold = marketExtremes.min >= 0
      ? marketExtremes.min - thresholdAmountMin  // For positive min
      : marketExtremes.min + thresholdAmountMin; // For negative min

    // Check if current net position is near extremes
    const isExtremeLong = currentNet >= maxThreshold;
    const isExtremeShort = currentNet <= minThreshold;
    const isTracked = isExtremeLong || isExtremeShort;

    // Log calculation for each commodity
    console.log(`\n🧮 ${item.commodity} (${item.contract_code}):`, {
      current: {
        long: longPosition,
        short: shortPosition,
        net: currentNet
      },
      extremes: {
        max: marketExtremes.max,
        min: marketExtremes.min
      },
      thresholds: {
        maxAmount: thresholdAmountMax,
        minAmount: thresholdAmountMin,
        maxThreshold,
        minThreshold
      },
      checks: {
        isExtremeLong: `${currentNet} >= ${maxThreshold} = ${isExtremeLong}`,
        isExtremeShort: `${currentNet} <= ${minThreshold} = ${isExtremeShort}`,
        isTracked
      }
    });

    return isTracked;
  });
} 