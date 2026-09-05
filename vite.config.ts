import { defineConfig } from "vite";
export default defineConfig({
  server: {
    host: "127.0.0.1",
    proxy: { "/socket": { target: "ws://127.0.0.1:3001", ws: true } },
  },
});
