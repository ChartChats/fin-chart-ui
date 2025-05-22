import { defineConfig, loadEnv } from 'vite';
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { mockApiPlugin } from './devServer.js';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  const isMock = env.MOCK_DATA === 'true';
  const serverUrl = env.BACKEND_SERVER_URL || 'http://localhost:8000';

  return {
    plugins: [
      react(),
      isMock && mockApiPlugin()
    ],
    define: {
      'process.env': {
        LLM_SERVER_URL: env.LLM_SERVER_URL,
        BACKEND_SERVER_URL: env.BACKEND_SERVER_URL
      }
    },
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: serverUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    resolve: {
      alias: {
        '/charting_library/': '/public/charting_library/',
        "@": path.resolve(__dirname, "./src"),
      }
    },
  };
});
