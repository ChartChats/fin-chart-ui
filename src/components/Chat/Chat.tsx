import React, { useEffect, useState } from 'react';
import { Empty } from 'antd';
import { useTheme } from '@/contexts/ThemeContext';
import { ChatList } from './ChatList';
import { ChatBox } from '../ChatBox/ChatBox';
import { useGetChatsQuery } from '@/store/index';

const ACTIVE_CHAT_ID_KEY = 'activeChatId';

interface ChatProps {
  id: string;
  title?: string;
  createdAt?: string;
  messages?: any[];
}

const Chat = () => {
  const { theme } = useTheme();
  const isDarkTheme = theme === 'dark';
  const borderColor = isDarkTheme ? '#3f3f46' : '#e5e7eb';

  // Fetch the list of chats (which correspond to charts)
  const {
    data: chats = [],
    isSuccess: isChatsLoaded,
    isLoading: isChatsLoading
  } = useGetChatsQuery(undefined, { refetchOnMountOrArgChange: true });

  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Sync active chat with chart selection
  useEffect(() => {
    if (!isChatsLoaded) return;

    const storedChatId = localStorage.getItem(ACTIVE_CHAT_ID_KEY);
    const validStoredChat = storedChatId && chats.some(chat => chat.id === storedChatId);
    
    if (validStoredChat) {
      setActiveChatId(storedChatId);
    } else if (chats.length > 0) {
      // Set to most recent chat
      const mostRecentChat = chats[chats.length - 1];
      setActiveChatId(mostRecentChat.id);
      localStorage.setItem(ACTIVE_CHAT_ID_KEY, mostRecentChat.id);
    } else {
      // No chats available
      setActiveChatId(null);
      localStorage.removeItem(ACTIVE_CHAT_ID_KEY);
    }
  }, [isChatsLoaded, chats]);

  // Handle chart selection and deletion events
  useEffect(() => {
    const handleChartSelected = (event: CustomEvent) => {
      const { chartId } = event.detail;
      if (chartId && chats.some(chat => chat.id === chartId)) {
        setActiveChatId(chartId);
        localStorage.setItem(ACTIVE_CHAT_ID_KEY, chartId);
      }
    };

    const handleChartDeleted = (event: CustomEvent) => {
      const { chartId } = event.detail;
      if (chartId === activeChatId) {
        // Find next available chat
        const nextChat = chats.find(chat => chat.id !== chartId);
        if (nextChat) {
          setActiveChatId(nextChat.id);
          localStorage.setItem(ACTIVE_CHAT_ID_KEY, nextChat.id);
        } else {
          setActiveChatId(null);
          localStorage.removeItem(ACTIVE_CHAT_ID_KEY);
        }
      }
    };

    window.addEventListener('chartSelected', handleChartSelected as EventListener);
    window.addEventListener('chartDeleted', handleChartDeleted as EventListener);
    
    return () => {
      window.removeEventListener('chartSelected', handleChartSelected as EventListener);
      window.removeEventListener('chartDeleted', handleChartDeleted as EventListener);
    };
  }, [chats, activeChatId]);

  if (isChatsLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Empty description="Loading chats..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col min-h-0">
        {activeChatId ? (
          <>
            <div className="flex-1 overflow-y-auto">
              <ChatList chatId={activeChatId} />
            </div>
            <div className="flex-shrink-0 p-4 border-t" style={{ borderColor }}>
              <ChatBox chatId={activeChatId} />
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <Empty 
              description={
                <span className="text-muted-foreground">
                  No active chat available. Create a new chat to start a conversation.
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;