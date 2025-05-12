import { useEffect, useRef } from "react";
import { useChat } from "@/contexts/ChatContext";
import { ChatMessage } from "./ChatMessage";
import { ScrollArea } from "@/components/widgets/scroll-area";

interface ChatListProps {
  chatId?: string;
}

export function ChatList({ chatId }: ChatListProps) {
  const { getMessagesForChat } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesForChat = getMessagesForChat(chatId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesForChat]);

  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div className="flex flex-col gap-6 p-4">
        {messagesForChat.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground text-sm">No messages yet - start a conversation!</p>
          </div>
        ) : (
          messagesForChat.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
      </div>
    </ScrollArea>
  );
}