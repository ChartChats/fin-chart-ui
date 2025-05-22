import React, { useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { TVChartContainer } from "../TVChart";

interface ChartDisplayProps {
  chart: any;
}

export const ChartDisplay = React.memo(({ chart }: ChartDisplayProps) => {
  const { theme } = useTheme();
  const themeValue = useMemo(() => theme === 'dark' ? 'dark' : 'light', [theme]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0 chart-container">
        <TVChartContainer
          symbol={ chart.symbol }
          interval={ chart.timeframe || '1D' }
          indicators={ chart.indicators }
          theme={ themeValue }
        />
      </div>
    </div>
  );
});