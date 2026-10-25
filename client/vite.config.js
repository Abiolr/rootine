import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@mediapipe/pose": fileURLToPath(new URL("./src/mediapipePoseStub.js", import.meta.url)),
    },
  },
});