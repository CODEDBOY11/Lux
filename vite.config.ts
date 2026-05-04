import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
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
  };
});
