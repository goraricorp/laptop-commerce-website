import session from "express-session";
import { createHmac } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "../database/index.js";
import { betterAuthSecret, clientUrl } from "../lib/utils/environment.js";
export class PostgresSessionStore extends session.Store {
  constructor(database = db) {
    super();
    this.database = database;
  }
  get(sid, done) {
    this.database
      .execute(
        sql`select data from http_session where sid=${sid} and expires_at>now()`,
      )
      .then((result) => done(null, result.rows[0]?.data ?? null), done);
  }
  set(sid, data, done = () => {}) {
    const expiresAt = data.cookie?.expires
      ? new Date(data.cookie.expires)
      : new Date(Date.now() + 28800000);
    this.database
      .execute(
        sql`insert into http_session(sid,data,expires_at) values(${sid},${JSON.stringify(data)}::jsonb,${expiresAt}) on conflict(sid) do update set data=excluded.data,expires_at=excluded.expires_at`,
      )
      .then(() => done(), done);
  }
  destroy(sid, done = () => {}) {
    this.database
      .execute(sql`delete from http_session where sid=${sid}`)
      .then(() => done(), done);
  }
  touch(sid, data, done = () => {}) {
    const expiresAt = data.cookie?.expires
      ? new Date(data.cookie.expires)
      : new Date(Date.now() + 28800000);
    this.database
      .execute(
        sql`update http_session set expires_at=${expiresAt} where sid=${sid}`,
      )
      .then(() => done(), done);
  }
}
export function auxiliarySession({ store = new PostgresSessionStore() } = {}) {
  return session({
    name: "lc.http.sid",
    secret: createHmac("sha256", betterAuthSecret)
      .update("express-auxiliary-session-v1")
      .digest("hex"),
    store,
    resave: false,
    saveUninitialized: false,
    rolling: false,
    unset: "destroy",
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(clientUrl).protocol === "https:",
      path: "/",
      maxAge: 28800000,
    },
  });
}
export async function cleanupHttpSessions(database = db) {
  return database.execute(
    sql`delete from http_session where sid in(select sid from http_session where expires_at<=now() order by expires_at limit 100)`,
  );
}
