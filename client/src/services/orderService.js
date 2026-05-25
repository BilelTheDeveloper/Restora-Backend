import api from './api';

export const orderService = {
  create:        (data)         => api.post('/owner/orders', data),
  list:          (params)       => api.get('/owner/orders', { params }),
  get:           (id)           => api.get(`/owner/orders/${id}`),
  updateStatus:  (id, status)   => api.patch(`/owner/orders/${id}/status`, { status }),
  processPayment:(id, method)   => api.post(`/owner/orders/${id}/payment`, { paymentMethod: method }),
  addItem:       (id, item)     => api.post(`/owner/orders/${id}/items`, item),
  getSummary:    ()             => api.get('/owner/orders/summary'),
};
