import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The API base URL is read at build/runtime from VITE_API_URL.
// In dev we proxy /api to the backend so the frontend can use relative URLs.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5099",
        changeOrigin: true,
      },
    },
  },
});
