import _ from 'lodash';

import {
  ChartPatternProps
} from '@/interfaces/chartInterfaces';

export const getChartPatternFunction = (pattern: ChartPatternProps): string => {
  // 4 functions to choose from -> createShape, createMultipointShape, createExecutionShape and createAnchoredShape
  const shape = pattern.shape;

  // for createShape
  if (shape === 'Label' || shape === 'Triangle_symbol' || shape === 'Horizontal_Line') {
    return 'createShape';
  }

  // rest for other options -> createMultipointShape
  return 'createMultipointShape';
};

export const getShapeMap = {
  "Label": "text",
  "Circle": "circle",
  "Horizontal_Line": "horizontal_line",
  "Trend_Line": "trend_line",
  "Rectangle": "rectangle",
  "Triangle_Symbol_up": "arrow_up",
  "Triangle_Symbol_down": "arrow_down",
};

export const colorMap = {
  "orange": "rgb(255, 153, 0)",
  "blue": "rgb(51, 153, 255)",
  "white": "rgb(255, 255, 255)",
  "green": "rgb(0, 204, 0)",
  "red": "rgb(255, 0, 0)",
  "lime": "rgb(153, 255, 51)",
  "purple": "rgb(153, 0, 255)",
  "magenta": "rgb(255, 0, 255)",
}