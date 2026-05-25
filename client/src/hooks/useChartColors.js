import { useThemeStore } from '../store/themeStore';

export function useChartColors() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return {
    axis:    isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.30)',
    grid:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    tooltip: isDark
      ? { bg: '#1a1a1a', border: 'rgba(255,255,255,0.10)', text: '#fff', muted: 'rgba(255,255,255,0.4)' }
      : { bg: '#ffffff', border: 'rgba(0,0,0,0.10)',       text: '#0f172a', muted: '#64748b' },
  };
}
