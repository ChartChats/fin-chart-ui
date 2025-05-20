import _ from 'lodash';

import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import {
  chartApi,
  ChartData
} from "./chartApis";

import {
  Message,
  Chat
} from "@/interfaces/chatInterfaces";

// Get base URL from environment variable
const BASE_URL = '/api';
const LLM_SERVER_URL = process.env.LLM_SERVER_URL;

export const chatsApi = createApi({
  reducerPath: 'chat',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
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

    addMessage: builder.mutation<void, { chatId: string; message: string }>({
      queryFn: async ({ chatId, message }, { dispatch }) => {
        // Create abort controller for stream cancellation
        const controller = new AbortController();
    
        // Optimistic update for user message
        const userMessage: Message = {
          content: message,
          role: 'user',
          timestamp: new Date().toISOString()
        };
    
        const patchResult = dispatch(
          chatsApi.util.updateQueryData('getChat', chatId, (draft) => {
            draft.messages = draft.messages || [];
            draft.messages.push(userMessage);
          })
        );
    
        try {
          // Handle SSE stream
          const sseResponse = await fetch(`${LLM_SERVER_URL}/api/v1/llm/response`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              "prompt": message,
              "thread_id": chatId
            }),
            signal: controller.signal,
          });
    
          if (!sseResponse.body) throw new Error('No response body');
          
          // Stream processing setup
          const reader = sseResponse.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let streamComplete = false;
          let lastActivityTime = Date.now();
          const STREAM_TIMEOUT = 50000; // 10 seconds timeout
          const ACTIVITY_CHECK_INTERVAL = 1000; // Check every second

          // Set up timeout check
          const timeoutCheck = setInterval(() => {
            if (Date.now() - lastActivityTime > STREAM_TIMEOUT) {
              streamComplete = true;
              clearInterval(timeoutCheck);
              controller.abort();
            }
          }, ACTIVITY_CHECK_INTERVAL);

          try {
            // Process stream chunks
            while (!streamComplete) {
              const { done, value } = await reader.read();
              
              if (done) {
                streamComplete = true;
                break;
              }

              lastActivityTime = Date.now(); // Update last activity time
              buffer += decoder.decode(value, { stream: true });
              const events = buffer.split('\n\n');
              buffer = events.pop() || '';
      
              for (const event of events) {
                if (!event.trim()) continue;
      
                try {
                  const jsonData = event.replace(/^data: /, '');
                  const parsedJsonData = JSON.parse(jsonData);

                  // Process normal messages
                  dispatch(
                    chatsApi.util.updateQueryData('getChat', chatId, (draft) => {

                      if (
                        parsedJsonData.action_type === 'llm_response' &&
                        !_.isEmpty(parsedJsonData.message)
                      ) {
                        draft.messages.push({
                          role: 'system',
                          content: parsedJsonData.message,
                          timestamp: new Date().toISOString()
                        });
                      }
      
                      if (parsedJsonData.action_type === 'plot_indicator') {
                        const chartData: ChartData = {
                          id: `${chatId}-${Date.now()}`,
                          type: 'line',
                          title: parsedJsonData.description || '',
                          symbol: parsedJsonData.ticker,
                          timeframe: parsedJsonData.interval || 'daily',
                          exchange: parsedJsonData.exchange || '',
                          description: parsedJsonData.description || '',
                          data: [],
                          indicators: parsedJsonData.indicators || []
                        };
                        dispatch(chartApi.endpoints.addChart.initiate(chartData));
                      }
                    })
                  );
                } catch (error) {
                  console.error('Error processing SSE event:', error);
                }
              }

              if (streamComplete) {
                break;
              }
            }
          } finally {
            // Cleanup
            clearInterval(timeoutCheck);
            controller.abort();
            reader.releaseLock();
          }
          
          return { data: null };
        } catch (error) {
          // Revert optimistic update on error
          patchResult.undo();
          console.error('Stream error:', error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Stream error'
            }
          };
        }
      }
    })
  }),
});

export const {
  useGetChatsQuery,
  useGetChatQuery,
  useEditChatMutation,
  useDeleteChatMutation,
  useCreateChatMutation,
  useAddMessageMutation,
} = chatsApi;