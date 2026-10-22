import { defineConfig } from "vite";
export default defineConfig({
  appType: "custom",
  publicDir: false,
  server: {
    host: true,
    strictPort: true
  },
  ssr: {
    noExternal: true,
  },
  plugins: [
    {
      name: "express-dev-server",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            const { default: app } = await server.ssrLoadModule("/src/index.js");
            app(req, res, next);
          } catch (error) {
            server.ssrFixStacktrace(error);
            next(error);
          }
        });
      },
    },
  ],
  build: {
    ssr: "src/index.js",
    target: "node24",
    outDir: "dist",
    sourcemap: true,
    rolldownOptions: { output: { entryFileNames: "index.js" } },
  },
});
