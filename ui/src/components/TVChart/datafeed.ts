import _ from 'lodash';
import moment from 'moment';

import {
  makeApiRequest,
  apiKey,
  configurationData,
  parseFullSymbol
} from './helpers.js';

import { subscribeOnStream, unsubscribeFromStream } from './streaming.js';

interface Bar {
  time: number;
  low: number;
  high: number;
  open: number;
  close: number;
  volume: number;
}

interface SymbolInfo {
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

interface PeriodParams {
  from: number;
  to: number;
  firstDataRequest: boolean;
}

interface DatafeedProps {
  symbol: string;
  description: string;
  symbol_type: string;
  exchange: string;
  interval: string;
  theme: string;
}

// Global cache to store data for each symbol and resolution
const dataCache = new Map<string, Bar[]>();
const lastBarsCache = new Map<string, Bar>();

// Helper functions
const processBars = (response: any): Bar[] => {
  if (!response?.values) return [];
  return response.values.map((bar: any) => ({
    time: new Date(bar.datetime).getTime(),
    low: parseFloat(bar.low),
    high: parseFloat(bar.high),
    open: parseFloat(bar.open),
    close: parseFloat(bar.close),
    volume: parseFloat(bar.volume || 0)
  }));
};

const mergeBars = (existing: Bar[], newBars: Bar[], isOlderData: boolean): Bar[] => {
  const combined = isOlderData ? [...newBars, ...existing] : [...existing, ...newBars];
  const unique = _.uniqBy(combined, 'time');
  return _.sortBy(unique, 'time');
};

export default class Datafeed {
  private props: DatafeedProps;

  constructor(props: DatafeedProps) {
    this.props = props;
  }

  onReady = async (callback: (configuration: any) => void): Promise<void> => {
    console.log('[onReady]: Method call', configurationData);
    setTimeout(() => callback(configurationData), 0);
  };
  
  searchSymbols = async (
    userInput: string,
    exchange: string,
    symbolType: string,
    onResultReadyCallback: (symbols: any[]) => void
  ): Promise<void> => {
    console.log('[searchSymbols]: Method call');

    const searchedSymbolsData = await makeApiRequest(`symbol_search?symbol=${userInput}`);
    console.log("symbols", searchedSymbolsData);

    const newSymbols = _.map(searchedSymbolsData.data, symbolItem => ({
      symbol: symbolItem.symbol,
      description: symbolItem.instrument_name,
      exchange: symbolItem.exchange,
      ticker: symbolItem.symbol,
      type: symbolItem.instrument_type
    }));
    
    console.log('[searchSymbols]: Returning ' + newSymbols.length + ' symbols');
    setTimeout(() => onResultReadyCallback(newSymbols), 0);
  };

  resolveSymbol = async (
    symbolName: string,
    onSymbolResolvedCallback: (symbolInfo: SymbolInfo) => void,
    onResolveErrorCallback: (error: string) => void,
    extension: any
  ): Promise<void> => {
    console.log('[resolveSymbol]: Method call', symbolName);

    if (!this.props.symbol) {
      console.log('[resolveSymbol]: Cannot resolve symbol', symbolName);
      setTimeout(() => onResolveErrorCallback('Cannot resolve symbol'), 0);
      return;
    }
  
    // Symbol information object
    const symbolInfo: SymbolInfo = {
      ticker: this.props.symbol,
      name: symbolName,
      description: this.props.description,
      type: this.props.symbol_type,
      session: '24x7',
      timezone: 'Etc/UTC',
      exchange: this.props.exchange,
      interval: this.props.interval,
      minmov: 1,
      pricescale: 100,
      has_intraday: true,
      has_daily: true,
      has_weekly_and_monthly: true,
      supported_resolutions: configurationData.supported_resolutions,
      volume_precision: 2,
      visible_plots_set: 'ohlc',
      data_status: 'streaming'
    };

    console.log('[resolveSymbol]: Symbol resolved', symbolName);
    setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
  };

  getBars = async (
    symbolInfo: SymbolInfo,
    resolution: string,
    periodParams: PeriodParams,
    onHistoryCallback: (bars: Bar[], meta: { noData: boolean; nextTime?: number }) => void,
    onErrorCallback: (error: any) => void
  ): Promise<void> => {
    const { from, to, firstDataRequest } = periodParams;
    console.log('[getBars]: Method call', symbolInfo, resolution, from, to);
  
    const intervalMap: { [key: string]: string } = {
      '1': '1min',
      '3': '3min',
      '5': '5min',
      '15': '15min',
      '30': '30min',
      '60': '1h',
      '120': '2h',
      'D': '1day',
      'W': '1week',
      'M': '1month'
    };
  
    const symbol = symbolInfo.name;
    const interval = intervalMap[resolution] || '1day';
    const cacheKey = `${symbol}-${interval}`;
    const fromMs = from * 1000;
    const toMs = to * 1000;
    const BARS_LIMIT = 5000;
  
    try {
      let storedBars = dataCache.get(cacheKey) || [];
      const cacheFirst = storedBars[0]?.time;
      const cacheLast = storedBars[storedBars.length - 1]?.time;
  
      // Determine required fetch direction
      const needsOlderData = firstDataRequest || (cacheFirst && fromMs < cacheFirst);
      const needsNewerData = firstDataRequest || (cacheLast && toMs > cacheLast);
  
      if (needsOlderData || needsNewerData) {
        console.log(`[getBars]: Fetching data for ${symbol}`);
  
        let startDate: Date, endDate: Date;
        if (needsOlderData) {
          endDate = cacheFirst ? new Date(cacheFirst) : new Date(toMs);
          startDate = new Date(endDate);
          
          // Calculate backward period based on resolution
          const timeUnitMap: { [key: string]: { unit: string; value: number } } = {
            '1': { unit: 'minutes', value: BARS_LIMIT },
            '5': { unit: 'minutes', value: BARS_LIMIT * 5 },
            '15': { unit: 'minutes', value: BARS_LIMIT * 15 },
            '30': { unit: 'minutes', value: BARS_LIMIT * 30 },
            '60': { unit: 'hours', value: BARS_LIMIT },
            'D': { unit: 'days', value: BARS_LIMIT },
            'W': { unit: 'weeks', value: BARS_LIMIT },
            'M': { unit: 'months', value: BARS_LIMIT }
          };
  
          const { unit, value } = timeUnitMap[resolution] || { unit: 'days', value: BARS_LIMIT };
          startDate = moment(endDate).subtract(value, unit).toDate();
        } else {
          startDate = cacheLast ? new Date(cacheLast) : new Date(fromMs);
          endDate = new Date(toMs);
        }
  
        const url = `time_series?symbol=${symbol}&interval=${interval}` +
          `&start_date=${startDate.toISOString()}` +
          `&end_date=${endDate.toISOString()}` +
          `&apikey=${apiKey}`;
  
        const response = await makeApiRequest(url);
        
        if (!response?.values?.length) {
          console.log('[getBars]: Empty response');
          onHistoryCallback([], { noData: true });
          return;
        }
  
        const newBars = response.values.map((item: any) => ({
          time: new Date(item.datetime).getTime(),
          low: parseFloat(item.low),
          high: parseFloat(item.high),
          open: parseFloat(item.open),
          close: parseFloat(item.close),
          volume: parseFloat(item.volume || 0)
        })).sort((a, b) => a.time - b.time);
  
        // Merge and deduplicate
        const merged = [...storedBars, ...newBars].reduce((acc: Bar[], bar: Bar) => {
          if (!acc.some(b => b.time === bar.time)) {
            acc.push(bar);
          }
          return acc;
        }, []).sort((a, b) => a.time - b.time);
  
        dataCache.set(cacheKey, merged);
        storedBars = merged;
      }
  
      // Filter to requested range
      const visibleBars = storedBars.filter(bar => 
        bar.time >= fromMs && bar.time <= toMs
      );
  
      // Calculate nextTime for pagination
      const oldestTime = storedBars[0]?.time;
      const newestTime = storedBars[storedBars.length - 1]?.time;
      const hasOlderData = oldestTime && oldestTime < fromMs;
  
      onHistoryCallback(visibleBars, {
        noData: visibleBars.length === 0,
        nextTime: hasOlderData ? oldestTime : newestTime,
      });
  
    } catch (err) {
      console.error('[getBars]: Error', err);
      onErrorCallback(err);
    }
  };

  subscribeBars = (
    symbolInfo: SymbolInfo,
    resolution: string,
    onRealtimeCallback: (bar: Bar) => void,
    subscriberUID: string,
    onResetCacheNeededCallback: () => void
  ): void => {
    // subscribeOnStream(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback);
  };

  unsubscribeBars = (subscriberUID: string): void => {
    unsubscribeFromStream(subscriberUID);
  };
}