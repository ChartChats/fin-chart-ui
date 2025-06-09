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
}

export interface FieldConfig {
  key: string;
  title: string;
  type: 'currency' | 'percentage' | 'change' | 'number' | 'text';
  width?: number;
}

export interface WatchlistTableProps {
  watchlistData: any[];
  onAddTicker: (ticker: string) => void;
  onRemoveFromWatchlist: (keys: string[]) => void;
  isDarkTheme: boolean;
  columns: any[];
}

export interface ScreenerDashboardProps {
  screeners: any[];
  loadingStates: Record<string, boolean>;
  columns: any[];
  fieldConfigMenu: any;
  getTimeDifference: (screener: any) => string;
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