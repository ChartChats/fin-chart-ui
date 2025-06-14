import _ from 'lodash';
import moment from 'moment';
import { chartApi } from '@/store/apis/chartApis';

import {
  makeApiRequest,
  configurationData,
  parseFullSymbol
} from './helpers.js';

import {
  Bar,
  DatafeedProps,
  SymbolInfo,
  PeriodParams,
  NewSymbol,
  SymbolItem,
  ChartData
} from '@/interfaces/chartInterfaces.js';

import { subscribeOnStream, unsubscribeFromStream } from './streaming.js';

// Global cache to store data for each symbol and resolution
const dataCache = new Map<string, Bar[]>();

export default class Datafeed {
  private props: DatafeedProps;

  constructor(props: DatafeedProps) {
    this.props = props;
  }

  onReady = async (callback: (configuration: any) => void): Promise<void> => {
    console.log('[onReady]: Method call', configurationData);
    setTimeout(() => callback(configurationData), 0);
  };
  
  searchSymbols = async (userInput: string, exchange: string, symbolType: string, onResultReadyCallback: (symbols: any[]) => void): Promise<void> => {
    console.log('[searchSymbols]: Method call');

    const searchedSymbolsData = await makeApiRequest('stock-search', {
      symbol: userInput,
      outputsize: 100,
    });
    console.log("symbols", searchedSymbolsData);

    const newSymbols: NewSymbol[] = (searchedSymbolsData.data as SymbolItem[])
      .filter((item: SymbolItem) => !symbolType || symbolType === 'All' || symbolType === item.instrument_type)
      .map((item: SymbolItem) => ({
        symbol: `${item.exchange}:${item.symbol}`,
        description: item.instrument_name,
        exchange: item.exchange,
        ticker: `${item.exchange}:${item.symbol}`,
        type: item.instrument_type
      }));

    console.log('[searchSymbols]: Returning ' + newSymbols.length + ' symbols');
    setTimeout(() => onResultReadyCallback(newSymbols), 0);
  };

  resolveSymbol = async (
    symbolName: string,
    onSymbolResolvedCallback: (symbolInfo: SymbolInfo) => void,
    onResolveErrorCallback: (error: string) => void, extension: any
  ): Promise<void> => {
    console.log('[resolveSymbol]: Method call', symbolName);

    try {
      const parsedSymbol = parseFullSymbol(symbolName);
      console.log('[resolveSymbol]: Parsed symbol', parsedSymbol);
      
      if (!parsedSymbol || !parsedSymbol.exchange || !parsedSymbol.symbol) {
        throw new Error('Invalid symbol format');
      }

      const {
        exchange = 'NASDAQ',
        symbol = 'APPL'
      } = parsedSymbol;
      
      // Now get the details of the parsed symbol from the API
      const symbolsResponse = await makeApiRequest('stock-search', {
        symbol: symbol,
      });
      
      if (!symbolsResponse?.data) {
        throw new Error('No data received from API');
      }

      let symbolDetails = _.find(symbolsResponse.data, (item: any) => 
        item.exchange === exchange && item.symbol === symbol
      );

      console.log('[resolveSymbol]: Symbol details', symbolDetails);

      if (_.isEmpty(symbolDetails)) {
        if (symbolsResponse && _.size(symbolsResponse.data) > 0) {
          symbolDetails = _.head(symbolsResponse.data);
        } else {
          throw new Error(`Symbol ${exchange}:${symbol} not found`);
        }
      }

      const {
        symbol: selectedSymbol = '',
        instrument_name: selectedDescription = '',
        exchange: selectedExchange = '',
        instrument_type: selectedType = '',
        currency_code: currencyCode = '',
        exchange_timezone: selectedTimezone = 'Etc/UTC',
        country: countryName = ''
      } = symbolDetails;
    
      // Symbol information object
      const symbolInfo: SymbolInfo = {
        ticker: selectedSymbol,
        name: `${selectedExchange}:${selectedSymbol}`,
        description: selectedDescription || `${exchange}:${symbol}`,
        type: selectedType || 'crypto',
        session: '24x7',
        timezone: selectedTimezone || 'Etc/UTC',
        exchange: selectedExchange,
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

      // After fixing on the symbolInfo, we need to change the details of the chart from the LLM too
      // Sometimes, the LLM fails to recognize the exchange / description / ticker
      // But based on the symbol, we provide them the best possible solution from symbol_search endpoint
      if (this.props.dispatch) {
        const chartData: Partial<ChartData> = {
          id: this.props.chartId,
          type: selectedType || 'crypto',
          title: selectedDescription || `${selectedExchange}:${selectedSymbol}`,
          symbol: selectedSymbol,
          timeframe: this.props.interval,
          exchange: selectedExchange,
          description: selectedDescription || `${exchange}:${symbol}`,
        };

        this.props.dispatch(chartApi.endpoints.updateChart.initiate({
          id: this.props.chartId,
          data: chartData
        }));
      }

      console.log('[resolveSymbol]: Symbol resolved', symbolInfo);
      setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
    } catch (error) {
      console.error('[resolveSymbol]: Error', error);
      setTimeout(() => onResolveErrorCallback(error.message || 'Cannot resolve symbol'), 0);
    }
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
  
    const parsedSymbol = parseFullSymbol(symbolInfo.name);
    const { exchange, symbol } = parsedSymbol;
    const interval = intervalMap[resolution] || '1day';
    const cacheKey = `${exchange}:${symbol}-${interval}`;
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
        console.log(`[getBars]: Fetching data for ${exchange}:${symbol}`);

        let startDate: Date, endDate: Date;
        if (needsOlderData) {
          endDate = cacheFirst ? new Date(cacheFirst) : new Date(toMs);
          startDate = new Date(endDate);
          
          // Calculate backward period based on resolution
          const timeUnitMap: { [key: string]: { unit: moment.DurationInputArg2; value: number } } = {
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
          endDate = new Date(startDate);
        }
  
        const response = await makeApiRequest('time-series', {
          symbol: symbol,
          interval: interval,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        });
        
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
      // When filtering visible bars, use the date range constraints
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
    const parsedSymbol = parseFullSymbol(symbolInfo.name);
    const { exchange, symbol } = parsedSymbol;
    console.log(`[subscribeBars]: Subscribing to ${exchange}:${symbol}`);
    // subscribeOnStream(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback);
  };

  unsubscribeBars = (subscriberUID: string): void => {
    console.log('[unsubscribeBars]: Unsubscribing from stream', subscriberUID);
    unsubscribeFromStream(subscriberUID);
  };
}