import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { chatsApi } from './apis/chatsApis';
import { chartApi } from './apis/chartApis';
import { screenerApi } from './apis/screenerApis';

export const store = configureStore({
  reducer: {
    [chatsApi.reducerPath]: chatsApi.reducer,
    [chartApi.reducerPath]: chartApi.reducer,
    [screenerApi.reducerPath]: screenerApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware()
      .concat(chatsApi.middleware)
      .concat(chartApi.middleware)
      .concat(screenerApi.middleware)  
  }
});

setupListeners(store.dispatch);

// Export chat API hooks
export {
  useGetChatQuery,
  useCreateChatMutation,
  useDeleteChatMutation,
  useAddMessageMutation,
  useGetChatsQuery,
} from './apis/chatsApis';

// Export chart API hooks
export {
  useGetChartsQuery,
  useGetChartQuery,
  useAddChartMutation,
  useRemoveChartMutation,
  useUpdateChartMutation,
} from './apis/chartApis';

// Export screener API hooks
export {
  useGetScreenersQuery,
  useGetScreenerQuery,
  useAddScreenerMutation,
  useRemoveScreenerMutation,
  useUpdateScreenerMutation
} from './apis/screenerApis';

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 