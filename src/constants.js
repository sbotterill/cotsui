export const ALLOWED_EXCHANGES = [
  "CHICAGO MERCANTILE EXCHANGE",
  "CHICAGO BOARD OF TRADE",
  "COMMODITY EXCHANGE INC.",
  "CBOE FUTURES EXCHANGE",
  "ICE FUTURES U.S.",
  "NEW YORK MERCANTILE EXCHANGE"
];

// Helper function to validate if an exchange is allowed
export const isValidExchange = (exchange) => {
  return ALLOWED_EXCHANGES.includes(exchange);
}; 