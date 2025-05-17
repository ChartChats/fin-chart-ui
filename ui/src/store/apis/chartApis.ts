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
}

export interface PlotIndicatorPayload {
  action_type: 'plot_indicator';
  ticker: string;
  from_date: string;
  to_date: string;
  interval: string;
  exchange: string;
  description: string;
  indicators: {
    name: string;
    value: string;
    properties: Record<string, string>;
  }[];
}

const chartApi = createApi({
  reducerPath: 'chart',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
  }),
  tagTypes: ['Chart'],
  endpoints: (builder) => ({
    getCharts: builder.query({
      query: () => '/charts',
      providesTags: ['Chart']
    }),
    plotIndicator: builder.mutation({
      query: (payload: PlotIndicatorPayload) => ({
        url: '/charts/plot-indicator',
        method: 'POST',
        body: payload,
      }),
      // This would normally invalidate the charts query to refresh the list
      invalidatesTags: ['Chart']
    }),
  }),
});

export const {
  useGetChartsQuery,
  usePlotIndicatorMutation,
} = chartApi;

export { chartApi };