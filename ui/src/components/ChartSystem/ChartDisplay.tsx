import { useEffect, useRef } from 'react';
import { Chart } from "@/contexts/ChatContext";
import { useTheme } from "@/contexts/ThemeContext";

declare global {
  interface Window {
    TradingView: any;
  }
}

interface ChartDisplayProps {
  chart: Chart;
}

export function ChartDisplay({ chart }: ChartDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Load TradingView widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView && container) {
        // Create new widget
        widgetRef.current = new window.TradingView.widget({
          container_id: container.id,
          symbol: 'NASDAQ:AAPL',
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: theme === 'dark' ? 'dark' : 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: theme === 'dark' ? '#1A1F2C' : '#f8f9fa',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          save_image: true,
          height: '100%',
          width: '100%',
        });
      }
    };
    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (widgetRef.current) {
        // Clean up widget if needed
        widgetRef.current = null;
      }
      script.remove();
    };
  }, [theme, chart.id]);

  return (
    <div
      id={`tradingview_${chart.id}`}
      ref={containerRef}
      className="w-full h-full"
    />
  );
}