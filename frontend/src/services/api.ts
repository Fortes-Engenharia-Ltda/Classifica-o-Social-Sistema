import axios, { AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: 'https://classificacao-social-backend.onrender.com/api',
  timeout: 15000,
});

// Interceptador para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptador para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url || '');
    const isPublicAuthRoute =
      requestUrl.includes('/usuarios/login') ||
      requestUrl.includes('/usuarios/esqueci-senha') ||
      requestUrl.includes('/usuarios/redefinir-senha');

    if (error.response?.status === 401 && !isPublicAuthRoute) {
      localStorage.removeItem('token');
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  },
);

export default api;
