import api from './api';

export const adminService = {
  overview: () => api.get('/admin/overview').then((r) => r.data),
  users: () => api.get('/admin/users').then((r) => r.data),
  createUser: (data) => api.post('/admin/users', data).then((r) => r.data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  userSpaces: (id) => api.get(`/admin/users/${id}/spaces`).then((r) => r.data),
  updateSpace: (id, data) => api.patch(`/admin/spaces/${id}`, data).then((r) => r.data),
  deleteSpace: (id) => api.delete(`/admin/spaces/${id}`).then((r) => r.data),
  updateLocation: (id, data) => api.patch(`/admin/locations/${id}`, data).then((r) => r.data),
  deleteLocation: (id) => api.delete(`/admin/locations/${id}`).then((r) => r.data),
  updateContent: (id, data) => api.patch(`/admin/contents/${id}`, data).then((r) => r.data),
  deleteContent: (id) => api.delete(`/admin/contents/${id}`).then((r) => r.data),
  images: () => api.get('/admin/images').then((r) => r.data),
  createImage: (data) => api.post('/admin/images', data).then((r) => r.data),
  deleteImage: (id) => api.delete(`/admin/images/${id}`).then((r) => r.data),
};
