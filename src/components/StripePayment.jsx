import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Alert,
  TextField,
  Divider,
  Grid,
  Link,
  Autocomplete,
  Paper
} from '@mui/material';
import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from '../config';
import LockIcon from '@mui/icons-material/Lock';
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      ':-webkit-autofill': {
        color: '#fce883',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const inputStyles = {
  '& .MuiInputBase-input': {
    padding: '16px 14px',
    fontSize: '16px',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#e0e0e0',
    },
    '&:hover fieldset': {
      borderColor: '#bdbdbd',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'primary.main',
    },
  },
};

const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error('Google Maps API key is not configured'));
      return;
    }

    // Create a global callback function
    const callbackName = 'initGoogleMaps';
    window[callbackName] = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        resolve();
      } else {
        reject(new Error('Google Maps API failed to initialize properly'));
      }
    };

    // Add error handler for API load errors
    window.gm_authFailure = () => {
      reject(new Error('Google Maps API authentication failed - Please check API key and enabled services'));
    };

    try {
      const script = document.createElement('script');
      const params = new URLSearchParams({
        key: GOOGLE_MAPS_API_KEY,
        libraries: 'places',
        callback: callbackName,
        v: 'weekly'
      });
      
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.defer = true;

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API script'));
      };

      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });
};

const searchOptions = {
  types: ['address'],
  componentRestrictions: { country: 'us' }, // Restrict to US addresses
  fields: ['address_components', 'formatted_address', 'geometry', 'name']
};

// Add these styles at the top with other style constants
const addressDropdownStyles = {
  position: 'absolute',
  zIndex: 1000,
  width: '100%',
  bgcolor: 'background.paper',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  borderRadius: '8px',
  mt: 1,
  maxHeight: '300px',
  overflowY: 'auto',
  border: '1px solid',
  borderColor: 'divider',
};

const suggestionItemStyles = {
  p: 2,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    bgcolor: 'rgba(25, 118, 210, 0.08)'
  },
  '&:not(:last-child)': {
    borderBottom: '1px solid',
    borderColor: 'divider'
  }
};

export default function StripePayment({ plan, onSuccess, onError, isUpdatingPaymentMethod = false, hasHadTrial = false }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [googleMapsError, setGoogleMapsError] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: ''
  });
  const addressInputRef = React.useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initGoogleMaps = async () => {
      try {
        await loadGoogleMapsScript();
        
        if (!isMounted) return;
        
        // Verify the Places service is available
        try {
          const service = new window.google.maps.places.AutocompleteService();
          const request = {
            input: 'test',
            types: ['address'],
            componentRestrictions: { country: 'us' }
          };

          // Test the service
          await new Promise((resolve, reject) => {
            service.getPlacePredictions(request, (predictions, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                resolve();
              } else {
                reject(new Error(`Places service test failed: ${status}`));
              }
            });
          });

          if (!isMounted) return;
          setIsGoogleLoaded(true);
          setGoogleMapsError(null);
        } catch (serviceError) {
          throw new Error('Places API service is not working properly');
        }
      } catch (error) {
        if (isMounted) {
          setGoogleMapsError(
            'Address autocomplete is currently unavailable. Please enter the address manually.'
          );
          setIsGoogleLoaded(false);
        }
      }
    };

    initGoogleMaps();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!addressInputRef.current || window.google === undefined) return;

    const options = {
      fields: ['address_components', 'formatted_address'],
      types: ['address']
    };

    const autocomplete = new window.google.maps.places.Autocomplete(
      addressInputRef.current,
      options
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      handleSuggestionSelect(place);
    });

    return () => {
      // Cleanup
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [addressInputRef.current]);

  const fetchAddressSuggestions = async (input) => {
    if (!input || input.length < 3 || !window.google) return;

    setLoadingSuggestions(true);
    try {
      const service = new window.google.maps.places.AutocompleteService();
      const request = {
        input,
        types: ['address'],
        componentRestrictions: { country: 'us' }
      };

      const response = await new Promise((resolve, reject) => {
        service.getPlacePredictions(request, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
          } else {
            reject(new Error(status));
          }
        });
      });

      setSuggestions(response);
    } catch (error) {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddressChange = async (event) => {
    const value = event.target.value;
    setAddress(value);
    await fetchAddressSuggestions(value);
  };

  const handleSuggestionSelect = async (suggestion) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await new Promise((resolve, reject) => {
        geocoder.geocode({ placeId: suggestion.place_id }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0]);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });

      if (!result.address_components || result.address_components.length === 0) {
        throw new Error('No address components found in the response');
      }

      const addressComponents = result.address_components;
      let streetNumber = '';
      let route = '';
      let city = '';
      let state = '';
      let country = '';
      let postalCode = '';

      addressComponents.forEach(component => {
        const types = component.types;
        
        // Street number
        if (types.includes('street_number')) {
          streetNumber = component.long_name;
        }
        // Street name
        else if (types.includes('route')) {
          route = component.long_name;
        }
        // City (try multiple type variations)
        else if (types.includes('locality') || types.includes('sublocality') || 
                types.includes('sublocality_level_1') || types.includes('postal_town')) {
          city = component.long_name;
        }
        // State/Province
        else if (types.includes('administrative_area_level_1')) {
          state = component.short_name; // Use short_name for state codes (e.g., "CA" instead of "California")
        }
        // Country
        else if (types.includes('country')) {
          country = component.short_name; // Use short_name for country codes
        }
        // Postal code
        else if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
      });

      // Build the street address
      let streetAddress = '';
      
      // First try to build from components
      if (streetNumber && route) {
        streetAddress = `${streetNumber} ${route}`;
      } else {
        // If either component is missing, use the first line of formatted_address
        const formattedParts = result.formatted_address.split(',');
        if (formattedParts.length > 0) {
          streetAddress = formattedParts[0].trim();
        } else {
          throw new Error('Could not determine street address from selected location');
        }
      }

      // Update form fields
      setBillingDetails(prev => ({
        ...prev,
        address: streetAddress,
        city: city || '',
        state: state || '',
        country: country || '',
        postalCode: postalCode || ''
      }));
      
      // Update the address field with the street address only
      setAddress(streetAddress);
      setSuggestions([]);
      setError(null); // Clear any previous errors
    } catch (error) {
      setError(`Failed to process the selected address: ${error.message}. Please try entering it manually.`);
      setSuggestions([]); // Clear suggestions on error
    }
  };

  const handleBillingDetailsChange = (event) => {
    const { name, value } = event.target;
    setBillingDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found. Please try again.');
      setLoading(false);
      return;
    }

    try {
      // Create payment method with billing details
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: billingDetails.firstName + ' ' + billingDetails.lastName,
          address: {
            line1: billingDetails.address,
            city: billingDetails.city,
            state: billingDetails.state,
            country: billingDetails.country,
            postal_code: billingDetails.postalCode
          }
        }
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      if (isUpdatingPaymentMethod) {
        // Update payment method only
        const response = await fetch(`${API_BASE_URL}/update-payment-method`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: localStorage.getItem('userEmail'),
            paymentMethodId: paymentMethod.id
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update payment method');
        }

        onSuccess(data);
      } else {
        // Create new subscription
        const requestData = {
          email: localStorage.getItem('userEmail'),
          name: billingDetails.firstName + ' ' + billingDetails.lastName,
          priceId: plan === 'monthly' ? process.env.REACT_APP_STRIPE_MONTHLY_PRICE_ID : process.env.REACT_APP_STRIPE_ANNUAL_PRICE_ID,
          paymentMethodId: paymentMethod.id,
          billingDetails: {
            address: billingDetails.address,
            city: billingDetails.city,
            state: billingDetails.state,
            country: billingDetails.country,
            postalCode: billingDetails.postalCode
          }
        };
        
        // Use different endpoint based on trial eligibility
        const endpoint = hasHadTrial ? '/create-subscription-no-trial' : '/create-subscription';
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create subscription');
        }

        if (data.requiresAction && data.clientSecret) {
          const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);
          if (confirmError) {
            throw new Error(confirmError.message);
          }
        }

        onSuccess(data);
      }
    } catch (err) {
      setError(err.message);
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add this style for the card element container
  const cardElementStyle = {
    padding: '16px 14px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    backgroundColor: '#fff',
    '&:hover': {
      borderColor: '#bdbdbd'
    },
    '&.focused': {
      borderColor: 'primary.main',
      borderWidth: '2px'
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {googleMapsError && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {googleMapsError}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
          Billing Details
        </Typography>
        <Grid container spacing={3} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={billingDetails.firstName}
              onChange={handleBillingDetailsChange}
              required
              sx={{ 
                '& .MuiInputBase-input': {
                  padding: '16px',
                  fontSize: '16px'
                },
                '& .MuiOutlinedInput-root': {
                  height: '56px'
                }
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={billingDetails.lastName}
              onChange={handleBillingDetailsChange}
              required
              sx={{ 
                '& .MuiInputBase-input': {
                  padding: '16px',
                  fontSize: '16px'
                },
                '& .MuiOutlinedInput-root': {
                  height: '56px'
                }
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                label="Address"
                value={address}
                onChange={handleAddressChange}
                disabled={!isGoogleLoaded && !googleMapsError}
                placeholder={isGoogleLoaded ? "Start typing your address..." : "Loading..."}
                required
                sx={{ 
                  '& .MuiInputBase-input': {
                    padding: '16px',
                    fontSize: '16px'
                  },
                  '& .MuiOutlinedInput-root': {
                    height: '56px'
                  }
                }}
                inputRef={addressInputRef}
              />
              {loadingSuggestions && (
                <Paper
                  sx={{
                    position: 'absolute',
                    width: '100%',
                    height: '300px',
                    zIndex: 1000,
                    mt: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CircularProgress size={24} />
                </Paper>
              )}
              {!loadingSuggestions && suggestions.length > 0 && (
                <Box sx={addressDropdownStyles}>
                  {suggestions.map((suggestion, index) => (
                    <Box
                      key={index}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      sx={suggestionItemStyles}
                    >
                      <Typography>{suggestion.description}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Grid>
          <Grid container item spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="City"
                name="city"
                value={billingDetails.city}
                onChange={handleBillingDetailsChange}
                required
                sx={{ 
                  '& .MuiInputBase-input': {
                    padding: '16px',
                    fontSize: '16px'
                  },
                  '& .MuiOutlinedInput-root': {
                    height: '56px'
                  },
                  width: '255px'
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="State/Province"
                name="state"
                value={billingDetails.state}
                onChange={handleBillingDetailsChange}
                required
                sx={{ 
                  '& .MuiInputBase-input': {
                    padding: '16px',
                    fontSize: '16px'
                  },
                  '& .MuiOutlinedInput-root': {
                    height: '56px'
                  },
                  width: '255px'
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Country"
                name="country"
                value={billingDetails.country}
                onChange={handleBillingDetailsChange}
                required
                sx={{ 
                  '& .MuiInputBase-input': {
                    padding: '16px',
                    fontSize: '16px'
                  },
                  '& .MuiOutlinedInput-root': {
                    height: '56px'
                  },
                  width: '255px'
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Postal Code"
                name="postalCode"
                value={billingDetails.postalCode}
                onChange={handleBillingDetailsChange}
                required
                sx={{ 
                  '& .MuiInputBase-input': {
                    padding: '16px',
                    fontSize: '16px'
                  },
                  '& .MuiOutlinedInput-root': {
                    height: '56px'
                  },
                  width: '255px'
                }}
              />
            </Grid>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
          Payment Details
        </Typography>
        <Box sx={cardElementStyle}>
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </Box>
      </Box>

      {!isUpdatingPaymentMethod && (
        <>
          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Order Summary
            </Typography>
            <Box sx={{ 
              p: 2, 
              backgroundColor: '#f8f9fa', 
              borderRadius: 2,
              border: '1px solid #e9ecef'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  {plan === 'monthly' ? 'Monthly Plan' : 'Annual Plan'}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {plan === 'monthly' ? '$4.99' : '$49.99'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="success.main">
                  Free Trial (7 days)
                </Typography>
                <Typography variant="body2" color="success.main" fontWeight={600}>
                  -{plan === 'monthly' ? '$4.99' : '$49.99'}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight={600}>
                  Today's Charge
                </Typography>
                <Typography variant="body2" fontWeight={600} color="success.main">
                  $0.00
                </Typography>
              </Box>
            </Box>
          </Box>
        </>
      )}

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={!stripe || loading}
        size="large"
        sx={{ 
          py: 1.5,
          fontSize: '1.1rem',
          fontWeight: 600,
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
          }
        }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          <>
            <LockIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
            {isUpdatingPaymentMethod 
              ? 'Update Payment Method'
              : `Start ${plan === 'annual' ? 'Annual' : 'Monthly'} Plan with 7-Day Trial`}
          </>
        )}
      </Button>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 1,
          color: 'text.secondary'
        }}>
          <Typography variant="body2">Secure payment powered by</Typography>
          <Link 
            href="https://stripe.com" 
            target="_blank" 
            rel="noopener noreferrer"
            color="text.secondary"
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontWeight: 500,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Stripe
          </Link>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Your payment information is encrypted and secure
        </Typography>
      </Box>
    </Box>
  );
} 