import { Chart } from "@/contexts/ChatContext";
import { useTheme } from "@/contexts/ThemeContext";
import { TVChartContainer } from "../TVChart";

interface ChartDisplayProps {
  chart: Chart;
}

export function ChartDisplay({ chart }: ChartDisplayProps) {
  const { theme } = useTheme();

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <TVChartContainer 
          symbol={ chart.symbol }
          interval={ chart.timeframe }
          theme={ theme === 'dark' ? 'dark' : 'light' }
        />
      </div>
    </div>
  );
}