import _ from 'lodash';

import {
  ChartPatternProps
} from '@/interfaces/chartInterfaces';

import {
  Chat
} from '@/interfaces/chatInterfaces';

export const getChartPatternFunction = (pattern: ChartPatternProps): string => {
  // 4 functions to choose from -> createShape, createMultipointShape, createExecutionShape and createAnchoredShape
  const shape = pattern.shape;

  // for createShape
  if (shape === 'Label' || shape === 'Triangle_symbol' || shape === 'Horizontal_Line') {
    return 'createShape';
  }

  // rest for other options -> createMultipointShape
  return 'createMultipointShape';
};

export const getPatternShape = (pattern: ChartPatternProps) => {
  return pattern.shape === 'Triangle_Symbol'
    ? (pattern.direction === 'up' ? 'Triangle_Symbol_up' : 'Triangle_Symbol_down')
    : pattern.shape;
}

export const getShapeMap = {
  "Label": "text",
  "Circle": "circle",
  "Horizontal_Line": "horizontal_line",
  "Trend_Line": "trend_line",
  "Rectangle": "rectangle",
  "Triangle_Symbol_up": "arrow_up",
  "Triangle_Symbol_down": "arrow_down",
};

export const colorMap = {
  "orange": "rgb(255, 153, 0)",
  "blue": "rgb(51, 153, 255)",
  "white": "rgb(255, 255, 255)",
  "green": "rgb(0, 204, 0)",
  "red": "rgb(255, 0, 0)",
  "lime": "rgb(153, 255, 51)",
  "purple": "rgb(153, 0, 255)",
  "magenta": "rgb(255, 0, 255)",
}

export const getChats = (chatsData: [string, any[]][] = []): Chat[] => {
  return _.map(chatsData, chat => {
    const chatId = chat[0] || '';
    return {
      id: chatId,
      title: `Chat ${chatId?.substring(0, 8)}`,
      messages: chat[1],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
};

export const formatValue = (value, type) => {
  if (value === '' || value === null || value === undefined) return '-';
  switch (type) {
    case 'currency': return `$${Number(value).toFixed(2)}`;
    case 'percentage': return `${Number(value).toFixed(2)}%`;
    case 'change': {
      const change = Number(value).toFixed(2);
      return Number(change) >= 0 ? `+${change}` : `${change}`;
    }
    case 'number': return Number(value).toFixed(2);
    default: return value;
  }
};

export const getPoints = (pattern: ChartPatternProps): {time: number, price: string}[] => {
  // Rectangle goes with [[time1, time2], [price1, price2]]
  // And reactangle is always a multi-shape point with 2 points
  if (pattern.shape === "Rectangle") {
    return [
      {
        time: normalizeTimestamp(pattern.points[0][0]),
        price: pattern.points[1][0]
      },
      {
        time: normalizeTimestamp(pattern.points[0][1]),
        price: pattern.points[1][1]
      }
    ];
  }

  // Other points go with [time, price] format
  return pattern.points.map(([time, price]: any) => {
    // Ensure timestamp is in seconds for TradingView
    return { 
      time: normalizeTimestamp(time), 
      price 
    };
  });
};

// Helper function to ensure timestamp is in seconds for TradingView
export const normalizeTimestamp = (timestamp: number): number => {
  // If timestamp is in milliseconds (13 digits), convert to seconds
  if (timestamp.toString().length === 13) {
    return Math.floor(timestamp / 1000);
  }
  // If already in seconds (10 digits), return as is
  return Math.floor(timestamp);
};