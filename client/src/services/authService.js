import api from './api';

export const authService = {
  login:               (data) => api.post('/auth/login', data),
  register:            (data) => api.post('/auth/register', data),
  getMe:               ()     => api.get('/auth/me'),
  updateProfile:       (data) => api.put('/auth/me', data),
  changePassword:      (data) => api.put('/auth/change-password', data),
  submitKYC:           (data) => api.put('/auth/kyc-submit', data),
  getKYCStatus:        ()     => api.get('/auth/kyc-status'),
  requestOTP:          (data) => api.post('/auth/otp/request', data),
  verifyOTP:           (data) => api.post('/auth/otp/verify', data),
  updateNotifications: (data) => api.put('/auth/notifications', data),
};
