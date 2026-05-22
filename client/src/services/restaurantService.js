import api from './api';

export const restaurantService = {
  // Public
  getAll:      (params) => api.get('/restaurants', { params }),
  getBySlug:   (slug)   => api.get(`/restaurants/${slug}`),

  // Admin
  create:       (data) => api.post('/restaurants', data),
  getMine:      ()     => api.get('/restaurants/admin/mine'),
  update:       (data) => api.put('/restaurants/admin/mine', data),
  upsertSetup:  (data) => api.put('/restaurants/admin/setup', data),
};
