import { ref, onMounted } from 'vue';

const THEME_STORAGE_KEY = 'kura_theme';
const CUSTOM_THEME_STORAGE_KEY = 'kura_custom_theme';
const PRESET_THEMES = ['default', 'cinema', 'yoru', 'amoled'];

export function useTheme() {
  const currentTheme = ref('default');

  const applyCustomThemeStyles = () => {
    try {
      const savedCustom = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
      if (savedCustom) {
        const c = JSON.parse(savedCustom);
        const root = document.documentElement;
        if (c.bg) root.style.setProperty('--custom-bg', c.bg);
        if (c.surface) root.style.setProperty('--custom-surface', c.surface);
        if (c.accent) root.style.setProperty('--custom-accent', c.accent);
        if (c.text) root.style.setProperty('--custom-text', c.text);
      }
    } catch (e) {
      console.error('Failed to apply custom theme styles:', e);
    }
  };

  const applyTheme = (theme) => {
    currentTheme.value = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (_) {}

    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'custom') {
      applyCustomThemeStyles();
    } else {
      const root = document.documentElement;
      root.style.removeProperty('--custom-bg');
      root.style.removeProperty('--custom-surface');
      root.style.removeProperty('--custom-accent');
      root.style.removeProperty('--custom-text');
    }
  };

  const cycleTheme = () => {
    const currentIndex = PRESET_THEMES.indexOf(currentTheme.value);
    const nextIndex = (currentIndex + 1) % PRESET_THEMES.length;
    applyTheme(PRESET_THEMES[nextIndex]);
  };

  const initTheme = () => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'default';
      applyTheme(savedTheme);
    } catch (_) {
      applyTheme('default');
    }
  };

  onMounted(() => {
    initTheme();
  });

  return {
    currentTheme,
    applyTheme,
    cycleTheme,
    applyCustomThemeStyles,
    initTheme,
  };
}
