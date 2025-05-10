import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import axiosInstance from '../services/axios';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: axiosInstance.defaults.baseURL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Add your endpoints here
    // Example:
    // getCharts: builder.query<Chart[], void>({
    //   query: () => 'charts',
    // }),
  }),
});

// Export hooks for usage in components
// export const { useGetChartsQuery } = api; 