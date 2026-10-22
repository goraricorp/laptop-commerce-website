export const config = {
  installCommand:
    "cd .. && npx --yes deno@2.9.7 install --frozen --allow-scripts=npm:@tailwindcss/oxide,npm:esbuild,npm:unrs-resolver",
  buildCommand: "npx --yes deno@2.9.7 task build",
  outputDirectory: "dist",
  rewrites: [
    { source: "/((?!assets/).*)", destination: "/index.html" },
  ],
};
