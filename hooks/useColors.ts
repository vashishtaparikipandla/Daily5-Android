import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

/**
 * Returns the design tokens for the active theme, plus the shared `radius`.
 * Defaults to the authentic warm paper palette ('light') unless the user
 * explicitly chooses 'dark' or selects 'system' on a dark system.
 */
export function useColors() {
  const systemScheme = useColorScheme();
  let themePreference: 'light' | 'dark' | 'system' = 'light';
  try {
    const app = useApp();
    if (app && app.theme) {
      themePreference = app.theme;
    }
  } catch {
    // Outside AppContext provider fallback
  }

  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && systemScheme === 'dark');
  const palette = isDark ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius, isDark };
}

