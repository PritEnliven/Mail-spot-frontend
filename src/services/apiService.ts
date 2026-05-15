import { showError } from '@components/ui/toast/toastNotification';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 120000, // Increased to 2 minutes for long-running operations
  headers: {
    'Content-Type': 'application/json',
  }
});

// API Interceptor Class
const ApiInterceptor = {
  token: null as string | null,
  socketId: localStorage.getItem('socketId'),

  init() {
    this.token = localStorage.getItem('token');
  },

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  getToken() {
    return this.token;
  },

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  },

  clearAllData() {
    localStorage.removeItem('token');
    localStorage.removeItem('socketId');
    localStorage.removeItem('email');
    localStorage.removeItem('username');
    localStorage.removeItem('adminToken');
    window.location.href = "/";
  }
};

// Initialize the interceptor
ApiInterceptor.init();

// Request Interceptor (attach token)
api.interceptors.request.use(
  (config: any) => {
    let token = localStorage.getItem('token');

    if (config.url?.includes('admin')) {
      token = localStorage.getItem('adminToken');
    }

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return config;
  },
  (error: any) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response: any) => response,
  (error) => {
    if (!error.response) {
      // Handle different types of network errors
      if (error.code === 'ECONNABORTED') {
        showError("Request timeout. The operation is taking longer than expected.");
        return Promise.reject({ message: 'Request timeout. The operation is taking longer than expected.', statusCode: 408 });
      } else {
        showError("Network error. Please check your connection and try again.");
        return Promise.reject({ message: 'Network error. Please check your connection and try again.', statusCode: 500 });
      }
    }
    if (error.response.status === 401) {
      // Don't redirect for login endpoints - let the login component handle the error
      if (error.config?.url?.includes('login')) {
        return Promise.reject({
          message: error.response.data?.message || 'Invalid credentials',
          statusCode: 401,
        });
      }
      // Clear all local storage data and redirect to login for other endpoints
      ApiInterceptor.clearAllData();
      showError("Unauthorized - token expired");
      return Promise.reject({ message: 'Unauthorized - token expired', statusCode: 401 });
    }
    // return standardized error
    return Promise.reject({
      message: error.response.data?.message || 'Something went wrong',
      statusCode: error.response.status,
      data: error.response.data,
    });
  }
);

// =======================
// API METHODS
// =======================

export const getData = async (endpoint: string, config = {}): Promise<any> => {
  const response = await api.get(endpoint, config);
  return response.data;
};

export const postData = async (endpoint: string, data: any): Promise<any> => {
  const config = data instanceof FormData
    ? { headers: { 'Content-Type': undefined } }
    : {};
  const response = await api.post(endpoint, data, config);
  return response.data;
};

export const putData = async <T = any>(endpoint: string, data: any, config?: any): Promise<T> => {
  const response = await api.put(endpoint, data, config);
  return response.data;
};

export const deleteData = async <T = any>(endpoint: string, data: any): Promise<T> => {
  const response = await api.delete(endpoint, { data });
  return response.data;
};

// Special method for long-running operations like email fetching
export const longRunningRequest = async (endpoint: string, config = {}): Promise<any> => {
  const response = await api.get(endpoint, {
    ...config,
    timeout: 300000, // 5 minutes for email fetching operations
  });
  return response.data;
};

// Export the ApiInterceptor for external use
export { ApiInterceptor };
