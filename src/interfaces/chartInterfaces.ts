export interface IndicatorProps {
  name: string;
  value: string;
  properties: any;
}

export interface ChartPatternProps {
  shape: string;
  color: string;
  points: Array<number>;
  text: string;
  line_color: string;
  dotted: boolean;
  width: number;
  direction: string;
  label: string;
}

export interface TVChartProps {
  symbol?: string;
  interval?: string;
  theme?: string;
  indicators?: IndicatorProps[];
  chartPatterns?: ChartPatternProps[];
  date_from: string;
  date_to: string;
}

export interface DefaultChartProps {
  indicators: IndicatorProps[];
  chartPatterns: ChartPatternProps[];
  interval: string;
  symbol: string;
  exchange: string;
  type: string;
  description: string;
  ticker: string;
  date_from: string;
  date_to: string;
  resolution: string;
  range: string;
  theme: string;
}

export interface Bar {
  time: number;
  low: number;
  high: number;
  open: number;
  close: number;
  volume: number;
}

export interface SymbolInfo {
  ticker: string;
  name: string;
  description: string;
  type: string;
  session: string;
  timezone: string;
  exchange: string;
  interval: string;
  minmov: number;
  pricescale: number;
  has_intraday: boolean;
  has_daily: boolean;
  has_weekly_and_monthly: boolean;
  supported_resolutions: string[];
  volume_precision: number;
  visible_plots_set: string;
  data_status: string;
}

export interface PeriodParams {
  from: number;
  to: number;
  firstDataRequest: boolean;
}

export interface DatafeedProps {
  symbol: string;
  description: string;
  symbol_type: string;
  exchange: string;
  interval: string;
  theme: string;
  from_date?: string; // Add from_date parameter
  to_date?: string;   // Add to_date parameter
}

export interface SymbolItem {
  symbol: string;
  instrument_name: string;
  exchange: string;
  instrument_type: string;
}

export interface NewSymbol {
  symbol: string;
  description: string;
  exchange: string;
  ticker: string;
  type: string;
}

export interface ChartData {
  id: string;
  type: string;
  title: string;
  symbol: string;
  timeframe: string;
  exchange: string;
  description: string;
  data: any[];
  date_from: string;
  date_to: string;
  indicators?: IndicatorProps[];
  chart_pattern?: ChartPatternProps[];
}

export interface ParsedSymbol {
  exchange: string;
  symbol: string;
}

export interface SymbolType {
  name: string;
  value: string;
}

export interface ConfigurationData {
  supported_resolutions: string[];
  symbols_types: SymbolType[];
  supports_marks: boolean;
  supports_timescale_marks: boolean;
  supports_time: boolean;
}

export interface IntervalMap {
  [key: string]: string;
}