import React from 'react';
import { Button, Tooltip } from 'antd';
import { DesktopOutlined, LineChartOutlined, MessageOutlined } from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import ProfileIcon from '@/components/Profile/ProfileIcon';

import {
  NavigationBarProps
} from '@/interfaces/navigationInterfaces';

export const NavigationBar = (props: NavigationBarProps) => {
  const {
    activeSection,
    visibleSections,
    onSectionToggle
  } = props;

  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';

  const bgColor = isDarkTheme ? '#1A1F2C' : '#ffffff';
  const borderColor = isDarkTheme ? '#3f3f46' : '#e5e7eb';

  const NavButton = ({ 
    icon, 
    label, 
    isVisible, 
    onClick 
  }: { 
    icon: React.ReactNode; 
    label: string; 
    isVisible: boolean;
    onClick: () => void;
  }) => (
    <Tooltip title={ label } placement="right">
      <Button
        type={ isVisible ? 'primary' : 'text' }
        className={
          cn(
            'w-full h-8 mb-1 flex items-center justify-center px-2 transition-all',
            !isVisible && 'opacity-60 hover:opacity-100'
          )
        }
        onClick={ onClick }
      >
        { icon  }
      </Button>
    </Tooltip>
  );

  return (
    <div
      className="flex flex-col border-r w-12"
      style={ { backgroundColor: bgColor, borderColor } }
    >
      <div
        className="p-2 flex justify-center border-b"
        style={ { borderColor } }
      >
        <img
          src="/logo-small.svg"
          alt="ChartChat"
          className="h-6 w-6"
        />
      </div>
      <div className="flex-1 p-2">
        <NavButton
          icon={ <DesktopOutlined /> }
          label="Screener"
          isVisible={ visibleSections.screener  }
          onClick={ () => onSectionToggle('screener') }
        />
        <NavButton
          icon={ <LineChartOutlined /> }
          label="Charts"
          isVisible={ visibleSections.charts  }
          onClick={ () => onSectionToggle('charts') }
        />
        <NavButton
          icon={ <MessageOutlined /> }
          label="Chat"
          isVisible={ visibleSections.chat  }
          onClick={ () => onSectionToggle('chat') }
        />
      </div>
      <div
        className="p-2 border-t"
        style={ { borderColor } }
      >
        <div className="mt-2">
          <ProfileIcon />
        </div>
        <div className="mt-2">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}