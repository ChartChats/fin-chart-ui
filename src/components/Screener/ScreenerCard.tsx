// src/components/ScreenerCard.tsx
import React, { useEffect, useCallback, useState, useRef } from 'react';
import _ from 'lodash';
import {
  Table,
  Card,
  Button,
  Dropdown,
  Tag,
  Typography,
  Tooltip,
  Spin,
  Collapse,
  message,
  Skeleton,
  Input,
  Space,
  Checkbox,
  Select,
  MenuProps
} from 'antd';

import { useGetScreenerQuery } from '@/store/apis/screenerApis';

import {
  defaultFields,
  availableCustomFields,
  defaultSelectedCustomFields
} from '@/utils/AppConstants';

import { renderChangeValue } from '@/utils/JSXUtils';

import { formatValue } from '@/utils/AppUtils';

import {
  SettingOutlined,
  ReloadOutlined,
  DeleteOutlined,
  StarOutlined,
  SearchOutlined,
  CloseOutlined
} from '@ant-design/icons';

import { SCREENER_TABLE_PAGINATIONLIMIT } from '@/utils/AppConstants';

import {
  ScreenerCardProps,
  Screener
} from '@/interfaces/screenerInterfaces';

const { Text } = Typography;
const { Panel } = Collapse;
const { Search } = Input;
const { Option } = Select;

const ScreenerCard: React.FC<ScreenerCardProps> = (props) => {
  const {
    screener,
    isExpanded,
    onToggleExpand,
    onRetry,
    onDelete,
    onAddToWatchlist,
    loadingStates,
    isDarkTheme
  } = props;

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Separate input state for debouncing
  const [sortField, setSortField] = useState<string | undefined>('symbol');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | undefined>('ascend');
  const [exchangeFilter, setExchangeFilter] = useState<string[]>([]);
  const [availableExchanges, setAvailableExchanges] = useState<string[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCustomFields, setSelectedCustomFields] = useState<string[]>(defaultSelectedCustomFields);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Debounced search function
  const debouncedSearch = useCallback(
    _.debounce((value: string) => {
      setSearchText(value);
      resetDataAndFetch();
    }, 1000),
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getTimeDifference = (screener: Screener) => {
    if (!screener?.updatedAt) return "unknown";
    
    try {
      const updatedAtDate = new Date(screener.updatedAt);
      if (isNaN(updatedAtDate.getTime())) return "unknown";
      
      const diffMs = currentTime.getTime() - updatedAtDate.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffMinutes < 1) return "just now";
      if (diffMinutes === 1) return "1 minute ago";
      if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) {
        return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
      }
      
      const diffDays = Math.floor(diffHours / 24);
      return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
    } catch (error) {
      console.error('Error calculating time difference:', error);
      return "unknown";
    }
  };

  const fieldConfigMenu: MenuProps = {
    items: availableCustomFields.map(field => ({
      key: field.key,
      label: (
        <Checkbox
          checked={selectedCustomFields.includes(field.key)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedCustomFields(prev => [...prev, field.key]);
            } else {
              setSelectedCustomFields(prev => prev.filter(key => key !== field.key));
            }
          }}
        >
          {field.title}
        </Checkbox>
      )
    }))
  };

  const columns = [
    {
      title: 'Stock',
      dataIndex: 'symbol',
      key: 'symbol',
      fixed: 'left' as const,
      width: 120,
      sorter: true,
      sortOrder: sortField === 'symbol' ? sortOrder : null,
      render: (stock: string) => (
        <Text strong style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
          {stock || 'N/A'}
        </Text>
      )
    },
    {
      title: 'Exchange',
      dataIndex: 'exchange',
      key: 'exchange',
      fixed: 'left' as const,
      width: 150,
      sorter: true,
      sortOrder: sortField === 'exchange' ? sortOrder : null,
      render: (exchange: string) => (
        <Text strong style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
          {exchange || 'N/A'}
        </Text>
      )
    },
    ...defaultFields.map(field => ({
      title: field.title,
      dataIndex: field.key,
      key: field.key,
      width: 100,
      sorter: true,
      sortOrder: sortField === field.key ? sortOrder : null,
      render: (value: any) => {
        if (field.type === 'change' || field.type === 'percentage') {
          return renderChangeValue(value, field.type, isDarkTheme);
        }
        return (
          <span style={{ color: isDarkTheme ? '#d9d9d9' : '#666666' }}>
            {formatValue(value, field.type)}
          </span>
        );
      }
    })),
    ...selectedCustomFields.map(fieldKey => {
      const field = availableCustomFields.find(f => f.key === fieldKey);
      if (!field) return null;
      
      return {
        title: field.title,
        dataIndex: field.key,
        key: field.key,
        width: 120,
        sorter: true,
        sortOrder: sortField === field.key ? sortOrder : null,
        render: (value: any) => (
          <span style={{ color: isDarkTheme ? '#d9d9d9' : '#666666' }}>
            {formatValue(value, field.type)}
          </span>
        )
      };
    }).filter(Boolean) as any[]
  ];

  const buildQueryParams = useCallback(() => {
    const params: Record<string, any> = {
      screenerId: screener?.id,
      offset,
      limit: SCREENER_TABLE_PAGINATIONLIMIT,
      refreshKey
    };

    if (searchText && searchText.trim()) {
      params.search = searchText.trim();
    }

    if (sortField && sortOrder) {
      params.sort_field = sortField;
      params.sort_order = sortOrder === 'ascend' ? 'asc' : 'desc';
    }

    if (exchangeFilter && exchangeFilter.length > 0) {
      params.exchange_filter = exchangeFilter.join(',');
    }

    return params;
  }, [screener?.id, offset, sortField, sortOrder, searchText, exchangeFilter, refreshKey]);

  const { 
    data: screenerData, 
    isFetching, 
    error, 
    refetch 
  } = useGetScreenerQuery(
    buildQueryParams(),
    { 
      skip: !isExpanded || !screener?.id,
      refetchOnMountOrArgChange: true 
    }
  );

  const hasMore = screenerData?.records && screenerData.total > data.length;

  useEffect(() => {
    if (!screenerData?.records || !isExpanded) return;

    try {
      const transformedData = screenerData.records.map((item, index) => {
        let changePercent = 0;
        if (item?.open && typeof item.open === 'number' && item.open !== 0) {
          const close = item?.close || 0;
          changePercent = ((close - item.open) / item.open) * 100;
        }

        return {
          ...item,
          key: `${screener?.id}-${offset + index}-${Date.now()}`,
          price_change_1d_percent: changePercent,
          prev_close: item?.open || 0,
          symbol: item?.symbol || 'N/A',
          exchange: item?.exchange || 'N/A'
        };
      });

      if (screenerData.available_exchanges && Array.isArray(screenerData.available_exchanges)) {
        setAvailableExchanges(screenerData.available_exchanges);
      }

      setData(prev => {
        if (offset === 0) {
          return transformedData;
        } else {
          return [...prev, ...transformedData];
        }
      });

      setIsLoadingMore(false);
      
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('Error transforming screener data:', error);
      setIsLoadingMore(false);
    }
  }, [screenerData, offset, screener?.id, isExpanded, isInitialLoad]);

  const resetDataAndFetch = useCallback(() => {
    setOffset(0);
    setData([]);
    setSelectedRowKeys([]);
    setIsLoadingMore(false);
    setIsInitialLoad(true);
    setRefreshKey(prev => prev + 1);
    
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, []);

  const handleSearch = useCallback((value: string) => {
    const trimmedValue = value?.trim() || '';
    setSearchText(trimmedValue);
    resetDataAndFetch();
  }, [resetDataAndFetch]);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    
    // Use debounced search only if user is typing
    if (value.trim()) {
      debouncedSearch(value.trim());
    } else {
      // Clear search immediately when input is empty
      debouncedSearch.cancel();
      setSearchText('');
      resetDataAndFetch();
    }
  }, [debouncedSearch, resetDataAndFetch]);

  const handleTableChange = useCallback((pagination: any, filters: any, sorter: any) => {
    if (!sorter || Array.isArray(sorter)) return;

    const { field, order } = sorter;
    
    // Set sort field and order based on Ant Design's sorter object
    setSortField(field || undefined);
    setSortOrder(order || undefined);
    
    resetDataAndFetch();
  }, [resetDataAndFetch]);

  const handleExchangeFilterChange = useCallback((values: string[]) => {
    const safeValues = Array.isArray(values) ? values.filter(Boolean) : [];
    setExchangeFilter(safeValues);
    resetDataAndFetch();
  }, [resetDataAndFetch]);

  const clearSearch = useCallback(() => {
    setSearchText('');
    setSearchInput('');
    debouncedSearch.cancel();
    resetDataAndFetch();
  }, [resetDataAndFetch, debouncedSearch]);

  const clearSort = useCallback(() => {
    setSortField(undefined);
    setSortOrder(undefined);
    resetDataAndFetch();
  }, [resetDataAndFetch]);

  const clearExchangeFilter = useCallback(() => {
    setExchangeFilter([]);
    resetDataAndFetch();
  }, [resetDataAndFetch]);

  const handleScroll = useCallback(() => {
    if (!tableContainerRef.current || isFetching || !hasMore || isLoadingMore) return;
    
    try {
      const container = tableContainerRef.current;
      const { scrollTop, clientHeight, scrollHeight } = container;
      
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        setIsLoadingMore(true);
        setOffset(prev => prev + SCREENER_TABLE_PAGINATIONLIMIT);
      }
    } catch (error) {
      console.error('Error handling scroll:', error);
      setIsLoadingMore(false);
    }
  }, [isFetching, hasMore, isLoadingMore]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container || !isExpanded) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isExpanded, handleScroll]);

  const handleExpansionChange = (keys: string | string[]) => {
    const isNowExpanded = Array.isArray(keys) ? keys.includes(screener?.id) : keys === screener?.id;
    
    if (typeof onToggleExpand === 'function') {
      onToggleExpand(screener?.id, isNowExpanded);
    }
    
    if (isNowExpanded) {
      setSearchText('');
      setSearchInput('');
      setSortField('symbol');
      setSortOrder('ascend');
      setExchangeFilter([]);
      setOffset(0);
      setData([]);
      setSelectedRowKeys([]);
      setIsLoadingMore(false);
      setIsInitialLoad(true);
      setRefreshKey(prev => prev + 1);
      debouncedSearch.cancel();
    }
  };

  const handleRetry = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    resetDataAndFetch();
    
    if (typeof onRetry === 'function') {
      onRetry(screener?.id);
    }
  };

  const handleDelete = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (typeof onDelete === 'function') {
      onDelete(screener?.id);
    }
  };

  const handleAddToWatchlist = () => {
    if (!selectedRowKeys || selectedRowKeys.length === 0) {
      message.warning('Please select stocks to add to watchlist');
      return;
    }

    try {
      const selectedRows = data.filter(row => selectedRowKeys.includes(row?.key));
      
      if (selectedRows.length === 0) {
        message.warning('No valid stocks selected');
        return;
      }

      if (typeof onAddToWatchlist === 'function') {
        onAddToWatchlist(selectedRows);
      }
      
      setSelectedRowKeys([]);
      message.success(`${selectedRows.length} stocks added to watchlist`);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      message.error('Failed to add stocks to watchlist');
    }
  };

  const handleLoadMore = () => {
    if (!isFetching && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      setOffset(prev => prev + SCREENER_TABLE_PAGINATIONLIMIT);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      const safeKeys = Array.isArray(keys) ? keys : [];
      setSelectedRowKeys(safeKeys);
    },
    columnWidth: 48,
    fixed: 'left' as const,
    getCheckboxProps: (record: any) => ({
      disabled: !record?.symbol,
    }),
  };

  const getCurrentTotal = () => {
    return screenerData?.total || screener?.total || 0;
  };

  const getDisplayedCount = () => {
    return data?.length || 0;
  };

  if (!screener || !screener.id) {
    return null;
  }

  return (
    <Card
      key={screener.id}
      style={{
        backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
        borderColor: isDarkTheme ? '#374151' : '#e5e7eb',
      }}
    >
      <Collapse
        ghost
        expandIconPosition="left"
        activeKey={isExpanded ? [screener.id] : []}
        onChange={handleExpansionChange}
      >
        <Panel
          header={
            <div className="flex items-center justify-between w-full mr-8">
              <div className="flex-col items-center gap-4 flex-grow">
                <div style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
                  {screener.query || 'Untitled Screener'}
                </div>
                <div className="flex justify-between m-2">
                  <div>
                    <span style={{ 
                      color: isDarkTheme ? '#9ca3af' : '#6b7280', 
                      fontSize: '12px' 
                    }}>
                      Updated {getTimeDifference(screener)}
                    </span>
                    <Tag color="blue" style={{ fontSize: '11px', marginLeft: '8px' }}>
                      {(isFetching && data.length === 0) || isInitialLoad
                        ? 'Loading...'
                        : `${getDisplayedCount()} / ${getCurrentTotal()} results`}
                    </Tag>
                  </div>
                  <div>
                    <Tooltip title="Retry">
                      <Button
                        type="text"
                        size="small"
                        icon={<ReloadOutlined spin={loadingStates?.[screener.id] || isFetching} />}
                        onClick={handleRetry}
                        style={{ color: isDarkTheme ? '#9ca3af' : '#6b7280' }}
                        disabled={isFetching}
                      />
                    </Tooltip>
                    <Tooltip title="Delete Screener">
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDelete}
                        disabled={isFetching}
                      />
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          }
          key={screener.id}
        >
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Dropdown menu={fieldConfigMenu} trigger={['click']}>
                  <Button
                    icon={<SettingOutlined />}
                    style={{
                      backgroundColor: isDarkTheme ? '#374151' : '#f5f5f5',
                      borderColor: isDarkTheme ? '#4b5563' : '#d9d9d9',
                      color: isDarkTheme ? '#ffffff' : '#000000'
                    }}
                  >
                    Configure Fields
                  </Button>
                </Dropdown>
                
                {selectedRowKeys.length > 0 && (
                  <Button
                    type="primary"
                    icon={<StarOutlined />}
                    onClick={handleAddToWatchlist}
                    style={{ backgroundColor: isDarkTheme ? '#2563eb' : '#1890ff' }}
                  >
                    Add to Watchlist ({selectedRowKeys.length})
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {searchText && (
                  <Tag 
                    closable
                    onClose={clearSearch}
                    style={{ padding: '5px' }}
                    color="blue"
                    closeIcon={<CloseOutlined />}
                  >
                    Search: {searchText}
                  </Tag>
                )}
                {(sortField && sortOrder) && (
                  <Tag 
                    closable 
                    onClose={clearSort}
                    style={{ padding: '5px' }}
                    color="green"
                    closeIcon={<CloseOutlined />}
                  >
                    Sort: {sortField.replace(/_/g, ' ')} {sortOrder === 'descend' ? '↓' : '↑'}
                  </Tag>
                )}
                {exchangeFilter && exchangeFilter.length > 0 && (
                  <Tag 
                    closable 
                    onClose={clearExchangeFilter}
                    style={{ padding: '5px' }}
                    color="orange"
                    closeIcon={<CloseOutlined />}
                  >
                    Exchange: {exchangeFilter.join(', ')}
                  </Tag>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <div className="flex gap-2">
                <Search
                  placeholder="Search by stock symbol or exchange..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                  value={searchInput}
                  onSearch={handleSearch}
                  onChange={handleSearchInputChange}
                  style={{
                    backgroundColor: isDarkTheme ? '#374151' : '#ffffff',
                    flex: 1
                  }}
                />
                
                <Select
                  mode="multiple"
                  placeholder="Filter by Exchange"
                  value={exchangeFilter}
                  onChange={handleExchangeFilterChange}
                  style={{ minWidth: '20%' }}
                  allowClear
                  showSearch
                  filterOption={(input, option) => {
                    return String(option?.value ?? '').toLowerCase().includes(input.toLowerCase());
                  }}
                  notFoundContent={
                    availableExchanges.length === 0
                      ? "No exchanges available"
                      : "No matching exchanges"
                  }
                >
                  {availableExchanges.map(exchange => (
                    <Option key={exchange} value={exchange}>
                      {exchange}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>

            <Skeleton active loading={(isFetching && data.length === 0) || isInitialLoad}>
              {error ? (
                <div className="text-center p-4">
                  <Text type="danger">
                    {(error as Error)?.message || 'Error loading data. Please try again.'}
                  </Text>
                  <br />
                  <Button onClick={handleRetry} style={{ marginTop: 8 }}>
                    Retry
                  </Button>
                </div>
              ) : (
                <div 
                  ref={tableContainerRef}
                  style={{
                    maxHeight: 500,
                    overflowY: 'auto',
                    backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff'
                  }}
                >
                  <Table
                    columns={columns}
                    dataSource={data}
                    scroll={{ x: 1200 }}
                    pagination={false}
                    size="small"
                    rowSelection={rowSelection}
                    loading={isFetching && data.length === 0}
                    onChange={handleTableChange}
                    locale={{
                      emptyText: getCurrentTotal() === 0 
                        ? 'No data available' 
                        : 'No results match your filters'
                    }}
                    showSorterTooltip={false}
                  />
                  
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    {isFetching || isLoadingMore ? (
                      <Spin tip="Loading more..." />
                    ) : hasMore ? (
                      <Button 
                        onClick={handleLoadMore}
                        loading={isLoadingMore}
                        type="primary"
                        ghost
                        disabled={isFetching}
                      >
                        Load More ({getDisplayedCount()} of {getCurrentTotal()})
                      </Button>
                    ) : data.length > 0 ? (
                      <Text type="secondary">— No more results —</Text>
                    ) : null}
                  </div>
                </div>
              )}
            </Skeleton>
          </div>
        </Panel>
      </Collapse>
    </Card>
  );
};

export default ScreenerCard;