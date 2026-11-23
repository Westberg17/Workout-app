import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" gör att appen fungerar oavsett var den hostas (GitHub Pages-undermapp, Netlify, Cloudflare ...)
export default defineConfig({
  base: "./",
  plugins: [react()],
});
