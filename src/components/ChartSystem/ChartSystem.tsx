import React, { useState, useEffect } from "react";
import { Tabs, Button, Modal } from "antd";
import { ChartDisplay } from "./ChartDisplay";
import { useGetChartsQuery, useAddChartMutation, useRemoveChartMutation, useDeleteChatMutation, useCreateChatMutation } from "@/store";
import { ChartData } from "@/interfaces/chartInterfaces";
import { v4 as uuid4 } from 'uuid';

export function ChartSystem() {
  const {
    data: activeCharts = [],
    isLoading
  } = useGetChartsQuery(undefined, { skip: false, refetchOnMountOrArgChange: true });

  const [removeChart] = useRemoveChartMutation();
  const [addChart] = useAddChartMutation();
  const [deleteChat] = useDeleteChatMutation();
  const [createChat] = useCreateChatMutation();
  
  const [activeChartId, setActiveChartId] = useState<string | null>(() => {
    const stored = localStorage.getItem('activeChartId');
    return stored || null;
  });

  // Update active chart id when charts change and sync with chat
  useEffect(() => {
    if (!isLoading) {
      if (activeCharts.length === 0) {
        setActiveChartId(null);
        localStorage.removeItem('activeChartId');
        window.dispatchEvent(new CustomEvent('chartSelected', { detail: { chartId: null } }));
      } else {
        const stored = localStorage.getItem('activeChartId');
        const validStoredChart = stored && activeCharts.some(chart => chart.id === stored);
        
        if (!activeChartId || !activeCharts.find(chart => chart.id === activeChartId)) {
          if (validStoredChart) {
            // Restore the stored active chart and sync with chat
            setActiveChartId(stored);
            window.dispatchEvent(new CustomEvent('chartSelected', { detail: { chartId: stored } }));
          } else {
            // Default to the most recently added chart (first in the array)
            const newActiveId = activeCharts[0]?.id;
            setActiveChartId(newActiveId);
            if (newActiveId) {
              localStorage.setItem('activeChartId', newActiveId);
              window.dispatchEvent(new CustomEvent('chartSelected', { detail: { chartId: newActiveId } }));
            }
          }
        } else {
          // Ensure chat is synced even if chart is already selected
          window.dispatchEvent(new CustomEvent('chartSelected', { detail: { chartId: activeChartId } }));
        }
      }
    }
  }, [activeCharts, isLoading]);

  // Handle chart selection changes
  const handleChartChange = (chartId: string) => {
    setActiveChartId(chartId);
    localStorage.setItem('activeChartId', chartId);
    // Immediately sync with chat
    window.dispatchEvent(new CustomEvent('chartSelected', { 
      detail: { chartId } 
    }));
  };

  const activeChart = activeCharts.find(chart => chart.id === activeChartId);
  
  const handleAddNewChart = async () => {
    const newChartId = uuid4();
    const newChart: ChartData = {
      id: newChartId,
      type: "line",
      title: `#${activeCharts.length + 1}`,
      symbol: 'AAPL',
      timeframe: '1D',
      exchange: 'NASDAQ',
      description: 'Apple Inc.',
      date_from: '',
      date_to: '',
      data: []
    };
    
    try {
      // Create both chart and corresponding chat
      await Promise.all([
        addChart(newChart).unwrap(),
        createChat(newChartId).unwrap()
      ]);
      
      // Set this chart as active immediately and sync with chat
      handleChartChange(newChartId);
      
      // Fire a custom event to notify any listeners of the new chart
      window.dispatchEvent(new CustomEvent('newChartGenerated', {
        detail: { chartId: newChartId }
      }));
    } catch (error) {
      console.error('Failed to add chart:', error);
    }
  };

  const handleRemoveChart = async (chartId: string) => {
    try {
      Modal.confirm({
        title: 'Remove Chart',
        content: 'Are you sure you want to remove this chart? This action cannot be undone.',
        okText: 'Remove',
        cancelText: 'Cancel',
        onOk: async () => {
          await removeChart(chartId).unwrap();
          
          // Find the next chart to activate (prefer the one to the left)
          const currentIndex = activeCharts.findIndex(chart => chart.id === chartId);
          const remainingCharts = activeCharts.filter(chart => chart.id !== chartId);
          
          if (chartId === activeChartId) {
            // Try to select the chart to the left, if not available, try the one to the right
            const nextChart = remainingCharts[currentIndex - 1] || remainingCharts[currentIndex] || remainingCharts[0];
            if (nextChart) {
              handleChartChange(nextChart.id);
            } else {
              handleChartChange(null);
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to remove chart:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden custom-tabs">
      <div className="flex items-center bg-background px-2 pt-2">
        <Button
          type="text"
          size="small"
          onClick={handleAddNewChart}
          className="flex items-center gap-1 mr-2"
        >
          +
        </Button>
        <Tabs
          type="editable-card"
          activeKey={activeChartId || undefined}
          onChange={handleChartChange}
          onEdit={(targetKey, action) => {
            if (action === 'remove' && typeof targetKey === 'string') {
              handleRemoveChart(targetKey);
            }
          }}
          items={activeCharts.map((chart, index) => ({
            key: chart.id,
            label: chart.title || `#${activeCharts.length - index}`,
          })).reverse()}
          className="flex-1"
          style={{
            marginBottom: 0
          }}
          tabBarStyle={{
            marginBottom: 0,
            borderRadius: 0
          }}
          hideAdd={true}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        {activeChart ? (
          <ChartDisplay chartId={activeChartId} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-4">
              <p className="text-muted-foreground mb-2">No charts open</p>
              <Button
                type="dashed"
                size="middle"
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