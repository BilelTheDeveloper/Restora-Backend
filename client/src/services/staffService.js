import api from './api';

export const staffService = {
  list:           ()           => api.get('/owner/staff'),
  invite:         (data)       => api.post('/owner/staff', data),
  update:         (id, data)   => api.patch(`/owner/staff/${id}`, data),
  getShifts:      (weekStart)  => api.get('/owner/staff/shifts', { params: { weekStart } }),
  createShift:    (data)       => api.post('/owner/staff/shifts', data),
  updateShift:    (id, data)   => api.patch(`/owner/staff/shifts/${id}`, data),
  deleteShift:    (id)         => api.delete(`/owner/staff/shifts/${id}`),
  getPerformance: (days)       => api.get('/owner/staff/performance', { params: { days } }),
};
