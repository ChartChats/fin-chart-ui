export type FieldType = 'currency' | 'percentage' | 'change' | 'number';

export interface ScreenerField {
  key: string;
  title: string;
  type: FieldType;
}

export interface ScreenerData {
  query: string;
  records: any[];
  createdAt: string;
  updatedAt: string;
  id?: string;
}