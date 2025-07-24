import axios from 'axios';

const BATCH_SIZE = 50;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const EXTREME_THRESHOLD = 0.05; // 5% threshold
const CACHE_KEY = 'commercialExtremes_v3'; // Updated cache key to force refresh

async function getHistoricalNetPositions(marketCode) {
  console.log(`🔍 Fetching historical data for market code: ${marketCode}`);
  const query = `
    SELECT 
      cftc_contract_market_code,
      report_date_as_yyyy_mm_dd,
      comm_positions_long_all,
      comm_positions_short_all
    WHERE cftc_contract_market_code = '${marketCode}'
    ORDER BY report_date_as_yyyy_mm_dd DESC
    LIMIT 1000
  `;
  
  const url = `https://publicreporting.cftc.gov/resource/6dca-aqww.json?$query=${encodeURIComponent(query)}`;
  console.log(`📡 API URL: ${url}`);
  return axios.get(url);
}

function getCachedExtremes() {
  console.log('🔍 Checking cache for commercial extremes');
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      console.log(`📦 Found cached data. Age: ${Math.round(age / 1000 / 60)} minutes`);
      if (age < CACHE_DURATION) {
        console.log('✅ Cache is valid, returning cached data');
        return data;
      }
      console.log('❌ Cache is expired');
    }
  } catch (error) {
    console.error('❌ Error reading cached extremes:', error);
  }
  console.log('🔄 No valid cache found, will fetch fresh data');
  return null;
}

function setCachedExtremes(data) {
  console.log('💾 Caching commercial extremes data');
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    console.log('✅ Successfully cached data');
  } catch (error) {
    console.error('❌ Error caching extremes:', error);
  }
}

export async function getCommercialExtremes(commodities) {
  console.log('🔄 Starting getCommercialExtremes');
  console.log('📊 Input commodities:', commodities.length);

  // First check cache
  const cached = getCachedExtremes();
  if (cached) {
    return cached;
  }

  // If no cache, fetch from API
  const marketCodes = [...new Set(commodities.map(c => c.contract_code))];
  console.log(`🎯 Unique market codes to process: ${marketCodes.length}`);
  const results = {};
  
  for (let i = 0; i < marketCodes.length; i += BATCH_SIZE) {
    const batch = marketCodes.slice(i, i + BATCH_SIZE);
    console.log(`📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(marketCodes.length/BATCH_SIZE)}`);
    console.log(`🔍 Current batch market codes:`, batch);
    
    const batchPromises = batch.map(code => getHistoricalNetPositions(code));
    
    try {
      const batchResults = await Promise.all(batchPromises);
      console.log(`✅ Batch ${Math.floor(i/BATCH_SIZE) + 1} API calls successful`);
      
      // Process each result
      batchResults.forEach((result, index) => {
        const marketCode = batch[index];
        const data = result.data;
        
        if (data && data.length > 0) {
          console.log(`📊 Processing data for ${marketCode}. Records: ${data.length}`);
          // Calculate extremes
          const netPositions = data.map(d => 
            parseInt(d.comm_positions_long_all || 0) - parseInt(d.comm_positions_short_all || 0)
          );
          
          const max = Math.max(...netPositions);
          const min = Math.min(...netPositions);
          const current = netPositions[0];
          
          results[marketCode] = { max, min, current };
          console.log(`📈 ${marketCode} extremes - Max: ${max}, Min: ${min}, Current: ${current}`);
        } else {
          console.log(`⚠️ No data found for ${marketCode}`);
        }
      });
      
      // Add delay between batches to respect rate limits
      if (i + BATCH_SIZE < marketCodes.length) {
        console.log('⏳ Adding delay between batches');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Error processing batch starting at index ${i}:`, error);
    }
  }
  
  console.log('💾 Caching final results');
  setCachedExtremes(results);
  
  console.log('✅ getCommercialExtremes complete. Results:', results);
  return results;
}

export function getCommercialTrackerData(data, extremes) {
  console.log('\n🔍 STARTING COMMERCIAL TRACKER ANALYSIS');
  console.log('================================');
  console.log('Input Data Length:', data?.length);
  console.log('Extremes Keys:', Object.keys(extremes || {}).length);

  if (!data || !extremes) {
    console.log('⚠️ Missing data or extremes, returning empty array');
    return [];
  }

  // Find Gold data first for debugging
  const goldData = data.find(item => item.commodity === 'GOLD');
  if (goldData) {
    console.log('\n🔍 FOUND GOLD DATA:', goldData);
    const goldExtremes = extremes[goldData.contract_code];
    console.log('GOLD EXTREMES:', goldExtremes);
  } else {
    console.log('⚠️ Gold data not found in input data');
  }

  const trackedData = data.filter(item => {
    // Log every item being processed
    console.log(`Processing ${item.commodity} (${item.contract_code})`);

    const marketExtremes = extremes[item.contract_code];
    if (!marketExtremes) {
      console.log(`No extremes found for ${item.commodity}`);
      return false;
    }
    
    const currentNet = (parseInt(item.comm_positions_long_all) || 0) - 
                      (parseInt(item.comm_positions_short_all) || 0);
    
    // Calculate threshold ranges
    const maxRange = marketExtremes.max - (Math.abs(marketExtremes.max) * EXTREME_THRESHOLD);
    const minRange = marketExtremes.min + (Math.abs(marketExtremes.min) * EXTREME_THRESHOLD);
    
    // Check if current net position is beyond either threshold
    const isExtremeLong = currentNet >= maxRange;
    const isExtremeShort = currentNet <= minRange;
    
    const isTracked = isExtremeLong || isExtremeShort;

    // Log every item that gets tracked
    if (isTracked) {
      console.log(`\n✅ TRACKING ${item.commodity}:`, {
        contract: item.contract_code,
        currentNet,
        maxRange,
        minRange,
        isExtremeLong,
        isExtremeShort,
        reason: isExtremeLong ? 'EXTREME_LONG' : 'EXTREME_SHORT'
      });
    }

    // Special detailed logging for Gold
    if (item.commodity === 'GOLD') {
      console.log('\n🔍 GOLD CALCULATION DETAILS');
      console.log('Raw Data:', {
        long: item.comm_positions_long_all,
        short: item.comm_positions_short_all,
        currentNet
      });
      console.log('Extremes:', marketExtremes);
      console.log('Thresholds:', {
        maxCalc: {
          max: marketExtremes.max,
          fivePercent: Math.abs(marketExtremes.max) * EXTREME_THRESHOLD,
          maxRange,
          check: `${currentNet} >= ${maxRange} = ${isExtremeLong}`
        },
        minCalc: {
          min: marketExtremes.min,
          fivePercent: Math.abs(marketExtremes.min) * EXTREME_THRESHOLD,
          minRange,
          check: `${currentNet} <= ${minRange} = ${isExtremeShort}`
        }
      });
      console.log('Final Decision:', isTracked ? 'TRACKED' : 'NOT TRACKED');
      console.log('================================');
    }
    
    return isTracked;
  });

  // Log final results
  console.log('\n📊 TRACKING SUMMARY:', {
    totalAnalyzed: data.length,
    totalTracked: trackedData.length,
    trackedCommodities: trackedData.map(item => ({
      commodity: item.commodity,
      contract: item.contract_code
    }))
  });

  return trackedData;
} 