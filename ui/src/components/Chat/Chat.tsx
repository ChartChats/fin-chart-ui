import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { Tabs, Empty } from 'antd';
import { useTheme } from '@/contexts/ThemeContext';
import { ChatList } from './ChatList';
import { ChatBox } from '../ChatBox/ChatBox';

import {
  useCreateChatMutation,
  useDeleteChatMutation,
  useGetChatsQuery,
} from '@/store/index';

const ACTIVE_CHAT_ID_KEY = 'activeChatId';

interface ChatWidgetProps {
  chatId?: string;
}
interface ChatProps {
  id?: string;
  title?: string;
  createdAt?: string;
  messages?: any[];
}



const Chat = (props: ChatWidgetProps) => {

  const [activeChatId, setActiveChatId] = useState<string | null>(
    localStorage.getItem(ACTIVE_CHAT_ID_KEY)
  );
  const { theme } = useTheme();

  const isDarkTheme = theme === 'dark';
  const borderColor = isDarkTheme ? '#3f3f46' : '#e5e7eb';

  // Fetch the list of chats
  const {
    data: chatsData = [],
    refetch: refetchChats,
    isSuccess: isChatsLoaded
  } = useGetChatsQuery(undefined, { skip: false, refetchOnMountOrArgChange: true });

  const [createChat, { data: newChatData, isLoading: isCreating, isSuccess: isCreateSuccess }] = useCreateChatMutation();
  const [deleteChat, { isSuccess: isDeleteSuccess }] = useDeleteChatMutation();


  // While switching chat want to set the new active chat id
  const switchChat = (id: string) => {
    setActiveChatId(id);
    localStorage.setItem(ACTIVE_CHAT_ID_KEY, id);
  };


  // Effect to initialize chat when chats data is loaded
  useEffect(() => {
    if (!isChatsLoaded || !chatsData) return;
    
    const chats = Array.isArray(chatsData) ? chatsData : [];
    
    if (_.size(chats) > 0) {
      // Check if the stored activeChatId exists in the chats
      const storedChatId = localStorage.getItem(ACTIVE_CHAT_ID_KEY);
      const storedChatExists = storedChatId && chats.some(chat => chat.id === storedChatId);
      
      if (storedChatExists) {
        // If stored chat exists, use it
        switchChat(storedChatId!);
      } else if (!activeChatId) {
        // If no active chat and no valid stored chat, use the most recent one
        const mostRecentChat = chats[chats.length - 1];
        switchChat(mostRecentChat.id);
      }
    } else if (!isCreating && !isCreateSuccess) {
      // Only create a new chat if:
      // 1. There are no chats
      // 2. We're not already creating one
      // 3. We haven't already successfully created one
      createChat();
    }
  }, [chatsData, isChatsLoaded, isCreating, isCreateSuccess]);
  

  // Effect to update when new chat is created
  useEffect(() => {
    if (newChatData && newChatData.id) {
      switchChat(newChatData.id);
      refetchChats();
    }
  }, [newChatData]);
  
  // Effect to handle chat deletion
  useEffect(() => {
    if (isDeleteSuccess) {
      refetchChats();
      
      // If the active chat was deleted, select another one
      if (activeChatId && !chatsData.some((chat: ChatProps) => chat.id === activeChatId)) {
        if (chatsData.length > 0) {
          const chatIndex = _.findIndex(chatsData, (chat: ChatProps) => chat.id === activeChatId);
          const newChatIndex = chatIndex > 0 ? chatIndex - 1 : 0;
          switchChat(chatsData[newChatIndex].id as string);
        } else {
          setActiveChatId(null);
          localStorage.removeItem(ACTIVE_CHAT_ID_KEY);
        }
      }
    }
  }, [isDeleteSuccess]);


  return (
    <div className="flex flex-col h-full">
      <Tabs
        type="editable-card"
        activeKey={ activeChatId || undefined }
        onChange={ id => switchChat(id) }
        onEdit={ (targetKey, action) => {
          if (action === 'add') createChat();
          if (action === 'remove' && typeof targetKey === 'string') {
            deleteChat(targetKey);
            // If we're deleting the active chat, handle it in the effect
            if (targetKey === activeChatId) {
              // Find another chat to switch to
              const remainingChats = chatsData.filter((chat: ChatProps) => chat.id !== targetKey);
              if (remainingChats.length > 0) {
                switchChat(remainingChats[0].id as string);
              } else {
                setActiveChatId(null);
                localStorage.removeItem(ACTIVE_CHAT_ID_KEY);
              }
            }
          }
        } }
        items={
          _.map(chatsData, (chat: ChatProps) => {
            return {
              key: chat.id,
              label: (
                <span className="truncate max-w-[100px] inline-block">
                  { chat.title || `Chat ${chat.id?.substring(0, 8)}` }
                </span>
              ),
            };
          })
        }
        className="px-2 pt-2 custom-tabs"
        style={ {
          marginBottom: 0,
          borderBottom: `1px solid ${borderColor}`
        } }
        tabBarStyle={ {
          borderRadius: 8,
          marginBottom: 0,
        } }
      />
      <div className="flex-1 flex flex-col min-h-0">
        {
          activeChatId ? (
            <>
              <div className="flex-1 overflow-y-auto">
                <ChatList chatId={ activeChatId } />
              </div>
              <div
                className="flex-shrink-0 p-4 border-t"
                style={ { borderColor } } >
                <ChatBox chatId={activeChatId || undefined} />
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <Empty description="No chat selected" />
            </div>
          )
        }
      </div>
    </div>
  );
};

export default Chat;