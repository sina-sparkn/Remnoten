import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'default',
    nameKey: 'theme_default',
    name: 'Default',
    primary: '#FF2442',
    primaryHover: '#E01B37',
    primaryForeground: '#FFFFFF',
    primarySubtle: 'rgba(255, 36, 66, 0.15)',
    primarySubtleBorder: 'rgba(255, 36, 66, 0.3)',
    ring: '#FF2442',
    previewGradient: 'linear-gradient(135deg, #FF2442, #B31027)',
    dotColor: '#FF2442',
  },
  {
    id: 'cyber_violet',
    nameKey: 'theme_cyber_violet',
    name: 'Cyber Violet',
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    primaryForeground: '#FFFFFF',
    primarySubtle: 'rgba(139, 92, 246, 0.15)',
    primarySubtleBorder: 'rgba(139, 92, 246, 0.35)',
    ring: '#8B5CF6',
    previewGradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    dotColor: '#8B5CF6',
  },
  {
    id: 'ocean_blue',
    nameKey: 'theme_ocean_blue',
    name: 'Ocean Blue',
    primary: '#0EA5E9',
    primaryHover: '#0284C7',
    primaryForeground: '#FFFFFF',
    primarySubtle: 'rgba(14, 165, 233, 0.15)',
    primarySubtleBorder: 'rgba(14, 165, 233, 0.35)',
    ring: '#0EA5E9',
    previewGradient: 'linear-gradient(135deg, #0EA5E9, #2563EB)',
    dotColor: '#0EA5E9',
  },
  {
    id: 'jungle_green',
    nameKey: 'theme_jungle_green',
    name: 'Jungle Green',
    primary: '#10B981',
    primaryHover: '#059669',
    primaryForeground: '#FFFFFF',
    primarySubtle: 'rgba(16, 185, 129, 0.15)',
    primarySubtleBorder: 'rgba(16, 185, 129, 0.35)',
    ring: '#10B981',
    previewGradient: 'linear-gradient(135deg, #10B981, #047857)',
    dotColor: '#10B981',
  },
  {
    id: 'sunset_orange',
    nameKey: 'theme_sunset_orange',
    name: 'Sunset Orange',
    primary: '#F97316',
    primaryHover: '#EA580C',
    primaryForeground: '#FFFFFF',
    primarySubtle: 'rgba(249, 115, 22, 0.15)',
    primarySubtleBorder: 'rgba(249, 115, 22, 0.35)',
    ring: '#F97316',
    previewGradient: 'linear-gradient(135deg, #F97316, #C2410C)',
    dotColor: '#F97316',
  },
  {
    id: 'pink_pastel',
    nameKey: 'theme_pink_pastel',
    name: 'Pink Pastel',
    primary: '#F472B6',
    primaryHover: '#EC4899',
    primaryForeground: '#FFFFFF',
    primarySubtle: 'rgba(244, 114, 182, 0.15)',
    primarySubtleBorder: 'rgba(244, 114, 182, 0.35)',
    ring: '#F472B6',
    previewGradient: 'linear-gradient(135deg, #F472B6, #FB7185)',
    dotColor: '#F472B6',
  },
  {
    id: 'electric_mint',
    nameKey: 'theme_electric_mint',
    name: 'Electric Mint',
    primary: '#14B8A6',
    primaryHover: '#0D9488',
    primaryForeground: '#FFFFFF',
    primarySubtle: 'rgba(20, 184, 166, 0.15)',
    primarySubtleBorder: 'rgba(20, 184, 166, 0.35)',
    ring: '#14B8A6',
    previewGradient: 'linear-gradient(135deg, #14B8A6, #06B6D4)',
    dotColor: '#14B8A6',
  },
  {
    id: 'rose_red',
    nameKey: 'theme_rose_red',
    name: 'Rose Red',
    primary: '#F43F5E',
    primaryHover: '#E11D48',
    primaryForeground: '#FFFFFF',
    primarySubtle: 'rgba(244, 63, 94, 0.15)',
    primarySubtleBorder: 'rgba(244, 63, 94, 0.35)',
    ring: '#F43F5E',
    previewGradient: 'linear-gradient(135deg, #F43F5E, #BE123C)',
    dotColor: '#F43F5E',
  },
  {
    id: 'lavender_lilac',
    nameKey: 'theme_lavender_lilac',
    name: 'Lavender Lilac',
    primary: '#A78BFA',
    primaryHover: '#8B5CF6',
    primaryForeground: '#FFFFFF',
    primarySubtle: 'rgba(167, 139, 250, 0.15)',
    primarySubtleBorder: 'rgba(167, 139, 250, 0.35)',
    ring: '#A78BFA',
    previewGradient: 'linear-gradient(135deg, #A78BFA, #C084FC)',
    dotColor: '#A78BFA',
  },
  {
    id: 'pastel_yellow',
    nameKey: 'theme_pastel_yellow',
    name: 'Pastel Yellow',
    primary: '#FACC15',
    primaryHover: '#EAB308',
    primaryForeground: '#000000',
    primarySubtle: 'rgba(250, 204, 21, 0.15)',
    primarySubtleBorder: 'rgba(250, 204, 21, 0.35)',
    ring: '#FACC15',
    previewGradient: 'linear-gradient(135deg, #FACC15, #F59E0B)',
    dotColor: '#FACC15',
    isLightContrast: true,
  },
  {
    id: 'midnight_indigo',
    nameKey: 'theme_midnight_indigo',
    name: 'Midnight Indigo',
    primary: '#6366F1',
    primaryHover: '#4F46E5',
    primaryForeground: '#FFFFFF',
    primarySubtle: 'rgba(99, 102, 241, 0.15)',
    primarySubtleBorder: 'rgba(99, 102, 241, 0.35)',
    ring: '#6366F1',
    previewGradient: 'linear-gradient(135deg, #6366F1, #4338CA)',
    dotColor: '#6366F1',
  },
  {
    id: 'golden_honey',
    nameKey: 'theme_golden_honey',
    name: 'Golden Honey',
    primary: '#F59E0B',
    primaryHover: '#D97706',
    primaryForeground: '#000000',
    primarySubtle: 'rgba(245, 158, 11, 0.15)',
    primarySubtleBorder: 'rgba(245, 158, 11, 0.35)',
    ring: '#F59E0B',
    previewGradient: 'linear-gradient(135deg, #F59E0B, #B45309)',
    dotColor: '#F59E0B',
    isLightContrast: true,
  },
  {
    id: 'energy_lime',
    nameKey: 'theme_energy_lime',
    name: 'Energy Lime',
    primary: '#84CC16',
    primaryHover: '#65A30D',
    primaryForeground: '#000000',
    primarySubtle: 'rgba(132, 204, 22, 0.15)',
    primarySubtleBorder: 'rgba(132, 204, 22, 0.35)',
    ring: '#84CC16',
    previewGradient: 'linear-gradient(135deg, #84CC16, #4D7C0F)',
    dotColor: '#84CC16',
    isLightContrast: true,
  },
  {
    id: 'white_and_black',
    nameKey: 'theme_white_and_black',
    name: 'White and Black',
    primary: '#FFFFFF',
    primaryHover: '#E4E4E7',
    primaryForeground: '#000000',
    primarySubtle: 'rgba(255, 255, 255, 0.18)',
    primarySubtleBorder: 'rgba(255, 255, 255, 0.4)',
    ring: '#FFFFFF',
    previewGradient: 'linear-gradient(135deg, #FFFFFF 50%, #18181B 50%)',
    dotColor: '#FFFFFF',
    isLightContrast: true,
  },
];

export function applyThemeVariables(th) {
  if (typeof document === 'undefined' || !th) return;
  const root = document.documentElement;
  root.setAttribute('data-theme', th.id);
  root.style.setProperty('--primary', th.primary);
  root.style.setProperty('--primary-hover', th.primaryHover);
  root.style.setProperty('--primary-foreground', th.primaryForeground);
  root.style.setProperty('--primary-subtle', th.primarySubtle);
  root.style.setProperty('--primary-subtle-border', th.primarySubtleBorder);
  root.style.setProperty('--accent-red', th.primary);
  root.style.setProperty('--accent-red-hover', th.primaryHover);
  root.style.setProperty('--ring', th.ring);
  root.style.setProperty('--destructive', th.primary);

  // Switch thumb circle: in white & black theme, circle is dark for high contrast
  const thumbChecked = (th.id === 'white_and_black' || th.isLightContrast) ? '#121214' : '#FFFFFF';
  root.style.setProperty('--switch-thumb-checked', thumbChecked);
}

// Immediately apply saved theme on initial load to prevent flicker
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('remnoten_theme');
    const matched = THEMES.find((t) => t.id === saved);
    if (matched) {
      applyThemeVariables(matched);
    }
  } catch (e) {
    // Ignore storage issues
  }
}

const ThemeContext = createContext({
  theme: 'default',
  currentTheme: THEMES.find((t) => t.id === 'default') || THEMES[0],
  themes: THEMES,
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    try {
      const saved = localStorage.getItem('remnoten_theme');
      return THEMES.some((t) => t.id === saved) ? saved : 'default';
    } catch {
      return 'default';
    }
  });

  const currentTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  useEffect(() => {
    applyThemeVariables(currentTheme);
    try {
      localStorage.setItem('remnoten_theme', themeId);
    } catch (e) {
      // Ignore
    }
  }, [themeId, currentTheme]);

  const setTheme = (id) => {
    if (THEMES.some((t) => t.id === id)) {
      setThemeId(id);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: themeId,
        currentTheme,
        themes: THEMES,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
