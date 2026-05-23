import api from './api';

export const adminService = {
  // Stats & KYC
  getStats:              ()               => api.get('/platform-admin/stats'),
  getKYCQueue:           (status)         => api.get('/platform-admin/kyc-queue', { params: { status } }),
  reviewKYC:             (id, data)       => api.put(`/platform-admin/kyc-review/${id}`, data),
  getAllRestaurants:      ()               => api.get('/platform-admin/restaurants'),

  // Maintenance
  getMaintenance:        ()               => api.get('/platform-admin/maintenance'),
  toggleMaintenance:     (data)           => api.post('/platform-admin/maintenance', data),

  // Platform security
  getSecuritySummary:    ()               => api.get('/platform-admin/security/summary'),
  getSecurityLogs:       (params)         => api.get('/platform-admin/security/logs', { params }),

  // Public status
  getStatus:             ()               => api.get('/status'),
};
