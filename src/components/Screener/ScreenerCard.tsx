import React from 'react';
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
} from 'antd';

import {
  useGetScreenerQuery,
} from '@/store/apis/screenerApis';

import {
  SettingOutlined,
  ReloadOutlined,
  DeleteOutlined,
  StarOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Panel } = Collapse;

const ScreenerCard = (props) => {
  const { 
    screener,
    isExpanded,
    onToggleExpand,
    onRetry,
    onDelete,
    onAddToWatchlist,
    loadingStates,
    columns,
    fieldConfigMenu,
    getTimeDifference,
    isDarkTheme
  } = props;

  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);

  const { data: screenerData, isLoading, error, refetch } = useGetScreenerQuery(screener.id, {
    skip: !isExpanded
  });

  const getProcessedData = () => {
    if (!screenerData?.records) return [];
    return screenerData.records.map((item, index) => {
      const changePercent = item.open !== 0 ? ((item.close - item.open) / item.open) * 100 : 0;
      const prevClose = item.open;
      return {
        ...item,
        key: `${screener.id}-${index}`,
        price_change_1d_percent: changePercent,
        prev_close: prevClose
      };
    });
  };

  const processedData = getProcessedData();

  const handleRetry = (e) => {
    e.stopPropagation();
    onRetry(screener.id);
    refetch();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(screener.id);
  };

  const handleExpansionChange = (keys) => {
    const isNowExpanded = keys.includes(screener.id);
    onToggleExpand(screener.id, isNowExpanded);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    columnWidth: 48,
    fixed: 'left' as const,
  };

  const handleAddToWatchlist = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select stocks to add to watchlist');
      return;
    }

    const selectedRows = processedData.filter(row => 
      selectedRowKeys.includes(row.key)
    );
    
    console.log('Selected stocks for watchlist:', selectedRows);
    onAddToWatchlist(selectedRows);
    setSelectedRowKeys([]);
    message.success(`${selectedRows.length} stocks added to watchlist`);
  };

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
        style={{ margin: 0 }}
        activeKey={isExpanded ? [screener.id] : []}
        onChange={handleExpansionChange}
      >
        <Panel 
          header={
            <div className="flex items-center justify-between w-full mr-8">
              <div className="flex-col items-center gap-4 flex-grow">
                <div
                  style={{
                    color: isDarkTheme ? '#ffffff' : '#000000',
                    flex: 1
                  }}
                >
                  {screener.query}
                </div>
                <div className="flex justify-between m-2">
                  <div>
                    <span
                      style={{
                        color: isDarkTheme ? '#9ca3af' : '#6b7280',
                        fontSize: '12px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Updated {getTimeDifference(screener)}
                    </span>
                    <Tag
                      color="blue"
                      style={{
                        fontSize: '11px',
                        marginLeft: '8px'
                      }}
                    >
                      {
                        isLoading
                          ? 'Loading...'
                          : processedData && processedData.length === 0
                            ? 'Click to view results'
                            : `${processedData.length} results`
                      }
                    </Tag>
                  </div>
                  <div>
                    <Tooltip title="Retry">
                      <Button
                        type="text"
                        size="small"
                        icon={<ReloadOutlined spin={loadingStates[screener.id] || isLoading} />}
                        onClick={handleRetry}
                        style={{
                          color: isDarkTheme ? '#9ca3af' : '#6b7280',
                          width: '24px',
                          height: '24px'
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Delete Screener">
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleDelete}
                        style={{
                          width: '24px',
                          height: '24px'
                        }}
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
                <Dropdown
                  menu={fieldConfigMenu}
                  trigger={['click']}
                  placement="bottomRight"
                >
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
                    style={{
                      backgroundColor: isDarkTheme ? '#2563eb' : '#1890ff',
                    }}
                  >
                    Add to Watchlist ({selectedRowKeys.length})
                  </Button>
                )}
              </div>
            </div>

            <Spin spinning={loadingStates[screener.id] || isLoading} tip="Loading data...">
              {error ? (
                <div className="text-center p-4">
                  <Text type="danger">Error loading data. Please try again.</Text>
                </div>
              ) : (
                <Table
                  columns={columns}
                  dataSource={processedData}
                  scroll={{ x: 1200, y: 500 }}
                  pagination={false}
                  size="small"
                  rowSelection={rowSelection}
                  style={{ backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff' }}
                  className={isDarkTheme ? 'dark-theme-table' : ''}
                />
              )}
            </Spin>
          </div>
        </Panel>
      </Collapse>
    </Card>
  );
};

export default ScreenerCard;