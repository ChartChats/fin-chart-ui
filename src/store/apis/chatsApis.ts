import _ from 'lodash';
import axios from '@/store/client';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

import {
  createApi,
} from "@reduxjs/toolkit/query/react";

import {
  getChats
} from "@/utils/AppUtils";

import {
  clientBaseQuery
} from '@/store/clientBaseQuery';

import {
  chartApi
} from "@/store/apis/chartApis";

import {
  screenerApi
} from "@/store/apis/screenerApis";

import {
  Message,
  Chat
} from "@/interfaces/chatInterfaces";

import {
  ChartData
} from "@/interfaces/chartInterfaces";

import {
  ScreenerData
} from "@/interfaces/screenerInterfaces";

export const chatsApi = createApi({
  reducerPath: 'chat',
  baseQuery: clientBaseQuery,
  tagTypes: ['Chat', 'Chats'],
  endpoints: (builder) => ({

    getChats: builder.query<Chat[], void>({
      queryFn: async (_, { dispatch }) => {
        try {
          const response = await axios.get(`/user/chats`);
          const data = getChats(response.data.chat_history);
          return {
            data
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Failed to create chat'
            }
          };
        }
      },
      providesTags: ['Chats']
    }),

    getChat: builder.query<Partial<Chat>, string>({
      queryFn: async (chatId, { dispatch }) => {
        try {
          const response = await axios.get(`/user/chats/${chatId}`);
          return {
            data: {
              id: chatId,
              messages: response.data[chatId]
            }
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Failed to create chat'
            }
          };
        }
      },
      providesTags: (result, error, chatId) => 
        result ? [{ type: 'Chat', id: chatId }] : ['Chat']
    }),

    deleteChat: builder.mutation<void, string>({
      query: (chatId) => {
        return {
          url: `/user/chats/${chatId}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Chats']
    }),

    createChat: builder.mutation<Chat, void>({
      queryFn: async (_, { dispatch }) => {
        const chatId = uuidv4();
        try {
          const response = await axios.post(`/user/chats/${chatId}`, {
            messages: []
          });
          return {
            data: {
              ...response.data,
              id: chatId
            }
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'Failed to create chat'
            }
          };
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

        // Add initial system message with analyzing state
        const analyzingMessage: Message = {
          content: '',
          role: 'system',
          timestamp: new Date().toISOString(),
          isAnalyzing: true
        };
        const patchResult = dispatch(
            chatsApi.util.updateQueryData('getChat', chatId, (draft) => {
              draft.messages = draft.messages || [];
              draft.messages.push(userMessage);
              draft.messages.push(analyzingMessage);
          })
        );

        // Initialize accumulators
        let systemMessageContent = '';
        let systemMessageCreated = false;
        let chartUpdates: Partial<ChartData> = {
          indicators: [],
          chart_pattern: [],
        };
        let screenerUpdates: Partial<ScreenerData> = {};
        let chartExistsInitially = false;
        const chartId = chatId; // Use chatId as chartId

        // Check if chart exists
        let chartResponse = { data: null };
        try {
          chartResponse = await axios(`/user/charts/${chartId}`);
          if (chartResponse.data) {
            const chartData = chartResponse.data[chartId];
            chartUpdates.indicators = [...(chartData.indicators || [])];
            chartUpdates.chart_pattern = [...(chartData.chart_pattern || [])];
            chartExistsInitially = true;
          }
        } catch (error) {
          console.log('Chart not found, will create new if needed');
        }


        // if chart exists initally then we will tweak the message given to LLM
        // We need to let LLM know maybe the chart is talking about the specific ticker
        let llmMessage = message;
        if (chartExistsInitially) {
          const {
            symbol = '',
            exchange = '',
            description = '',
            date_from = '',
            date_to = ''
          } = chartResponse.data[chartId];
          llmMessage = `The ticker for which the below message is being asked is maybe for
            the ticker: ${symbol} on exchange: ${exchange}, having description: ${description},
            from date: ${moment.unix(date_from)} to date: ${moment.unix(date_to)}. The message is: ${llmMessage}`;
        }
        const SSE_ENDPOINT = `${process.env.BACKEND_SERVER_URL}/llm/response`;
    
        try {
          // Handle SSE stream
          const sseResponse = await fetch(SSE_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': localStorage.getItem('token') || '',
            },
            body: JSON.stringify({
              "prompt": llmMessage,
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
          const STREAM_TIMEOUT = 50000; // 50 seconds timeout
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

                  // Handle LLM response (accumulate content)
                  if (parsedJsonData.action_type === 'llm_response' && parsedJsonData.message) {
                    systemMessageContent += parsedJsonData.message;
                    
                    dispatch(
                      chatsApi.util.updateQueryData('getChat', chatId, (draft) => {
                        const lastMessage = draft.messages[draft.messages.length - 1];
                        if (lastMessage?.role === 'system') {
                          // Update the analyzing message with actual content
                          lastMessage.content = systemMessageContent;
                          lastMessage.isAnalyzing = false;
                        } else {
                          // Create a new system message if needed
                          draft.messages.push({
                            role: 'system',
                            content: systemMessageContent,
                            timestamp: new Date().toISOString(),
                            isAnalyzing: false
                          });
                        }
                        systemMessageCreated = true;
                      })
                    );
                  }

                  // Accumulate chart indicators
                  if (parsedJsonData.action_type === 'plot_indicator' && parsedJsonData.indicators) {
                    parsedJsonData.indicators.forEach((ind: any) => {
                      if (!chartUpdates.indicators.some(i => 
                        i.name === ind.name && i.value === ind.value
                      )) {
                        chartUpdates.indicators.push(ind);
                      }
                    });
                  }

                  // Accumulate chart patterns
                  if (parsedJsonData.action_type === 'plot_chart_pattern' && parsedJsonData.chart_pattern) {
                    parsedJsonData.chart_pattern.forEach((pattern: any) => {
                      chartUpdates.chart_pattern.push(pattern);
                    });
                  }

                  // Update chart metadata
                  if (
                    parsedJsonData.action_type === 'plot_indicator' || 
                    parsedJsonData.action_type === 'plot_chart_pattern'
                  ) {
                    chartUpdates = {
                      ...chartUpdates,
                      ...(parsedJsonData.ticker && { symbol: parsedJsonData.ticker }),
                      ...(parsedJsonData.interval && { timeframe: parsedJsonData.interval }),
                      ...(parsedJsonData.exchange && { exchange: parsedJsonData.exchange }),
                      ...(parsedJsonData.description && { description: parsedJsonData.description }),
                      ...(parsedJsonData.from_date && { date_from: parsedJsonData.from_date }),
                      ...(parsedJsonData.to_date && { date_to: parsedJsonData.to_date }),
                    };
                  }


                  // Handle Screener response (create new screener always)
                  if (parsedJsonData.action_type === 'screen_stock' && parsedJsonData.records) {
                    screenerUpdates = {
                      query: message,
                      records: parsedJsonData.records,
                      updatedAt: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                    };
                  }
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
          
          // After stream completes:
          // 1. Save all messages
          const systemMessage: Message = {
            role: 'system',
            content: systemMessageContent,
            timestamp: new Date().toISOString()
          };

          await axios.post(`/user/chats/${chatId}`, {
            messages: [userMessage, systemMessage]
          });

          // 2. Handle chart update/create if we have any chart data
          if (chartUpdates.indicators.length > 0 || chartUpdates.chart_pattern.length > 0) {
            const chartData: ChartData = {
              id: chartId,
              type: 'line',
              title: chartUpdates.description || '',
              symbol: chartUpdates.symbol || '',
              timeframe: chartUpdates.timeframe || 'daily',
              exchange: chartUpdates.exchange || '',
              description: chartUpdates.description || '',
              data: [],
              indicators: chartUpdates.indicators,
              chart_pattern: chartUpdates.chart_pattern,
              date_from: chartUpdates.date_from,
              date_to: chartUpdates.date_to,
            };

            if (chartExistsInitially) {
              dispatch(chartApi.endpoints.updateChart.initiate({
                id: chartId,
                data: chartData
              }));
            } else {
              dispatch(chartApi.endpoints.addChart.initiate(chartData));
              // Dispatch event for new chart
              window.dispatchEvent(new CustomEvent('newChartGenerated', { 
                detail: { chartId: chartId } 
              }));
            }
          }

          // 3. Handle create screener if we have any screener data
          if (!_.isEmpty(screenerUpdates)) {
            const result = await dispatch(screenerApi.endpoints.addScreener.initiate(screenerUpdates)).unwrap();
            // Dispatch event for new screener
            window.dispatchEvent(new CustomEvent('newScreenerGenerated', { 
              detail: { screenerId: result.id } 
            }));
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
  useDeleteChatMutation,
  useCreateChatMutation,
  useAddMessageMutation,
} = chatsApi;