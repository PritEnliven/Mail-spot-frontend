import { clearAllToasts, showError } from '@components/ui/toast/toastNotification';
import axios from 'axios';

// Network error notification throttling
let lastNetworkErrorTime = 0;
let lastTimeoutErrorTime = 0;
const NETWORK_ERROR_THROTTLE = 5000; // Show same network error only once every 5 seconds

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

  clearUserData() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('socketId');
    localStorage.removeItem('email');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('id');
  },

  clearAdminData() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('adminId');
  },

  clearAllData() {
    this.clearUserData();
    this.clearAdminData();
    window.location.href = "/";
  }
};

const isAdminApiRequest = (url = '') => /(^|\/)admin(\/|$)/.test(url);

// Exact credential login only — must NOT match loginAdminAsUser
const isCredentialLoginRequest = (url = '') =>
  /(^|\/)(auth\/login|admin\/login)(\?|$)/.test(url);

const isLoginAsUserRequest = (url = '') => url.includes('loginAdminAsUser');

const getErrorMessage = (data: any, fallback: string) =>
  data?.message || data?.data?.message || fallback;

// Initialize the interceptor
ApiInterceptor.init();

// Request Interceptor (attach token)
api.interceptors.request.use(
  (config: any) => {
    const url = config.url || '';
    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;

    // Admin APIs (including loginAdminAsUser) must use adminToken, not user token
    const token = isAdminApiRequest(url)
      ? localStorage.getItem('adminToken')
      : localStorage.getItem('token');

    if (isFormData && config.headers) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }

    if (token) {
      if (typeof config.headers?.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    return config;
  },
  (error: any) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response: any) => response,
  (error) => {
    clearAllToasts();
    if (!error.response) {
      // Handle different types of network errors with throttling
      const currentTime = Date.now();

      if (error.code === 'ECONNABORTED') {
        // Throttle timeout error notifications
        if (currentTime - lastTimeoutErrorTime > NETWORK_ERROR_THROTTLE) {
          lastTimeoutErrorTime = currentTime;
          showError("Request timeout. The operation is taking longer than expected.");
        }
        return Promise.reject({ message: 'Request timeout. The operation is taking longer than expected.', statusCode: 408 });
      } else {
        // Throttle network error notifications
        if (currentTime - lastNetworkErrorTime > NETWORK_ERROR_THROTTLE) {
          lastNetworkErrorTime = currentTime;
          showError("Network error. Please check your connection and try again.");
        }
        return Promise.reject({ message: 'Network error. Please check your connection and try again.', statusCode: 500 });
      }
    }
    if (error.response.status === 429) {
      // Handle rate limiting specifically
      return Promise.reject({
        message: getErrorMessage(error.response.data, 'Too many requests. Please try again later.'),
        statusCode: 429,
        isRateLimit: true,
      });
    }
    if (error.response.status === 401) {
      const url = error.config?.url || '';

      // Don't redirect for credential login / login-as-user — let the caller handle the error
      if (isCredentialLoginRequest(url) || isLoginAsUserRequest(url)) {
        return Promise.reject({
          message: getErrorMessage(
            error.response.data,
            isLoginAsUserRequest(url) ? 'Failed to login as user' : 'Invalid credentials'
          ),
          statusCode: 401,
        });
      }

      // Keep admin and user sessions independent (login-as-user opens mail in another tab)
      if (isAdminApiRequest(url)) {
        ApiInterceptor.clearAdminData();
        showError("Unauthorized - admin session expired");
        window.location.href = '/admin/login';
      } else {
        ApiInterceptor.clearUserData();
        showError("Unauthorized - token expired");
        window.location.href = '/login';
      }
      return Promise.reject({ message: 'Unauthorized - token expired', statusCode: 401 });
    }
    // return standardized error
    return Promise.reject({
      ...error.response.data,
      message: getErrorMessage(error.response.data, 'Something went wrong'),
      statusCode:
        error.response.data?.statusCode ||
        error.response.status,
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

export const postData = async (endpoint: string, data: any, config = {}): Promise<any> => {
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
