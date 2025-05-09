import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Chart {
  id: string;
  title: string;
  type: 'candlestick' | 'line' | 'bar' | 'area';
  symbol: string;  // Trading symbol (e.g., 'AAPL', 'BTCUSD')
  timeframe: string;  // Timeframe (e.g., '1D', '1H', '15m')
  exchange: string;  // Exchange name (e.g., 'NASDAQ', 'NYSE')
  description: string;  // Company/asset description
  data: any[];  // Will be replaced with TradingView data format
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: number;
  charts?: Chart[];
  chatId: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
}

interface ChatContextType {
  messages: ChatMessage[];
  activeCharts: Chart[];
  chatSessions: ChatSession[];
  activeChatId: string | null;
  addMessage: (text: string, sender: ChatMessage['sender'], charts?: Chart[]) => void;
  addChart: (chart: Chart) => void;
  removeChart: (id: string) => void;
  updateChart: (id: string, chart: Partial<Chart>) => void;
  clearChat: () => void;
  startNewChat: () => void;
  switchChat: (chatId: string) => void;
  getMessagesForChat: (chatId?: string) => ChatMessage[];
  deleteMessage: (messageId: string) => void;
  deleteChat: (chatId: string) => void;
}

const mockChartData = {
  line: {
    data: Array.from({ length: 20 }, (_, i) => ({
      name: `${i+1}`,
      value: Math.floor(Math.random() * 1000) + 500
    }))
  },
  bar: {
    data: Array.from({ length: 10 }, (_, i) => ({
      name: `${String.fromCharCode(65 + i)}`,
      value: Math.floor(Math.random() * 1000)
    }))
  },
  area: {
    data: Array.from({ length: 12 }, (_, i) => ({
      name: `${i+1}`,
      value: Math.floor(Math.random() * 1000) + 200
    }))
  },
  candlestick: {
    data: Array.from({ length: 30 }, (_, i) => {
      const open = Math.random() * 100 + 50;
      const close = Math.random() * 100 + 50;
      return {
        name: `${i+1}`,
        open,
        close,
        high: Math.max(open, close) + Math.random() * 10,
        low: Math.min(open, close) - Math.random() * 10,
      };
    })
  }
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Sample initial charts for demonstration
const initialCharts: Chart[] = [
  {
    id: 'chart-1',
    type: 'line',
    title: 'Stock 1',
    symbol: 'AAPL',
    timeframe: '1D',
    data: mockChartData.line.data
  },
  {
    id: 'chart-2',
    type: 'bar',
    title: 'Stock 2',
    symbol: 'MSFT',
    timeframe: '1D',
    data: mockChartData.bar.data
  }
];

// Create a default chat session
const createDefaultChatSession = (): ChatSession => ({
  id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  title: 'New Chat',
  createdAt: Date.now()
});

const exampleCharts: Chart[] = [
  {
    id: '1',
    type: 'line',
    title: 'Sample Line Chart',
    symbol: 'AAPL',
    timeframe: '1D',
    data: [
      { name: 'Jan', value: 100 },
      { name: 'Feb', value: 120 },
      { name: 'Mar', value: 115 },
    ],
  },
  {
    id: '2',
    type: 'bar',
    title: 'Sample Bar Chart',
    symbol: 'MSFT',
    timeframe: '1D',
    data: [
      { name: 'Jan', value: 200 },
      { name: 'Feb', value: 220 },
      { name: 'Mar', value: 215 },
    ],
  },
];

const createLineChart = (): Chart => ({
  id: crypto.randomUUID(),
  type: 'line',
  title: 'Line Chart',
  symbol: 'AAPL',
  timeframe: '1D',
  data: [
    { name: 'Jan', value: 100 },
    { name: 'Feb', value: 120 },
    { name: 'Mar', value: 115 },
  ],
});

const createBarChart = (): Chart => ({
  id: crypto.randomUUID(),
  type: 'bar',
  title: 'Bar Chart',
  symbol: 'MSFT',
  timeframe: '1D',
  data: [
    { name: 'Jan', value: 200 },
    { name: 'Feb', value: 220 },
    { name: 'Mar', value: 215 },
  ],
});

const createAreaChart = (): Chart => ({
  id: crypto.randomUUID(),
  type: 'area',
  title: 'Area Chart',
  symbol: 'GOOGL',
  timeframe: '1D',
  data: [
    { name: 'Jan', value: 300 },
    { name: 'Feb', value: 320 },
    { name: 'Mar', value: 315 },
  ],
});

const createCandlestickChart = (): Chart => ({
  id: crypto.randomUUID(),
  type: 'candlestick',
  title: 'Candlestick Chart',
  symbol: 'BTCUSD',
  timeframe: '1D',
  data: [
    { name: 'Jan', open: 100, close: 120, high: 125, low: 95 },
    { name: 'Feb', open: 120, close: 115, high: 130, low: 110 },
    { name: 'Mar', open: 115, close: 130, high: 135, low: 110 },
  ],
});

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedMessages = localStorage.getItem('chartChatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });

  const [activeCharts, setActiveCharts] = useState<Chart[]>(() => {
    const savedCharts = localStorage.getItem('chartChatActiveCharts');
    return savedCharts ? JSON.parse(savedCharts) : [];
  });
  
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const savedSessions = localStorage.getItem('chartChatSessions');
    const sessions = savedSessions ? JSON.parse(savedSessions) : [createDefaultChatSession()];
    return sessions;
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    const savedActiveChatId = localStorage.getItem('chartChatActiveChatId');
    return savedActiveChatId || chatSessions[0]?.id || null;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chartChatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chartChatActiveCharts', JSON.stringify(activeCharts));
  }, [activeCharts]);

  useEffect(() => {
    localStorage.setItem('chartChatSessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem('chartChatActiveChatId', activeChatId);
    }
  }, [activeChatId]);

  const addMessage = (text: string, sender: ChatMessage['sender'], charts: Chart[] = []) => {
    if (!activeChatId) return;
    
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      sender,
      timestamp: Date.now(),
      charts,
      chatId: activeChatId
    };

    setMessages(prev => [...prev, newMessage]);

    // If message contains charts, add them to active charts
    if (charts.length > 0) {
      setActiveCharts(prev => [...prev, ...charts]);
    }
  };

  const addChart = (chart: Chart) => {
    setActiveCharts(prev => [...prev, chart]);
  };

  const removeChart = (id: string) => {
    setActiveCharts(prev => prev.filter(chart => chart.id !== id));
  };

  const updateChart = (id: string, updates: Partial<Chart>) => {
    setActiveCharts(prev => prev.map(chart => 
      chart.id === id ? { ...chart, ...updates } : chart
    ));
  };

  const clearChat = () => {
    if (!activeChatId) return;
    setMessages(prev => prev.filter(msg => msg.chatId !== activeChatId));
  };

  const startNewChat = () => {
    const newSession = createDefaultChatSession();
    setChatSessions(prev => [...prev, newSession]);
    setActiveChatId(newSession.id);
    return newSession.id;
  };

  const switchChat = (chatId: string) => {
    if (chatSessions.some(session => session.id === chatId)) {
      setActiveChatId(chatId);
    }
  };

  const deleteChat = (chatId: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== chatId));
    setMessages(prev => prev.filter(msg => msg.chatId !== chatId));
    
    if (activeChatId === chatId) {
      const remainingSessions = chatSessions.filter(session => session.id !== chatId);
      if (remainingSessions.length > 0) {
        setActiveChatId(remainingSessions[0].id);
      } else {
        const newSession = createDefaultChatSession();
        setChatSessions([newSession]);
        setActiveChatId(newSession.id);
      }
    }
  };

  const getMessagesForChat = (chatId: string = activeChatId || '') => {
    return messages.filter(msg => msg.chatId === chatId);
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        activeCharts,
        chatSessions,
        activeChatId,
        addMessage,
        addChart,
        removeChart,
        updateChart,
        clearChat,
        startNewChat,
        switchChat,
        getMessagesForChat,
        deleteMessage,
        deleteChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Helper to create mock chart data for demonstration purposes
export const generateMockChart = (type: Chart['type'], title: string): Chart => {
  const id = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const symbols = {
    line: 'AAPL',
    bar: 'MSFT',
    area: 'GOOGL',
    candlestick: 'BTCUSD'
  };

  return {
    id,
    type,
    title,
    symbol: symbols[type],
    timeframe: '1D',
    data: []
  };
};