import React from 'react';
import { Tabs, List, Avatar, Empty } from 'antd';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat, ChatMessage } from '@/contexts/ChatContext';

export default function Chat() {
  const { chatSessions: sessions, getMessagesForChat, activeChatId, startNewChat, switchChat, deleteChat } = useChat();
  const messages = getMessagesForChat(activeChatId || undefined);
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
            <span> {session.title} </span>
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
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {activeChatId ? (
          <List
            dataSource={messages}
            renderItem={(msg: ChatMessage) => (
              <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <List.Item
                  style={{ border: 'none', padding: '8px 0' }}
                >
                  <div 
                    className={`flex items-start gap-2 max-w-[80%] ${
                      msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <Avatar 
                      style={{ 
                        backgroundColor: msg.sender === 'user' ? '#1677ff' : '#52525b',
                        flexShrink: 0
                      }}
                    >
                      {msg.sender === 'user' ? 'U' : 'S'}
                    </Avatar>
                    <div 
                      className={`rounded-lg px-4 py-2 ${
                        msg.sender === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : isDarkTheme 
                            ? 'bg-zinc-700 text-white'
                            : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </List.Item>
              </div>
            )}
            locale={{ emptyText: <Empty description="No messages yet" /> }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Empty description="No chat selected" />
          </div>
        )}
      </div>
    </div>
  );
}