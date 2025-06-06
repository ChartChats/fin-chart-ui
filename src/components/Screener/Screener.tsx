import React, { useState, useMemo, useEffect } from 'react';
import _ from 'lodash';
import { useTheme } from "@/contexts/ThemeContext";

import {
  Table,
  Card,
  Button,
  Dropdown,
  Checkbox,
  Tag,
  Typography,
  Tooltip,
  Spin,
  Collapse,
  Empty
} from 'antd';

import {
  useGetScreenersQuery,
  useGetScreenerQuery
} from '@/store/apis/screenerApis';

import {
  SettingOutlined,
  RiseOutlined,
  FallOutlined,
  ReloadOutlined
} from '@ant-design/icons';

import {
  defaultFields,
  availableCustomFields
} from '@/utils/AppConstants';

const { Text, Title } = Typography;
const { Panel } = Collapse;

const Screener = () => {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  const { data: screeners, isLoading: isLoadingScreeners } = useGetScreenersQuery();
  const [selectedScreenerId, setSelectedScreenerId] = useState<string | null>(null);
  
  const { 
    data: selectedScreenerData,
    isLoading: isLoadingScreenerData 
  } = useGetScreenerQuery(selectedScreenerId ?? '', {
    skip: !selectedScreenerId
  });

  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCustomFields, setSelectedCustomFields] = useState([
    'volume', 'trailing_pe', 'rsi', 'beta'
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getTimeDifference = (screener) => {
    const updatedAtDate = new Date(screener.updatedAt);
    const diffMs = currentTime.getTime() - updatedAtDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return "just now";
    if (diffMinutes === 1) return "1 minute ago";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  };

  const processedData = useMemo(() => {
    if (!selectedScreenerData?.records) return [];
    return selectedScreenerData.records.map((item, index) => {
      const changePercent = item.open !== 0 ? ((item.close - item.open) / item.open) * 100 : 0;
      const prevClose = item.open;
      return {
        ...item,
        key: index,
        price_change_1d_percent: changePercent,
        prev_close: prevClose
      };
    });
  }, [selectedScreenerData]);

  const handleRetry = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const formatValue = (value, type) => {
    if (value === '' || value === null || value === undefined) return '-';
    switch (type) {
      case 'currency': return `$${Number(value).toFixed(2)}`;
      case 'percentage': return `${Number(value).toFixed(2)}%`;
      case 'change': {
        const change = Number(value).toFixed(2);
        return Number(change) >= 0 ? `+${change}` : `${change}`;
      }
      case 'number': return Number(value).toFixed(2);
      default: return value;
    }
  };

  const getChangeColor = (value) => {
    if (value > 0) return '#52c41a';
    if (value < 0) return '#ff4d4f';
    return isDarkTheme ? '#d9d9d9' : '#666666';
  };

  const renderChangeValue = (value, type) => {
    const numValue = Number(value);
    const color = getChangeColor(numValue);
    const icon = numValue > 0 ? <RiseOutlined /> : numValue < 0 ? <FallOutlined /> : null;
    return <span style={{ color }}>{icon} {formatValue(value, type)}</span>;
  };

  const columns = [
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      fixed: true as const,
      width: 120,
      render: (text) => (
        <Text strong style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}>
          {text}
        </Text>
      )
    },
    ...defaultFields.map(field => ({
      title: field.title,
      dataIndex: field.key,
      key: field.key,
      width: 100,
      render: (value) => {
        if (field.type === 'change' || field.type === 'percentage') {
          return renderChangeValue(value, field.type);
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
      return {
        title: field.title,
        dataIndex: field.key,
        key: field.key,
        width: 120,
        render: (value) => (
          <span style={{ color: isDarkTheme ? '#d9d9d9' : '#666666' }}>
            {formatValue(value, field.type)}
          </span>
        )
      };
    })
  ];

  const fieldConfigMenu = {
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

  return (
    <div className="screener-container h-full w-full flex flex-col">
      <div
        className="p-4 border-b border-gray-300 flex-shrink-0"
        style={{
          background: isDarkTheme ? '#1f2937' : '#ffffff'
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Stock Screener
        </Title>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ minHeight: 0 }}>
        <div className="space-y-4 py-4">
          {
            isLoadingScreeners
              ? (
                  <div className="flex justify-center p-8">
                    <Spin size="large" tip="Loading screeners..." />
                  </div>
                )
              : !screeners?.length
                ? (
                    <div className="flex-col justify-center p-8">
                      <Empty description="No screeners found" />
                    </div>
                  )
                : (
                    _.map(screeners, (screener) => (
                      <Card
                        key={screener.id}
                        style={{
                          backgroundColor: isDarkTheme ? '#1f2937' : '#ffffff',
                          borderColor: isDarkTheme ? '#374151' : '#e5e7eb',
                        }}
                        bodyStyle={{ padding: '16px' }}
                      >
                        <Collapse
                          ghost
                          expandIconPosition="left"
                          style={{ margin: 0 }}
                          onChange={(keys) => {
                            if (keys.includes(screener.id)) {
                              setSelectedScreenerId(screener.id);
                            } else {
                              setSelectedScreenerId(null);
                            }
                          }}
                        >
                          <Panel header={screener.query} key={screener.id}>
                            <div className="flex flex-col space-y-4">
                              <div className="flex items-center">
                                <Text
                                  style={{
                                    color: isDarkTheme ? '#9ca3af' : '#6b7280',
                                    fontSize: '12px'
                                  }}
                                >
                                  Data updated {getTimeDifference(screener)}
                                </Text>
                                <Tag
                                  color="blue"
                                  style={{
                                    marginLeft: '12px',
                                    fontSize: '11px'
                                  }}
                                >
                                  {processedData.length} results
                                </Tag>
                                <Tooltip title="Retry">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<ReloadOutlined spin={loading} />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRetry();
                                    }}
                                    style={{
                                      marginLeft: '12px',
                                      color: isDarkTheme ? '#9ca3af' : '#6b7280',
                                      width: '24px',
                                      height: '24px'
                                    }}
                                  />
                                </Tooltip>
                              </div>

                              <div className="flex justify-between items-center">
                                <h3
                                  className="text-lg font-medium mb-0"
                                  style={{ color: isDarkTheme ? '#ffffff' : '#000000' }}
                                >
                                  Stock Screener Results
                                </h3>
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

                              <Spin spinning={loading} tip="Refreshing...">
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
                              </Spin>
                            </div>
                          </Panel>
                        </Collapse>
                      </Card>
                    )
                  )
                )
          }
        </div>
      </div>
    </div>
  );
};

export default Screener;