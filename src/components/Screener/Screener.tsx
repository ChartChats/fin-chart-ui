import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import { useTheme } from "@/contexts/ThemeContext";
import ScreenerDashboard from "@/components/Screener/ScreenerDashboard";

import {
  Modal
} from 'antd';

import {
  useGetScreenersQuery,
  useRemoveScreenerMutation
} from '@/store/apis/screenerApis';

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

  const [deleteScreenerMutation] = useRemoveScreenerMutation();

  const handleRetry = (screenerId: string) => {
    setLoadingStates(prev => ({ ...prev, [screenerId]: true }));
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [screenerId]: false }));
    }, 2000);
  };

  return (
    <div className="screener-container h-full w-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ minHeight: 0 }}>
        <ScreenerDashboard
          screeners={ screeners || [] }
          loadingStates={loadingStates}
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