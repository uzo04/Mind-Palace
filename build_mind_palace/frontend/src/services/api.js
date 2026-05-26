import axios from 'axios';

const explicitBaseURL = import.meta.env.VITE_API_URL;
const baseURL = explicitBaseURL
  || (import.meta.env.PROD ? '' : import.meta.env.VITE_BACKEND_URL)
  || '';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.message || '');
    if (typeof window !== 'undefined' && (status === 401 || message.includes('Сесията е невалидна'))) {
      window.dispatchEvent(new CustomEvent('mind-palace:auth-expired'));
    }

    return Promise.reject(
      error?.response?.data?.message ||
      error.message ||
      'Заявката е неуспешна.'
    );
  }
);

export default api;
