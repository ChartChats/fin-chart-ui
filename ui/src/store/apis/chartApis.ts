import {
  createApi,
} from "@reduxjs/toolkit/query/react";

import {
  ChartData
} from "@/interfaces/chartInterfaces";

import {
  clientBaseQuery
} from '@/store/clientBaseQuery';

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
  baseQuery: clientBaseQuery,
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