import symbolTypes from "../../mock/symbolTypes.json";
import axios from '@/store/client';

import {
  ConfigurationData,
  IntervalMap,
  ParsedSymbol,
} from '@/interfaces/chartInterfaces';

// Helper function to normalize timestamps for TradingView
export function normalizeTimestamp(timestamp: number): number {
  // If timestamp is in milliseconds (13 digits), convert to seconds
  if (timestamp.toString().length === 13) {
    return Math.floor(timestamp / 1000);
  }
  // If already in seconds (10 digits), return as is
  return Math.floor(timestamp);
}

// Makes requests to backend API
export async function makeApiRequest(endpoint: string = '', payload: Record<string, any> = {}): Promise<any> {
  const baseUrl = `${process.env.BACKEND_SERVER_URL}/api/v1`;

  try {
    console.log(`[API Request]: ${baseUrl}/${endpoint}`, payload);
    
    const response = await axios(`${baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(payload)
    });
    
    if (!response.data.ok) {
      throw new Error(`API request error: ${response.status}`);
    }
    const data = await response.data.json();
    console.log(`[API Response]: Received ${data?.values?.length || 0} data points`);
    return data;
  } catch (error: any) {
    console.error('API request failed:', error);
    throw new Error(`API request error: ${error.message}`);
  }
}

// Generates a symbol ID from a pair of the coins
export function generateSymbol(exchange: string, symbol: string): string {
  return `${exchange}:${symbol}`;
}

// Returns all parts of the symbol
export function parseFullSymbol(fullSymbol: string): ParsedSymbol {
  const match = fullSymbol.match(/^(\w+):(\w+)$/);
  if (!match) {
    console.warn(`[parseFullSymbol]: Could not parse symbol: ${fullSymbol}`);
    return { exchange: 'UNKNOWN', symbol: fullSymbol };
  }
  return { exchange: match[1], symbol: match[2] };
}

export function getNextDailyBarTime(barTime: number): number {
  // Ensure we're working with seconds
  const normalizedTime = normalizeTimestamp(barTime);
  const date = new Date(normalizedTime * 1000);
  date.setUTCDate(date.getUTCDate() + 1);
  date.setUTCHours(0, 0, 0, 0); // Reset to start of day in UTC
  return Math.floor(date.getTime() / 1000);
}

// DatafeedConfiguration implementation
export const configurationData: ConfigurationData = {
  // Represents the resolutions for bars supported by your datafeed
  supported_resolutions: ["1", "5", "15", "30", "60", "D", "W", "M"],
  symbols_types: symbolTypes,
  supports_marks: false,
  supports_timescale_marks: false,
  supports_time: true
};

export const intervalMap: IntervalMap = {
  '1': '1min',
  '5': '5min',
  '15': '15min',
  '30': '30min',
  '60': '1h',
  'D': '1day',
  'W': '1week',
  'M': '1month'
};