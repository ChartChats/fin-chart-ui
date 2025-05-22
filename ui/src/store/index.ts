import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { chatsApi } from './apis/chatsApis';
import { chartApi } from './apis/chartApis';

export const store = configureStore({
  reducer: {
    [chatsApi.reducerPath]: chatsApi.reducer,
    [chartApi.reducerPath]: chartApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware()
      .concat(chatsApi.middleware)
      .concat(chartApi.middleware)
  }
});

setupListeners(store.dispatch);

// Export chat API hooks
export {
  useGetChatQuery,
  useCreateChatMutation,
  useDeleteChatMutation,
  useAddMessageMutation,
  useEditChatMutation,
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 