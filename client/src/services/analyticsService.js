import api from './api';

export const analyticsService = {
  getDashboard:     ()         => api.get('/owner/analytics/dashboard'),
  getRevenue:       (days)     => api.get('/owner/analytics/revenue', { params: { days } }),
  getTopItems:      (days)     => api.get('/owner/analytics/top-items', { params: { days } }),
  getTableOccupancy:(days)     => api.get('/owner/analytics/table-occupancy', { params: { days } }),
  getHeatmap:       ()         => api.get('/owner/analytics/heatmap'),
  getMenuEngineering:(days)    => api.get('/owner/analytics/menu-engineering', { params: { days } }),
  getOrderTypes:    (days)     => api.get('/owner/analytics/order-types', { params: { days } }),
};
