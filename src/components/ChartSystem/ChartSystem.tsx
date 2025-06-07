import React, { useState, useEffect } from "react";
import { Tabs, Button, Modal } from "antd";
import { ChartDisplay } from "./ChartDisplay";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGetChartsQuery, useAddChartMutation, useRemoveChartMutation, useDeleteChatMutation } from "@/store";
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
  
  const [activeChartId, setActiveChartId] = useState<string | null>(() => {
    const stored = localStorage.getItem('activeChartId');
    if (stored && activeCharts.some(chart => chart.id === stored)) {
      return stored;
    }
    return activeCharts.length > 0 ? activeCharts[0]?.id : null;
  });

  const isMobile = useIsMobile();

  // Update active chart id when charts change
  useEffect(() => {
    if (activeCharts.length === 0) {
      setActiveChartId(null);
      localStorage.removeItem('activeChartId');
    } else if (!activeChartId || !activeCharts.find(chart => chart.id === activeChartId)) {
      const newActiveId = activeCharts[0]?.id;
      setActiveChartId(newActiveId);
      if (newActiveId) {
        localStorage.setItem('activeChartId', newActiveId);
      }
    }
  }, [activeCharts]);

  // Save activeChartId to localStorage when it changes and dispatch event for chat sync
  useEffect(() => {
    if (activeChartId) {
      localStorage.setItem('activeChartId', activeChartId);
      // Dispatch event to sync with chat
      window.dispatchEvent(new CustomEvent('chartSelected', { 
        detail: { chartId: activeChartId } 
      }));
    } else {
      localStorage.removeItem('activeChartId');
    }
  }, [activeChartId]);

  // Listen for new chart events
  useEffect(() => {
    const handleNewChart = (event: CustomEvent) => {
      const { chartId } = event.detail;
      if (chartId) {
        setActiveChartId(chartId);
        // Ensure charts section is visible
        const visibleSections = JSON.parse(localStorage.getItem('visibleSections') || '{}');
        if (!visibleSections.charts) {
          visibleSections.charts = true;
          localStorage.setItem('visibleSections', JSON.stringify(visibleSections));
          window.dispatchEvent(new CustomEvent('sectionVisibilityChanged', { detail: { charts: true } }));
        }
      }
    };

    const handleChatSelected = (event: CustomEvent) => {
      const { chatId } = event.detail;
      if (chatId && activeCharts.some(chart => chart.id === chatId)) {
        setActiveChartId(chatId);
      }
    };

    window.addEventListener('newChartGenerated', handleNewChart as EventListener);
    window.addEventListener('chatSelected', handleChatSelected as EventListener);
    return () => {
      window.removeEventListener('newChartGenerated', handleNewChart as EventListener);
      window.removeEventListener('chatSelected', handleChatSelected as EventListener);
    };
  }, [activeCharts]);

  const activeChart = activeCharts.find(chart => chart.id === activeChartId);
  
  const handleAddNewChart = async () => {
    const newChart: ChartData = {
      id: uuid4(),
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
      const result = await addChart(newChart).unwrap();
      setActiveChartId(result.id);
    } catch (error) {
      console.error('Failed to add chart:', error);
    }
  };

  const handleRemoveChart = async (chartId: string) => {
    try {
      // Show confirmation modal if chart has an associated chat (since chart ID = chat ID)
      Modal.confirm({
        title: 'Remove Chart',
        content: 'This chart was generated from a chat. If you remove this chart, the associated chat will also be removed. Do you want to continue?',
        okText: 'Yes, remove both',
        cancelText: 'Cancel',
        onOk: async () => {
          await Promise.all([
            removeChart(chartId).unwrap(),
            deleteChat(chartId).unwrap()
          ]);
          
          if (chartId === activeChartId) {
            const remainingCharts = activeCharts.filter(chart => chart.id !== chartId);
            if (remainingCharts.length > 0) {
              setActiveChartId(remainingCharts[0].id);
            } else {
              setActiveChartId(null);
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
          <ChartDisplay chartId={activeChartId} />
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