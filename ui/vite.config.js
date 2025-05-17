import { defineConfig } from 'vite';
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { mockApiPlugin } from './devServer.js';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  return {
    plugins: [
      react(),
      isDev && mockApiPlugin()
    ],
    define: {
      'process.env': {}
    },
    server: {
      port: 3000,
      strictPort: true
    },
    resolve: {
      alias: {
        '/charting_library/': '/public/charting_library/',
        "@": path.resolve(__dirname, "./src"),
      }
    },
  };
});
