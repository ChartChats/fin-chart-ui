import express, { Request, Response, Router, RequestHandler } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from "uuid";

// Mock data for chart indicator responses
const generateMockChartIndicatorData = (symbol: string) => {
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

// Mock data for chart indicator responses
const generateMockChartPatternData = (symbol: string, fileName: string = '') => {
  const filePath = path.join(__dirname, 'src', 'mock', 'charts', fileName);
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileData);
  }
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
    configureServer(server: any) {
      const app = express();
      const router = Router();
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

      const getChartHandler: RequestHandler = (req, res) => {
        const chartId = req.params.id;
        const chartFilePath = path.join(chartsDir, `${chartId}.json`);

        if (!fs.existsSync(chartFilePath)) {
          res.status(404).json({ error: 'Chart not found' });
          return;
        }
        const chartData = fs.readFileSync(chartFilePath, 'utf-8');
        res.status(200).json(JSON.parse(chartData));
      }

      // Chart API routes
      const getChartsHandler: RequestHandler = (req, res) => {
        if (!fs.existsSync(chartsDir)) {
          res.status(200).json([]);
          return;
        }

        const chartFiles = fs.readdirSync(chartsDir);
        const charts = chartFiles.map(file => {
          const filePath = path.join(chartsDir, file);
          const data = fs.readFileSync(filePath, 'utf-8');
          return JSON.parse(data);
        });
        res.status(200).json(charts);
      };

      const postChartHandler: RequestHandler = (req, res) => {
        const chart = req.body;
        const chartId = chart.id || `chart-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        chart.id = chartId;

        const chartFilePath = path.join(chartsDir, `${chartId}.json`);
        fs.writeFileSync(chartFilePath, JSON.stringify(chart, null, 2));
        res.status(201).json(chart);
      };

      const patchChartHandler: RequestHandler = (req, res) => {
        const chartId = req.params.id;
        const chartFilePath = path.join(chartsDir, `${chartId}.json`);

        if (!fs.existsSync(chartFilePath)) {
          res.status(404).json({ error: 'Chart not found' });
          return;
        }

        const existingChart = JSON.parse(fs.readFileSync(chartFilePath, 'utf-8'));
        const updatedChart = { ...existingChart, ...req.body.data };

        fs.writeFileSync(chartFilePath, JSON.stringify(updatedChart, null, 2));
        res.status(200).json(updatedChart);
      };

      const deleteChartHandler: RequestHandler = (req, res) => {
        const chartId = req.params.id;
        const chartFilePath = path.join(chartsDir, `${chartId}.json`);

        if (fs.existsSync(chartFilePath)) {
          fs.unlinkSync(chartFilePath);
        }

        res.status(200).json({ message: 'Chart deleted' });
      };

      // Apply the handlers to the router
      router.get('/chart/:id', getChartHandler);
      router.get('/chart', getChartsHandler);
      router.post('/chart', postChartHandler);
      router.patch('/chart/:id', patchChartHandler);
      router.delete('/chart/:id', deleteChartHandler);

      // Create chats directory if it doesn't exist
      const chatsDir = path.join(mockFile, 'chats');
      if (!fs.existsSync(chatsDir)) {
        fs.mkdirSync(chatsDir, { recursive: true });
      }

      // Chat API routes
      const getChatsHandler: RequestHandler = (req, res) => {
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
      };

      const createChatHandler: RequestHandler = (req, res) => {
        const uuid = uuidv4();
        const chatFilePath = path.join(mockFile, 'chats', `chat-${uuid}.json`);
        fs.writeFileSync(chatFilePath, JSON.stringify({
          id: uuid,
          messages: []
        }, null, 2));
        res.status(201).json({ id: uuid });
      };

      const getChatHandler: RequestHandler = (req, res) => {
        const chatId = req.query.chat_id;
        const dataFilePath = path.join(mockFile, 'chats', `chat-${chatId}.json`);
        const data = fs.readFileSync(dataFilePath, 'utf-8');
        res.status(200).json(JSON.parse(data));
      };

      const postMessageHandler: RequestHandler = (req, res) => {
        const chatId = req.params.id;
        const message = req.body;
        const dataFilePath = path.join(mockFile, 'chats', `chat-${chatId}.json`);
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
        
        let timeOutMilliseconds = 1000;

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Add the user message to stored chat data
        data.messages.push(message);

        // Helper function to send SSE messages
        const sendSSEMessage = (messageData: any) => {
          res.write(`data: ${JSON.stringify(messageData)}\n\n`);
        };

        console.log("I am here");

        // Simulate streaming responses with delays
        setTimeout(() => {
          // Send chart data response
          const chartResponse = generateMockChartIndicatorData('MSFT');
          const chartMessage = {
            role: 'system',
            content: JSON.stringify(chartResponse)
          };
          sendSSEMessage(chartMessage);
          data.messages.push(chartMessage);
        }, timeOutMilliseconds);

        // Increase the delay for the next message
        timeOutMilliseconds += 2000;

        // Send the pattern data response after a delay
        setTimeout(() => {
          const patternResponse = generateMockChartPatternData('MSFT', 'bullish_obr.json');
          const patternMessage = {
            role: 'system',
            content: JSON.stringify(patternResponse)
          };
          sendSSEMessage(patternMessage);
          data.messages.push(patternMessage);
        }, timeOutMilliseconds);

        // Increase the delay for the next message
        timeOutMilliseconds += 2000;

        // Send LLM response after another delay
        setTimeout(() => {
          const llmResponse = generateLLMResponse(
            "I've displayed the RSI indicator chart for Microsoft (MSFT). If you have any more questions or need further analysis, feel free to ask!"
          );
          const llmMessage = {
            role: 'system',
            content: JSON.stringify(llmResponse)
          };
          sendSSEMessage(llmMessage);
          data.messages.push(llmMessage);

          // Save the updated chat data
          fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
        }, timeOutMilliseconds);

        // Increase the delay for the next message
        timeOutMilliseconds += 1000;

        // Send done event and end the connection
        setTimeout(() => {
          res.write(`data: ${JSON.stringify({ event: 'done' })}\n\n`);
          res.end();
        }, timeOutMilliseconds);
      };

      const deleteChatHandler: RequestHandler = (req, res) => {
        const chatId = req.params.id;
        const dataFilePath = path.join(mockFile, 'chats', `chat-${chatId}.json`);
        if (fs.existsSync(dataFilePath)) {
          fs.unlinkSync(dataFilePath);
        }
        res.status(200).json({ message: 'Chat deleted' });
      };

      // Apply the handlers to the router
      router.get('/chat/chats', getChatsHandler);
      router.post('/chat/create', createChatHandler);
      router.get('/chat', getChatHandler);
      router.post('/chat/:id/message', postMessageHandler);
      router.delete('/chat/:id', deleteChatHandler);

      // Mount the router
      app.use('/api', router);

      // Use the Express app as middleware
      server.middlewares.use(app);
    }
  };
};