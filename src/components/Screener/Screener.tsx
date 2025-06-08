import React, { useState, useMemo, useEffect } from 'react';
import _ from 'lodash';
import { useTheme } from "@/contexts/ThemeContext";
import ScreenerDashboard from "@/components/Screener/ScreenerDashboard";

import {
  Checkbox,
  Typography,
  Modal
} from 'antd';

import {
  useGetScreenersQuery,
  useRemoveScreenerMutation
} from '@/store/apis/screenerApis';

import {
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';

import {
  defaultFields,
  availableCustomFields
} from '@/utils/AppConstants';

const { Text, Title } = Typography;

const Screener = () => {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  const { data: screeners, isLoading: isLoadingScreeners } = useGetScreenersQuery();
  
  // Track expanded screeners
  const [expandedScreeners, setExpandedScreeners] = useState<string[]>(() => {
    const stored = localStorage.getItem('expandedScreeners');
    return stored ? JSON.parse(stored) : [];
  });

  const [selectedScreenerId, setSelectedScreenerId] = useState<string | null>(() => {
    const stored = localStorage.getItem('selectedScreenerId');
    if (stored && screeners?.some(s => s.id === stored)) {
      return stored;
    }
    return null;
  });

  const [isScreenerExpanded, setIsScreenerExpanded] = useState(() => {
    const stored = localStorage.getItem('screenerSectionExpanded');
    return stored ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    if (selectedScreenerId) {
      localStorage.setItem('selectedScreenerId', selectedScreenerId);
      // When a screener is selected, ensure it's in the expanded list
      if (!expandedScreeners.includes(selectedScreenerId)) {
        setExpandedScreeners(prev => [...prev, selectedScreenerId]);
      }
      setIsScreenerExpanded(true);
      
      // Ensure screener section is visible
      const visibleSections = JSON.parse(localStorage.getItem('visibleSections') || '{}');
      if (!visibleSections.screener) {
        visibleSections.screener = true;
        localStorage.setItem('visibleSections', JSON.stringify(visibleSections));
        window.dispatchEvent(new CustomEvent('sectionVisibilityChanged', { detail: { screener: true } }));
      }
    } else {
      localStorage.removeItem('selectedScreenerId');
    }
  }, [selectedScreenerId, expandedScreeners]);

  // Save expanded screeners to localStorage
  useEffect(() => {
    localStorage.setItem('expandedScreeners', JSON.stringify(expandedScreeners));
  }, [expandedScreeners]);

  // Save screener section expansion state
  useEffect(() => {
    localStorage.setItem('screenerSectionExpanded', JSON.stringify(isScreenerExpanded));
  }, [isScreenerExpanded]);

  // Listen for new screener events
  useEffect(() => {
    const handleNewScreener = (event: CustomEvent) => {
      const { screenerId } = event.detail;
      if (screenerId) {
        setSelectedScreenerId(screenerId);
        setIsScreenerExpanded(true);
        
        // Ensure screener section is visible
        const visibleSections = JSON.parse(localStorage.getItem('visibleSections') || '{}');
        if (!visibleSections.screener) {
          visibleSections.screener = true;
          localStorage.setItem('visibleSections', JSON.stringify(visibleSections));
          window.dispatchEvent(new CustomEvent('sectionVisibilityChanged', { detail: { screener: true } }));
        }
      }
    };

    window.addEventListener('newScreenerGenerated', handleNewScreener as EventListener);
    return () => {
      window.removeEventListener('newScreenerGenerated', handleNewScreener as EventListener);
    };
  }, []);
  
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCustomFields, setSelectedCustomFields] = useState([
    'volume', 'trailing_pe', 'rsi', 'beta'
  ]);

  const [deleteScreenerMutation] = useRemoveScreenerMutation();

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

  const handleRetry = (screenerId: string) => {
    setLoadingStates(prev => ({ ...prev, [screenerId]: true }));
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [screenerId]: false }));
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
      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ minHeight: 0 }}>
        <ScreenerDashboard
          screeners={screeners || []}
          loadingStates={loadingStates}
          columns={columns}
          fieldConfigMenu={fieldConfigMenu}
          getTimeDifference={getTimeDifference}
          isDarkTheme={isDarkTheme}
          onRetry={handleRetry}
          onDelete={(screenerId) => {
            Modal.confirm({
              title: 'Delete Screener',
              content: 'Are you sure you want to delete this screener?',
              okText: 'Delete',
              cancelText: 'Cancel',
              okButtonProps: { danger: true },
              onOk: () => {
                deleteScreenerMutation(screenerId);
              }
            });
          }}
          onToggleExpand={(screenerId, isExpanded) => {
            if (isExpanded) {
              setExpandedScreeners(prev => [...prev, screenerId]);
              setSelectedScreenerId(screenerId);
              setIsScreenerExpanded(true);
            } else {
              setExpandedScreeners(prev => prev.filter(id => id !== screenerId));
              if (selectedScreenerId === screenerId) {
                setSelectedScreenerId(null);
              }
            }
          }}
          expandedScreeners={expandedScreeners}
        />
      </div>
    </div>
  );
};

export default Screener;