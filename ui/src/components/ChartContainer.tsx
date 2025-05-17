import React from 'react';
import { 
  useGetChartsQuery, 
  useAddChartMutation, 
  useRemoveChartMutation,
  useUpdateChartMutation
} from '../store/apis/chartApis';

interface ChartProps {
  data: any[];
  type: string;
  symbol: string;
  indicators?: Array<{
    name: string;
    value: string;
    properties: Record<string, string>;
  }>;
}

// Temporary Chart Component - Replace with your actual chart library component
const ChartComponent: React.FC<ChartProps> = ({ data, type, symbol, indicators }) => {
  return (
    <div className="chart-placeholder">
      <p>Chart: {symbol}</p>
      <p>Type: {type}</p>
      {indicators && indicators.map((indicator, index) => (
        <div key={index}>
          <p>Indicator: {indicator.name}</p>
        </div>
      ))}
    </div>
  );
};

export const ChartContainer: React.FC = () => {
  const { data: charts = [], isLoading } = useGetChartsQuery();
  const [addChart] = useAddChartMutation();
  const [removeChart] = useRemoveChartMutation();
  const [updateChart] = useUpdateChartMutation();

  const handleAddChart = async () => {
    try {
      await addChart({
        id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'candlestick',
        title: `#${charts.length + 1}`,
        symbol: 'AAPL',
        timeframe: '1D',
        exchange: 'NASDAQ',
        description: 'Apple Inc.'
      });
    } catch (error) {
      console.error('Failed to add chart:', error);
    }
  };

  const handleRemoveChart = async (chartId: string) => {
    try {
      await removeChart(chartId);
    } catch (error) {
      console.error('Failed to remove chart:', error);
    }
  };

  const handleLLMResponse = async (chartId: string, llmResponse: any) => {
    try {
      if (llmResponse.action_type === 'plot_indicator') {
        await updateChart({
          id: chartId,
          data: {
            symbol: llmResponse.ticker,
            timeframe: llmResponse.interval,
            exchange: llmResponse.exchange,
            description: llmResponse.description,
            indicators: llmResponse.indicators
          }
        });
      }
    } catch (error) {
      console.error('Failed to update chart with LLM response:', error);
    }
  };

  if (isLoading) {
    return <div>Loading charts...</div>;
  }

  return (
    <div className="chart-container">
      <button 
        onClick={handleAddChart}
        className="add-chart-button"
      >
        + Add Chart
      </button>
      
      <div className="charts-grid">
        {charts.map((chart) => (
          <div key={chart.id} className="chart-wrapper">
            <div className="chart-header">
              <h3>{chart.title}</h3>
              <button 
                onClick={() => handleRemoveChart(chart.id)}
                className="remove-chart-button"
              >
                ✕
              </button>
            </div>
            <div className="chart-content">
              {chart.symbol ? (
                <ChartComponent 
                  data={chart.data}
                  type={chart.type}
                  symbol={chart.symbol}
                  indicators={chart.indicators}
                />
              ) : (
                <div className="empty-chart-placeholder">
                  Select a symbol or use LLM to populate this chart
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};