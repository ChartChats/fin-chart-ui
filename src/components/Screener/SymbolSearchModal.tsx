import React, { useState, useEffect } from 'react';
import _ from "lodash";
import symbolTypes from "@/mock/symbolTypes.json";
import { useTheme } from '@/contexts/ThemeContext';

import {
  SymbolSearchResult
} from "@/interfaces/screenerInterfaces";

import {
  Modal,
  Input,
  Table,
  Typography,
  Button,
  Tag,
  message,
  Space,
  Spin
} from 'antd';

import {
  SearchOutlined,
  CloseOutlined,
  CheckOutlined
} from '@ant-design/icons';

import { makeApiRequest } from "@/components/TVChart/helpers";

const { Text } = Typography;
const { Column } = Table;

interface SymbolSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAddTicker: (ticker: string) => void;
}

const SymbolSearchModal: React.FC<SymbolSearchModalProps> = (props) => {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  const {
    visible,
    onClose,
    onAddTicker,
  } = props;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(_.head(symbolTypes));
  const [searchResults, setSearchResults] = useState<SymbolSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addedSymbols, setAddedSymbols] = useState<Set<string>>(new Set());

  // Symbol search API call
  const searchSymbols = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const symbolsResponse = await makeApiRequest('stock-search', {
        symbol: query,
        outputsize: 20
      });
      
      const results = (symbolsResponse.data || []).map((item: any, index: number) => ({
        ...item,
        key: `${item.exchange || 'unknown'}-${item.symbol || index}`
      }));
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching symbols:', error);
      message.error('Failed to search symbols. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchSymbols(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Filter search results based on selected filter
  const filteredResults = searchResults.filter(result => 
    selectedFilter.value === 'All' || result.instrument_type === selectedFilter.value
  );

  const handleSymbolSelect = async (record: SymbolSearchResult) => {
    const symbolKey = `${record.exchange}:${record.symbol}`;
    
    // Prevent duplicate additions
    if (addedSymbols.has(symbolKey)) {
      message.info(`${record.symbol} is already added to watchlist`);
      return;
    }

    try {
      // Send to backend with ticker and exchange
      const response = await fetch('/api/watchlist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: record.symbol,
          exchange: record.exchange,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add ticker to watchlist');
      }

      // Call the parent's onAddTicker function
      onAddTicker(symbolKey);
      
      // Add to local state to show it's been added
      setAddedSymbols(prev => new Set([...prev, symbolKey]));
      
      message.success(`${record.symbol} added to watchlist`);
      
      // Auto close modal after 1 second
      setTimeout(() => {
        handleClose();
      }, 1000);
      
    } catch (error) {
      console.error('Error adding ticker:', error);
      message.error('Failed to add ticker to watchlist');
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedFilter(_.head(symbolTypes));
    setSearchResults([]);
    setAddedSymbols(new Set());
    onClose();
  };

  const columns = [
    {
      title: 'Symbol',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 120,
      fixed: 'left' as const,
      render: (symbol: string, record: SymbolSearchResult) => {
        const symbolKey = `${symbol}:${record.exchange}`;
        const isAdded = addedSymbols.has(symbolKey);
        
        return (
          <Space>
            <Text 
              strong 
              style={ { 
                color: isAdded ? '#52c41a' : '#1890ff'
              } }
            >
              { symbol }
            </Text>
            {
              isAdded &&
              <CheckOutlined
                style={ {
                  color: '#52c41a'
                } }
              />
            }
          </Space>
        );
      }
    },
    {
      title: 'Description',
      dataIndex: 'instrument_name',
      key: 'description',
      ellipsis: true,
      render: (description: string) => (
        <Text>
          { description }
        </Text>
      )
    },
    {
      title: 'Type',
      dataIndex: 'instrument_type',
      key: 'type',
      width: 150,
      render: (type: string) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {type}
        </Tag>
      )
    },
    {
      title: 'Exchange',
      dataIndex: 'exchange',
      key: 'exchange',
      width: 100,
      render: (exchange: string) => (
        <Text style={{ color: isDarkTheme ? '#9ca3af' : '#666666' }}>
          {exchange}
        </Text>
      )
    }
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text strong style={{ fontSize: '18px', color: isDarkTheme ? '#ffffff' : '#000000' }}>
            Symbol Search
          </Text>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={handleClose}
            style={ {
              border: 'none',
              boxShadow: 'none'
            } }
          />
        </div>
      }
      open={ visible }
      onCancel={ handleClose }
      footer={ null }
      width={ 900 }
      style={ {
        borderRadius: '8px',
      } }
      closable={false}
    >
      {/* Search Input */}
      <div style={ { marginBottom: '16px' } }>
        <Input
          placeholder="Search symbols (e.g., AAPL, Tesla, etc.)..."
          prefix={ <SearchOutlined /> }
          value={ searchQuery }
          onChange={ (e) => setSearchQuery(e.target.value) }
          size="large"
          style={{ 
            backgroundColor: isDarkTheme ? '#374151' : '#ffffff',
            borderColor: isDarkTheme ? '#4b5563' : '#d9d9d9',
            color: isDarkTheme ? '#ffffff' : '#000000'
          }}
        />
      </div>

      <div style={ { marginBottom: '16px' } }>
        <Text 
          strong 
          style={ { 
            display: 'block', 
            marginBottom: '8px',
            color: isDarkTheme ? '#ffffff' : '#000000'
          } }
        >
          Filter by Asset Type:
        </Text>
        <div
          style={ {
            maxHeight: '120px',
            overflowY: 'auto'
            } }
          >
          <Space wrap size={ [8, 8] }>
            {
              _.map(symbolTypes, (filter) => {
                const {
                  name: filterName,
                  value: filterValue
                } = filter;

                return (
                  <Tag
                    key={ filter.value }
                    color={ selectedFilter.value === filterValue ? 'blue' : 'default' }
                    style={ {
                      cursor: 'pointer',
                      backgroundColor: selectedFilter.value === filterValue 
                        ? '#1890ff' 
                        : isDarkTheme ? '#374151' : '#f5f5f5',
                      color: selectedFilter.value === filterValue 
                        ? '#ffffff' 
                        : isDarkTheme ? '#ffffff' : '#000000',
                      borderColor: selectedFilter.value === filterValue 
                        ? '#1890ff' 
                        : isDarkTheme ? '#4b5563' : '#d9d9d9'
                    } }
                    onClick={ () => setSelectedFilter(filter) }
                  >
                    { filterName }
                  </Tag>
                );
              })
            }
          </Space>
        </div>
      </div>

      <div
        style={ { minHeight: '400px' } }>
        {!searchQuery ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: isDarkTheme ? '#9ca3af' : '#666666'
          }}>
            <SearchOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <div style={{ fontSize: '16px' }}>Start typing to search for symbols</div>
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
              Try searching for "AAPL", "Tesla", "Microsoft", etc.
            </div>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredResults}
            loading={isLoading}
            scroll={{ 
              x: 'max-content',
              y: 400
            }}
            size="middle"
            pagination={ false }
            style={{ 
              backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff'
            }}
            rowKey="key"
            onRow={(record) => ({
              onClick: () => handleSymbolSelect(record),
              style: { 
                cursor: 'pointer',
                backgroundColor: addedSymbols.has(`${record.exchange}:${record.symbol}`) 
                  ? (isDarkTheme ? '#1f4e1f' : '#f6ffed')
                  : 'transparent'
              }
            })}
            rowHoverable={ true }
            locale={{
              emptyText: searchQuery ? (
                <div style={{ padding: '40px', color: isDarkTheme ? '#9ca3af' : '#666666' }}>
                  <SearchOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
                  <div>No symbols found for "{searchQuery}"</div>
                  <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                    Try different keywords or check spelling
                  </div>
                </div>
              ) : 'No data'
            }}
          />
        )}
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        backgroundColor: isDarkTheme ? '#374151' : '#f8f9fa',
        borderRadius: '6px',
        fontSize: '12px',
        color: isDarkTheme ? '#9ca3af' : '#666666'
      }}>
        💡 <strong>Tip:</strong> Click on any row to add the symbol to your watchlist. 
        Use filters above to narrow down results by asset type.
      </div>
    </Modal>
  );
};

export default SymbolSearchModal;