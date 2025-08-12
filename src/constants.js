export const ALLOWED_EXCHANGES = [
  "CHICAGO MERCANTILE EXCHANGE",
  "CHICAGO BOARD OF TRADE",
  "COMMODITY EXCHANGE INC.",
  "ICE - ICE FUTURES",
  "NEW YORK MERCANTILE EXCHANGE",
  "SMALL EXCHANGE",
  "BITNOMIAL EXCHANGE",
  "KALSHI EXCHANGE",
  "LEDGERX",
  "TRADEWEB FUTURES EXCHANGE",
  "BAKKT FUTURES",
  "CANTOR FUTURES EXCHANGE",
  "CRYPTO FACILITIES LTD",
  "EUREX",
  "NADEX",
  "NASDAQ FUTURES"
];

// Mapping of short codes to full exchange names
export const EXCHANGE_CODE_MAP = {
  "CBT": "CHICAGO BOARD OF TRADE",
  "CME": "CHICAGO MERCANTILE EXCHANGE",
  "CMX": "COMMODITY EXCHANGE INC.",
  "ICE": "ICE - ICE FUTURES",
  "ICEU": "ICE - ICE FUTURES",
  "ICUS": "ICE - ICE FUTURES",
  "IFED": "ICE - ICE FUTURES",
  "NYME": "NEW YORK MERCANTILE EXCHANGE"
};

// Exchange codes that should be removed from the application entirely
export const REMOVED_EXCHANGE_CODES = ["E", "MGE", "NODX", "FREX"];

// Helper function to validate if an exchange is allowed
export const isValidExchange = (exchange) => {
  // Allow all exchanges
  return true;
}; 