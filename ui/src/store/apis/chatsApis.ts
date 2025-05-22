import _ from 'lodash';

import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import {
  ChartActionResponse,
  chartApi
} from "./chartApis";

import {
  Message,
  Chat,
  ChatResponse
} from "@/interfaces/chatInterfaces";

const chatsApi = createApi({
  reducerPath: 'chat',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
  }),
  tagTypes: ['Chat', 'Chats'],
  endpoints: (builder) => ({
    getChats: builder.query<Chat[], void>({
      query: () => {
        return {
          url: '/chat/chats',
          method: 'GET',
        }
      },
      providesTags: ['Chats']
    }),
    getChat: builder.query<Chat, string>({
      query: (chatId) => {
        return {
          url: '/chat',
          method: 'GET',
          params: {
            chat_id: chatId
          },
        }
      },
      providesTags: (result, error, chatId) => 
        result ? [{ type: 'Chat', id: chatId }] : ['Chat']
    }),
    editChat: builder.mutation<Chat, { chatId: string, message: Partial<Chat> }>({
      query: ({ chatId, message }) => {
        return {
          url: `/chat/${chatId}`,
          method: 'PUT',
          body: message,
        }
      },
      invalidatesTags: (result, error, { chatId }) => 
        result ? [{ type: 'Chat', id: chatId }, 'Chats'] : []
    }),
    deleteChat: builder.mutation<void, string>({
      query: (chatId) => {
        return {
          url: `/chat/${chatId}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Chats']
    }),
    createChat: builder.mutation<Chat, void>({
      query: () => {
        return {
          url: '/chat/create',
          method: 'POST',
        }
      },
      invalidatesTags: ['Chats']
    }),
    addMessage: builder.mutation<ChatResponse, { chatId: string, message: string }>({
      query: ({ chatId, message }) => {
        return {
          url: `/chat/${chatId}/message`,
          method: 'POST',
          body: { content: message, role: 'user' },
        }
      },
      async onQueryStarted({ chatId }, { dispatch, queryFulfilled }) {
        try {
          // Wait for the response which includes both user message and LLM responses
          const { data: chatResponse } = await queryFulfilled;
          
          // Process system messages to handle chart actions
          if (_.size(chatResponse.messages) > 0) {
            _.forEach(chatResponse.messages, async (message) => {
              if (message.role === 'system') {
                try {
                  // Try to parse the content as JSON
                  const responseData = JSON.parse(message.content) as ChartActionResponse;
                  
                  // Handle different action types
                  switch (responseData.action_type) {
                    case 'plot_indicator':
                      // Create a chart when action_type is plot_indicator
                      const chartData = {
                        id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        type: 'line' as const,
                        title: responseData.ticker || 'Chart',
                        symbol: responseData.ticker || '',
                        timeframe: responseData.interval || 'daily',
                        exchange: responseData.exchange || '',
                        description: responseData.description || '',
                        data: responseData.data || [],
                        indicators: responseData.indicators || []
                      };

                      // Create the chart
                      await dispatch(chartApi.endpoints.addChart.initiate(chartData));
                      break;
                    case 'chat_response':
                      // For llm_response, we don't need to do anything special
                      console.log('get Chat responses:', responseData.message);
                      break;
                    default:
                      break;
                  }
                } catch (e) {
                  // Not JSON or not a chart action, ignore
                  console.log('Message is not a valid chart action:', e);
                }
              }
            })
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      },
      invalidatesTags: (result, error, { chatId }) => 
        result ? [{ type: 'Chat', id: chatId }, 'Chats'] : []
    }),
  }),
});

export const {
  useEditChatMutation,
  useDeleteChatMutation,
  useCreateChatMutation,
  useAddMessageMutation,
  useGetChatQuery,
  useGetChatsQuery,
} = chatsApi;

export { chatsApi };