import React, { useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { TVChartContainer } from "../TVChart";
import { useGetChartQuery } from "@/store/index";

interface ChartDisplayProps {
  chartId: string;
}

export const ChartDisplay = React.memo(({ chartId }: ChartDisplayProps) => {
  const { theme } = useTheme();
  const { data: chart, isLoading } = useGetChartQuery(chartId);
  const themeValue = useMemo(() => theme === 'dark' ? 'dark' : 'light', [theme]);

  if (isLoading || !chart) return null;

  console.log(chart);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0 chart-container">
        <TVChartContainer
          chartId={chartId}
          symbol={chart.symbol}
          exchange={chart.exchange}
          interval={chart.timeframe || '1D'}
          indicators={chart.indicators || []}
          chartPatterns={chart.chart_pattern || []}
          theme={themeValue}
          date_from={chart.date_from || ''}
          date_to={chart.date_to || ''}
        />
      </div>
    </div>
  );
});