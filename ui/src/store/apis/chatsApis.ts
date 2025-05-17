import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";


const chatsApi = createApi({
  reducerPath: 'chat',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
  }),
  tagTypes: ['Chat', 'Chats'],
  endpoints: (builder) => ({
    getChats: builder.query({
      query: () => {
        return {
          url: '/chat/chats',
          method: 'GET',
        }
      },
      providesTags: ['Chats']
    }),
    getChat: builder.query({
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
    editChat: builder.mutation({
      query: ({ chatId, message }) => {
        return {
          url: `/chat/${chatId}`,
          method: 'PUT',
          body: message,
        }
      }
    }),
    deleteChat: builder.mutation({
      query: (chatId) => {
        return {
          url: `/chat/${chatId}`,
          method: 'DELETE',
        }
      },
      invalidatesTags: ['Chats']
    }),
    createChat: builder.mutation({
      query: () => {
        return {
          url: '/chat/create',
          method: 'POST',
        }
      },
      invalidatesTags: ['Chats']
    }),
    addMessage: builder.mutation({
      query: ({ chatId, message }) => {
        return {
          url: `/chat/${chatId}/message`,
          method: 'POST',
          body: message,
        }
      }
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