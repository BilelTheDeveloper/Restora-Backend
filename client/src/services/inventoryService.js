import api from './api';

export const inventoryService = {
  getIngredients:   (params)     => api.get('/owner/inventory/ingredients', { params }),
  createIngredient: (data)       => api.post('/owner/inventory/ingredients', data),
  updateIngredient: (id, data)   => api.patch(`/owner/inventory/ingredients/${id}`, data),
  addStock:         (id, qty)    => api.post(`/owner/inventory/ingredients/${id}/stock`, { quantity: qty }),
  deleteIngredient: (id)         => api.delete(`/owner/inventory/ingredients/${id}`),
  getRecipes:       ()           => api.get('/owner/inventory/recipes'),
  upsertRecipe:     (data)       => api.post('/owner/inventory/recipes', data),
  deleteRecipe:     (id)         => api.delete(`/owner/inventory/recipes/${id}`),
  getDishMargins:   (days)       => api.get('/owner/inventory/margins', { params: { days } }),
};
