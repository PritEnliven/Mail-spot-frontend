import { clearAllToasts, showError, suppressAllToasts } from '@components/ui/toast/toastNotification';
import axios from 'axios';

// Network error notification throttling
let lastNetworkErrorTime = 0;
let lastTimeoutErrorTime = 0;
const NETWORK_ERROR_THROTTLE = 5000; // Show same network error only once every 5 seconds

// Active account tracking for multi-account support
let _activeAccountId: string | null = null;

export const setActiveAccountId = (id: string | null) => {
  _activeAccountId = id;
};

export const getActiveAccountId = (): string | null => _activeAccountId;

export const LINKED_ACCOUNT_SIGNED_OUT_EVENT = 'mailspot:linked-account-signed-out';

export type LinkedAccountSignedOutEventDetail = {
  accountId?: string | null;
  email?: string;
  switchedToPrimary?: boolean;
  isSignedOut?: boolean;
};

const isAccountSignedOutError = (status: number, data: any): boolean => {
  if (status !== 403) return false;
  const text = [
    data?.error,
    data?.message,
    data?.data?.error,
    data?.data?.message,
  ]
    .filter(Boolean)
    .join(' ');
  return /signed out/i.test(text);
};

const readRequestAccountId = (config: any): string | null => {
  const headers = config?.headers;
  const headerId =
    (typeof headers?.get === 'function' ? headers.get('x-active-account-id') : null) ||
    headers?.['x-active-account-id'] ||
    headers?.['X-Active-Account-Id'];
  if (headerId) return String(headerId);

  let body = config?.data;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  return body?.userId ? String(body.userId) : null;
};

const dispatchLinkedAccountSignedOut = (accountId: string | null) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<LinkedAccountSignedOutEventDetail>(LINKED_ACCOUNT_SIGNED_OUT_EVENT, {
      detail: {
        accountId,
        switchedToPrimary: true,
        isSignedOut: true,
      },
    })
  );
};

// URLs that require x-active-account-id header (mailbox-scoped APIs)
const MAILBOX_SCOPED_PREFIXES = [
  'email/',
  'customBox/',
  'event/',
  'rule/',
  'contact/',
  'importData/',
];

const isMailboxScopedRequest = (url = '') => {
  const normalized = url.replace(/^\//, '');
  return MAILBOX_SCOPED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
};

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
    sessionStorage.removeItem('activeAccountId');
    sessionStorage.removeItem('activeAccountEmail');
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
  data?.message || data?.error || data?.data?.message || data?.data?.error || fallback;

const isAccountLinkPostRequest = (url = '', method = '') =>
  /^(post)$/i.test(method) && /(^|\/)accounts\/link(\?|$)/.test(url);

/** True when a JWT is past `exp`. Non-JWT tokens return false so the API can decide. */
export const isJwtExpired = (token: string | null | undefined): boolean => {
  if (!token) return true;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
};

let isRedirectingForAuth = false;

const redirectToLogin = (isAdmin: boolean) => {
  if (isRedirectingForAuth) return;
  isRedirectingForAuth = true;
  suppressAllToasts();
  if (isAdmin) {
    ApiInterceptor.clearAdminData();
    window.location.replace('/admin/login');
  } else {
    ApiInterceptor.clearUserData();
    window.location.replace('/login');
  }
};

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

    // Attach active account header for mailbox-scoped APIs
    if (isMailboxScopedRequest(url) && _activeAccountId) {
      if (typeof config.headers?.set === 'function') {
        config.headers.set('x-active-account-id', _activeAccountId);
      } else {
        config.headers = {
          ...config.headers,
          'x-active-account-id': _activeAccountId,
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
    if (!error.response) {
      clearAllToasts();
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
    if (isAccountSignedOutError(error.response.status, error.response.data)) {
      const signedOutAccountId = readRequestAccountId(error.config);
      // Never keep sending a signed-out account id. Omit header until primary is restored.
      if (!signedOutAccountId || _activeAccountId === signedOutAccountId) {
        setActiveAccountId(null);
      }
      dispatchLinkedAccountSignedOut(signedOutAccountId);
      return Promise.reject({
        message: getErrorMessage(
          error.response.data,
          'Account signed out. Please sign in again.'
        ),
        statusCode: 403,
        isLinkedAccountSignedOut: true,
      });
    }

    clearAllToasts();

    if (error.response.status === 429) {
      return Promise.reject({
        message: getErrorMessage(error.response.data, 'Too many requests. Please try again later.'),
        statusCode: 429,
        isRateLimit: true,
      });
    }
    if (error.response.status === 401) {
      const url = error.config?.url || '';
      const method = error.config?.method || '';

      // Don't redirect for credential login / login-as-user / link re-auth — let the caller handle the error
      if (
        isCredentialLoginRequest(url) ||
        isLoginAsUserRequest(url) ||
        isAccountLinkPostRequest(url, method)
      ) {
        return Promise.reject({
          message: getErrorMessage(
            error.response.data,
            isLoginAsUserRequest(url)
              ? 'Failed to login as user'
              : isAccountLinkPostRequest(url, method)
                ? 'Incorrect password for this account'
                : 'Invalid credentials'
          ),
          statusCode: 401,
        });
      }

      // Keep admin and user sessions independent (login-as-user opens mail in another tab)
      redirectToLogin(isAdminApiRequest(url));
      return Promise.reject({ message: 'Unauthorized - token expired', statusCode: 401, silent: true });
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
