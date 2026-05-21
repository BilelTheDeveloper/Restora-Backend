import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './i18n/index.js';
import './index.css';
import { useThemeStore } from './store/themeStore.js';

// Apply saved theme before first render to avoid flash
const savedTheme = JSON.parse(localStorage.getItem('restora-theme') || '{}')?.state?.theme || 'light';
if (savedTheme === 'dark') document.documentElement.classList.add('dark');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '10px',
            fontSize: '14px',
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
);
