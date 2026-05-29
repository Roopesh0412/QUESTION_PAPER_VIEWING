import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Security Events (401 Session Expiry or Conflict)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        // Clear session storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (data && data.detail === 'SESSION_TERMINATED') {
          // Redirect to login with concurrent device login notice
          window.location.href = '/login?reason=terminated';
        } else {
          // Token expired or invalid
          window.location.href = '/login?reason=expired';
        }
      } else if (status === 403) {
        // Unauthorized role access
        window.location.href = '/unauthorized';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
