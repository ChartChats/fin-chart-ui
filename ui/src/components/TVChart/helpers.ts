
import symbolTypes from "../../mock/symbolTypes.json";

interface ParsedSymbol {
  exchange: string;
  symbol: string;
}

interface SymbolType {
  name: string;
  value: string;
}

interface ConfigurationData {
  supported_resolutions: string[];
  symbols_types: SymbolType[];
  supports_marks: boolean;
  supports_timescale_marks: boolean;
  supports_time: boolean;
}

interface IntervalMap {
  [key: string]: string;
}

// Makes requests to backend API
export async function makeApiRequest(endpoint: string = '', payload: Record<string, any> = {}): Promise<any> {
  try {
    const response = await fetch(`${process.env.BACKEND_SERVER_URL}/api/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`API request error: ${response.status}`);
    }
    return response.json();
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
  return match ? { exchange: match[1], symbol: match[2] } : null;
}

export function getNextDailyBarTime(barTime: number): number {
  const date = new Date(barTime * 1000);
  date.setDate(date.getDate() + 1);
  return date.getTime() / 1000;
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