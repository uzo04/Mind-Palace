import api from './api';

export const contentService = {
  upload: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/content/upload', form).then((r) => r.data);
  },
  getStockImages: () => api.get('/stock-images').then((r) => r.data),
  create: (data) => api.post('/content', data).then((r) => r.data),
  update: (id, data) => api.patch(`/content/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/content/${id}`).then((r) => r.data),
};

export const locationService = {
  create: (data) => api.post('/locations', data).then((r) => r.data),
  update: (id, data) => api.patch(`/locations/${id}`, data).then((r) => r.data),
  reorder: (spaceId, updates) => api.patch('/locations/reorder', { spaceId, updates }).then((r) => r.data),
  delete: (id) => api.delete(`/locations/${id}`).then((r) => r.data),
};

export const progressService = {
  dashboard: () => api.get('/progress/dashboard').then((r) => r.data),
  get: (spaceId) => api.get(`/progress/${spaceId}`).then((r) => r.data),
  quiz: (spaceId) => api.get(`/progress/${spaceId}/quiz`).then((r) => r.data),
  update: (spaceId, data) => api.patch(`/progress/${spaceId}`, data).then((r) => r.data),
};
