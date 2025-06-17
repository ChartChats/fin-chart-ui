import React, { useEffect, useRef, useMemo } from 'react';
import moment from 'moment';
import _ from 'lodash';
import { useDispatch } from 'react-redux';
import { generateSymbol } from './helpers';
import Datafeed from './datafeed';
import './index.css';

import {
  getShapeMap,
  getChartPatternFunction,
  getPoints,
  colorMap,
  getPatternShape
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

export const TVChartContainer: React.FC<TVChartProps> = (props: DefaultChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const chartReadyRef = useRef<boolean>(false);
  const dataLoadedRef = useRef<boolean>(false);
  const visibleRangeSetRef = useRef<boolean>(false);
  const patternsAppliedRef = useRef<boolean>(false); // Track if patterns have been applied
  const actualChartIdRef = useRef(props.chartId);
  const dispatch = useDispatch();

  const defaultProps = useMemo(() => ({
    chartId: props.chartId,
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
    exchange: props.exchange,
  }), [props.symbol, props.interval, props.theme, props.type, props.description, props.exchange, props.chartId]);

  const isChartReadyForPatterns = (): boolean => (
    chartReadyRef.current && dataLoadedRef.current && visibleRangeSetRef.current
  );

  const updateVisibleRange = (): void => {
    const tvWidget = widgetRef.current as { chart: () => { setVisibleRange: (range: { from: number; to: number }) => void } };
    if (!tvWidget?.chart || !chartReadyRef.current) return;

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

    visibleRangeSetRef.current = true;

    if (isChartReadyForPatterns()) {
      updateChartPatterns();
    }
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

  const updateChartPatterns = (): void => {
    const tvWidget = widgetRef.current;
    if (!tvWidget?.chart || !isChartReadyForPatterns()) {
      console.log('[updateChartPatterns]: Chart not ready for patterns yet');
      return;
    }

    const chart = tvWidget.chart();
    console.log('[updateChartPatterns]: Applying patterns to chart');

    // Clear existing patterns first
    chart.removeAllShapes();

    if (props.chartPatterns && props.chartPatterns.length > 0) {
      props.chartPatterns.forEach(pattern => {
        try {
          if (!pattern.points || !Array.isArray(pattern.points)) {
            console.error('Invalid pattern points:', pattern);
            return;
          }

          // get properly constructed points [{time, price}]
          const points = getPoints(pattern);

          const functionName = getChartPatternFunction(pattern);
          const patternShape = getPatternShape(pattern);

          const shapeProperties = {
            shape: getShapeMap[patternShape],
            zOrder: "top",
            text: pattern.label,
            filled: true,
            overrides: {
              linecolor: colorMap[pattern.color] || pattern.color,
              bold: patternShape === "label" ? true : false,
              color: "black",
              linestyle: pattern.dotted ? 1 : 0,
              linewidth: patternShape === "Horizontal_Line" || patternShape === "Rectangle" ? 1 : pattern.dotted ? 3 : 5,
              textColor: patternShape === "Rectangle" ? "white" : colorMap[pattern.color] || pattern.color,
              textcolor: colorMap[pattern.color] || pattern.color,
              showLabel: true,
              backgroundColor: colorMap[pattern.color] || pattern.color,
              drawBorder: true,
              fixedSize: false,
              fillBackground: true
            }
          };

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

    console.log('[updateChartPatterns]: Patterns applied successfully');
  };

  const setupChartEventListeners = (tvWidget: any): void => {
    const chart = tvWidget.chart();

    chart.onDataLoaded().subscribe(null, () => {
      console.log('[onDataLoaded]: Chart data has been loaded');
      dataLoadedRef.current = true;
      
      if (isChartReadyForPatterns() && !patternsAppliedRef.current) {
        updateChartPatterns();
      }
    });

    chart.onSymbolChanged().subscribe(null, () => {
      console.log('[onSymbolChanged]: Symbol has changed');
      dataLoadedRef.current = false;
      visibleRangeSetRef.current = false;
      patternsAppliedRef.current = false; // Reset patterns flag when symbol changes
    });
  };

  useEffect(() => {
    // Always update to latest chartId
    actualChartIdRef.current = props.chartId;
  }, [props.chartId]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Only create widget when we have the correct chartId
    if (actualChartIdRef.current !== props.chartId) {
      return;
    }
  
    const datafeed = new Datafeed({
      chartId: actualChartIdRef.current,
      description: defaultProps.description,
      symbol: defaultProps.symbol,
      interval: defaultProps.interval,
      symbol_type: defaultProps.symbol_type,
      theme: defaultProps.theme,
      exchange: defaultProps.exchange,
      from_date: props.date_from,
      to_date: props.date_to,
      dispatch,
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
      timezone: 'Etc/UTC',
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
        'timeScale.timezone': 'Etc/UTC'
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

    tvWidget.onChartReady(() => {
      console.log('[onChartReady]: Chart is ready');
      chartReadyRef.current = true;
      
      setupChartEventListeners(tvWidget);
      updateVisibleRange();
  
      tvWidget.chart().createStudy('Volume', false, false, undefined, { showLabelsOnPriceScale: true });
      updateChartIndicators();
    });

    return () => {
      // Enhanced cleanup
      chartReadyRef.current = false;
      dataLoadedRef.current = false;
      visibleRangeSetRef.current = false;
      patternsAppliedRef.current = false;
      
      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }
      
      // Clear any existing chart container content
      if (chartContainerRef.current) {
        chartContainerRef.current.innerHTML = '';
      }
    };
  }, [props.chartId, props.symbol, props.interval, props.theme, defaultProps, dispatch]);

  // Add this new effect to handle date range updates
  useEffect(() => {
    if (chartReadyRef.current) {
      visibleRangeSetRef.current = false;
      updateVisibleRange();
    }
  }, [props.date_from, props.date_to]);

  // Effect to handle indicator updates
  useEffect(() => {
    if (chartReadyRef.current) {
      updateChartIndicators();
    }
  }, [props.indicators]);

  // Effect to handle chart pattern updates - only when patterns prop changes
  useEffect(() => {
    if (isChartReadyForPatterns()) {
      updateChartPatterns();
    }
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