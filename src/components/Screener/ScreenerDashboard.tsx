import React, { useState, useEffect } from 'react';
import { Divider, Typography } from 'antd';
import WatchlistTable from "@/components/Screener/WatchlistTable";
import ScreenerCard from "@/components/Screener/ScreenerCard";
import { ScreenerDashboardProps } from "@/interfaces/screenerInterfaces";
import _ from 'lodash';

import { 
  useGetWatchlistQuery, 
  useAddToWatchlistMutation,
  useRemoveFromWatchlistMutation 
} from '@/store/index';

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

  // Get watchlist data and mutations
  const { data: watchlist = {} } = useGetWatchlistQuery();
  const [addToWatchlist] = useAddToWatchlistMutation();
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation();

  const handleAddToWatchlist = async (selectedRows: any[]) => {
    try {
      await addToWatchlist(selectedRows).unwrap();
      // Removed refetch() - RTK Query will automatically update the cache
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
  };

  const handleAddTicker = (tickerSymbol: string) => {
    // This function is called from WatchlistTable after the ticker is added
    // The actual API call is handled by SymbolSearchModal
    // No need to make API call here as it's already done in the modal
    console.log('Ticker added:', tickerSymbol);
  };

  const handleRemoveFromWatchlist = async (keys: string[]) => {
    try {
      await removeFromWatchlist(keys).unwrap();
      // Removed refetch() - RTK Query will automatically update the cache
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  };

  const isScreenerExpanded = (screenerId: string) => {
    return expandedScreeners.includes(screenerId);
  };

  const watchlistSymbolsData = _.values(watchlist);

  return (
    <div style={{ padding: '16px' }}>
      {watchlist && watchlistSymbolsData.length > 0 && (
        <>
          <WatchlistTable
            watchlistData={watchlistSymbolsData}
            onAddTicker={handleAddTicker}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
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