import React, { useState, useEffect } from "react";
import { Tabs, Button } from "antd";
import { ChartDisplay } from "./ChartDisplay";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useGetChartsQuery, useAddChartMutation, useRemoveChartMutation } from "@/store";
import { ChartData } from "@/store/apis/chartApis";

export function ChartSystem() {
  const { data: activeCharts = [], isLoading } = useGetChartsQuery();
  const [removeChart] = useRemoveChartMutation();
  const [addChart] = useAddChartMutation();
  
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
  }, [activeCharts, activeChartId]);

  const activeChart = activeCharts.find(chart => chart.id === activeChartId);
  
  const handleAddNewChart = async () => {
    const newChart: Partial<ChartData> = {
      id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "line",
      title: `#${activeCharts.length + 1}`,
      symbol: 'AAPL',
      timeframe: '1D',
      exchange: 'NASDAQ',
      description: 'Apple Inc.',
      data: []
    };
    
    try {
      const result = await addChart(newChart).unwrap();
      setActiveChartId(result.id);
    } catch (error) {
      console.error('Failed to add chart:', error);
    }
  };

  const handleRemoveChart = async (chartId: string) => {
    try {
      await removeChart(chartId).unwrap();
    } catch (error) {
      console.error('Failed to remove chart:', error);
    }
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
            handleRemoveChart(targetKey);
          }
        }}
        items={activeCharts.map(chart => ({
          key: chart.id,
          label: chart.title || `#${activeCharts.indexOf(chart) + 1}`,
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