import React, { useState, useEffect } from 'react';
import { Divider, Typography } from 'antd';
import WatchlistTable from "@/components/Screener/WatchlistTable";
import ScreenerCard from "@/components/Screener/ScreenerCard";
import { ScreenerDashboardProps } from "@/interfaces/screenerInterfaces";
import _ from 'lodash';

const { Title } = Typography;

const ScreenerDashboard = (props: ScreenerDashboardProps) => {
  const { 
    screeners, 
    loadingStates,
    columns,
    fieldConfigMenu,
    getTimeDifference,
    isDarkTheme,
    onRetry,
    onDelete,
    onToggleExpand,
    expandedScreeners 
  } = props;

  const [watchlistData, setWatchlistData] = useState<any[]>([]);

  useEffect(() => {
    const savedWatchlist = localStorage.getItem('screener_watchlist');
    if (savedWatchlist) {
      try {
        setWatchlistData(JSON.parse(savedWatchlist));
      } catch (error) {
        console.error('Error loading watchlist:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (watchlistData.length > 0) {
      localStorage.setItem('screener_watchlist', JSON.stringify(watchlistData));
    } else {
      localStorage.removeItem('screener_watchlist');
    }
  }, [watchlistData]);

  const handleAddToWatchlist = (selectedRows: any[]) => {
    const newItems = selectedRows.filter(newItem => {
      const identifier = newItem.symbol || newItem.key;
      return !watchlistData.some(existingItem => 
        (existingItem.symbol || existingItem.key) === identifier
      );
    });

    if (newItems.length > 0) {
      setWatchlistData(prev => [...prev, ...newItems]);
    }
  };

  const handleAddTicker = (tickerSymbol: string) => {
    const exists = watchlistData.some(item => 
      (item.symbol || '').toUpperCase() === tickerSymbol.toUpperCase()
    );

    if (exists) return;

    const newTicker = {
      key: `ticker-${Date.now()}`,
      symbol: tickerSymbol,
      close: 0,
      open: 0,
      price_change_1d_percent: 0,
      added_at: new Date().toISOString(),
    };

    setWatchlistData(prev => [...prev, newTicker]);
  };

  const handleRemoveFromWatchlist = (keys: string[]) => {
    const filteredWatchlistData = _.filter(watchlistData, (item) => _.indexOf(keys, item.key) !== 0)
    setWatchlistData(filteredWatchlistData);
  };

  const isScreenerExpanded = (screenerId: string) => {
    return expandedScreeners.includes(screenerId);
  };

  return (
    <div style={{ padding: '16px' }}>
      {watchlistData.length > 0 && (
        <>
          <WatchlistTable
            watchlistData={watchlistData}
            onAddTicker={handleAddTicker}
            onRemoveFromWatchlist={ handleRemoveFromWatchlist }
            isDarkTheme={isDarkTheme}
            columns={columns}
          />
          <Divider 
            style={{ 
              borderColor: isDarkTheme ? '#374151' : '#e5e7eb',
              margin: '24px 0' 
            }} 
          />
        </>
      )}

      <div style={{ marginBottom: '16px' }}>
        <Title 
          level={4} 
          style={{ 
            color: isDarkTheme ? '#ffffff' : '#000000',
            marginBottom: '16px' 
          }}
        >
          Stock Screeners
        </Title>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {screeners.map((screener) => (
            <ScreenerCard
              key={screener.id}
              screener={screener}
              isExpanded={isScreenerExpanded(screener.id)}
              onToggleExpand={onToggleExpand}
              onRetry={onRetry}
              onDelete={onDelete}
              onAddToWatchlist={handleAddToWatchlist}
              loadingStates={loadingStates}
              columns={columns}
              fieldConfigMenu={fieldConfigMenu}
              getTimeDifference={getTimeDifference}
              isDarkTheme={isDarkTheme}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScreenerDashboard;