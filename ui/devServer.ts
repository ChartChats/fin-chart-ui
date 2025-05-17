import fs from 'fs';
import express from 'express';
import path from 'path';

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

      // get all chats and their ids
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


      // createChat
      app.post('/api/chat/create', (req, res) => {
        const uuid = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const chatFilePath = path.join(mockFile, 'chats', `chat-${uuid}.json`);

        console.log('Creating chat file:', chatFilePath);

        fs.writeFileSync(chatFilePath, JSON.stringify({
          id: uuid,
          messages: []
        }, null, 2));

        // Return the new chat ID
        setTimeout(() => {
          res.status(201).json({ id: uuid });
        }, 1000);
      });


      // getChat
      app.get('/api/chat', (req, res) => {
        const chatId = req.query.chat_id;
        const dataFilePath = path.join(mockFile, 'chats', `chat-${chatId}.json`);

        const data = fs.readFileSync(dataFilePath, 'utf-8');

        setTimeout(() => {
          res.status(200).json(data);
        }, 1000);
      });


      // add message
      app.post('/api/chat/:id/message', (req, res) => {
        const chatId = req.params.id;
        const message = req.body;

        const dataFilePath = path.join(mockFile, 'chats', `chat-${chatId}.json`);

        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
        data.messages.push(message);

        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

        setTimeout(() => {
          res.status(200).json(data);
        }, 1000);
      });

      
      // delete chat
      app.delete('/api/chat/:id', (req, res) => {
        const chatId = req.params.id;
        const dataFilePath = path.join(mockFile, 'chats', `chat-${chatId}.json`);

        if (fs.existsSync(dataFilePath)) {
          fs.unlinkSync(dataFilePath);
        }

        setTimeout(() => {
          res.status(200).json({ message: 'Chat deleted' });
        }, 1000);
      });

      server.middlewares.use(app);
    }
  };
};