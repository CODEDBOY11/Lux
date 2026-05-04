import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Ensure env variables are replaced in production builds
    __ENV_SUPABASE_URL__: JSON.stringify(process.env.VITE_SUPABASE_URL || ""),
    __ENV_SUPABASE_KEY__: JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY || "",
    ),
  },
  resolve: {
    alias: [
      {
        find: "react",
        replacement: path.resolve(__dirname, "node_modules/react"),
      },
      {
        find: "react-dom",
        replacement: path.resolve(__dirname, "node_modules/react-dom"),
      },
      {
        find: "react-router",
        replacement: path.resolve(__dirname, "node_modules/react-router"),
      },
      {
        find: "react-router-dom",
        replacement: path.resolve(__dirname, "node_modules/react-router-dom"),
      },
    ],
  },
});
