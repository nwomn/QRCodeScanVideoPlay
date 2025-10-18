import axios, { AxiosHeaders } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { authStore } from '../store/auth';

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: false,
  timeout: 1800000, // 30 minutes timeout for large file uploads (2GB max)
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStore.token;
  if (token) {
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    if (typeof (config.headers as AxiosHeaders).set === 'function') {
      (config.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
    } else {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStore.logout();
    }
    return Promise.reject(error);
  }
);

export default api;
