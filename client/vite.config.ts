import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // This only applies when you run `npm run dev` locally.
    // When deployed, Netlify uses the _redirects file instead.
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
