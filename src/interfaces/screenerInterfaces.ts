export type FieldType = 'currency' | 'percentage' | 'change' | 'number';

export interface ScreenerField {
  key: string;
  title: string;
  type: FieldType;
}