import api from './api';

export const customerService = {
  list:       (params) => api.get('/owner/customers', { params }),
  getStats:   ()       => api.get('/owner/customers/stats'),
  get:        (id)     => api.get(`/owner/customers/${id}`),
  upsert:     (data)   => api.post('/owner/customers', data),
  addVisit:   (id, data) => api.post(`/owner/customers/${id}/visit`, data),
};
