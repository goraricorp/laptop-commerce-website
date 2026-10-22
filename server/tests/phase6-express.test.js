import { beforeEach, describe, it, expect, vi } from "vitest";
import express from "express";
import { request } from "./helpers/request.js";
const state = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock("../src/database/index.js", () => ({ db: { execute: state.execute } }));
import {
  PostgresRateLimitStore,
  rateLimit,
} from "../src/middlewares/rate-limit.js";
import { parseBody, checkContentLength } from "../src/middlewares/body.js";
import { errorHandler } from "../src/middlewares/error.js";
beforeEach(() => vi.clearAllMocks());
describe("Express 5 request and shared middleware boundaries", () => {
  it("forwards rejected async handlers into JSON errors without leaking stack or secrets", async () => {
    const app = express();
    app.use(parseBody);
    app.get("/async", async () => {
      throw new Error("private-provider-token");
    });
    app.use(errorHandler);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await request(app, "/async");
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        message: "Internal server error",
      });
      expect(JSON.stringify(log.mock.calls)).not.toContain(
        "private-provider-token",
      );
    } finally {
      log.mockRestore();
    }
  });
  it("rejects malformed and oversized body payloads before business handlers", async () => {
    const handler = vi.fn((req, res) => res.json(req.body)),
      app = express();
    app.use(checkContentLength, parseBody);
    app.post("/json", handler);
    app.use(errorHandler);
    const bad = await request(app, "/json", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad",
    });
    expect(bad.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
    const large = await request(app, "/json", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "x".repeat(4100001) }),
    });
    expect(large.status).toBe(413);
    expect(handler).not.toHaveBeenCalled();
  });
  it("fails closed when the shared rate-limit store is unavailable", async () => {
    const app = express();
    app.use((req, res, next) => {
      req.user = { id: "fixture" };
      next();
    });
    app.use(
      rateLimit({
        scope: "phase6",
        windowMs: 60000,
        limit: 1,
        consume: async () => {
          throw Object.assign(Error("database unavailable"), { status: 503 });
        },
      }),
    );
    app.get("/", (req, res) => res.json({ allowed: true }));
    app.use(errorHandler);
    expect((await request(app, "/")).status).toBe(503);
  });
  it("adapts atomic PostgreSQL count/reset times for express-rate-limit without using instance memory", async () => {
    const consume = vi.fn().mockResolvedValue({ count: 2, last_request: 1000 }),
      store = new PostgresRateLimitStore({ consume });
    store.init({ windowMs: 60000 });
    expect(await store.increment("scoped-hash")).toEqual({
      totalHits: 2,
      resetTime: new Date(61000),
    });
    expect(store.localKeys).toBe(false);
    expect(consume).toHaveBeenCalledWith("scoped-hash", 60000);
  });
});
