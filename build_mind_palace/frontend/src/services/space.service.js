import api from './api';

export const spaceService = {
  getAll: () => api.get('/spaces').then((r) => r.data),
  getOne: (id) => api.get(`/spaces/${id}`).then((r) => r.data),
  create: (data) => api.post('/spaces', data).then((r) => r.data),
  update: (id, data) => api.patch(`/spaces/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/spaces/${id}`).then((r) => r.data),
  };
