import React from "react";
import { Card } from "antd";
import { Responsive, WidthProvider } from "react-grid-layout";
import type { ResizeHandle } from "react-resizable";
import { useLayout } from "@/contexts/LayoutContext";
import Chat from "./Chat/Chat";
import { ChatBox } from "./ChatBox/ChatBox";
import { ChartSystem } from "./ChartSystem/ChartSystem";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// Apply width provider to make the grid responsive
const ResponsiveGridLayout = WidthProvider(Responsive);

const componentMap: Record<string, React.ReactNode> = {
  charts: <ChartSystem />,
  chat: <Chat />,
  chatbox: <ChatBox />,
};

export function DraggableLayout() {
  const { layouts, setLayouts } = useLayout();
  const isMobile = useIsMobile();
  const { theme } = useTheme();

  const onLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
  };

  // Add resize handles: only four corners (diagonally opposite)
  const resizeHandles: ResizeHandle[] = ['sw', 'se', 'nw', 'ne'];

  const isDarkTheme = theme === 'dark';
  const borderColor = isDarkTheme ? '#3f3f46' : '#e5e7eb';
  const bgColor = isDarkTheme ? '#1A1F2C' : '#ffffff';
  const headerBgColor = isDarkTheme ? '#333333' : '#f3f3f3';

  // Get the current breakpoint
  const getCurrentBreakpoint = () => {
    const width = window.innerWidth;
    if (width >= 1200) return "lg";
    if (width >= 996) return "md";
    if (width >= 768) return "sm";
    return "xs";
  };
  const currentBreakpoint = getCurrentBreakpoint();
  const currentLayout = layouts[currentBreakpoint] || [];

  return (
    <div className="h-[calc(100vh-88px)] w-full bg-background">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 6 }}
        rowHeight={30}
        onLayoutChange={onLayoutChange}
        margin={[8, 8]}
        containerPadding={[8, 8]}
        isDraggable={!isMobile}
        isResizable={!isMobile}
        resizeHandles={resizeHandles}
        draggableHandle=".draggable-handle"
        compactType="vertical"
        preventCollision={false}
        useCSSTransforms={true}
        autoSize={true}
      >
        {currentLayout.map((item: any) => (
          <div key={item.i} className="h-full">
            <Card
              className="h-full shadow-sm"
              styles={{
                header: {
                  padding: '0.5rem 1rem',
                  minHeight: '40px',
                  cursor: 'move',
                  background: headerBgColor,
                  borderBottom: `1px solid ${borderColor}`
                },
                body: {
                  height: 'calc(100% - 40px)',
                  padding: 0,
                  overflow: 'hidden',
                  background: bgColor
                }
              }}
              style={{
                background: bgColor,
                borderColor: borderColor
              }}
              title={
                <div className="draggable-handle capitalize flex items-center h-6">
                  {item.i}
                </div>
              }
            >
              {componentMap[item.i]}
            </Card>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}