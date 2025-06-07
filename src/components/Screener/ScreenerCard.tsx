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
} from 'antd';

import {
  useGetScreenerQuery,
} from '@/store/apis/screenerApis';

import {
  SettingOutlined,
  ReloadOutlined,
  DeleteOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Panel } = Collapse;

// Separate component for each screener card to handle individual data fetching
const ScreenerCard = (props) => {

  const { 
  screener,
  isExpanded,
  onToggleExpand,
  onRetry,
  onDelete,
  loadingStates,
  columns,
  fieldConfigMenu,
  getTimeDifference,
  isDarkTheme
} = props;

  // Only fetch data when this specific screener is expanded
  const { data: screenerData, isLoading, error, refetch } = useGetScreenerQuery(screener.id, {
    skip: !isExpanded // Skip the query if not expanded
  });

  const getProcessedData = () => {
    if (!screenerData?.records) return [];
    return screenerData.records.map((item, index) => {
      const changePercent = item.open !== 0 ? ((item.close - item.open) / item.open) * 100 : 0;
      const prevClose = item.open;
      return {
        ...item,
        key: `${screener.id}-${index}`, // Unique key per screener
        price_change_1d_percent: changePercent,
        prev_close: prevClose
      };
    });
  };

  const processedData = getProcessedData();

  const handleRetry = (e) => {
    e.stopPropagation();
    onRetry(screener.id);
    refetch(); // Refetch the actual data
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(screener.id);
  };

  const handleExpansionChange = (keys: string[]) => {
    const isNowExpanded = keys.includes(screener.id);
    onToggleExpand(screener.id, isNowExpanded);
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
                  scroll={{ x: 1200 }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                    showQuickJumper: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
                  }}
                  size="small"
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