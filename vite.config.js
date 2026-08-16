import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages keeps the repository subpath by default; Cloudflare/root hosting can set VITE_BASE_PATH=/.
  base: process.env.VITE_BASE_PATH || "/Conform-2938103840/",
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: true,
  },
});
