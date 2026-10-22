import { resolve } from "path";
import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
// import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  clearScreen: false,
  // publicDir: 'src/assets',
  // root: "src",
  // logLevel: 'info',

  server: {
    host: true,
  },

  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
    },
  },

  plugins: [
    // react(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    devtools(),
    tailwindcss(),
    // tanstackStart({
    //   // router: {
    //   //   disableTypes: true,
    //   //   // generatedRouteTree: './src/tree.js',
    //   // },
    // }),
    viteReact(),
    // tanstackRouter({
    //   target: 'react',
    //   disableTypes: true,
    // }),
  ],
});
