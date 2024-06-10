import axios from 'axios';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // Use the environment variable
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Ensure all API calls use the base URL
    // if (config.url.startsWith('/api')) {
    //   config.url = config.url.replace('/api', '');
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
