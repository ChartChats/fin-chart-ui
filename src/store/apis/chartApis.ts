import axios from '@/store/client';
import _ from 'lodash';

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
      queryFn: async (chartId, { dispatch }) => {
        try {
          const response = await axios.get(`/user/charts/${chartId}`);
          return {
            data: response.data[chartId]
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Failed to create chart'
            }
          };
        }
      },
      keepUnusedDataFor: 0, // Immediately remove from cache when unused
      providesTags: (result, error, chartId) => result
        ? [{ type: 'Charts', id: chartId }]
        : ['Charts'],
    }),

    getCharts: builder.query<ChartData[], void>({
      queryFn: async (chart, { dispatch }) => {
        try {
          const response = await axios.get('/user/charts');
          return {
            data: _.map(response.data.charts, chart => chart[1])
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Failed to create chart'
            }
          };
        }
      },
      providesTags: ['Charts'],
    }),
    
    addChart: builder.mutation<ChartData, ChartData>({
      queryFn: async (chart, { dispatch }) => {
        try {
          const chartId = chart.id;
          const chartPayload = {
            "chart_data": {
              ...DEFAULT_CHART_CONFIG,
              ...chart,
            }
          };
          const response = await axios.post(`/user/charts/${chartId}`, chartPayload);
          return {
            data: response.data
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Failed to create chart'
            }
          };
        }
      },
      invalidatesTags: ['Charts']
    }),
    
    removeChart: builder.mutation<void, string>({
      query: (id) => ({
        url: `/user/charts/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Charts']
    }),
    
    updateChart: builder.mutation<ChartData, { id: string, data: Partial<ChartData> }>({  
      queryFn: async ({ id, data }, { dispatch }) => {
        try {
          const response = await axios.post(`/user/charts/${id}`, {
            "chart_data": {
              id,
              ...data
            }
          });
          return {
            data: response.data
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Failed to update chart'
            }
          };
        }
      },
      invalidatesTags: ['Charts']
    }),
  }),
});

export const {
  useGetChartsQuery,
  useGetChartQuery,
  useAddChartMutation,
  useRemoveChartMutation,
  useUpdateChartMutation
} = chartApi;