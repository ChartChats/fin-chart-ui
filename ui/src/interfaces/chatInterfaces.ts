
export interface Message {
  content: string;
  role: 'user' | 'system';
  timestamp: string;
  action_type?: string;
  charts?: any[];
  message?: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  messages: Message[];
}