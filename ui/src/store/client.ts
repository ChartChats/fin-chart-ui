import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL = process.env.BACKEND_SERVER_URL || process.env.LLM_SERVER_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return config;
    }

    // Add token to all requests
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get current user
        const user = auth.currentUser;
        if (!user) {
          throw new Error('No authenticated user');
        }

        // Force token refresh
        const newToken = await user.getIdToken(true);
        localStorage.setItem('token', newToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear storage and reload to trigger login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
