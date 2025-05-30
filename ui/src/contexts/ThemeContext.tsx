import React, { createContext, useContext, useEffect, useState } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Define custom theme tokens for light and dark modes with gray colors
const lightTheme = {
  token: {
    colorPrimary: '#555555',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#f3f3f3',
    colorText: '#1A1F2C',
    colorBorderSecondary: '#eee',
  },
};

const darkTheme = {
  token: {
    colorPrimary: '#888888',
    colorBgContainer: '#1A1F2C',
    colorBgElevated: '#333333',
    colorText: '#ffffff',
    colorBorderSecondary: '#3f3f46',
  },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // For SSR or when window is not available, default to 'light'
    if (typeof window === 'undefined') return 'light';
    
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ConfigProvider
        theme={theme === 'dark' ? 
          { 
            algorithm: antTheme.darkAlgorithm,
            ...darkTheme
          } : 
          lightTheme
        }
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};