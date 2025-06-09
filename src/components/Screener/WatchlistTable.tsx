import React, { useState, useEffect, useRef } from 'react';

import { 
  Table, 
  Button, 
  Typography, 
  Space, 
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import Sortable from 'sortablejs';
import { WatchlistTableProps } from "@/interfaces/screenerInterfaces";
import SymbolSearchModal from "@/components/Screener/SymbolSearchModal";

const { Text } = Typography;

const WatchlistTable = (props: WatchlistTableProps) => {
  const {
    watchlistData,
    onAddTicker,
    onRemoveFromWatchlist,
    isDarkTheme,
    columns
  } = props;

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [dataSource, setDataSource] = useState(watchlistData);
  
  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const tableRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);
  const tableBodyRef = useRef<HTMLElement | null>(null);

  // Only update dataSource if watchlistData truly changes
  useEffect(() => {
    setDataSource(watchlistData);
  }, [watchlistData.map(d => d.key).join(',')]); // Avoid unnecessary re-renders

  useEffect(() => {
    if (tableRef.current && !sortableRef.current) {
      tableBodyRef.current = tableRef.current.querySelector('.ant-table-tbody');
      
      if (tableBodyRef.current) {
        sortableRef.current = new Sortable(tableBodyRef.current, {
          animation: 150,
          handle: '.drag-handle',
          filter: '.ant-table-placeholder',
          preventOnFilter: false,
          onEnd: ({ oldIndex, newIndex }) => {
            if (
              oldIndex !== undefined &&
              newIndex !== undefined &&
              oldIndex !== newIndex &&
              oldIndex >= 0 &&
              newIndex >= 0 &&
              oldIndex < dataSource.length &&
              newIndex < dataSource.length
            ) {
              const newData = [...dataSource];
              const [movedItem] = newData.splice(oldIndex, 1);
              newData.splice(newIndex, 0, movedItem);
              setDataSource(newData);
            }
          },
        });
      }
    }

    return () => {
      sortableRef.current?.destroy();
      sortableRef.current = null;
    };
  }, []); // Init once on mount

  const handleAddTicker = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const handleTickerAdded = (ticker: string) => {
    onAddTicker(ticker);
  };

  const onSelectChange = (newSelectedRowKeys: string[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    columnWidth: 48,
    fixed: 'left' as const,
  };

  const handleBulkDelete = () => {
    onRemoveFromWatchlist(selectedRowKeys);
    setSelectedRowKeys([]);
  };

  const hasSelected = selectedRowKeys.length > 0;

  const tableColumns = [
    {
      title: '',
      key: 'drag',
      width: 40,
      fixed: 'left',
      render: () => (
        <span className="drag-handle" style={{ cursor: 'move' }}>
          <MoreOutlined style={{ color: '#999' }} />
        </span>
      ),
    },
    ...columns.map((col, index) => ({
      ...col,
      fixed: index === 0 ? 'left' : false,
      width: col.width || (
        col.key === 'stock' ? 200 :
        col.key === 'ticker' ? 100 :
        col.key === 'name' ? 200 :
        col.key === 'price' ? 120 :
        col.key === 'change' ? 120 :
        col.key === 'changePercent' ? 120 :
        col.key === 'volume' ? 120 :
        col.key === 'marketCap' ? 140 :
        120
      ),
    }))
  ];

  return (
    <>
      <div 
        ref={tableRef}
        style={{ 
          marginBottom: '24px',
          maxHeight: '40vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto'
        }}
      >
        <div
          style={ { 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px',
            flexShrink: 0
          } }
        >
          <Text strong style={{ fontSize: '20px', color: isDarkTheme ? '#ffffff' : '#000000' }}>
            <span className="align-middle">
              <span className="mx-2">
                Watchlist
              </span>
              <span className="mx-2">
                ( { watchlistData.length } )
              </span>
            </span>
            {
              hasSelected &&
              <span style={{ marginLeft: 8, fontSize: '16px' }}>
                <Popconfirm
                  title={ `Delete ${selectedRowKeys.length} items?` }
                  onConfirm={handleBulkDelete}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                  >
                    Delete {selectedRowKeys.length} items
                  </Button>
                </Popconfirm>
              </span>
            }
          </Text>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddTicker}
            >
              Add Ticker
            </Button>
          </Space>
        </div>
        
        <Table
          columns={tableColumns}
          dataSource={dataSource}
          scroll={{ 
            x: 'max-content',
            y: 'calc(40vh - 100px)'
          }}
          size="small"
          pagination={false}
          style={{ 
            backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
            flex: 1,
            overflow: 'hidden'
          }}
          rowKey="key"
          rowSelection={rowSelection}
        />
      </div>

      <SymbolSearchModal
        visible={ isModalVisible }
        onClose={ handleModalClose }
        onAddTicker={ handleTickerAdded }
      />
    </>
  );
};

export default WatchlistTable;