export const config = {
  installCommand: "bun install --frozen-lockfile",
  buildCommand: "bun run build",
  outputDirectory: "dist",
  rewrites: [
    { source: "/((?!assets/).*)", destination: "/index.html" },
  ],
};
