import api from './api';

export const restaurantService = {
  // Public
  getAll:      (params) => api.get('/restaurants', { params }),
  getBySlug:   (slug)   => api.get(`/restaurants/${slug}`),

  // Admin — restaurant
  create:       (data) => api.post('/restaurants', data),
  getMine:      ()     => api.get('/restaurants/admin/mine'),
  update:       (data) => api.put('/restaurants/admin/mine', data),
  upsertSetup:  (data) => api.put('/restaurants/admin/setup', data),

  // Admin — tables (floor plan)
  getTables:    ()            => api.get('/owner/tables'),
  createTable:  (data)        => api.post('/owner/tables', data),
  updateTable:  (id, data)    => api.patch(`/owner/tables/${id}`, data),
  deleteTable:  (id)          => api.delete(`/owner/tables/${id}`),

  // Admin — reservations
  getReservations: (params)   => api.get('/owner/reservations', { params }),
  updateReservationStatus: (id, status) => api.patch(`/owner/reservations/${id}/status`, { status }),
};
