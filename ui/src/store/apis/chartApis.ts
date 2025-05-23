import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'candlestick' | 'area';
  title: string;
  symbol: string;
  timeframe: string;
  exchange: string;
  description: string;
  data: any[];
  date_from: string;
  date_to: string;
  indicators?: Array<{
    name: string;
    value: string;
    properties: Record<string, string>;
  }>;
}

export interface ChartActionResponse {
  action_type: string;
  message?: string;
  ticker?: string;
  from_date?: string;
  to_date?: string;
  interval?: string;
  exchange?: string;
  description?: string;
  data?: any[];
  indicators?: Array<{
    name: string;
    value: string;
    properties: Record<string, string>;
  }>;
}

// Default chart configuration
export const DEFAULT_CHART_CONFIG = {
  type: 'line' as const,
  title: 'New Chart',
  symbol: '',
  timeframe: 'daily',
  exchange: '',
  description: 'Empty chart',
  data: []
};

export const chartApi = createApi({
  reducerPath: 'chartApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
  }),
  tagTypes: ['Charts'],
  endpoints: (builder) => ({
    getChart: builder.query<ChartData, string>({
      query: (id) => `/chart/${id}`,
      providesTags: ['Charts']
    }),

    getCharts: builder.query<ChartData[], void>({
      query: () => '/chart',
      providesTags: ['Charts']
    }),
    
    addChart: builder.mutation<ChartData, ChartData>({
      query: (chart) => ({
        url: '/chart',
        method: 'POST',
        body: {
          ...DEFAULT_CHART_CONFIG,
          ...chart
        }
      }),
      invalidatesTags: ['Charts']
    }),
    
    removeChart: builder.mutation<void, string>({
      query: (id) => ({
        url: `/chart/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Charts']
    }),
    
    updateChart: builder.mutation<ChartData, { id: string, data: Partial<ChartData> }>({  
      query: ({ id, data }) => ({
        url: `/chart/${id}`,
        method: 'PATCH',
        body: { data }  // Wrap the data in a data property
      }),
      invalidatesTags: ['Charts']
    })
  }),
});

export const {
  useGetChartsQuery,
  useGetChartQuery,
  useAddChartMutation,
  useRemoveChartMutation,
  useUpdateChartMutation
} = chartApi;