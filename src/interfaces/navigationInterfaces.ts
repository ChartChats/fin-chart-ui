
export interface NavigationBarProps {
  activeSection: 'screener' | 'charts' | 'chat';
  visibleSections: {
    screener: boolean;
    charts: boolean;
    chat: boolean;
  };
  onSectionToggle: (section: 'screener' | 'charts' | 'chat') => void;
}

export interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isVisible: boolean;
  onClick: () => void;
}