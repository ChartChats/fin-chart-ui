import { useState } from "react";
import { useChat, generateMockChart } from "@/contexts/ChatContext";
import { Button, Input, Tooltip } from "antd";
import { PaperClipOutlined, SendOutlined, SearchOutlined, ScanOutlined } from "@ant-design/icons";
import { useTheme } from "@/contexts/ThemeContext";

const { TextArea } = Input;

export function ChatBox() {
  const { addMessage } = useChat();
  const [input, setInput] = useState("");
  const [isScreenerMode, setIsScreenerMode] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const { theme } = useTheme();

  const isDarkTheme = theme === 'dark';
  const borderColor = isDarkTheme ? '#3f3f46' : '#e5e7eb';
  const bgColor = isDarkTheme ? '#27272a' : '#f9fafb';
  const textColor = isDarkTheme ? '#e4e4e7' : '#374151';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (input.trim() === "") return;
    addMessage(input, "user");
    setTimeout(() => {
      let charts = [];
      if (isScreenerMode) {
        charts.push(generateMockChart("bar", "Screener Results"));
      } else if (isSearchMode && (input.toLowerCase().includes("stock") || input.toLowerCase().includes("market"))) {
        charts.push(generateMockChart("line", "Market Data"));
      } else {
        if (input.toLowerCase().includes("line chart") || input.toLowerCase().includes("stock")) charts.push(generateMockChart("line", "Stock Price History"));
        if (input.toLowerCase().includes("bar chart") || input.toLowerCase().includes("comparison")) charts.push(generateMockChart("bar", "Company Comparison"));
        if (input.toLowerCase().includes("area chart") || input.toLowerCase().includes("trend")) charts.push(generateMockChart("area", "Market Trend Analysis"));
        if (input.toLowerCase().includes("candlestick") || input.toLowerCase().includes("candle")) charts.push(generateMockChart("candlestick", "Stock Candlestick"));
      }
      let responseText = isScreenerMode 
        ? "Here are the screener results based on your criteria."
        : isSearchMode 
          ? "Here's what I found from searching the web."
          : "Here's the information you requested.";
      if (charts.length > 0) responseText += " I've also generated some charts for you to visualize the data.";
      addMessage(responseText, "system", charts);
    }, 500);
    setInput("");
    setIsScreenerMode(false);
    setIsSearchMode(false);
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
      <div className="relative flex rounded-lg shadow-sm w-full" style={{ 
        border: `1px solid ${borderColor}`,
        backgroundColor: bgColor
      }}>
        {(isScreenerMode || isSearchMode) && (
          <div className="absolute -top-6 left-3 text-xs" style={{ color: textColor }}>
            {isScreenerMode ? "Screener Mode" : "Web Search Mode"}
          </div>
        )}
        <div className="flex items-center px-3 py-2 gap-2">
          <Tooltip title={isScreenerMode ? "Using Screener Mode" : "Use Screener"}>
            <Button 
              type={isScreenerMode ? "primary" : "text"} 
              shape="circle" 
              icon={<ScanOutlined />}
              size="middle"
              onClick={() => setMode(isScreenerMode ? 'none' : 'screener')} 
            />
          </Tooltip>
          <Tooltip title={isSearchMode ? "Using Web Search" : "Use Web Search"}>
            <Button 
              type={isSearchMode ? "primary" : "text"}
              shape="circle" 
              icon={<SearchOutlined />}
              size="middle"
              onClick={() => setMode(isSearchMode ? 'none' : 'search')} 
            />
          </Tooltip>
        </div>
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
          className="flex-1 !border-none !shadow-none !bg-transparent !py-2"
          style={{ color: textColor }}
        />
        <div className="flex items-center px-3 py-2 gap-2">
          <Tooltip title="Attach files">
            <Button 
              type="text" 
              shape="circle" 
              icon={<PaperClipOutlined />}
              size="middle"
            />
          </Tooltip>
          <Tooltip title="Send message">
            <Button 
              type="primary" 
              shape="circle" 
              icon={<SendOutlined />} 
              onClick={handleSubmit}
              disabled={input.trim() === ""}
            />
          </Tooltip>
        </div>
      </div>
    </form>
  );
}