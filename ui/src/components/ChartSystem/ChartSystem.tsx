import React, { useState, useEffect } from "react";
import { Chart, useChat } from "@/contexts/ChatContext";
import { Tabs, Button } from "antd";
import { ChartDisplay } from "./ChartDisplay";
import { useIsMobile } from "@/hooks/use-mobile";

export function ChartSystem() {
  const { activeCharts, removeChart, addChart } = useChat();
  const [activeChartId, setActiveChartId] = useState<string | null>(
    activeCharts.length > 0 ? activeCharts[0]?.id : null
  );
  const isMobile = useIsMobile();

  // Add chart tab when new charts are added
  useEffect(() => {
    if (activeCharts.length > 0 && !activeChartId) {
      setActiveChartId(activeCharts[0]?.id);
    } else if (activeCharts.length === 0) {
      setActiveChartId(null);
    } else if (activeChartId && !activeCharts.find(chart => chart.id === activeChartId)) {
      setActiveChartId(activeCharts[0]?.id);
    }
  }, [activeCharts, activeChartId]);

  const activeChart = activeCharts.find(chart => chart.id === activeChartId);
  
  const handleAddNewChart = () => {
    const newChart: Chart = {
      id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "line" as const,
      title: `New Chart ${activeCharts.length + 1}`,
      symbol: 'AAPL',
      timeframe: '1D',
      data: Array.from({ length: 20 }, (_, i) => ({
        name: `${i+1}`,
        value: Math.floor(Math.random() * 1000) + 500
      }))
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
          label: chart.title,
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