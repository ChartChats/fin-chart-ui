import React, { useEffect, useRef, useMemo } from 'react';
import { generateSymbol } from './helpers';
import Datafeed from './datafeed';
import './index.css';
import defaultChart from '../../mock/defaultChart.json';

declare global {
  interface Window {
    TradingView: {
      widget: new (options: any) => {
        remove: () => void;
      };
    };
  }
}

interface TVChartProps {
  symbol?: string;
  interval?: string;
  theme?: string;
}

interface DefaultChartProps {
  indicators: {
    name: string;
    forceOverlay: boolean;
    lock: boolean;
    settings: {
      length: number;
      std: number;
      mult: number;
    };
  }[];
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

function getLanguageFromURL(): string | null {
  const regex = new RegExp('[\\?&]lang=([^&#]*)');
  const results = regex.exec(window.location.search);
  return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

export const TVChartContainer: React.FC<TVChartProps> = (props: DefaultChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

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
    symbol_type: defaultChart.type,
    description: defaultChart.description,
    exchange: defaultChart.exchange
  }), [props.symbol, props.interval, props.theme]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const datafeed = new Datafeed({
      description: defaultProps.description,
      symbol: defaultProps.symbol,
      interval: defaultProps.interval,
      symbol_type: defaultProps.symbol_type,
      theme: defaultProps.theme,
      exchange: defaultProps.exchange
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
        'show_interval_dialog_on_key_press'
      ],
      disabled_features: [
        'use_localstorage_for_settings',
        'timezone_menu'
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
        "paneProperties.horzGridProperties.color": props.theme === 'dark' ? "#363c4e" : "#f0f3fa"
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
      initial_range: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime() / 1000,
        to: Math.floor(Date.now() / 1000)
      }
    };

    const tvWidget = new window.TradingView.widget(widgetOptions);

    // Cleanup on unmount
    return () => {
      if (tvWidget !== null) {
        tvWidget.remove();
      }
    };
  }, [props.symbol, props.interval, props.theme]);

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