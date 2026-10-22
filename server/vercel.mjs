export const config = {
  framework: "express",
  installCommand: "npx --yes bun@1.4.3 install --frozen-lockfile",
  buildCommand: "bun run build",
  functions: { "src/index.js": { maxDuration: 60 } },
}
