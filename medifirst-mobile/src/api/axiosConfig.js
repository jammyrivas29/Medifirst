import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ YOUR IP ADDRESS
const API_BASE_URL = 'http://192.168.91.236:5000/api';

// Custom API client using fetch (no axios needed!)
const api = {
  // GET request
  get: async (endpoint, options = {}) => {
    return await request('GET', endpoint, null, options);
  },

  // POST request
  post: async (endpoint, data, options = {}) => {
    return await request('POST', endpoint, data, options);
  },

  // PUT request
  put: async (endpoint, data, options = {}) => {
    return await request('PUT', endpoint, data, options);
  },

  // DELETE request
  delete: async (endpoint, options = {}) => {
    return await request('DELETE', endpoint, null, options);
  },
};

// Core request function
const request = async (method, endpoint, data = null, options = {}) => {
  try {
    // Build URL
    let url = `${API_BASE_URL}${endpoint}`;

    // Add query params for GET requests
    if (options.params) {
      const queryString = new URLSearchParams(options.params).toString();
      url = `${url}?${queryString}`;
    }

    // Get token from storage
    const token = await AsyncStorage.getItem('token');

    // Build headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    // Build request options
    const fetchOptions = {
      method,
      headers,
      ...(data ? { body: JSON.stringify(data) } : {}),
    };

    // Make request
    const response = await fetch(url, fetchOptions);

    // Parse response
    const responseData = await response.json();

    // Handle 401 unauthorized
    if (response.status === 401) {
      await AsyncStorage.removeItem('token');
      const error = new Error(responseData.message || 'Unauthorized');
      error.response = { status: 401, data: responseData };
      throw error;
    }

    // Handle other errors
    if (!response.ok) {
      const error = new Error(responseData.message || 'Request failed');
      error.response = { status: response.status, data: responseData };
      throw error;
    }

    // Return in axios-like format
    return { data: responseData, status: response.status };

  } catch (error) {
    // Network error
    if (!error.response) {
      error.response = { data: { message: 'Network error. Check your connection.' } };
    }
    throw error;
  }
};

export default api;
export { API_BASE_URL };
