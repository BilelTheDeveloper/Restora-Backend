import api from './api';

export const copilotService = {
  ask: (question) => api.post('/owner/copilot/ask', { question }),
};
