import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor for adding the auth token
api.interceptors.request.use(
  (config) => {
    // We only access localStorage on the client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Silent refresh on 401: exchange the httpOnly refresh cookie for a new
// access token and retry the original request once. Concurrent 401s share
// a single refresh call.
let refreshPromise = null;

const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${api.defaults.baseURL}/auth/refresh`, null, {
        withCredentials: true,
      })
      .then((response) => {
        const token = response.data?.data?.accessToken;
        if (!token) {
          throw new Error('Refresh response missing access token');
        }
        localStorage.setItem('accessToken', token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const clearSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    // A 401 from the public auth endpoints means bad credentials, not an
    // expired session — surface it directly instead of refreshing + reloading.
    const isAuthEndpoint = /\/auth\/(login|register|refresh)$/.test(original?.url || '');
    if (
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !isAuthEndpoint &&
      typeof window !== 'undefined'
    ) {
      original._retried = true;
      try {
        const token = await refreshSession();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        clearSession();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
