import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // nói rõ nơi xuất file build
  build: { outDir: "dist" },

  // (tùy chọn) nếu bạn chỉ dùng cho dev local thì giữ block server,
  // còn deploy Railway không cần:
  // server: {
  //   host: true,
  //   allowedHosts: ["cinderlike-unduteously-korey.ngrok-free.dev"],
  // },
});
