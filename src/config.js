const isDevelopment = process.env.NODE_ENV === 'development';

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000'
  : 'https://cotsui-backend.onrender.com'; 

export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;