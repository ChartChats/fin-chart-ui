import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Card } from "antd";
import { useTheme } from "@/contexts/ThemeContext";
import Screener from "@/components/Screener/Screener";
import { ChartSystem } from "./ChartSystem/ChartSystem";
import Chat from "./Chat/Chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { NavigationBar } from "./NavigationBar";

interface ResizeState {
  isResizing: boolean;
  initialX: number;
  initialWidths: {
    screener: number;
    charts: number;
    chat: number;
  };
  activeHandle: {
    section: 'screener' | 'charts' | 'chat';
    side: 'left' | 'right';
  } | null;
}

export function MainLayout() {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const isDarkTheme = theme === 'dark';
  
  const [visibleSections, setVisibleSections] = useState(() => {
    const stored = localStorage.getItem('visibleSections');
    return stored ? JSON.parse(stored) : {
      screener: false,
      charts: true,
      chat: true
    };
  });

  const handleSectionToggle = (section: 'screener' | 'charts' | 'chat') => {
    setVisibleSections(prev => {
      const newState = {
        ...prev,
        [section]: !prev[section]
      };
      localStorage.setItem('visibleSections', JSON.stringify(newState));
      return newState;
    });
  };

  const activeSection = useMemo(() => {
    if (visibleSections.screener) return 'screener';
    if (visibleSections.charts) return 'charts';
    if (visibleSections.chat) return 'chat';
    return 'charts'; // Default
  }, [visibleSections]);

  const containerRef = useRef<HTMLDivElement>(null);
  const screenerRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  
  // Calculate base widths based on proportions
  const calculateBaseWidths = useCallback((containerWidth: number) => {
    const minWidth = 200;

    // Single section visible - take full width
    if (Object.values(visibleSections).filter(Boolean).length === 1) {
      return {
        screener: visibleSections.screener ? containerWidth : 0,
        charts: visibleSections.charts ? containerWidth : 0,
        chat: visibleSections.chat ? containerWidth : 0
      };
    }

    // Two sections visible - split evenly
    if (Object.values(visibleSections).filter(Boolean).length === 2) {
      const splitWidth = containerWidth / 2;
      return {
        screener: visibleSections.screener ? Math.max(splitWidth, minWidth) : 0,
        charts: visibleSections.charts ? Math.max(splitWidth, minWidth) : 0,
        chat: visibleSections.chat ? Math.max(splitWidth, minWidth) : 0
      };
    }

    // All three sections visible - initial proportional split
    return {
      screener: visibleSections.screener ? Math.max(containerWidth * 0.33, minWidth) : 0,
      charts: visibleSections.charts ? Math.max(containerWidth * 0.34, minWidth) : 0,
      chat: visibleSections.chat ? Math.max(containerWidth * 0.33, minWidth) : 0
    };
  }, [visibleSections]);

  // Initialize with reasonable defaults
  const [screenerWidth, setScreenerWidth] = useState(240);
  const [chartsWidth, setChartsWidth] = useState(0);
  const [chatWidth, setChatWidth] = useState(320);
  
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    initialX: 0,
    initialWidths: {
      screener: 240,
      charts: 0,
      chat: 320
    },
    activeHandle: null
  });

  const borderColor = isDarkTheme ? '#3f3f46' : '#e5e7eb';
  const bgColor = isDarkTheme ? '#1A1F2C' : '#ffffff';
  const headerBgColor = isDarkTheme ? '#333333' : '#f3f3f3';

  const handleMouseDown = (e: React.MouseEvent, section: 'screener' | 'charts' | 'chat', side: 'left' | 'right') => {
    e.preventDefault();
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    setResizeState({
      isResizing: true,
      initialX: e.clientX,
      initialWidths: {
        screener: screenerWidth,
        charts: containerWidth - screenerWidth - chatWidth,
        chat: chatWidth
      },
      activeHandle: { section, side }
    });
  };

  const widthsRef = useRef({
    screener: 240,
    chat: 320
  });

  const setScreenerWidthWithRef = useCallback((width: number) => {
    widthsRef.current.screener = width;
    setScreenerWidth(width);
  }, []);

  const setChatWidthWithRef = useCallback((width: number) => {
    widthsRef.current.chat = width;
    setChatWidth(width);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizeState.isResizing || !containerRef.current || !resizeState.activeHandle) return;

    const containerWidth = containerRef.current.offsetWidth;
    const delta = e.clientX - resizeState.initialX;
    const minWidth = 200; // Minimum practical width
    
    const { section, side } = resizeState.activeHandle;
    const deltaMultiplier = side === 'right' ? 1 : -1;
    const adjustedDelta = delta * deltaMultiplier;

    document.body.classList.add('resizing');

    // Get array of visible sections in order
    const visibleSectionsList = ['screener', 'charts', 'chat'].filter(
      s => visibleSections[s as keyof typeof visibleSections]
    );

    switch (section) {
      case 'screener': {
        const newWidth = Math.max(resizeState.initialWidths.screener + adjustedDelta, minWidth);
        // Calculate remaining space after new width
        const remainingSpace = containerWidth - newWidth;
        
        // If we have enough space for other sections (or only one other section)
        if (remainingSpace >= (visibleSectionsList.length > 2 ? minWidth * 2 : minWidth)) {
          setScreenerWidthWithRef(newWidth);
          // If only two sections are visible, adjust the other section accordingly
          if (visibleSectionsList.length === 2) {
            if (visibleSections.chat) {
              setChatWidthWithRef(remainingSpace);
            }
          }
        }
        break;
      }
      case 'charts': {
        if (side === 'left') {
          const newScreenerWidth = Math.max(resizeState.initialWidths.screener + adjustedDelta, minWidth);
          if (containerWidth - newScreenerWidth >= minWidth) {
            setScreenerWidthWithRef(newScreenerWidth);
          }
        } else {
          const newChatWidth = Math.max(resizeState.initialWidths.chat - adjustedDelta, minWidth);
          if (containerWidth - newChatWidth - widthsRef.current.screener >= minWidth) {
            setChatWidthWithRef(newChatWidth);
          }
        }
        break;
      }
      case 'chat': {
        const newWidth = Math.max(resizeState.initialWidths.chat + adjustedDelta, minWidth);
        const remainingSpace = containerWidth - newWidth;

        if (remainingSpace >= (visibleSectionsList.length > 2 ? minWidth * 2 : minWidth)) {
          setChatWidthWithRef(newWidth);
          // If only two sections are visible, adjust the other section accordingly
          if (visibleSectionsList.length === 2) {
            if (visibleSections.screener) {
              setScreenerWidthWithRef(remainingSpace);
            }
          }
        }
        break;
      }
    }
  }, [resizeState, setScreenerWidthWithRef, setChatWidthWithRef, visibleSections]);

  // Update ref when state changes
  useEffect(() => {
    widthsRef.current.screener = screenerWidth;
  }, [screenerWidth]);

  useEffect(() => {
    widthsRef.current.chat = chatWidth;
  }, [chatWidth]);

  const handleMouseUp = useCallback(() => {
    setResizeState(prev => ({
      ...prev,
      isResizing: false,
      activeHandle: null
    }));
    document.body.classList.remove('resizing');
  }, []);

  useEffect(() => {
    if (resizeState.isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.cursor = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [resizeState.isResizing, handleMouseMove, handleMouseUp]);

  const previousWidthsRef = useRef<{
    container: number;
    screener: number;
    chat: number;
  }>({ container: 0, screener: screenerWidth, chat: chatWidth });

  // Calculate the middle section width
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const newChartsWidth = containerWidth - screenerWidth - chatWidth;
      
      // Only update if there's been a meaningful change in any of the measurements
      if (
        Math.abs(previousWidthsRef.current.container - containerWidth) > 1 ||
        Math.abs(previousWidthsRef.current.screener - screenerWidth) > 1 ||
        Math.abs(previousWidthsRef.current.chat - chatWidth) > 1
      ) {
        setChartsWidth(newChartsWidth);
        previousWidthsRef.current = {
          container: containerWidth,
          screener: screenerWidth,
          chat: chatWidth
        };
      }
    }
  }, [screenerWidth, chatWidth]); // Remove chartsWidth from dependencies

  const ResizeHandle = ({ section, side }: { section: 'screener' | 'charts' | 'chat', side: 'left' | 'right' }) => (
    <div
      className="absolute top-0 bottom-0 w-1 hover:bg-blue-400/50 cursor-col-resize transition-colors z-10"
      style={{ 
        left: side === 'left' ? 0 : undefined,
        right: side === 'right' ? 0 : undefined,
        backgroundColor: isDarkTheme ? 'rgba(45, 45, 45, 0.5)' : 'rgba(229, 231, 235, 0.5)'
      }}
      onMouseDown={(e) => handleMouseDown(e, section, side)}
    />
  );

  // Update widths when container size or visibility changes
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const baseWidths = calculateBaseWidths(containerWidth);
      
      setScreenerWidth(baseWidths.screener);
      setChatWidth(baseWidths.chat);
      
      // Charts width will be calculated based on remaining space
      const remainingWidth = containerWidth - baseWidths.screener - baseWidths.chat;
      setChartsWidth(visibleSections.charts ? Math.max(remainingWidth, 200) : 0);
    }
  }, [visibleSections, calculateBaseWidths]);

  // Listen for section visibility changes
  useEffect(() => {
    const handleSectionVisibilityChange = (event: CustomEvent) => {
      const { screener, charts } = event.detail;
      setVisibleSections(prev => {
        const newState = {
          ...prev,
          ...(screener !== undefined && { screener }),
          ...(charts !== undefined && { charts })
        };
        localStorage.setItem('visibleSections', JSON.stringify(newState));
        return newState;
      });
    };

    window.addEventListener('sectionVisibilityChanged', handleSectionVisibilityChange as EventListener);
    return () => {
      window.removeEventListener('sectionVisibilityChanged', handleSectionVisibilityChange as EventListener);
    };
  }, []);

  if (isMobile) {
    return (
      <div className="flex flex-col h-full gap-2 p-2">
        <Card className="flex-none h-64" style={{ borderColor }}>
          <Screener />
        </Card>
        <Card className="flex-1 min-h-0" style={{ borderColor }}>
          <ChartSystem />
        </Card>
        <Card className="flex-none h-96" style={{ borderColor }}>
          <Chat />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <NavigationBar
        activeSection={activeSection}
        visibleSections={visibleSections}
        onSectionToggle={handleSectionToggle}
      />
      <div ref={containerRef} className="flex-1 flex min-w-0">
        <div className="flex h-full w-full">
          {visibleSections.screener && (
            <div 
              ref={screenerRef}
              className="relative h-full flex-shrink-0"
              style={{ width: screenerWidth }}
            >
              <Card
                className="h-full shadow-sm"
                styles={{
                  body: {
                    height: '100%',
                    padding: 0,
                    overflow: 'hidden',
                    background: bgColor
                  }
                }}
                style={{
                  background: bgColor,
                  borderColor: borderColor
                }}
              >
                <Screener />
              </Card>
              <ResizeHandle section="screener" side="right" />
            </div>
          )}

          {visibleSections.charts && (
            <div 
              ref={chartsRef}
              className="relative h-full flex-shrink-0"
              style={{ 
                width: chartsWidth,
                minWidth: visibleSections.screener && !visibleSections.chat ? '200px' : undefined
              }}
            >
              <Card
                className="h-full shadow-sm"
                styles={{
                  body: {
                    height: '100%',
                    padding: 0,
                    overflow: 'hidden',
                    background: bgColor
                  }
                }}
                style={{
                  background: bgColor,
                  borderColor: borderColor
                }}
              >
                <ChartSystem />
              </Card>
              <ResizeHandle section="charts" side="right" />
            </div>
          )}

          {visibleSections.chat && (
            <div 
              ref={chatRef}
              className="relative h-full flex-shrink-0"
              style={{ width: chatWidth }}
            >
              <Card
                className="h-full shadow-sm"
                styles={{
                  body: {
                    height: '100%',
                    padding: 0,
                    overflow: 'hidden',
                    background: bgColor
                  }
                }}
                style={{
                  background: bgColor,
                  borderColor: borderColor
                }}
              >
                <Chat />
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}