
import symbolTypes from "../../mock/symbolTypes.json";

// Your TwelveData API key
export const apiKey = "2029fb701e55433b9e8b3f722db59df2";

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

// Makes requests to TwelveData API
export async function makeApiRequest(path: string): Promise<any> {
  try {
    const url = new URL(`https://api.twelvedata.com/${path}`);
    url.searchParams.append('Authorization', apiKey);
    const response = await fetch(url.toString());
    return response.json();
  } catch (error: any) {
    throw new Error(`TwelveData request error: ${error.status}`);
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