import api from './api';

export const alertService = {
  list:         (params) => api.get('/owner/alerts', { params }),
  unreadCount:  ()       => api.get('/owner/alerts/unread-count'),
  markRead:     (id)     => api.patch(`/owner/alerts/${id}/read`),
  markAllRead:  ()       => api.patch('/owner/alerts/read-all'),
  dismiss:      (id)     => api.patch(`/owner/alerts/${id}/dismiss`),
};
