import React, { useState, useEffect } from "react";
import { Tabs, Button } from "antd";
import { ChartDisplay } from "./ChartDisplay";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function ChartSystem() {
  const { activeCharts, removeChart, addChart } = useChat();
  const [activeChartId, setActiveChartId] = useState<string | null>(
    activeCharts.length > 0 ? activeCharts[0]?.id : null
  );
  const isMobile = useIsMobile();

  // Update active chart id when charts change
  useEffect(() => {
    if (activeCharts.length === 0) {
      setActiveChartId(null);
    } else if (!activeCharts.find(chart => chart.id === activeChartId)) {
      setActiveChartId(activeCharts[0]?.id);
    }
  }, [activeCharts]); // Remove activeChartId from dependencies

  const activeChart = activeCharts.find(chart => chart.id === activeChartId);
  
  const handleAddNewChart = () => {
    const newChart: any = {
      id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "line" as const,
      title: `#${activeCharts.length + 1}`,
      symbol: 'AAPL',
      timeframe: '1D',
      exchange: 'NASDAQ',
      description: 'Apple Inc.',
      data: []
    };
    addChart(newChart);
    setActiveChartId(newChart.id);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden custom-tabs">
      <Tabs
        type="editable-card"
        activeKey={activeChartId || undefined}
        onChange={setActiveChartId}
        onEdit={(targetKey, action) => {
          if (action === 'add') handleAddNewChart();
          if (action === 'remove' && typeof targetKey === 'string') {
            removeChart(targetKey);
          }
        }}
        items={activeCharts.map(chart => ({
          key: chart.id,
          label: `#${activeCharts.indexOf(chart) + 1}`,
        }))}
        className="px-2 pt-2"
        style={{
          marginBottom: 0
        }}
        tabBarStyle={{
          marginBottom: 0,
          borderRadius: 0
        }}
        hideAdd={false}
      />
      <div className="flex-1 overflow-hidden">
        {activeChart ? (
          <ChartDisplay chart={activeChart} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-4">
              <p className="text-muted-foreground mb-2">No charts open</p>
              <Button
                type="dashed"
                size={isMobile ? "small" : "middle"}
                onClick={handleAddNewChart}
                className="flex items-center gap-1"
              >
                +
                <span>Create new chart</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function useChat(): { activeCharts: any; removeChart: any; addChart: any; } {
  return {
    activeCharts: [],
    removeChart: (id: string) => { /* remove chart logic */ },
    addChart: (chart: any) => { /* add chart logic */ }
  }
}
