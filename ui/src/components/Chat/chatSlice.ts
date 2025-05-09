import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  chatId: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
}

export interface ChatState {
  messages: Message[];
  sessions: ChatSession[];
  activeSessionId: string | null;
}

const createDefaultSession = (): ChatSession => ({
  id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  title: 'New Chat',
  createdAt: Date.now()
});

const initialState: ChatState = {
  messages: [],
  sessions: [createDefaultSession()],
  activeSessionId: null
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addSession: (state) => {
      const newSession = createDefaultSession();
      state.sessions.push(newSession);
      state.activeSessionId = newSession.id;
    },
    deleteSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(session => session.id !== action.payload);
      state.messages = state.messages.filter(msg => msg.chatId !== action.payload);
      
      if (state.activeSessionId === action.payload) {
        state.activeSessionId = state.sessions[0]?.id || null;
      }
    },
    setActiveSession: (state, action: PayloadAction<string>) => {
      if (state.sessions.some(session => session.id === action.payload)) {
        state.activeSessionId = action.payload;
      }
    },
    addMessage: (state, action: PayloadAction<{ chatId: string; text: string; sender: 'user' | 'system' }>) => {
      const { chatId, text, sender } = action.payload;
      if (!state.sessions.some(session => session.id === chatId)) return;

      const newMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        sender,
        chatId,
        timestamp: Date.now()
      };

      state.messages.push(newMessage);

      // Update session title for new chats based on first user message
      if (sender === 'user') {
        const session = state.sessions.find(s => s.id === chatId);
        if (session?.title === 'New Chat') {
          const shortTitle = text.length > 20 ? `${text.substring(0, 20)}...` : text;
          const sessionIndex = state.sessions.findIndex(s => s.id === chatId);
          if (sessionIndex !== -1) {
            state.sessions[sessionIndex].title = shortTitle;
          }
        }
      }
    },
    deleteMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(msg => msg.id !== action.payload);
    },
    clearChat: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(msg => msg.chatId !== action.payload);
    }
  }
});

export const {
  addSession,
  deleteSession,
  setActiveSession,
  addMessage,
  deleteMessage,
  clearChat
} = chatSlice.actions;

export default chatSlice.reducer; 