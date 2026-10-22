export const config = {
  installCommand: "bun install",
  buildCommand: "bun run build",
  outputDirectory: "dist",
  "functions": {
    "api/index.js": { "maxDuration": 60, "includeFiles": "dist/**" }
  },
  rewrites: [
    { source: "/(.*)", destination: "/api/index" }
  ]
}
