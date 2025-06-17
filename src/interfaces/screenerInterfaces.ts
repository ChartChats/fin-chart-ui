export type FieldType = 'currency' | 'percentage' | 'change' | 'number';

export interface ScreenerField {
  key: string;
  title: string;
  type: FieldType;
}

export interface ScreenerData {
  query: string;
  records: any[];
  createdAt: string;
  updatedAt: string;
  id?: string;
  total?: number;
  available_exchanges?: string[];
  applied_filters?: {
    search?: string;
    sort_field?: string;
    sort_order?: string;
    exchange_filter?: string;
  };
}

export interface FieldConfig {
  key: string;
  title: string;
  type: 'currency' | 'percentage' | 'change' | 'number' | 'text';
  width?: number;
}

export interface WatchlistTableProps {
  watchlistData: any[];
  onRemoveFromWatchlist: (keys: string[]) => void;
  isDarkTheme: boolean;
}

export interface ScreenerDashboardProps {
  screeners: any[];
  loadingStates: Record<string, boolean>;
  isDarkTheme: boolean;
  onRetry: (screenerId: string) => void;
  onDelete: (screenerId: string) => void;
  onToggleExpand: (screenerId: string, isExpanded: boolean) => void;
  expandedScreeners: string[];
}

export interface SymbolSearchResult {
  symbol: string;
  country: string;
  currency: string;
  exchange: string;
  exchange_timezone: string;
  description: string;
  instrument_type: string;
  key?: string;
}

export interface ScreenerTickerProps {
  ticker: string;
  exchange: string;
  low: number;
  high: number;
  open: number;
  close: number;
  volume: number;
  rsi: number;
  macd: number;
}

export interface EnhancedColumnType {
  title: string;
  dataIndex: string;
  key: string;
  width?: number;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  sorter?: boolean;
  sortOrder?: 'ascend' | 'descend' | null;
}

export interface Screener {
  id: string;
  query: string;
  total?: number;
  createdAt?: string;
  updatedAt?: string;
  records?: any[];
}

export interface ScreenerCardProps {
  screener: Screener;
  isExpanded: boolean;
  onToggleExpand: (id: string, isExpanded: boolean) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onAddToWatchlist: (rows: any[]) => void;
  loadingStates: Record<string, boolean>;
  isDarkTheme: boolean;
}