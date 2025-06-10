import axios from '@/store/client';
import _ from 'lodash';
import { v4 as uuid4 } from 'uuid';

import {
  createApi,
} from "@reduxjs/toolkit/query/react";

import {
  ScreenerData,
  ScreenerTickerProps
} from "@/interfaces/screenerInterfaces";

import {
  clientBaseQuery
} from '@/store/clientBaseQuery';

export const watchlistApi = createApi({
  reducerPath: 'WatchlistApi',
  baseQuery: clientBaseQuery,
  tagTypes: ['Watchlist'],
  endpoints: (builder) => ({

    getWatchlist: builder.query<ScreenerTickerProps[], void>({
      queryFn: async (_, { dispatch }) => {
        try {
          const response = await axios.get(`/user/watchlist`);
          // Return data in the correct format
          return { data: response.data.watchlist };
        } catch (error) {
          console.error('getWatchlist error:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Failed to fetch watchlist'
            }
          };
        }
      },
      providesTags: ['Watchlist']
    }),
    
    addToWatchlist: builder.mutation<ScreenerTickerProps[], any>({
      queryFn: async (symbols, { dispatch }) => {
        try {
          const response = await axios.post(`/user/watchlist`, {
            "symbols_data": symbols
          });
          // Return data in the correct format
          return { data: response.data };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Failed to add to watchlist'
            }
          };
        }
      },
      invalidatesTags: ['Watchlist']
    }),
    
    removeFromWatchlist: builder.mutation<void, string[]>({
      query: (ids: string[]) => ({
        url: `/user/watchlist?${ids.map(id => `symbols=${encodeURIComponent(id)}`).join('&')}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Watchlist']
    }),

    getStockDetails: builder.query<any, { ticker: string, exchange: string }>({
      query: ({ ticker, exchange }) => ({
        url: `/screener/stock-detail`,
        params: { ticker, exchange }
      }),
    }),
  }),
});

export const {
  useAddToWatchlistMutation,
  useGetWatchlistQuery,
  useRemoveFromWatchlistMutation,
  useGetStockDetailsQuery,
  useLazyGetStockDetailsQuery
} = watchlistApi;