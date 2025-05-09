import React, { createContext, useContext, useEffect, useState } from 'react';
import { Layout, Layouts } from 'react-grid-layout';

export interface LayoutItem extends Layout {
  i: string;
}

// Available layout presets
export const LAYOUT_PRESETS = {
  CHARTS_FOCUS: 'charts-focus',
  CHAT_FOCUS: 'chat-focus',
  BALANCED: 'balanced',
} as const;

export type LayoutPreset = typeof LAYOUT_PRESETS[keyof typeof LAYOUT_PRESETS];

interface LayoutContextType {
  layouts: Layouts;
  currentLayout: LayoutItem[];
  activePreset: LayoutPreset;
  setLayouts: (layouts: Layouts) => void;
  saveCurrentLayout: () => void;
  applyPreset: (preset: LayoutPreset) => void;
}

// Updated default layouts for better responsiveness and increased heights
// Charts on left, Chat on right, ChatBox at bottom
const defaultLayouts: Layouts = {
  lg: [
    { i: 'charts', x: 0, y: 0, w: 8, h: 14, minW: 3, minH: 5 },
    { i: 'chat', x: 8, y: 0, w: 4, h: 14, minW: 3, minH: 4 },
    { i: 'chatbox', x: 0, y: 15, w: 12, h: 4, minW: 3, minH: 2 },
  ],
  md: [
    { i: 'charts', x: 0, y: 0, w: 7, h: 14, minW: 3, minH: 5 },
    { i: 'chat', x: 7, y: 0, w: 5, h: 14, minW: 3, minH: 4 },
    { i: 'chatbox', x: 0, y: 13, w: 12, h: 4, minW: 3, minH: 2 },
  ],
  sm: [
    { i: 'charts', x: 0, y: 8, w: 12, h: 10, minW: 3, minH: 4 },
    { i: 'chat', x: 0, y: 0, w: 12, h: 8, minW: 3, minH: 3 },
    { i: 'chatbox', x: 0, y: 18, w: 12, h: 4, minW: 3, minH: 2 },
  ],
  xs: [
    { i: 'charts', x: 0, y: 6, w: 6, h: 8, minW: 2, minH: 3 },
    { i: 'chat', x: 0, y: 0, w: 6, h: 6, minW: 2, minH: 3 },
    { i: 'chatbox', x: 0, y: 14, w: 6, h: 4, minW: 2, minH: 2 },
  ],
};

// Updated preset layouts with increased heights
const presetLayouts: Record<LayoutPreset, Layouts> = {
  [LAYOUT_PRESETS.CHARTS_FOCUS]: {
    lg: [
      { i: 'charts', x: 0, y: 0, w: 9, h: 14, minW: 3, minH: 5 },
      { i: 'chat', x: 9, y: 0, w: 3, h: 14, minW: 3, minH: 4 },
      { i: 'chatbox', x: 0, y: 15, w: 12, h: 4, minW: 3, minH: 2 },
    ],
    md: [
      { i: 'charts', x: 0, y: 0, w: 8, h: 14, minW: 3, minH: 5 },
      { i: 'chat', x: 8, y: 0, w: 4, h: 14, minW: 3, minH: 4 },
      { i: 'chatbox', x: 0, y: 13, w: 12, h: 4, minW: 3, minH: 2 },
    ],
    sm: defaultLayouts.sm,
    xs: defaultLayouts.xs,
  },
  [LAYOUT_PRESETS.CHAT_FOCUS]: {
    lg: [
      { i: 'charts', x: 0, y: 0, w: 4, h: 14, minW: 3, minH: 5 },
      { i: 'chat', x: 4, y: 0, w: 8, h: 14, minW: 3, minH: 4 },
      { i: 'chatbox', x: 0, y: 15, w: 12, h: 4, minW: 3, minH: 2 },
    ],
    md: [
      { i: 'charts', x: 0, y: 0, w: 4, h: 14, minW: 3, minH: 5 },
      { i: 'chat', x: 4, y: 0, w: 8, h: 14, minW: 3, minH: 4 },
      { i: 'chatbox', x: 0, y: 13, w: 12, h: 4, minW: 3, minH: 2 },
    ],
    sm: defaultLayouts.sm,
    xs: defaultLayouts.xs,
  },
  [LAYOUT_PRESETS.BALANCED]: defaultLayouts,
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [layouts, setLayouts] = useState<Layouts>(() => {
    const savedLayouts = localStorage.getItem('chartChatLayouts');
    return savedLayouts ? JSON.parse(savedLayouts) : defaultLayouts;
  });

  const [activePreset, setActivePreset] = useState<LayoutPreset>(() => {
    const savedPreset = localStorage.getItem('chartChatActivePreset');
    return (savedPreset as LayoutPreset) || LAYOUT_PRESETS.BALANCED;
  });

  const [currentLayout, setCurrentLayout] = useState<LayoutItem[]>([]);

  useEffect(() => {
    localStorage.setItem('chartChatLayouts', JSON.stringify(layouts));
  }, [layouts]);

  useEffect(() => {
    localStorage.setItem('chartChatActivePreset', activePreset);
  }, [activePreset]);

  const saveCurrentLayout = () => {
    // This function would be called when manual changes are made
    // We'd update the current preset's layout with the current layout
    const updatedLayouts = { ...layouts };
    const breakpoint = getCurrentBreakpoint();
    if (breakpoint && currentLayout.length > 0) {
      updatedLayouts[breakpoint] = currentLayout;
      setLayouts(updatedLayouts);
    }
  };

  const getCurrentBreakpoint = (): keyof Layouts | null => {
    const width = window.innerWidth;
    if (width >= 1200) return 'lg';
    if (width >= 996) return 'md';
    if (width >= 768) return 'sm';
    return 'xs';
  };

  const applyPreset = (preset: LayoutPreset) => {
    setLayouts(presetLayouts[preset]);
    setActivePreset(preset);
  };

  return (
    <LayoutContext.Provider value={{ 
      layouts,
      currentLayout,
      activePreset,
      setLayouts: (newLayouts) => {
        setLayouts(newLayouts);
        const breakpoint = getCurrentBreakpoint();
        if (breakpoint && newLayouts[breakpoint]) {
          setCurrentLayout(newLayouts[breakpoint]);
        }
      },
      saveCurrentLayout,
      applyPreset
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = (): LayoutContextType => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};