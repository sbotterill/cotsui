import * as React from 'react';
import axios from 'axios';
import './App.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import DrawerAppBar from './components/AppBar';
import CollapsibleTable from './components/CollapsableTable';
import CircularLoading from './components/Loading';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const getThisWeeksTuesday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday = 0, ..., Saturday = 6
  const diffToTuesday = (2 - dayOfWeek + 7) % 7;
  const tuesday = new Date(today);
  tuesday.setDate(today.getDate() + diffToTuesday);
  tuesday.setHours(0, 0, 0, 0);
  return formatLocalIso(tuesday);
};

const formatLocalIso = (date) => {
  const pad = (n) => n.toString().padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.000`;
};

const getLastWeeksTuesday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday = 0, ..., Saturday = 6

  // Get how many days have passed since *last* Tuesday
  const diffToLastTuesday = ((dayOfWeek - 2 + 7) % 7) + 7;

  const lastTuesday = new Date(today);
  lastTuesday.setDate(today.getDate() - diffToLastTuesday);
  lastTuesday.setHours(0, 0, 0, 0);

  return formatLocalIso(lastTuesday);
};

async function fetchData() {
  let fullList = [];
  let exchangesList = [];
  let reportDate = await getThisWeeksTuesday();

  try {
    const firstResponse = await axios.get("https://publicreporting.cftc.gov/resource/6dca-aqww.json");
   
    // Build all the individual requests into an array
    const requests = firstResponse.data.map(async element => {
      if (element.cftc_market_code !== "NODX" && element.cftc_market_code !== "IFED") {
        try {
          let response = await axios.get(
            `https://publicreporting.cftc.gov/resource/6dca-aqww.json?cftc_contract_market_code=${element.cftc_contract_market_code}&report_date_as_yyyy_mm_dd=${reportDate}`
          );
          if (response.data.length === 0) {
            reportDate = await getLastWeeksTuesday()
            response = await axios.get(
              `https://publicreporting.cftc.gov/resource/6dca-aqww.json?cftc_contract_market_code=${element.cftc_contract_market_code}&report_date_as_yyyy_mm_dd=${reportDate}`
            );
          }

          const data = response.data[0];

          if (
            !data ||
            !data.noncomm_positions_long_all ||
            !data.noncomm_positions_short_all ||
            data.noncomm_positions_long_all === "undefined"
          ) {
            return; // Skip this entry if undefined positions
          }

          const commercialTotalPostitions = +data.comm_positions_long_all + +data.comm_positions_short_all;
          const commercialPercentageLong = +data.comm_positions_long_all / commercialTotalPostitions;
          const commercialPercentageShort = +data.comm_positions_short_all / commercialTotalPostitions;
          const nonCommercialTotalPostitions = +data.noncomm_positions_long_all + +data.noncomm_positions_short_all;
          const nonCommercialPercentageLong = +data.noncomm_positions_long_all / nonCommercialTotalPostitions;
          const nonCommercialPercentageShort = +data.noncomm_positions_short_all / nonCommercialTotalPostitions;
          const nonReptTotalPostitions = +data.nonrept_positions_long_all + +data.nonrept_positions_short_all;
          const nonReptPercentageLong = +data.nonrept_positions_long_all / nonReptTotalPostitions;
          const nonReptPercentageShort = +data.nonrept_positions_short_all / nonReptTotalPostitions;

          const obj = {
            "commodity": element.contract_market_name,
            "contract_code": element.cftc_contract_market_code,
            "market_and_exchange_name": element.market_and_exchange_names,
            "market_code": element.cftc_market_code, 
            "report_date": reportDate,
            "commerical_long": +data.comm_positions_long_all,
            "commerical_long_change": +data.change_in_comm_long_all,
            "commerical_short": +data.comm_positions_short_all,
            "commerical_short_change": +data.change_in_comm_short_all,
            "commerical_total": commercialTotalPostitions,
            "commerical_percentage_long": commercialPercentageLong,
            "commerical_percentage_short": commercialPercentageShort,
            "non_commercial_long": +data.noncomm_positions_long_all,
            "non_commercial_long_change": +data.change_in_noncomm_long_all,
            "non_commercial_short": +data.noncomm_positions_short_all,
            "non_commercial_short_change": +data.change_in_noncomm_short_all,
            "non_commercial_total": nonCommercialTotalPostitions,
            "non_commercial_percentage_long": nonCommercialPercentageLong,
            "non_commercial_percentage_short": nonCommercialPercentageShort,
            "non_reportable_long": +data.nonrept_positions_long_all,
            "non_reportable_long_change": +data.change_in_nonrept_long_all,
            "non_reportable_short": +data.nonrept_positions_short_all,
            "non_reportable_short_change": +data.change_in_nonrept_short_all,
            "non_reportable_total": nonReptTotalPostitions,
            "non_reportable_percentage_long": nonReptPercentageLong,
            "non_reportable_percentage_short": nonReptPercentageShort,
          };

          if (!fullList.some(item => item.commodity === obj.commodity)) {
            fullList.push(obj);
          }

          let market_exchange_full_name = element.market_and_exchange_names.split("-");
          let words = ["CHICAGO MERCANTILE EXCHANGE", "CHICAGO BOARD OF TRADE", "COMMODITY EXCHANGE INC", "CBOE FUTURES EXCHANGE", "ICE FUTURES U.S.", "NEW YORK MERCANTILE EXCHANGE"]
          const found = words.some(word => market_exchange_full_name[1].includes(word));
          
          if (found) {         
            if (!exchangesList.includes(`${element.cftc_market_code.trim()} - ${market_exchange_full_name[1].trim()}`)) {
              exchangesList.push(`${element.cftc_market_code.trim()} - ${market_exchange_full_name[1].trim()}`);
            }
          }

        } catch (err) {
          console.warn(`Failed to fetch data for ${element.contract_market_name}:`, err.message);
        }
      } else {
        return;
      }
    });

    // Wait for all requests to finish
    await Promise.all(requests);

    // Now sort the list
    let sortedExchanges = exchangesList.sort((a, b) => a.localeCompare(b));
    let sortedFutures = fullList.sort((a, b) => a.commodity.localeCompare(b.commodity));

    return [sortedExchanges, sortedFutures, reportDate]
    
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

export default function App() {
  const [futuresData, setFuturesData] = React.useState([])
  const [filteredData, setFilteredData] = React.useState([])
  const [exchanges, setExchanges] = React.useState([])
  const [lastUpdated, setLastUpdated] = React.useState([])

  React.useEffect(() => {
    const loadData = async () => {
      const dataArr = await fetchData();
      setExchanges(dataArr[0]);
      setFuturesData(dataArr[1]);
      setFilteredData(dataArr[1])
      setLastUpdated(dataArr[2]);
    };

    loadData();
  }, []);
  
  return (
    <>
      {futuresData.length > 0 && exchanges.length > 0 ? (
        <ThemeProvider theme={darkTheme}>
          <div className="app-js-container">
            <DrawerAppBar futuresData={futuresData} setFilteredData={setFilteredData} reportDate={lastUpdated}/>
            <div style={{ paddingTop: '90px', width: "100%" }}>
              <CollapsibleTable futuresData={filteredData} exchanges={exchanges} />
            </div>
          </div>
        </ThemeProvider>
      ) : (
        <div style={{display: "flex", alignContent: "center", justifyContent: "center", height: "100vh"}}>
          <CircularLoading />
        </div>
      )}
    </>   
  );
}
