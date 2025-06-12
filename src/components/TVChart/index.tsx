import React, { useEffect, useRef, useMemo } from 'react';
import moment from 'moment';
import _ from 'lodash';
import { generateSymbol } from './helpers';
import Datafeed from './datafeed';
import './index.css';

import {
  getShapeMap,
  getChartPatternFunction,
  colorMap
} from '@/utils/AppUtils';

import {
  DefaultChartProps,
  TVChartProps,
} from '@/interfaces/chartInterfaces';

declare global {
  interface Window {
    TradingView: {
      widget: new (options: any) => {
        [x: string]: any;
        remove: () => void;
      };
    };
  }
}

function getLanguageFromURL(): string | null {
  const regex = new RegExp('[\\?&]lang=([^&#]*)');
  const results = regex.exec(window.location.search);
  return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

const getIndicatorInputs = (tvWidget: any, indicatorName: string) => {
  const indicatorInputs = tvWidget.getStudyInputs(indicatorName);
  let indicatorProps: { [key: string]: any } = {};
  _.forEach(indicatorInputs, (input) => {
    indicatorProps[input.id] = input.defval;
  });
  return indicatorProps;
};

// Helper function to ensure timestamp is in seconds for TradingView
const normalizeTimestamp = (timestamp: number): number => {
  // If timestamp is in milliseconds (13 digits), convert to seconds
  if (timestamp.toString().length === 13) {
    return Math.floor(timestamp / 1000);
  }
  // If already in seconds (10 digits), return as is
  return Math.floor(timestamp);
};

export const TVChartContainer: React.FC<TVChartProps> = (props: DefaultChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const chartReadyRef = useRef<boolean>(false);

  const defaultProps = useMemo(() => ({
    symbol: props.symbol,
    interval: props.interval,
    libraryPath: '/charting_library/',
    chartsStorageUrl: 'https://saveload.tradingview.com',
    chartsStorageApiVersion: '1.1',
    clientId: 'tradingview.com',
    userId: 'public_user_id',
    fullscreen: false,
    autosize: true,
    studiesOverrides: {},
    theme: props.theme,
    symbol_type: props.type,
    description: props.description,
    exchange: props.exchange
  }), [props.symbol, props.interval, props.theme]);

  // Function to update visible range
  const updateVisibleRange = () => {
    const tvWidget = widgetRef.current;
    if (!tvWidget || !tvWidget.chart || !chartReadyRef.current) return;

    const chart = tvWidget.chart();
    
    // Ensure timestamps are in seconds
    const fromTime = props.date_from
      ? moment(props.date_from, 'YYYY-MM-DD').unix()
      : moment().subtract(30, 'days').unix();

    const toTime = props.date_to
      ? moment(props.date_to, 'YYYY-MM-DD').unix()
      : moment().unix();
    
    console.log(`[updateVisibleRange]: Setting range from ${fromTime} to ${toTime}`);
    
    chart.setVisibleRange({
      from: fromTime,
      to: toTime
    });
  };

  // Function to update chart indicators
  const updateChartIndicators = () => {
    const tvWidget = widgetRef.current;
    if (!tvWidget || !tvWidget.chart || !chartReadyRef.current) return;
    
    // Remove all existing studies except Volume
    const studies = tvWidget.chart().getAllStudies();
    if (studies && studies.length > 0) {
      studies.forEach((study: any) => {
        // Skip the Volume indicator
        if (study.name !== 'Volume') {
          tvWidget.chart().removeEntity(study.id);
        }
      });
    }
    
    // Add all indicators from props
    if (_.size(props.indicators) > 0) {
      props.indicators.forEach(indicator => {
        tvWidget.chart().createStudy(
          indicator.value,
          false,
          false,
          indicator.properties || getIndicatorInputs(tvWidget, indicator.value),
        );
      });
    }
  };

  const updateChartPatterns = () => {
    const tvWidget = widgetRef.current;
    if (!tvWidget || !tvWidget.chart || !chartReadyRef.current) return;

    const chart = tvWidget.chart();

    // Clear existing patterns first
    chart.removeAllShapes();

    if (props.chartPatterns && props.chartPatterns.length > 0) {
      props.chartPatterns.forEach(pattern => {
        try {
          if (!pattern.points || !Array.isArray(pattern.points)) {
            console.error('Invalid pattern points:', pattern);
            return;
          }

          const points = pattern.points.map(([time, price]: any) => {
            if (typeof time !== 'number' || typeof price !== 'number') {
              throw new Error(`Invalid coordinates: [${time}, ${price}]`);
            }
            // Ensure timestamp is in seconds for TradingView
            return { 
              time: normalizeTimestamp(time), 
              price 
            };
          });

          const functionName = getChartPatternFunction(pattern);
          const patternShape = pattern.shape === 'Triangle_Symbol'
            ? (pattern.direction === 'up' ? 'Triangle_Symbol_up' : 'Triangle_Symbol_down')
            : pattern.shape;

          const shapeProperties = {
            shape: getShapeMap[patternShape],
            overrides: {
              linecolor: colorMap[pattern.color] || pattern.color,
              color: colorMap[pattern.color] || pattern.color,
              linestyle: pattern.dotted ? 1 : 0,
              linewidth: patternShape === 'Horizontal_Line'? 0.5 : pattern.dotted ? 3 : 5,
              size: 50
            }
          };
          // for the text to show
          if (pattern.label) {
            shapeProperties['text'] = pattern.label;
          }

          if (functionName === 'createShape') {
            chart.createShape(
              {
                time: points[0].time,
                price: points[0].price
              },
              shapeProperties
            );
          } else if (functionName === 'createMultipointShape') {
            if (pattern.shape === 'Circle') {
              points.push({
                time: points[0].time,
                price: points[0].price + 1
              });
            }
            chart.createMultipointShape(
              points,
              shapeProperties
            );
          }
          
        } catch (error) {
          console.error('Error rendering pattern:', error, pattern);
        }
      });
    }
  }

  // Main effect for chart initialization
  useEffect(() => {
    if (!chartContainerRef.current) return;
  
    const datafeed = new Datafeed({
      description: defaultProps.description,
      symbol: defaultProps.symbol,
      interval: defaultProps.interval,
      symbol_type: defaultProps.symbol_type,
      theme: defaultProps.theme,
      exchange: defaultProps.exchange,
      from_date: props.date_from, // Pass from_date from props
      to_date: props.date_to     // Pass to_date from props
    });
  
    const widgetOptions = {
      symbol: generateSymbol(defaultProps.exchange, defaultProps.symbol),
      datafeed: datafeed,
      interval: defaultProps.interval,
      container: chartContainerRef.current,
      library_path: defaultProps.libraryPath,
      debug: false,
      symbol_type: defaultProps.symbol_type,
      description: defaultProps.description,
      locale: getLanguageFromURL() || 'en',
      timezone: 'Etc/UTC', // Force UTC timezone
      enabled_features: [
        'study_templates',
        'create_volume_indicator_by_default',
        'header_symbol_search',
        'timeframes_toolbar',
        'timeframes_toolbar_buttons',
        'range_selection',
        'header_chart_type',
        'header_settings',
        'header_undo_redo',
        'header_screenshot',
        'header_fullscreen_button',
        'header_saveload',
        'header_compare',
        'header_resolutions',
        'header_indicators',
        'header_interval_dialog_button',
        'show_interval_dialog_on_key_press',
      ],
      disabled_features: [
        'use_localstorage_for_settings',
        'timezone_menu',
      ],
      charts_storage_url: defaultProps.chartsStorageUrl,
      charts_storage_api_version: defaultProps.chartsStorageApiVersion,
      client_id: defaultProps.clientId,
      user_id: defaultProps.userId,
      fullscreen: defaultProps.fullscreen,
      autosize: defaultProps.autosize,
      studies_overrides: defaultProps.studiesOverrides,
      theme: defaultProps.theme,
      overrides: {
        "mainSeriesProperties.candleStyle.upColor": "#26a69a",
        "mainSeriesProperties.candleStyle.downColor": "#ef5350",
        "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
        "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
        "paneProperties.background": props.theme === 'dark' ? "#131722" : "#ffffff",
        "paneProperties.vertGridProperties.color": props.theme === 'dark' ? "#363c4e" : "#f0f3fa",
        "paneProperties.horzGridProperties.color": props.theme === 'dark' ? "#363c4e" : "#f0f3fa",
        'timeScale.timezone': 'Etc/UTC' // Ensure UTC timezone
      },
      toolbar_bg: props.theme === 'dark' ? "#131722" : "#ffffff",
      timeframes: [
        { text: "1D", resolution: "1", description: "1 Day" },
        { text: "1W", resolution: "5", description: "1 Week" },
        { text: "1M", resolution: "15", description: "1 Month" },
        { text: "3M", resolution: "30", description: "3 Months" },
        { text: "6M", resolution: "60", description: "6 Months" },
        { text: "1Y", resolution: "D", description: "1 Year" },
        { text: "ALL", resolution: "W", description: "All" }
      ],
      range_selection: {
        enabled: true,
        ranges: [
          { text: "1D", resolution: "1", description: "1 Day" },
          { text: "1W", resolution: "5", description: "1 Week" },
          { text: "1M", resolution: "15", description: "1 Month" },
          { text: "3M", resolution: "30", description: "3 Months" },
          { text: "6M", resolution: "60", description: "6 Months" },
          { text: "1Y", resolution: "D", description: "1 Year" },
          { text: "ALL", resolution: "W", description: "All" }
        ]
      },
      loading_screen: { backgroundColor: props.theme === 'dark' ? "#131722" : "#ffffff" },
    };

    const tvWidget = new window.TradingView.widget(widgetOptions);
    widgetRef.current = tvWidget;

    // Add this in the onChartReady callback
    tvWidget.onChartReady(async () => {
      chartReadyRef.current = true;
      
      // Update visible range
      updateVisibleRange();
  
      // Existing indicator setup
      // Volume indicator should be there by default
      tvWidget.chart().createStudy("Volume", false, false, undefined, { "showLabelsOnPriceScale": true });

      // Apply initial indicators
      updateChartIndicators();

      // Apply initial patterns - delay to ensure chart is fully loaded
      setTimeout(() => {
        updateChartPatterns();
      }, 1500);
    });

    // Cleanup on unmount
    return () => {
      chartReadyRef.current = false;
      if (widgetRef.current !== null) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }
    };
  }, [props.symbol, props.interval, props.theme]);

  // Add this new effect to handle date range updates
  useEffect(() => {
    updateVisibleRange();
  }, [props.date_from, props.date_to]);

  // Effect to handle indicator updates
  useEffect(() => {
    updateChartIndicators();
  }, [props.indicators]);

  useEffect(() => {
    setTimeout(() => {
      updateChartPatterns();
    }, 1500);
  }, [props.chartPatterns]);

  useEffect(() => {
    return () => {
      const tvWidget = widgetRef.current;
      if (tvWidget && tvWidget.chart && chartReadyRef.current) {
        tvWidget.chart().removeAllShapes();
      }
    };
  }, []);

  return (
    <div className="TVChartContainer-wrapper">
      <div
        ref={chartContainerRef}
        className="TVChartContainer"
        data-theme={props.theme}
      />
    </div>
  );
};

export default TVChartContainer;