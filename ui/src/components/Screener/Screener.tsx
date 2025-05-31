import React from 'react';
import { Card } from 'antd';
import { useTheme } from '@/contexts/ThemeContext';

export function Screener() {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <Card 
          className="mb-4" 
          style={{
            backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
            borderColor: isDarkTheme ? '#374151' : '#e5e7eb'
          }}
        >
          <h3 className="text-lg font-medium mb-2">Market Overview</h3>
          {/* Add market overview content */}
        </Card>

        <Card 
          className="mb-4"
          style={{
            backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
            borderColor: isDarkTheme ? '#374151' : '#e5e7eb'
          }}
        >
          <h3 className="text-lg font-medium mb-2">Watchlists</h3>
          {/* Add watchlists content */}
        </Card>

        <Card 
          style={{
            backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
            borderColor: isDarkTheme ? '#374151' : '#e5e7eb'
          }}
        >
          <h3 className="text-lg font-medium mb-2">Screener Filters</h3>
          {/* Add screener filters content */}
        </Card>
      </div>
    </div>
  );
}