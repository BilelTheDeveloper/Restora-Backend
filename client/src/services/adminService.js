import api from './api';

export const adminService = {
  getStats:         ()           => api.get('/platform-admin/stats'),
  getKYCQueue:      (status)     => api.get('/platform-admin/kyc-queue', { params: { status } }),
  reviewKYC:        (id, data)   => api.put(`/platform-admin/kyc-review/${id}`, data),
  getAllRestaurants: ()           => api.get('/platform-admin/restaurants'),
};
