import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // cho phép truy cập từ mạng ngoài
    allowedHosts: [
      "cinderlike-unduteously-korey.ngrok-free.dev", // host ngrok của bạn
    ],
  },
});
