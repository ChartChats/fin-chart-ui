import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { chatsApi } from './apis/chatsApis';

export const store = configureStore({
  reducer: {
    [chatsApi.reducerPath]: chatsApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware()
      .concat(chatsApi.middleware)
  }
});

setupListeners(store.dispatch);

export {
  useGetChatQuery,
  useCreateChatMutation,
  useDeleteChatMutation,
  useAddMessageMutation,
  useEditChatMutation,
  useGetChatsQuery,
} from './apis/chatsApis';

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 