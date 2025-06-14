import { useState } from "react";
import { Button, Input, Tooltip, message } from "antd";
import { PaperClipOutlined, SendOutlined, SearchOutlined, ScanOutlined } from "@ant-design/icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useAddMessageMutation } from "@/store";

const { TextArea } = Input;

export function ChatBox({ chatId }: { chatId?: string }) {
  const [input, setInput] = useState("");
  const [isScreenerMode, setIsScreenerMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const { theme } = useTheme();
  
  const [addMessage, { isLoading: isSendingMessage }] = useAddMessageMutation();

  const isDarkTheme = theme === 'dark';
  const borderColor = isDarkTheme ? '#3f3f46' : '#e5e7eb';
  const bgColor = isDarkTheme ? '#27272a' : '#f9fafb';
  const textColor = isDarkTheme ? '#e4e4e7' : '#374151';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (input.trim() === "" || !chatId) return;
    
    try {
      console.log("Sending message:", input, "to chat:", chatId);
      
      // Send the message to the chat API
      addMessage({ 
        chatId, 
        message: input 
      }).unwrap();
      
      setInput("");
      setIsScreenerMode(false);
      setIsSearchMode(false);
    } catch (error) {
      message.error('Failed to process your question. Please try again.');
      console.error('Error processing question:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const setMode = (mode: 'screener' | 'search' | 'none') => {
    setIsScreenerMode(mode === 'screener');
    setIsSearchMode(mode === 'search');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-2">
        <div
          className="relative flex rounded-lg shadow-sm w-full"
          style={{ 
            border: `1px solid ${borderColor}`,
            backgroundColor: bgColor
          }}
        >
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isScreenerMode ? "Enter screener criteria..." : 
              isSearchMode ? "Search the web..." : 
              "Type your message..."
            }
            onKeyDown={handleKeyDown}
            autoSize={{ minRows: 1, maxRows: 6 }}
            className="flex-1 !border-none !shadow-none !bg-transparent !py-2 !px-3"
            style={{ color: textColor }}
            disabled={isSendingMessage}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tooltip title={isScreenerMode ? "Using Screener Mode" : "Use Screener"}>
              <Button 
                type={isScreenerMode ? "primary" : "text"} 
                shape="circle" 
                icon={<ScanOutlined />}
                size="small"
                onClick={() => setMode(isScreenerMode ? 'none' : 'screener')} 
              />
            </Tooltip>
            <Tooltip title={isSearchMode ? "Using Web Search" : "Use Web Search"}>
              <Button 
                type={isSearchMode ? "primary" : "text"}
                shape="circle" 
                icon={<SearchOutlined />}
                size="small"
                onClick={() => setMode(isSearchMode ? 'none' : 'search')} 
              />
            </Tooltip>
            <Tooltip title="Attach files">
              <Button 
                type="text" 
                shape="circle" 
                icon={<PaperClipOutlined />}
                size="small"
              />
            </Tooltip>
          </div>
          <Tooltip title="Send message">
            <Button 
              type="primary" 
              shape="circle" 
              icon={<SendOutlined />} 
              onClick={handleSubmit}
              disabled={input.trim() === "" || isSendingMessage}
              loading={isSendingMessage}
            />
          </Tooltip>
        </div>
      </div>
    </form>
  );
}