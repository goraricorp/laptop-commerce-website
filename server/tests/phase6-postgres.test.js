import { beforeAll, afterAll, describe, it, expect } from "vitest";
import express from "express";
import process from "node:process";
import { randomUUID } from "node:crypto";
import { request } from "./helpers/request.js";
const enabled = process.env.RUN_PHASE1_POSTGRES_TESTS === "true";
let db, pool, auxiliarySession, PostgresSessionStore, cleanupHttpSessions;
const promisify = (store, method, ...args) =>
  new Promise((resolve, reject) =>
    store[method](...args, (error, result) =>
      error ? reject(error) : resolve(result),
    ),
  );
describe.skipIf(!enabled)(
  "Phase 6 native express-session and PostgreSQL persistence",
  () => {
    beforeAll(async () => {
      if (
        new URL(process.env.PHASE1_DATABASE_URL).hostname !== "127.0.0.1" ||
        process.env.DATABASE_URL !== process.env.PHASE1_DATABASE_URL
      )
        throw Error("Disposable localhost PostgreSQL required");
      ({ db, pool } = await import("../src/database/index.js"));
      ({ auxiliarySession, PostgresSessionStore, cleanupHttpSessions } =
        await import("../src/middlewares/session.js"));
    });
    afterAll(async () => {
      await pool?.end();
    });
    it("keeps auxiliary session state across two Express instances with secure cookie controls and no anonymous cookie", async () => {
      function instance() {
        const app = express();
        app.set("trust proxy", 1);
        app.use(auxiliarySession({ store: new PostgresSessionStore(db) }));
        app.get("/read", (req, res) =>
          res.json({ marker: req.session.marker ?? null }),
        );
        app.post("/write", (req, res) => {
          req.session.marker = "local-" + randomUUID();
          res.json({ marker: req.session.marker });
        });
        app.post("/destroy", (req, res, next) =>
          req.session.destroy((error) =>
            error ? next(error) : res.json({ destroyed: true }),
          ),
        );
        return app;
      }
      const a = instance(),
        b = instance(),
        headers = { "x-forwarded-proto": "https" };
      const empty = await request(a, "/read", { headers });
      expect(empty.headers.getSetCookie()).toHaveLength(0);
      const written = await request(a, "/write", { method: "POST", headers }),
        data = await written.json(),
        raw = written.headers.get("set-cookie");
      expect(raw).toContain("lc.http.sid=");
      expect(raw).toContain("HttpOnly");
      expect(raw).toContain("SameSite=Lax");
      expect(raw).not.toContain("session_token");
      const cookie = written.headers
          .getSetCookie()
          .map((c) => c.split(";")[0])
          .join("; "),
        read = await request(b, "/read", { headers: { ...headers, cookie } });
      expect(await read.json()).toEqual(data);
      expect(
        (
          await request(b, "/destroy", {
            method: "POST",
            headers: { ...headers, cookie },
          })
        ).status,
      ).toBe(200);
      expect(
        await (
          await request(a, "/read", { headers: { ...headers, cookie } })
        ).json(),
      ).toEqual({ marker: null });
    });
    it("expires and prunes auxiliary sessions in bounded jobs without startup timers", async () => {
      const store = new PostgresSessionStore(db),
        id = randomUUID();
      await promisify(store, "set", id, {
        cookie: { expires: new Date(Date.now() - 1000) },
        value: "expired-fixture",
      });
      expect(await promisify(store, "get", id)).toBeNull();
      await cleanupHttpSessions(db);
      expect(
        (await pool.query("select sid from http_session where sid=$1", [id]))
          .rows,
      ).toHaveLength(0);
    });
    it("shares a single rate-limit budget across instances under concurrent PostgreSQL requests", async () => {
      const { rateLimit } = await import("../src/middlewares/rate-limit.js"),
        actor = randomUUID();
      function instance() {
        const app = express();
        app.use((req, res, next) => {
          req.user = { id: actor };
          next();
        });
        app.use(
          rateLimit({ scope: "concurrency-p6", windowMs: 60000, limit: 3 }),
        );
        app.get("/", (req, res) => res.json({ ok: true }));
        return app;
      }
      const apps = [instance(), instance()],
        responses = await Promise.all(
          Array.from({ length: 8 }, (_, i) => request(apps[i % 2], "/")),
        );
      expect(responses.filter((r) => r.status === 200)).toHaveLength(3);
      expect(responses.filter((r) => r.status === 429)).toHaveLength(5);
    });
  },
);
