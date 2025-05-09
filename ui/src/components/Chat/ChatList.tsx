import { useEffect, useRef } from "react";
import { useChat } from "@/contexts/ChatContext";
import { ChatMessage } from "./ChatMessage";
import { ScrollArea } from "@/components/widgets/scroll-area";
import { useSelector, useDispatch } from 'react-redux';
import { Input } from 'antd';
import { addMessage, ChatState } from './chatSlice';

interface ChatListProps {
  chatId?: string;
}

export function ChatList({ chatId }: ChatListProps) {
  const { getMessagesForChat } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { activeSessionId } = useSelector(
    (state: { chat: ChatState }) => state.chat
  );
  
  const messagesForChat = getMessagesForChat(chatId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesForChat]);

  const handleSend = (text: string) => {
    if (text.trim() && activeSessionId) {
      dispatch(addMessage({ chatId: activeSessionId, sender: 'user', text }));
      // Optionally, add a system reply here
    }
  };

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="py-4 space-y-2 px-4">
          {messagesForChat.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[100px]">
              <p className="text-muted-foreground text-sm">No messages in this chat</p>
            </div>
          ) : (
            messagesForChat.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
        </div>
      </ScrollArea>
      <div style={{ padding: 16, borderTop: '1px solid #eee' }}>
        <Input.Search
          enterButton="Send"
          placeholder="Type your message..."
          onSearch={handleSend}
        />
      </div>
    </div>
  );
}