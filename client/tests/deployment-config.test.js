import { afterEach, expect, it, vi } from "vitest";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});
it("keeps the separately hosted client deployment as an SPA", async () => {
  const { config } = await import("../vercel.mjs");
  expect(config.rewrites).toEqual([
    { source: "/((?!assets/).*)", destination: "/index.html" },
  ]);
  expect(config.installCommand).toContain("deno@2.9.7 install --frozen");
});
