import { title } from "process";

export const defaultFields = [
  { key: 'Close', title: 'Value', type: 'currency' },
  { key: '1 Day Price Change (%)', title: 'Change', type: 'change' },
  { key: '1 Day Price Change (%)', title: 'Chg%', type: 'percentage' },
  { key: 'Open', title: 'Open', type: 'currency' },
  { key: 'High', title: 'High', type: 'currency' },
  { key: 'Low', title: 'Low', type: 'currency' },
  { key: 'Close', title: 'Close', type: 'currency' }
];

export const availableCustomFields = [
  { key: 'Volume', title: 'Volume', type: 'number' },
  { key: 'marketcap', title: 'Market Cap', type: 'currency' },
  { key: 'RSI', title: 'RSI', type: 'number' },
  { key: 'MACD Line', title: 'MACD', type: 'number' },
  { key: 'CCI', title: 'CCI', type: 'number' },
  { key: 'ADX', title: 'ADX', type: 'number' },
  { key: 'WilliamR', title: 'Williams %R', type: 'number' },
  { key: 'ROC', title: 'Rate of Change', type: 'number' },
  { key: 'Money Flow Index (MFI)', title: 'Money Flow Index (MFI)', type: 'number' },
  { key: 'Chaikin Money Flow (CMF)', title: 'Chaikin Money Flow (CMF)', type: 'number' },
  { key: 'Force Index (FI)', title: 'Force Index (FI)', type: 'number' },
  { key: '1 Month Volatility (%)', title: '1M Volatility', type: 'percentage' },
  { key: '3 Month Volatility (%)', title: '3M Volatility', type: 'percentage' },
  { key: 'Closest Resistance', title: 'Closest Resistance', type: 'currency' },
  { key: 'Closest Support', title: 'Closest Support', type: 'currency' },
  { key: '52 Week High', title: '52 Week High', type: 'currency' },
  { key: '52 Week Low', title: '52 Week Low', type: 'currency' }
];

export const defaultSelectedCustomFields = ['Volume', 'RSI'];

export const SCREENER_TABLE_PAGINATIONLIMIT = 20;