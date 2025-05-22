import express from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from "uuid";

// Mock data for chart responses
const generateMockChartData = (symbol: string) => {
  const now = Math.floor(Date.now() / 1000);
  const oneYearAgo = now - 365 * 24 * 60 * 60;

  return {
    action_type: "plot_indicator",
    ticker: symbol,
    from_date: oneYearAgo.toString(),
    to_date: now.toString(),
    interval: "1D",
    exchange: "NASDAQ",
    description: `${symbol} Inc.`,
    indicators: [
      {
        name: "Relative Strength Index",
        value: "rsi",
        properties: {
          period: "14",
          overbought_level: "70",
          oversold_level: "30"
        }
      }
    ]
  };
};

const generateLLMResponse = (message: string) => {
  return {
    action_type: "llm_response",
    message
  };
};

export const mockApiPlugin = () => {
  return {
    name: 'mock-api',
    configureServer(server) {
      const app = express();
      app.use(express.json());
      
      // Add CORS headers to all routes
      app.use('/api', (req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
          return;
        }
        next();
      });

      const mockFile = path.resolve(__dirname, 'src/mock');
      

      // Create charts directory if it doesn't exist
      const chartsDir = path.join(mockFile, 'charts');
      if (!fs.existsSync(chartsDir)) {
        fs.mkdirSync(chartsDir, { recursive: true });
      }

      // Chart API routes
      app.get('/api/chart', (req, res) => {
        if (!fs.existsSync(chartsDir)) {
          return res.status(200).json([]);
        }
        
        const chartFiles = fs.readdirSync(chartsDir);
        const charts = chartFiles.map(file => {
          const filePath = path.join(chartsDir, file);
          const data = fs.readFileSync(filePath, 'utf-8');
          return JSON.parse(data);
        });
        res.status(200).json(charts);
      });
      
      app.post('/api/chart', (req, res) => {
        const chart = req.body;
        const chartId = chart.id || `chart-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        chart.id = chartId;
        
        const chartFilePath = path.join(chartsDir, `${chartId}.json`);
        fs.writeFileSync(chartFilePath, JSON.stringify(chart, null, 2));
        res.status(201).json(chart);
      });
      
      app.patch('/api/chart/:id', (req, res) => {
        const chartId = req.params.id;
        const chartFilePath = path.join(chartsDir, `${chartId}.json`);
        
        if (!fs.existsSync(chartFilePath)) {
          return res.status(404).json({ error: 'Chart not found' });
        }
        
        const existingChart = JSON.parse(fs.readFileSync(chartFilePath, 'utf-8'));
        const updatedChart = { ...existingChart, ...req.body.data };
        
        fs.writeFileSync(chartFilePath, JSON.stringify(updatedChart, null, 2));
        res.status(200).json(updatedChart);
      });
      
      app.delete('/api/chart/:id', (req, res) => {
        const chartId = req.params.id;
        const chartFilePath = path.join(chartsDir, `${chartId}.json`);
        
        if (fs.existsSync(chartFilePath)) {
          fs.unlinkSync(chartFilePath);
        }
        
        res.status(200).json({ message: 'Chart deleted' });
      });


      // Create chats directory if it doesn't exist
      const chatsDir = path.join(mockFile, 'chats');
      if (!fs.existsSync(chatsDir)) {
        fs.mkdirSync(chatsDir, { recursive: true });
      }

      // Chat API routes
      app.get('/api/chat/chats', (req, res) => {
        const chatFiles = fs.readdirSync(path.join(mockFile, 'chats'));
        const chats = chatFiles.map(file => {
          const filePath = path.join(mockFile, 'chats', file);
          const data = fs.readFileSync(filePath, 'utf-8');
          const chatData = JSON.parse(data);
          return {
            id: chatData.id,
            title: chatData.title || `Chat ${new Date(chatData.createdAt || Date.now()).toLocaleString()}`,
            createdAt: chatData.createdAt || Date.now()
          };
        });
        res.status(200).json(chats);
      });

      app.post('/api/chat/create', (req, res) => {
        const uuid = uuidv4();
        const chatFilePath = path.join(mockFile, 'chats', `chat-${uuid}.json`);
        fs.writeFileSync(chatFilePath, JSON.stringify({
          id: uuid,
          messages: []
        }, null, 2));
        res.status(201).json({ id: uuid });
      });

      app.get('/api/chat', (req, res) => {
        const chatId = req.query.chat_id;
        const dataFilePath = path.join(mockFile, 'chats', `chat-${chatId}.json`);
        const data = fs.readFileSync(dataFilePath, 'utf-8');
        res.status(200).json(JSON.parse(data));
      });

      app.post('/api/chat/:id/message', (req, res) => {
        const chatId = req.params.id;
        const message = req.body;
        const dataFilePath = path.join(mockFile, 'chats', `chat-${chatId}.json`);
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

        let serverResponse: string = '';
        let messageData: any = {};
        const newMessages: any = [];
        
        // Add the user message
        data.messages.push(message);

        // Add chart data response
        serverResponse = JSON.stringify(generateMockChartData('MSFT'));
        messageData = {
          role: 'system',
          content: serverResponse
        };
        newMessages.push(messageData);
        data.messages.push(messageData);

        // Add LLM response
        serverResponse = JSON.stringify(generateLLMResponse(
          "I've displayed the RSI indicator chart for Microsoft (MSFT). If you have any more questions or need further analysis, feel free to ask!"
        ));
        messageData = {
          role: 'system',
          content: serverResponse
        };
        newMessages.push(messageData);
        data.messages.push(messageData);

        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
        res.status(200).json({
          id: chatId,
          messages: newMessages,
        });
      });

      app.delete('/api/chat/:id', (req, res) => {
        const chatId = req.params.id;
        const dataFilePath = path.join(mockFile, 'chats', `chat-${chatId}.json`);
        if (fs.existsSync(dataFilePath)) {
          fs.unlinkSync(dataFilePath);
        }
        res.status(200).json({ message: 'Chat deleted' });
      });

      // Use the Express app as middleware
      server.middlewares.use(app);
    }
  };
};