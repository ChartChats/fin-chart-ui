import React from 'react';
import { Tabs, Empty } from 'antd';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/contexts/ChatContext';
import { ChatList } from './ChatList';
import { ChatBox } from '../ChatBox/ChatBox';

export default function Chat() {
  const { chatSessions: sessions, activeChatId, startNewChat, switchChat, deleteChat } = useChat();
  const { theme } = useTheme();

  const isDarkTheme = theme === 'dark';
  const borderColor = isDarkTheme ? '#3f3f46' : '#e5e7eb';

  return (
    <div className="flex flex-col h-full">
      <Tabs
        type="editable-card"
        activeKey={activeChatId || undefined}
        onChange={id => switchChat(id)}
        onEdit={(targetKey, action) => {
          if (action === 'add') startNewChat();
          if (action === 'remove' && typeof targetKey === 'string') {
            deleteChat(targetKey);
          }
        }}
        items={sessions.map(session => ({
          key: session.id,
          label: (
            <span className="truncate max-w-[100px] inline-block">
              {session.title}
            </span>
          ),
        }))}
        className="px-2 pt-2 custom-tabs"
        style={{
          marginBottom: 0,
          borderBottom: `1px solid ${borderColor}`
        }}
        tabBarStyle={{
          borderRadius: 8,
          marginBottom: 0,
        }}
      />
      <div className="flex-1 flex flex-col min-h-0">
        {activeChatId ? (
          <>
            <div className="flex-1 overflow-y-auto">
              <ChatList chatId={activeChatId} />
            </div>
            <div className="flex-shrink-0 p-4 border-t" style={{ borderColor }}>
              <ChatBox />
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <Empty description="No chat selected" />
          </div>
        )}
      </div>
    </div>
  );
}