import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { ChartActionResponse, chartApi } from "./chartApis";

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'system';
  timestamp: string;
  charts?: any[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  messages: Message[];
}

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
          
          // Process assistant messages to handle chart actions
          if (chatResponse.messages) {
            for (const message of chatResponse.messages) {
              if (message.role === 'assistant') {
                try {
                  // Try to parse the content as JSON
                  const responseData = JSON.parse(message.content) as ChartActionResponse;
                  
                  // Handle different action types
                  if (responseData.action_type === 'plot_indicator') {
                    // Create a chart when action_type is plot_indicator
                    const chartData = {
                      id: `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      type: 'line', // Default, can be overridden
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
                  }
                  // For llm_response, we don't need to do anything special
                } catch (e) {
                  // Not JSON or not a chart action, ignore
                  console.log('Message is not a valid chart action:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      },
      invalidatesTags: (result, error, { chatId }) => 
        result ? [{ type: 'Chat', id: chatId }] : []
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