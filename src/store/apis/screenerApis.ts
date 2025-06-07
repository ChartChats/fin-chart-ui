import axios from '@/store/client';
import _ from 'lodash';
import { v4 as uuid4 } from 'uuid';

import {
  createApi,
} from "@reduxjs/toolkit/query/react";

import {
  ScreenerData
} from "@/interfaces/screenerInterfaces";

import {
  clientBaseQuery
} from '@/store/clientBaseQuery';

export const screenerApi = createApi({
  reducerPath: 'screenerApi',
  baseQuery: clientBaseQuery,
  tagTypes: ['Screeners'],
  endpoints: (builder) => ({

    getScreener: builder.query<ScreenerData, string>({
      queryFn: async (screenerId, { dispatch }) => {
        try {
          const response = await axios.get(`/user/screeners/${screenerId}`);
          return {
            data: response.data[screenerId]
          };
        } catch (error) {
          console.error('getScreener error:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Failed to fetch screener'
            }
          };
        }
      },
      providesTags: ['Screeners']
    }),

    getScreeners: builder.query<ScreenerData[], void>({
      queryFn: async (_, { dispatch }) => {
        try {
          const response = await axios.get('/user/screeners');
          if (!response.data.screeners) {
            return { data: [] };
          }
          return {
            data: response.data.screeners.map(([id, screener]: [string, any]) => ({
              id,
              ...screener
            }))
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Failed to fetch screeners'
            }
          };
        }
      },
      providesTags: ['Screeners'],
    }),
    
    addScreener: builder.mutation<Partial<ScreenerData>, any>({
      queryFn: async (screener, { dispatch }) => {
        try {
          const screenerId = uuid4();
          const response = await axios.post(`/user/screeners/${screenerId}`, {
            "screener_data": {
              ...screener,
            }
          });
          
          // Dispatch custom event to notify the component
          window.dispatchEvent(new CustomEvent('newScreenerGenerated', { 
            detail: { screenerId } 
          }));
          
          return {
            data: {
              id: screenerId,
              ...response.data
            }
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Failed to create screener'
            }
          };
        }
      },
      invalidatesTags: ['Screeners']
    }),
    
    removeScreener: builder.mutation<void, string>({
      query: (id) => ({
        url: `/user/screeners/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Screeners']
    }),

    updateScreener: builder.mutation<ScreenerData, { id: string, data: Partial<ScreenerData> }>({
      queryFn: async ({ id, data }, { dispatch }) => {
        try {
          const response = await axios.post(`/user/screeners/${id}`, {
            "screener_data": {
              id,
              ...data
            }
          });
          return {
            data: {
              id,
              ...response.data
            }
          };
        } catch (error) {
          console.error('updateScreener error:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Failed to update screener'
            }
          };
        }
      },
      invalidatesTags: ['Screeners']
    }),
  }),
});

export const {
  useGetScreenersQuery,
  useGetScreenerQuery,
  useAddScreenerMutation,
  useRemoveScreenerMutation,
  useUpdateScreenerMutation
} = screenerApi;