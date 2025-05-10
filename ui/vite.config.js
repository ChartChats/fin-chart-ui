import { defineConfig } from 'vite';
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  define: {
    'process.env': {}
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  resolve: {
    alias: {
      '/charting_library/': '/public/charting_library/',
      "@": path.resolve(__dirname, "./src"),
    }
  }
});
