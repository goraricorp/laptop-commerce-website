export const config = {
  installCommand: "bun install",
  buildCommand: "bun run build",
  outputDirectory: "dist",
  rewrites: [
    { source: "/((?!assets/).*)", destination: "/index.html" },
  ],
};
