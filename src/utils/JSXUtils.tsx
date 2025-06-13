import React from 'react';

import {
  formatValue
} from '@/utils/AppUtils';

import {
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';

const getChangeColor = (value, isDarkTheme) => {
  if (value > 0) return '#52c41a';
  if (value < 0) return '#ff4d4f';
  return isDarkTheme ? '#d9d9d9' : '#666666';
};

export const renderChangeValue = (value, type, isDarkTheme) => {
  const numValue = Number(value);
  const color = getChangeColor(numValue, isDarkTheme);
  const icon = numValue > 0
    ? <RiseOutlined />
    : numValue < 0
      ? <FallOutlined />
      : null;

  return (
    <span
      style={{ color }}
    >
      { icon  }
      { formatValue(value, type) }
    </span>
  );
};