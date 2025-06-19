const isDevelopment = process.env.NODE_ENV === 'development';

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000'
  : 'https://cotsui-backend.onrender.com'; 

export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

// Log configuration during development
if (isDevelopment) {
  console.log('Environment Variables:', {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_GOOGLE_API_KEY: process.env.REACT_APP_GOOGLE_API_KEY ? 'Present' : 'Missing'
  });
  
  console.log('Configuration:', {
    apiBaseUrl: API_BASE_URL,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || 'NOT SET'
  });

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key is missing. Please check your .env file and ensure REACT_APP_GOOGLE_API_KEY is set.');
  }
} 