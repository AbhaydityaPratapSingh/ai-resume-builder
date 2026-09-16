import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // The project lives on a Windows mount (/mnt/c), where inotify events do
    // not fire — without polling, file edits never trigger a reload.
    watch: { usePolling: true, interval: 300 },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
