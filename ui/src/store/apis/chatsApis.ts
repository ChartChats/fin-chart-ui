import _ from 'lodash';
import moment from 'moment';
import axios from '@/store/client';

import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import {
  clientBaseQuery
} from '@/store/clientBaseQuery';

import {
  chartApi
} from "./chartApis";

import {
  Message,
  Chat
} from "@/interfaces/chatInterfaces";

import {
  ChartData
} from "@/interfaces/chartInterfaces";

export const chatsApi = createApi({
  reducerPath: 'chat',
  baseQuery: clientBaseQuery,
  tagTypes: ['Chat', 'Chats'],
  refetchOnMountOrArgChange: true,
  refetchOnFocus: false,
  refetchOnReconnect: true,
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

        const SSE_ENDPOINT = process.env.USE_SSE_URL === 'true'
          ? `${process.env.BACKEND_SERVER_URL}/api/v1/llm/response`
          : `/api/chat/${chatId}/message`;

    
        try {
          // Handle SSE stream
          const sseResponse = await axios(SSE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({
              "prompt": message,
              "thread_id": chatId
            }),
            signal: controller.signal,
          });
    
          if (!sseResponse.data.body) throw new Error('No response body');
          
          // Stream processing setup
          const reader = sseResponse.data.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let streamComplete = false;
          let lastActivityTime = Date.now();
          const STREAM_TIMEOUT = 50000; // 50 seconds timeout
          const ACTIVITY_CHECK_INTERVAL = 1000; // Check every second
    
          // Use chatId directly as chartId to establish 1:1 relationship
          // Key change: Use chatId as chartId
          const chartId = chatId;
          let chartCreatedForChat = false;
          let accumulatedIndicators: Array<any> = [];
          let accumulatedChartPatterns: Array<any> = [];
    
          // Check if chart already exists for this chat
          try {
            const chartResponse = await axios(`/api/chart/${chartId}`);
            
            // Only process if we got a successful response
            if (chartResponse.data.ok) {
              const chartData = await chartResponse.data.json();
              if (chartData && chartData.indicators) {
                accumulatedIndicators = [...chartData.indicators];
                accumulatedChartPatterns = chartData.chart_pattern ? [...chartData.chart_pattern] : [];
                chartCreatedForChat = true;
              }
            } else if (chartResponse.status === 404) {
              // This is expected if chart doesn't exist yet
              console.log(`Chart ${chartId} not found, will create new one if needed`);
              chartCreatedForChat = false;
            } else {
              // Handle other error statuses
              console.error(`Error fetching chart: ${chartResponse.status}`);
            }
          } catch (error) {
            // Handle network errors or other exceptions
            console.error('Error checking chart existence:', error);
            // Continue with creating a new chart if needed
            chartCreatedForChat = false;
          }
    
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
                        // Add new indicators to our accumulated array
                        if (parsedJsonData.indicators && parsedJsonData.indicators.length > 0) {
                          // Merge new indicators with existing ones, avoiding duplicates
                          const newIndicators = parsedJsonData.indicators;
                          
                          // Add only indicators that don't already exist (based on name and value)
                          newIndicators.forEach((newInd: { name: any; value: any; }) => {
                            const exists = accumulatedIndicators.some(existingInd => 
                              existingInd.name === newInd.name && existingInd.value === newInd.value
                            );
                            
                            if (!exists) {
                              accumulatedIndicators.push(newInd);
                            }
                          });
                        }
                      }

                      if (parsedJsonData.action_type === 'plot_chart_pattern') {
                        // Add new chart patterns to our accumulated array
                        if (parsedJsonData.chart_pattern && parsedJsonData.chart_pattern.length > 0) {
                          // Merge new chart patterns with existing ones, avoiding duplicates
                          const newChartPatterns = parsedJsonData.chart_pattern;
                          
                          // Add only chart patterns that don't already exist (based on name and value)
                          newChartPatterns.forEach((pattern: any) => {
                            accumulatedChartPatterns.push(pattern);
                          });
                        }
                      }
  
                      // if the action type is inidicator or pattern then  only update the chart or create the chart
                      if (
                        (parsedJsonData.action_type === 'plot_indicator' || parsedJsonData.action_type === 'plot_chart_pattern') &&
                        !chartCreatedForChat
                      ) {
                        // Create new chart if we haven't created one yet for this chat session
                        const chartData: ChartData = {
                          id: chartId, // Using chatId as chartId
                          type: 'line',
                          title: parsedJsonData.description || '',
                          symbol: parsedJsonData.ticker,
                          timeframe: parsedJsonData.interval || 'daily',
                          exchange: parsedJsonData.exchange || '',
                          description: parsedJsonData.description || '',
                          data: [],
                          indicators: accumulatedIndicators,
                          chart_pattern: accumulatedChartPatterns,
                          date_from: `${moment(parsedJsonData.from_date).unix()}`,
                          date_to: `${moment(parsedJsonData.to_date).unix()}`,
                        };
                        dispatch(chartApi.endpoints.addChart.initiate(chartData));
                        chartCreatedForChat = true;
                      } else {
                        // Update existing chart with all accumulated indicators
                        dispatch(chartApi.endpoints.updateChart.initiate({
                          id: chartId,
                          data: {
                            indicators: accumulatedIndicators,
                            chart_pattern: accumulatedChartPatterns,
                            // Update other chart properties if they've changed
                            ...(
                              parsedJsonData.ticker &&
                              { symbol: parsedJsonData.ticker }
                            ),
                            ...(
                              parsedJsonData.interval &&
                              { timeframe: parsedJsonData.interval }
                            ),
                            ...(
                              parsedJsonData.exchange &&
                              { exchange: parsedJsonData.exchange }
                            ),
                            ...(
                              parsedJsonData.description &&
                              { description: parsedJsonData.description }
                            ),
                            ...(
                              parsedJsonData.date_from &&
                              { date_from: parsedJsonData.date_from }
                            ),
                            ...(
                              parsedJsonData.date_to &&
                              { date_to: parsedJsonData.date_to }
                            ),
                          }
                        }));
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
