import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Cloudflare Pages and custom domains serve from the root; GitHub Pages injects its repository subpath in CI.
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: true,
  },
});
