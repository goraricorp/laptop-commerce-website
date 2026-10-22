import { request as httpRequest } from "./helpers/request.js";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import process from "node:process";
import { randomUUID, createHmac } from "node:crypto";
vi.mock("../src/lib/email/mailer.js", () => ({
  sendVerificationOtpEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendNewsletterEmail: vi.fn(),
  sendOrderEventEmail: vi.fn(),
}));
vi.mock("../src/lib/upload/s3-client.js", () => ({
  deleteObject: vi.fn(),
  uploadObject: vi.fn(),
  getObjectUrl: vi.fn(async () => "https://storage.example.test/signed"),
}));
const enabled = process.env.RUN_PHASE1_POSTGRES_TESTS === "true";
let db,
  pool,
  s,
  auth,
  app,
  features,
  support,
  lifecycle,
  editor,
  env,
  buyer,
  other,
  staff,
  master,
  product,
  variant,
  category,
  location;
let ipSequence = 1;
const password = "phase5-fixture-password-123";
function mergeCookie(old = "", response) {
  const jar = new Map(
    old
      .split("; ")
      .filter(Boolean)
      .map((v) => [v.slice(0, v.indexOf("=")), v.slice(v.indexOf("=") + 1)]),
  );
  for (const v of response.headers.getSetCookie()) {
    const [pair] = v.split(";"),
      i = pair.indexOf("=");
    jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
  return [...jar].map(([k, v]) => k + "=" + v).join("; ");
}
async function authRequest(path, body, owner) {
  const response = await auth.handler(
    new Request(env.betterAuthUrl.replace(/\/$/, "") + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        origin: env.clientUrl,
        "x-forwarded-for": owner?.ip ?? "127.2.0.1",
        "content-type": "application/json",
        ...(owner ? { cookie: owner.cookie } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  );
  if (owner) owner.cookie = mergeCookie(owner.cookie, response);
  return {
    status: response.status,
    data:
      response.status >= 300 && response.status < 400
        ? null
        : response.headers.get("content-type")?.includes("json")
          ? await response.json()
          : null,
    response,
  };
}
async function fixture(role = "user") {
  const email = randomUUID() + "@example.test";
  const [person] = await db
    .insert(s.user)
    .values({ name: "P5 Fixture", email, emailVerified: true, role })
    .returning();
  const ctx = await auth.$context;
  await db.insert(s.account).values({
    userId: person.id,
    providerId: "credential",
    accountId: person.id,
    password: await ctx.password.hash(password),
  });
  const owner = { user: person, cookie: "", ip: "127.1.0." + ++ipSequence };
  expect(
    (await authRequest("/sign-in/email", { email, password }, owner)).status,
  ).toBe(200);
  return owner;
}
async function current(owner) {
  return auth.api.getSession({
    headers: new Headers({ cookie: owner.cookie }),
  });
}
async function request(
  path,
  owner,
  body,
  method = body === undefined ? "GET" : "POST",
  origin = env.clientUrl,
) {
  const response = await httpRequest(app, path, {
    method,
    headers: {
      origin,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(owner ? { cookie: owner.cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return {
    status: response.status,
    data:
      response.status >= 300 && response.status < 400
        ? null
        : response.headers.get("content-type")?.includes("json")
          ? await response.json()
          : null,
    response,
  };
}
function totp(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of secret.toUpperCase().replace(/=/g, ""))
    bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8)
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac("sha1", Buffer.from(bytes))
      .update(counter)
      .digest(),
    offset = digest[19] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(
    6,
    "0",
  );
}
async function enroll(owner) {
  const enabled = await authRequest("/two-factor/enable", { password }, owner);
  expect(enabled.status, JSON.stringify(enabled.data)).toBe(200);
  expect((await current(owner)).user.twoFactorEnabled).toBe(false);
  const secret = new URL(enabled.data.totpURI).searchParams.get("secret");
  expect(
    (
      await authRequest(
        "/two-factor/verify-totp",
        { code: totp(secret) },
        owner,
      )
    ).status,
  ).toBe(200);
  return { secret, codes: enabled.data.backupCodes };
}
function payload(overrides = {}) {
  return {
    requestId: randomUUID(),
    expectedVersion: null,
    product: {
      name: "P5 laptop",
      slug: "p5-" + randomUUID(),
      categoryId: category.id,
      status: "active",
    },
    variants: [
      {
        id: randomUUID(),
        sku: "P5-" + randomUUID(),
        name: "SKU",
        price: 100000,
        status: "active",
        attributeValueIds: [],
      },
    ],
    media: [],
    content: [],
    inventory: [],
    ...overrides,
  };
}
async function asset(owner, purpose = "support") {
  const key = `public/users/${owner.user.id}/${randomUUID()}.png`,
    url =
      env.serverUrl.replace(/\/$/, "") +
      "/storage/object?key=" +
      encodeURIComponent(key);
  await db
    .insert(s.uploadAssets)
    .values({ key, url, userId: owner.user.id, purpose });
  return { key, url };
}
describe.skipIf(!enabled)(
  "Phase 5 PostgreSQL: native auth, account lifecycle, product transaction and support ownership",
  () => {
    beforeAll(async () => {
      if (
        new URL(process.env.PHASE1_DATABASE_URL).hostname !== "127.0.0.1" ||
        process.env.DATABASE_URL !== process.env.PHASE1_DATABASE_URL
      )
        throw Error("Disposable localhost PostgreSQL required");
      ({ db, pool } = await import("../src/database/index.js"));
      s = await import("../src/database/schema.js");
      ({ auth } = await import("../src/lib/auth/index.js"));
      env = await import("../src/lib/utils/environment.js");
      app = (await import("../src/module.js")).default();
      features = await import("../src/services/account-features.js");
      support = await import("../src/services/support.js");
      lifecycle = await import("../src/services/account-lifecycle.js");
      editor = await import("../src/services/product-editor.js");
      buyer = await fixture();
      other = await fixture();
      staff = await fixture("moderator");
      master = await fixture("master");
      [category] = await db
        .insert(s.categories)
        .values({ name: "Laptop P5", slug: "laptop-p5-" + randomUUID() })
        .returning();
      [location] = await db
        .insert(s.inventoryLocations)
        .values({ code: "P5-" + randomUUID(), name: "Warehouse P5" })
        .returning();
      const data = payload();
      const result = await editor.saveProductEditor(
        randomUUID(),
        data,
        master.user,
      );
      product = result.product;
      variant = result.variants[0];
    }, 30000);
    afterAll(async () => {
      await pool?.end();
    });
    it("keeps favorites unique per owner; hides draft DTOs and validates comparison using current public SKUs", async () => {
      expect((await request("/me/favorites", null)).status).toBe(401);
      await Promise.all(
        Array.from({ length: 5 }, () =>
          features.setFavorite(buyer.user.id, product.id, true),
        ),
      );
      expect((await features.favoriteList(buyer.user.id)).total).toBe(1);
      expect((await features.favoriteList(other.user.id)).total).toBe(0);
      const listed = (await features.favoriteList(buyer.user.id)).items[0];
      expect(listed).not.toHaveProperty("version");
      const compared = await features.comparison({ variantIds: [variant.id] });
      expect(compared.items[0].variant).not.toHaveProperty("costPrice");
      await expect(
        features.comparison({ variantIds: [variant.id, variant.id] }),
      ).rejects.toMatchObject({ status: 400 });
      await pool.query("update product set status='draft' where id=$1", [
        product.id,
      ]);
      expect((await features.favoriteList(buyer.user.id)).total).toBe(0);
      await expect(
        features.comparison({ variantIds: [variant.id] }),
      ).rejects.toMatchObject({ status: 404 });
      await pool.query("update product set status='active' where id=$1", [
        product.id,
      ]);
      expect(
        (
          await request(
            "/me/favorites/" + product.id,
            buyer,
            {},
            "PUT",
            "https://evil.test",
          )
        ).status,
      ).toBe(403);
    });
    it("persists notification preferences per account and keeps default transactional consent separate", async () => {
      expect(await features.preferences(buyer.user.id)).toEqual({
        transactional: true,
        marketing: false,
      });
      await features.preferences(buyer.user.id, {
        transactional: false,
        marketing: true,
      });
      expect(await features.transactionalEmailAllowed(buyer.user.id)).toBe(
        false,
      );
      expect(await features.preferences(other.user.id)).toEqual({
        transactional: true,
        marketing: false,
      });
      expect(
        (
          await request(
            "/me/preferences",
            buyer,
            { transactional: true, marketing: true, userId: other.user.id },
            "PATCH",
          )
        ).status,
      ).toBe(400);
    });
    it("stores only hashed newsletter tokens and encrypted outbox material; confirms and unsubscribes once", async () => {
      const email = randomUUID() + "@example.test";
      await expect(
        features.subscribeNewsletter({ email, consent: false }),
      ).rejects.toThrow();
      const accepted = await features.subscribeNewsletter({
        email,
        consent: true,
      });
      expect(accepted).not.toHaveProperty("token");
      const sub = (
        await pool.query(
          "select * from newsletter_subscription where email=$1",
          [email],
        )
      ).rows[0];
      expect(sub.state).toBe("pending");
      const { symmetricDecrypt } = await import("better-auth/crypto");
      const tokenPayload = async (purpose) =>
        (
          await pool.query(
            "select payload from outbox where kind='newsletter_email' and payload->>'subscriptionId'=$1 and payload->>'purpose'=$2 order by created_at desc limit 1",
            [sub.id, purpose],
          )
        ).rows[0].payload;
      const raw = await symmetricDecrypt({
        key: env.betterAuthSecret,
        data: (await tokenPayload("confirm")).encryptedToken,
      });
      await features.dispatchNewsletter(await tokenPayload("confirm"));
      const delivery = await import("../src/lib/email/mailer.js");
      expect(delivery.sendNewsletterEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email,
          purpose: "confirm",
          url: expect.stringContaining("purpose=confirm"),
        }),
      );
      delivery.sendNewsletterEmail.mockClear();
      expect(
        (
          await pool.query(
            "select * from newsletter_token where subscription_id=$1",
            [sub.id],
          )
        ).rows[0].hash,
      ).not.toBe(raw);
      await expect(
        features.newsletterAction({ token: raw, purpose: "unsubscribe" }),
      ).rejects.toMatchObject({ status: 400 });
      const result = await Promise.all(
        [1, 2].map(() =>
          features.newsletterAction({ token: raw, purpose: "confirm" }),
        ),
      );
      expect(result.map((r) => r.status).sort()).toEqual([
        "already_processed",
        "confirmed",
      ]);
      const unsub = await symmetricDecrypt({
        key: env.betterAuthSecret,
        data: (await tokenPayload("unsubscribe")).encryptedToken,
      });
      expect(
        (
          await features.newsletterAction({
            token: unsub,
            purpose: "unsubscribe",
          })
        ).status,
      ).toBe("unsubscribed");
      await features.newsletterAction({ token: raw, purpose: "confirm" });
      expect(
        (
          await pool.query(
            "select state from newsletter_subscription where id=$1",
            [sub.id],
          )
        ).rows[0].state,
      ).toBe("unsubscribed");
      await features.subscribeNewsletter({ email, consent: true });
      const next = await symmetricDecrypt({
        key: env.betterAuthSecret,
        data: (await tokenPayload("confirm")).encryptedToken,
      });
      await pool.query(
        "update newsletter_token set expires_at=now()-interval '1 second' where subscription_id=$1 and used_at is null",
        [sub.id],
      );
      await expect(
        features.newsletterAction({ token: next, purpose: "confirm" }),
      ).rejects.toMatchObject({ status: 400 });
      await features.dispatchNewsletter(await tokenPayload("confirm"));
      const mail = await import("../src/lib/email/mailer.js");
      expect(mail.sendNewsletterEmail).not.toHaveBeenCalled();
    });
    it("checks support owner/assignment, idempotent commands and cursor scope; private images require authorization", async () => {
      const image = await asset(buyer);
      const input = {
        requestId: randomUUID(),
        subject: "Private P5 case",
        content: "Owner private message",
        attachments: [image.url],
      };
      const [a, b] = await Promise.all(
        [1, 2].map(() => support.createTicket(input, buyer.user)),
      );
      expect(a.id).toBe(b.id);
      await expect(support.getTicket(a.id, other.user)).rejects.toMatchObject({
        status: 404,
      });
      await expect(support.getTicket(a.id, staff.user)).rejects.toMatchObject({
        status: 404,
      });
      const queue = await support.listTickets(
        { queue: "unassigned" },
        staff.user,
      );
      expect(queue.items.find((t) => t.id === a.id).subject).not.toContain(
        "Private",
      );
      expect(
        (
          await request(
            "/storage/object?key=" + encodeURIComponent(image.key),
            null,
          )
        ).status,
      ).toBe(401);
      expect(
        (
          await request(
            "/storage/object?key=" + encodeURIComponent(image.key),
            other,
          )
        ).status,
      ).toBe(403);
      await support.assignTicket(
        a.id,
        { assigneeId: staff.user.id },
        staff.user,
      );
      expect(
        (
          await request(
            "/storage/object?key=" + encodeURIComponent(image.key),
            staff,
          )
        ).status,
      ).toBe(302);
      await pool.query('update "user" set role=$1 where id=$2', [
        "user",
        staff.user.id,
      ]);
      expect(
        (
          await request(
            "/storage/object?key=" + encodeURIComponent(image.key),
            staff,
          )
        ).status,
      ).toBe(403);
      await pool.query('update "user" set role=$1 where id=$2', [
        "moderator",
        staff.user.id,
      ]);
      const reply = {
        requestId: randomUUID(),
        content: "Actual assigned reply",
      };
      await Promise.all(
        [1, 2].map(() => support.replyTicket(a.id, reply, staff.user)),
      );
      expect((await support.getTicket(a.id, buyer.user)).status).toBe(
        "pending",
      );
      const list = await support.ticketMessages(a.id, {}, buyer.user);
      expect(list.items).toHaveLength(2);
      expect(
        (
          await support.ticketMessages(
            a.id,
            { after: list.items[0].id },
            buyer.user,
          )
        ).items,
      ).toHaveLength(1);
      await expect(
        support.replyTicket(a.id, { ...reply, content: "changed" }, staff.user),
      ).rejects.toMatchObject({ status: 409 });
      await support.ticketStatus(a.id, { status: "closed" }, buyer.user);
      await expect(
        support.replyTicket(
          a.id,
          { requestId: randomUUID(), content: "Closed" },
          buyer.user,
        ),
      ).rejects.toMatchObject({ status: 409 });
      const another = await support.createTicket(
        {
          requestId: randomUUID(),
          subject: "Another ticket",
          content: "Other",
        },
        other.user,
      );
      await expect(
        support.ticketMessages(
          another.id,
          { after: list.items[0].id },
          other.user,
        ),
      ).rejects.toMatchObject({ status: 400 });
      expect((await request("/conversation", master)).status).toBe(410);
    });
    it("rejects foreign pending attachments and private support images in public catalog", async () => {
      const image = await asset(other);
      await expect(
        support.createTicket(
          {
            requestId: randomUUID(),
            subject: "Invalid attachment",
            content: "Private",
            attachments: [image.url],
          },
          buyer.user,
        ),
      ).rejects.toMatchObject({ status: 400 });
      const input = payload();
      input.media = [
        { id: randomUUID(), url: image.url, position: 0, mediaType: "image" },
      ];
      await expect(
        editor.saveProductEditor(randomUUID(), input, master.user),
      ).rejects.toMatchObject({ status: 403 });
    });
    it("saves product/SKU/content/media/stock in one transaction; retries once and rejects stale versions", async () => {
      const id = randomUUID(),
        input = payload(),
        sku = input.variants[0],
        image = await asset(master, "general");
      input.media = [
        {
          id: randomUUID(),
          url: image.url,
          position: 0,
          mediaType: "image",
          variantId: sku.id,
        },
      ];
      input.content = [
        {
          id: randomUUID(),
          title: "Details",
          content: "<p>Safe</p><script>unsafe()</script>",
          format: "html",
          position: 0,
        },
      ];
      input.inventory = [
        {
          variantId: sku.id,
          locationId: location.id,
          expectedOnHand: 0,
          expectedReserved: 0,
          quantityOnHand: 5,
          reorderLevel: 1,
          reason: "Initial stock",
        },
      ];
      const saved = await editor.saveProductEditor(id, input, master.user);
      expect(saved.product.version).toBe(0);
      expect(saved.balances[0].quantityOnHand).toBe(5);
      expect(saved.content[0].content).not.toContain("<script>");
      expect(
        (await editor.saveProductEditor(id, input, master.user)).product
          .version,
      ).toBe(0);
      const next = {
        ...input,
        requestId: randomUUID(),
        expectedVersion: 0,
        product: { ...input.product, name: "Updated" },
        inventory: [],
      };
      const race = await Promise.allSettled([
        editor.saveProductEditor(id, next, master.user),
        editor.saveProductEditor(
          id,
          {
            ...next,
            requestId: randomUUID(),
            product: { ...next.product, name: "Concurrent" },
          },
          master.user,
        ),
      ]);
      expect(race.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(race.find((r) => r.status === "rejected").reason.status).toBe(409);
      const current = await editor.productEditorDetail(id);
      const bad = {
        ...next,
        requestId: randomUUID(),
        expectedVersion: current.product.version,
        product: { ...next.product, name: "Must rollback" },
        inventory: [
          {
            ...input.inventory[0],
            expectedOnHand: 5,
            quantityOnHand: 0,
            expectedReserved: 0,
          },
        ],
      };
      await pool.query(
        "update inventory_balance set quantity_reserved=2 where variant_id=$1",
        [sku.id],
      );
      await expect(
        editor.saveProductEditor(id, bad, master.user),
      ).rejects.toThrow();
      expect((await editor.productEditorDetail(id)).product.name).toBe(
        current.product.name,
      );
      await editor.saveProductEditor(
        id,
        {
          ...next,
          requestId: randomUUID(),
          expectedVersion: current.product.version,
          variants: [],
          media: [],
          inventory: [],
        },
        master.user,
      );
      expect((await editor.productEditorDetail(id)).variants[0].status).toBe(
        "discontinued",
      );
    });
    it("enables TOTP only after verification and encrypts both secret and recovery codes", async () => {
      const person = await fixture(),
        { secret, codes } = await enroll(person);
      const session = await current(person);
      expect(session.user.twoFactorEnabled).toBe(true);
      expect(session.session.secondFactorAt).toBeTruthy();
      const stored = (
        await pool.query("select * from two_factor where user_id=$1", [
          person.user.id,
        ])
      ).rows[0];
      expect(stored.secret).not.toContain(secret);
      expect(stored.backup_codes).not.toContain(codes[0]);
      const malformed = await authRequest(
        "/two-factor/verify-totp",
        { code: "000000" },
        person,
      );
      expect(malformed.status).toBeGreaterThanOrEqual(400);
      expect(
        (
          await authRequest(
            "/two-factor/verify-totp",
            { code: totp(secret), trustDevice: true },
            person,
          )
        ).status,
      ).toBe(403);
      expect(
        (await authRequest("/two-factor/view-backup-codes", {}, person)).status,
      ).toBeGreaterThanOrEqual(400);
    });
    it("uses the native credential challenge and consumes recovery codes only once under concurrent requests", async () => {
      const person = await fixture(),
        { codes } = await enroll(person);
      await authRequest("/sign-out", {}, person);
      person.cookie = "";
      const login = await authRequest(
        "/sign-in/email",
        { email: person.user.email, password },
        person,
      );
      expect(login.data.twoFactorRedirect).toBe(true);
      expect(await current(person)).toBeNull();
      const responses = await Promise.all(
        [1, 2].map(() =>
          authRequest(
            "/two-factor/verify-backup-code",
            { code: codes[0] },
            { ...person },
          ),
        ),
      );
      expect(responses.filter((r) => r.status === 200)).toHaveLength(1);
      const winner = responses.find((r) => r.status === 200);
      person.cookie = mergeCookie(person.cookie, winner.response);
      expect((await current(person)).session.secondFactorAt).toBeTruthy();
      await expect(
        auth.api.verifyBackupCode({
          body: { code: codes[0] },
          headers: new Headers({ cookie: person.cookie }),
        }),
      ).rejects.toThrow();
    });
    it("keeps Google callback sessions pending until actual TOTP and blocks business, account and auth mutations", async () => {
      const person = await fixture(),
        { secret } = await enroll(person),
        ctx = await auth.$context;
      const provider = await (typeof ctx.socialProviders[0] === "function"
        ? ctx.socialProviders[0]()
        : ctx.socialProviders[0]);
      const oldProviders = ctx.socialProviders,
        originalCode = provider.validateAuthorizationCode,
        originalInfo = provider.getUserInfo;
      await db.insert(s.account).values({
        userId: person.user.id,
        providerId: "google",
        accountId: "P5-google-" + person.user.id,
      });
      provider.validateAuthorizationCode = vi.fn(async () => ({
        accessToken: "local-provider-token",
        scopes: ["openid", "email", "profile"],
      }));
      provider.getUserInfo = vi.fn(async () => ({
        user: {
          id: "P5-google-" + person.user.id,
          email: person.user.email,
          name: "P5 Google",
          emailVerified: true,
        },
        data: {
          sub: "P5-google-" + person.user.id,
          email: person.user.email,
          email_verified: true,
        },
      }));
      ctx.socialProviders = [provider];
      try {
        const pending = { cookie: "", ip: "127.1.0." + ++ipSequence };
        const start = await authRequest(
          "/sign-in/social",
          {
            provider: "google",
            callbackURL: env.clientUrl + "/settings/security",
          },
          pending,
        );
        expect(start.status).toBe(200);
        const state = new URL(start.data.url).searchParams.get("state");
        expect(
          (
            await authRequest(
              "/callback/google?" +
                new URLSearchParams({ state, code: "local-code" }),
              undefined,
              pending,
            )
          ).status,
        ).toBe(302);
        expect((await current(pending)).session.secondFactorAt).toBeNull();
        expect((await request("/me/preferences", pending)).status).toBe(403);
        expect(
          (await authRequest("/update-user", { name: "Bypass" }, pending))
            .status,
        ).toBe(403);
        expect(
          (await authRequest("/two-factor/disable", { password }, pending))
            .status,
        ).toBe(403);
        expect(
          (
            await authRequest(
              "/two-factor/verify-totp",
              { code: totp(secret) },
              pending,
            )
          ).status,
        ).toBe(200);
        expect((await current(pending)).session.secondFactorAt).toBeTruthy();
        expect((await request("/me/preferences", pending)).status).toBe(200);
        await pool.query(
          "update session set second_factor_at=now()-interval '6 minutes' where id=$1",
          [(await current(pending)).session.id],
        );
        expect(
          (
            await authRequest(
              "/change-password",
              { currentPassword: password, newPassword: "new-fixture-123456" },
              pending,
            )
          ).status,
        ).toBe(403);
        expect(
          (
            await authRequest(
              "/two-factor/verify-totp",
              { code: totp(secret) },
              pending,
            )
          ).status,
        ).toBe(200);
      } finally {
        provider.validateAuthorizationCode = originalCode;
        provider.getUserInfo = originalInfo;
        ctx.socialProviders = oldProviders;
      }
    });
    it("throttles existing pending-session TOTP guesses and prevents native delete bypass", async () => {
      const person = await fixture();
      await enroll(person);
      const session = (await current(person)).session;
      await pool.query("update session set second_factor_at=null where id=$1", [
        session.id,
      ]);
      let response;
      for (let i = 0; i < 11; i++)
        response = await authRequest(
          "/two-factor/verify-totp",
          { code: "invalid" },
          person,
        );
      expect(response.status).toBe(429);
      expect(
        (await authRequest("/delete-user", { password }, buyer)).status,
      ).toBe(403);
    });
    it("requires fresh first and second factors before anonymization", async () => {
      const person = await fixture(),
        { secret } = await enroll(person);
      const session = (await current(person)).session;
      await pool.query(
        "update session set created_at=now()-interval '10 minutes',second_factor_at=now()-interval '10 minutes' where id=$1",
        [session.id],
      );
      expect(
        (
          await request("/me/account/delete", person, {
            confirmEmail: person.user.email,
          })
        ).status,
      ).toBe(403);
      expect(
        (await authRequest("/verify-password", { password }, person)).status,
      ).toBe(200);
      expect(
        (
          await authRequest(
            "/two-factor/verify-totp",
            { code: totp(secret) },
            person,
          )
        ).status,
      ).toBe(200);
      const refreshed = await current(person);
      expect(refreshed.session.reauthenticatedAt).toBeTruthy();
      expect(
        (
          await request("/me/account/delete", person, {
            confirmEmail: person.user.email,
          })
        ).status,
      ).toBe(200);
    });
    it("blocks open business and master deletion; tombstones retain transaction snapshots and clear sessions, PII and provider links", async () => {
      const person = await fixture(),
        orderId = randomUUID();
      await pool.query(
        "insert into sales_order(id,code,user_id,subtotal,grand_total) values($1,$2,$3,100,100)",
        [orderId, "P5-" + randomUUID(), person.user.id],
      );
      await expect(
        lifecycle.anonymizeAccount(await current(person), {
          confirmEmail: person.user.email,
        }),
      ).rejects.toMatchObject({ status: 409 });
      await pool.query(
        "update sales_order set order_status='cancelled' where id=$1",
        [orderId],
      );
      await features.setFavorite(person.user.id, product.id, true);
      const ticket = await support.createTicket(
        {
          requestId: randomUUID(),
          subject: "My personal details",
          content: "Personal data",
        },
        person.user,
      );
      await support.assignTicket(
        ticket.id,
        { assigneeId: staff.user.id },
        staff.user,
      );
      await support.replyTicket(
        ticket.id,
        { requestId: randomUUID(), content: "Staff copied personal data" },
        staff.user,
      );
      await lifecycle.anonymizeAccount(await current(person), {
        confirmEmail: person.user.email,
      });
      const tombstone = (
        await pool.query('select * from "user" where id=$1', [person.user.id])
      ).rows[0];
      expect(tombstone.email).toBe(person.user.id + "@deleted.invalid");
      expect(tombstone.anonymized_at).toBeTruthy();
      expect(
        (await pool.query("select id from sales_order where id=$1", [orderId]))
          .rows,
      ).toHaveLength(1);
      expect(
        (
          await pool.query("select id from account where user_id=$1", [
            person.user.id,
          ])
        ).rows,
      ).toHaveLength(0);
      expect(
        (
          await pool.query("select id from session where user_id=$1", [
            person.user.id,
          ])
        ).rows,
      ).toHaveLength(0);
      expect(
        (await support.ticketMessages(ticket.id, {}, staff.user)).items.every(
          (m) => m.content.includes("đã ẩn"),
        ),
      ).toBe(true);
      await expect(
        features.setFavorite(person.user.id, product.id, true),
      ).rejects.toMatchObject({ status: 403 });
      await expect(
        lifecycle.anonymizeAccount(await current(master), {
          confirmEmail: master.user.email,
        }),
      ).rejects.toMatchObject({ status: 409 });
    });
    it("serializes master handoff and only accepts verified administrators", async () => {
      const owner = await fixture("master"),
        successor = await fixture("administrator");
      expect(
        (
          await authRequest(
            "/admin/set-role",
            { userId: owner.user.id, role: "user" },
            master,
          )
        ).status,
      ).toBe(403);
      await expect(
        lifecycle.transferMaster(await current(owner), {
          successorId: staff.user.id,
        }),
      ).rejects.toMatchObject({ status: 400 });
      await lifecycle.transferMaster(await current(owner), {
        successorId: successor.user.id,
      });
      expect(
        (
          await pool.query('select role from "user" where id=$1', [
            successor.user.id,
          ])
        ).rows[0].role,
      ).toBe("master");
      expect(await current(successor)).toBeNull();
      expect((await current(owner)).user.role).toBe("administrator");
      await lifecycle.anonymizeAccount(await current(owner), {
        confirmEmail: owner.user.email,
      });
    });
    it("resolves only requested relation labels, independently of pagination, with strict bounds and authorization", async () => {
      const path = `/admin/pickers/categories?ids=${category.id}&limit=1&page=99`;
      expect((await request(path, buyer)).status).toBe(403);
      const labels = await request(path, master);
      expect(labels.status).toBe(200);
      expect(labels.data.items.map((item) => item.id)).toEqual([category.id]);
      expect(labels.data.items[0].label).toBe(category.name);
      expect(
        (await request("/admin/pickers/categories?ids=invalid", master)).status,
      ).toBe(400);
      const oversized = Array.from({ length: 51 }, () => randomUUID()).join(
        ",",
      );
      expect(
        (await request(`/admin/pickers/categories?ids=${oversized}`, master))
          .status,
      ).toBe(400);
    });
    it("rejects more than four or mixed-type comparison SKUs and hides unauthorized picker data", async () => {
      expect((await request("/admin/pickers/users", buyer)).status).toBe(403);
      expect(
        (
          await authRequest(
            "/admin/update-user",
            { userId: buyer.user.id, data: { twoFactorEnabled: false } },
            master,
          )
        ).status,
      ).toBe(400);
      expect(
        (
          await authRequest(
            "/admin/update-user",
            { userId: master.user.id, data: { role: "user" } },
            master,
          )
        ).status,
      ).toBe(403);
      expect(
        (await request("/admin/pickers/conversations", master)).status,
      ).toBe(403);
      const choices = await request(
        "/admin/pickers/categories?q=Laptop",
        master,
      );
      expect(choices.status).toBe(200);
      expect(
        choices.data.items.find((i) => i.id === category.id).productType,
      ).toBe("other");
      await expect(
        features.comparison({
          variantIds: Array.from({ length: 5 }, () => randomUUID()),
        }),
      ).rejects.toThrow();
      const [otherCategory] = await db
        .insert(s.categories)
        .values({ name: "Monitor P5", slug: "portable-monitor" })
        .returning();
      const otherProduct = payload();
      otherProduct.product.categoryId = otherCategory.id;
      const created = await editor.saveProductEditor(
        randomUUID(),
        otherProduct,
        master.user,
      );
      await expect(
        features.comparison({
          variantIds: [variant.id, created.variants[0].id],
        }),
      ).rejects.toMatchObject({ status: 400 });
    });
    it("protects account deletion from unfinished returns and keeps completed documents", async () => {
      const person = await fixture(),
        orderId = randomUUID();
      await pool.query(
        "insert into sales_order(id,code,user_id,subtotal,grand_total,order_status,payment_status) values($1,$2,$3,100,100,'completed','paid')",
        [orderId, "P5-" + randomUUID(), person.user.id],
      );
      const [ret] = await db
        .insert(s.returns)
        .values({ orderId, userId: person.user.id, reason: "Local fixture" })
        .returning();
      await expect(
        lifecycle.anonymizeAccount(await current(person), {
          confirmEmail: person.user.email,
        }),
      ).rejects.toMatchObject({ status: 409 });
      await pool.query(
        "update sales_return set status='completed' where id=$1",
        [ret.id],
      );
      await lifecycle.anonymizeAccount(await current(person), {
        confirmEmail: person.user.email,
      });
      expect(
        (await pool.query("select id from sales_return where id=$1", [ret.id]))
          .rows,
      ).toHaveLength(1);
      await expect(
        pool.query('update "user" set name=$1 where id=$2', [
          "PII reappears",
          person.user.id,
        ]),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        pool.query(
          "insert into account(user_id,provider_id,account_id,updated_at) values($1,'google',$2,now())",
          [person.user.id, randomUUID()],
        ),
      ).rejects.toMatchObject({ code: "42501" });
      await expect(
        (await auth.$context).internalAdapter.createSession(person.user.id),
      ).rejects.toThrow();
    });
    it("serializes anonymization against new personal writes without leaving favorites behind", async () => {
      const person = await fixture(),
        session = await current(person);
      const results = await Promise.allSettled([
        lifecycle.anonymizeAccount(session, {
          confirmEmail: person.user.email,
        }),
        features.setFavorite(person.user.id, product.id, true),
      ]);
      expect(results[0].status).toBe("fulfilled");
      expect(
        (
          await pool.query("select * from favorite where user_id=$1", [
            person.user.id,
          ])
        ).rows,
      ).toHaveLength(0);
    });

    it("saves profile images with references atomically and keeps admin fields and private support images protected", async () => {
      const person = await fixture(),
        image = await asset(person, "general"),
        privateImage = await asset(person, "support");
      const result = await request("/auth/update-user", person, {
        name: "Updated personal name",
        username: "Phase5." + randomUUID().slice(0, 8),
        image: image.url,
        birthday: "2000-01-01T00:00:00.000Z",
      });
      expect(result.status, JSON.stringify(result.data)).toBe(200);
      expect((await current(person)).user.birthday).toBeTruthy();
      expect(
        (
          await pool.query("select state from upload_asset where key=$1", [
            image.key,
          ])
        ).rows[0].state,
      ).toBe("attached");
      expect(
        (
          await request("/auth/update-user", person, {
            image: privateImage.url,
          })
        ).status,
      ).toBe(403);
      expect(
        (await request("/auth/update-user", person, { role: "master" })).status,
      ).toBe(400);
      expect(
        (
          await request("/auth/admin/update-user", person, {
            userId: other.user.id,
            data: { name: "IDOR" },
          })
        ).status,
      ).toBe(403);
      expect(
        (
          await request("/auth/admin/update-user", master, {
            userId: person.user.id,
            data: { name: "Admin reviewed", birthday: "2001-01-01" },
          })
        ).status,
      ).toBe(200);
      expect((await current(person)).user.name).toBe("Admin reviewed");
      expect(
        (
          await request("/auth/admin/update-user", master, {
            userId: master.user.id,
            data: { role: "user" },
          })
        ).status,
      ).toBe(409);
    });
  },
);
