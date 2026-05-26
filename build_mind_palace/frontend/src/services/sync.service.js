import api from './api';

export const syncService = {
  state: () => api.get('/sync/state').then((response) => response.data),
};
