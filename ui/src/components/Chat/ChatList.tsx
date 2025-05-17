import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ScrollArea } from "@/components/widgets/scroll-area";

import {
  useGetChatQuery,
} from '@/store/index';

interface ChatListProps {
  chatId?: string;
}

export function ChatList({ chatId }: ChatListProps) {
  // Fetch the active chat data
  const {
    data: chatData,
    error: chatError,
    isLoading: isChatLoading
  } = useGetChatQuery(chatId, { skip: !chatId });

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesForChat = chatData?.messages || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesForChat]);

  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div key={ chatId } className="flex flex-col gap-6 p-4">
        {messagesForChat.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground text-sm">No messages yet - start a conversation!</p>
          </div>
        ) : (
          messagesForChat.map((message, index) => (
            <ChatMessage key={`${chatId}-${message.id || index}`} message={message} />
          ))
        )}
      </div>
    </ScrollArea>
  );
}