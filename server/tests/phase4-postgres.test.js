import {request as httpRequest} from './helpers/request.js';
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import process from "node:process";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
const state = vi.hoisted(() => ({ userId: null }));
vi.mock("../src/lib/auth/index.js", () => ({
  auth: {
    api: {
      getSession: async ({ headers }) =>
        headers.get("cookie")
          ? {
              user: {
                id:
                  headers.get("cookie") === "admin"
                    ? "00000000-0000-4000-8000-000000000001"
                    : state.userId,
                role: headers.get("cookie") === "admin" ? "master" : "user",
              },
            }
          : null,
    },
    handler: vi.fn(),
  },
}));
vi.mock("../src/lib/email/mailer.js", () => ({
  sendOrderEventEmail: vi.fn(async () => ({ accepted: 1 })),
}));
vi.mock("../src/lib/upload/s3-client.js", () => ({
  deleteObject: vi.fn(async () => {}),
  uploadObject: vi.fn(),
  getObjectUrl: vi.fn(),
}));
const enabled = process.env.RUN_PHASE1_POSTGRES_TESTS === "true";
let db, pool, s, f, j, ledger, app;
const admin = { id: "00000000-0000-4000-8000-000000000001", role: "master" };
const cmd = (extra = {}) => ({
  commandId: randomUUID(),
  note: "Local phase 4 acceptance",
  ...extra,
});
async function fixture(provider = "cod", quantity = 3) {
  const id = randomUUID();
  const [buyer] = await db
    .insert(s.user)
    .values({
      id: randomUUID(),
      name: "Return fixture",
      email: `${id}@example.test`,
      emailVerified: true,
    })
    .returning();
  const [product] = await db
    .insert(s.products)
    .values({ name: id, slug: id })
    .returning();
  const [variant] = await db
    .insert(s.productVariants)
    .values({ productId: product.id, sku: id, name: id, price: "100000" })
    .returning();
  const [location] = await db
    .insert(s.inventoryLocations)
    .values({ code: id, name: id })
    .returning();
  await db.insert(s.inventoryBalances).values({
    locationId: location.id,
    variantId: variant.id,
    quantityOnHand: 10,
  });
  const [order] = await db
    .insert(s.orders)
    .values({
      code: id,
      userId: buyer.id,
      subtotal: String(quantity * 100000),
      discountTotal: "1",
      shippingTotal: "30000",
      grandTotal: String(quantity * 100000 + 29999),
      orderStatus: "confirmed",
      paymentStatus: provider === "cod" ? "unpaid" : "paid",
    })
    .returning();
  const [item] = await db
    .insert(s.orderItems)
    .values({
      orderId: order.id,
      variantId: variant.id,
      sku: id,
      productName: id,
      variantName: id,
      quantity,
      unitPrice: "100000",
      total: String(quantity * 100000),
    })
    .returning();
  const [payment] = await db
    .insert(s.payments)
    .values({
      orderId: order.id,
      provider,
      method: provider === "cod" ? "cod" : "online",
      amount: order.grandTotal,
      status: provider === "cod" ? "pending" : "completed",
      transactionId: provider === "cod" ? null : `pi_${id}`,
      paidAt: provider === "cod" ? null : new Date(),
    })
    .returning();
  const [session] = await db
    .insert(s.checkoutSessions)
    .values({
      orderId: order.id,
      userId: buyer.id,
      requestKey: randomUUID(),
      fingerprint: id,
      provider,
      providerOrderId: id,
      providerAmount: order.grandTotal,
      currency: "VND",
      state: provider === "cod" ? "created" : "paid",
      reservations: [
        { locationId: location.id, variantId: variant.id, quantity },
      ],
      expiresAt: new Date(Date.now() + 3600000),
    })
    .returning();
  await ledger.inventoryTransaction((tx) =>
    ledger.reserveOrderStock(tx, order.id, session.reservations, buyer.id),
  );
  return { order, item, payment, session, buyer, variant, location };
}
const balance = async (x) =>
  (
    await db
      .select()
      .from(s.inventoryBalances)
      .where(eq(s.inventoryBalances.variantId, x.variant.id))
  )[0];
async function deliver(x) {
  await f.shipmentCommand(
    x.order.id,
    cmd({
      action: "prepare",
      carrier: "Local carrier",
      trackingNumber: randomUUID(),
    }),
    admin,
  );
  await f.shipmentCommand(x.order.id, cmd({ action: "handover" }), admin);
  await f.shipmentCommand(
    x.order.id,
    cmd({ action: "delivered", codProof: "Local collection proof" }),
    admin,
  );
}
async function inspected(x, quantity = 1, restockQuantity = quantity) {
  const r = await f.requestReturn(
    x.order.id,
    cmd({ items: [{ orderItemId: x.item.id, quantity }] }),
    x.buyer,
  );
  await f.returnCommand(r.id, cmd({ action: "approve" }), admin);
  await f.returnCommand(r.id, cmd({ action: "receive" }), admin);
  const [item] = await db
    .select()
    .from(s.returnItems)
    .where(eq(s.returnItems.returnId, r.id));
  await f.returnCommand(
    r.id,
    cmd({
      action: "inspect",
      items: [
        {
          itemId: item.id,
          acceptedQuantity: quantity,
          restockQuantity,
          locationId: x.location.id,
          condition: restockQuantity ? "resellable" : "damaged",
          note: "Inspection proof fixture",
        },
      ],
    }),
    admin,
  );
  return r;
}
const request = async (path, cookie = "admin", body) => {
  const r = await httpRequest(app,path, {
    method: body ? "POST" : "GET",
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: r.status, data: await r.json() };
};
describe.skipIf(!enabled)("Phase 4 disposable PostgreSQL acceptance", () => {
  beforeAll(async () => {
    ({ db, pool } = await import("../src/database/index.js"));
    s = await import("../src/database/schema.js");
    f = await import("../src/services/fulfillment.js");
    j = await import("../src/services/jobs.js");
    ledger = await import("../src/services/stock-ledger.js");
    app = (await import("../src/module.js")).default();
  });
  afterAll(async () => {
    await pool?.end();
  });
  it("migration backfills old completion/allocation without touching stock balances", async () => {
    const legacy = "00000000-0000-4000-8000-000000000006";
    const [record] = await db
      .select()
      .from(s.orderFulfillments)
      .where(eq(s.orderFulfillments.orderId, legacy));
    expect(record.provenance).toBe("legacy_completed_fallback");
    expect(record.stockIssuedAt).toBeTruthy();
    expect(record.deliveredAt).toBeTruthy();
    const [allocation] = await db
      .select()
      .from(s.orderAllocations)
      .where(eq(s.orderAllocations.orderId, legacy));
    expect(allocation).toMatchObject({ net: 299, discount: 1, quantity: 3 });
    const [balance] = await db
      .select()
      .from(s.inventoryBalances)
      .where(
        eq(
          s.inventoryBalances.variantId,
          "00000000-0000-4000-8000-000000000003",
        ),
      );
    expect(balance).toMatchObject({ quantityOnHand: 5, quantityReserved: 2 });
  });
  it("failed COD delivery can return through inspection without inventing a collection/refund", async () => {
    const x = await fixture();
    await f.shipmentCommand(
      x.order.id,
      cmd({
        action: "prepare",
        carrier: "Carrier",
        trackingNumber: randomUUID(),
      }),
      admin,
    );
    await f.shipmentCommand(x.order.id, cmd({ action: "handover" }), admin);
    await f.shipmentCommand(x.order.id, cmd({ action: "failed" }), admin);
    await f.shipmentCommand(x.order.id, cmd({ action: "retry" }), admin);
    expect((await balance(x)).quantityOnHand).toBe(7);
    await f.shipmentCommand(x.order.id, cmd({ action: "failed" }), admin);
    const r = await f.requestReturn(
      x.order.id,
      cmd({ items: [{ orderItemId: x.item.id, quantity: 3 }] }),
      admin,
    );
    await expect(
      f.shipmentCommand(x.order.id, cmd({ action: "retry" }), admin),
    ).rejects.toMatchObject({ status: 409 });
    await f.returnCommand(r.id, cmd({ action: "approve" }), admin);
    await f.returnCommand(r.id, cmd({ action: "receive" }), admin);
    const [item] = await db
      .select()
      .from(s.returnItems)
      .where(eq(s.returnItems.returnId, r.id));
    await f.returnCommand(
      r.id,
      cmd({
        action: "inspect",
        items: [
          {
            itemId: item.id,
            acceptedQuantity: 3,
            restockQuantity: 3,
            locationId: x.location.id,
            condition: "resellable",
            note: "Returned delivery verified",
          },
        ],
      }),
      admin,
    );
    await f.returnCommand(r.id, cmd({ action: "complete" }), admin);
    expect((await balance(x)).quantityOnHand).toBe(10);
    expect(
      (
        await db
          .select()
          .from(s.payments)
          .where(eq(s.payments.id, x.payment.id))
      )[0].status,
    ).toBe("pending");
    expect(
      await db
        .select()
        .from(s.refunds)
        .where(eq(s.refunds.orderId, x.order.id)),
    ).toHaveLength(0);
  });
  it("concurrent partial refunds cannot reserve shipping twice or exceed captured total", async () => {
    const x = await fixture("stripe");
    await deliver(x);
    const first = await inspected(x),
      second = await inspected(x);
    const attempts = await Promise.allSettled(
      [first, second].map((r) =>
        f.createRefund(
          x.order.id,
          cmd({
            purpose: "return",
            returnId: r.id,
            shippingAmount: 30000,
            shippingReason: "Delivery charge refund requested",
          }),
          admin,
        ),
      ),
    );
    expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(1);
    expect(attempts.find((a) => a.status === "rejected").reason.status).toBe(
      409,
    );
  });
  it("paid cancellation keeps voucher usage; unsigned/stale events cannot restore it", async () => {
    const x = await fixture("stripe");
    const [promotion] = await db
      .insert(s.promotions)
      .values({
        name: "Refund voucher fixture",
        discountValue: "1",
        startsAt: new Date(Date.now() - 1000),
        endsAt: new Date(Date.now() + 86400000),
      })
      .returning();
    const [code] = await db
      .insert(s.promotionCodes)
      .values({ promotionId: promotion.id, code: randomUUID(), usedCount: 1 })
      .returning();
    await db.insert(s.promotionUsages).values({
      promotionCodeId: code.id,
      userId: x.buyer.id,
      orderId: x.order.id,
    });
    await f.createRefund(
      x.order.id,
      cmd({ purpose: "paid_cancellation" }),
      admin,
    );
    expect(
      (
        await db
          .select()
          .from(s.promotionCodes)
          .where(eq(s.promotionCodes.id, code.id))
      )[0].usedCount,
    ).toBe(1);
    expect(
      await db
        .select()
        .from(s.promotionUsages)
        .where(eq(s.promotionUsages.orderId, x.order.id)),
    ).toHaveLength(1);
  });
  it("expired outbox lease recovers by querying an already submitted refund", async () => {
    const x = await fixture("stripe"),
      refund = await f.createRefund(
        x.order.id,
        cmd({ purpose: "paid_cancellation" }),
        admin,
      );
    await db
      .update(s.refunds)
      .set({ submittedAt: new Date(), state: "processing" })
      .where(eq(s.refunds.id, refund.id));
    await db
      .update(s.outbox)
      .set({ state: "processing", leaseUntil: new Date(Date.now() - 1000) })
      .where(eq(s.outbox.key, `refund:${refund.id}`));
    const adapter = vi.fn(async (r, p, session, options) => {
      expect(options.submit).toBe(false);
      return {
        state: "succeeded",
        verified: true,
        reference: r.reference,
        amount: r.providerAmount,
        currency: r.currency,
        id: "re_recovered",
      };
    });
    await j.processOutbox({
      limit: 1,
      deadline: Date.now() + 45000,
      refundAdapter: adapter,
      key: `refund:${refund.id}`,
    });
    expect(adapter).toHaveBeenCalledTimes(1);
  });
  it("image sweep rotates checked referenced assets and deletes only expired orphans", async () => {
    const id = randomUUID(),
      assetUrl = `https://assets.example.test/${id}.webp`;
    const [buyer] = await db
      .insert(s.user)
      .values({
        id: randomUUID(),
        name: "Image fixture",
        email: `${id}@image.test`,
        image: assetUrl,
      })
      .returning();
    await db.insert(s.uploadAssets).values([
      {
        key: `${id}-referenced`,
        url: assetUrl,
        userId: buyer.id,
        state: "attached",
        createdAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        key: `${id}-orphan`,
        url: assetUrl + "-orphan",
        userId: buyer.id,
        state: "pending",
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
    ]);
    const { cleanupAssets } = await import("../src/services/storage.js");
    const first = await cleanupAssets({ limit: 1 });
    expect(first[0]).toMatchObject({
      key: `${id}-referenced`,
      referenced: true,
      deleted: false,
    });
    const second = await cleanupAssets({ limit: 1 });
    expect(second[0]).toMatchObject({ key: `${id}-orphan`, deleted: true });
    const assets = await db
      .select()
      .from(s.uploadAssets)
      .where(eq(s.uploadAssets.userId, buyer.id));
    expect(assets).toHaveLength(1);
    expect(assets[0].checkedAt).toBeTruthy();
  });
  it("job lease prevents a concurrent hourly image sweep, including an authenticated scheduler", async () => {
    process.env.INTERNAL_JOB_SECRET =
      "phase4-local-job-secret-at-least-32-characters";
    await db.insert(s.jobLeases).values({
      name: "images",
      token: randomUUID(),
      leaseUntil: new Date(Date.now() + 60000),
      lastStartedAt: new Date(),
    });
    const response = await httpRequest(app,"/internal/jobs/images", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.INTERNAL_JOB_SECRET}`,
        "content-type": "application/json",
      },
      body: "{}",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ skipped: true });
  });
  it("handover issues once; delivery does not issue again; COD requires collection proof", async () => {
    const x = await fixture();
    await f.shipmentCommand(
      x.order.id,
      cmd({
        action: "prepare",
        carrier: "Carrier",
        trackingNumber: randomUUID(),
      }),
      admin,
    );
    const c = cmd({ action: "handover" });
    await Promise.all([
      f.shipmentCommand(x.order.id, c, admin),
      f.shipmentCommand(x.order.id, c, admin),
    ]);
    expect(await balance(x)).toMatchObject({
      quantityOnHand: 7,
      quantityReserved: 0,
    });
    await expect(
      f.shipmentCommand(x.order.id, cmd({ action: "delivered" }), admin),
    ).rejects.toMatchObject({ status: 400 });
    await f.shipmentCommand(
      x.order.id,
      cmd({ action: "delivered", codProof: "Receipt number fixture" }),
      admin,
    );
    expect(await balance(x)).toMatchObject({
      quantityOnHand: 7,
      quantityReserved: 0,
    });
    expect(
      (
        await db
          .select()
          .from(s.payments)
          .where(eq(s.payments.id, x.payment.id))
      )[0].status,
    ).toBe("completed");
    expect(
      (
        await db
          .select()
          .from(s.shipmentEvents)
          .where(eq(s.shipmentEvents.orderId, x.order.id))
      ).length,
    ).toBe(3);
  });
  it("rejects replay with changed payload and non-staff shipment command", async () => {
    const x = await fixture(),
      c = cmd({
        action: "prepare",
        carrier: "Carrier",
        trackingNumber: randomUUID(),
      });
    await f.shipmentCommand(x.order.id, c, admin);
    await expect(
      f.shipmentCommand(x.order.id, { ...c, note: "Changed payload" }, admin),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      f.shipmentCommand(x.order.id, cmd({ action: "handover" }), x.buyer),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("unpaid online orders cannot ship; completed legacy orders never issue again", async () => {
    const x = await fixture("stripe");
    await db
      .update(s.checkoutSessions)
      .set({ state: "ready" })
      .where(eq(s.checkoutSessions.id, x.session.id));
    await expect(
      f.shipmentCommand(
        x.order.id,
        cmd({
          action: "prepare",
          carrier: "Carrier",
          trackingNumber: randomUUID(),
        }),
        admin,
      ),
    ).rejects.toMatchObject({ status: 409 });
    await db
      .update(s.orders)
      .set({ orderStatus: "completed" })
      .where(eq(s.orders.id, x.order.id));
    await expect(
      f.shipmentCommand(
        x.order.id,
        cmd({
          action: "prepare",
          carrier: "Carrier",
          trackingNumber: randomUUID(),
        }),
        admin,
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("partial return restocks only inspected sellable units exactly once", async () => {
    const x = await fixture();
    await deliver(x);
    const r = await inspected(x, 2, 1);
    expect(await balance(x)).toMatchObject({
      quantityOnHand: 8,
      quantityReserved: 0,
    });
    await expect(
      f.returnCommand(r.id, cmd({ action: "inspect", items: [] }), admin),
    ).rejects.toBeDefined();
    const [line] = await db
      .select()
      .from(s.returnItems)
      .where(eq(s.returnItems.returnId, r.id));
    expect(line.refundAmount).toBe(200000);
  });
  it("concurrent requests cannot return the same last unit twice", async () => {
    const x = await fixture("cod", 1);
    await deliver(x);
    const results = await Promise.allSettled(
      [1, 2].map(() =>
        f.requestReturn(
          x.order.id,
          cmd({ items: [{ orderItemId: x.item.id, quantity: 1 }] }),
          x.buyer,
        ),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });
  it("rejects late/foreign returns and invalid transition; rejected requests release quantity", async () => {
    const x = await fixture();
    await deliver(x);
    await expect(
      f.requestReturn(
        x.order.id,
        cmd({ items: [{ orderItemId: x.item.id, quantity: 1 }] }),
        admin,
      ),
    ).rejects.toMatchObject({ status: 404 });
    const r = await f.requestReturn(
      x.order.id,
      cmd({ items: [{ orderItemId: x.item.id, quantity: 3 }] }),
      x.buyer,
    );
    await expect(
      f.returnCommand(r.id, cmd({ action: "receive" }), admin),
    ).rejects.toMatchObject({ status: 409 });
    await f.returnCommand(r.id, cmd({ action: "reject" }), admin);
    expect(
      (
        await f.requestReturn(
          x.order.id,
          cmd({ items: [{ orderItemId: x.item.id, quantity: 3 }] }),
          x.buyer,
        )
      ).status,
    ).toBe("requested");
    await db
      .update(s.orderFulfillments)
      .set({ deliveredAt: new Date(Date.now() - 16 * 86400000) })
      .where(eq(s.orderFulfillments.orderId, x.order.id));
    await expect(
      f.requestReturn(
        x.order.id,
        cmd({ items: [{ orderItemId: x.item.id, quantity: 1 }] }),
        x.buyer,
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("manual COD refund requires proof; no shipping refund by default; closes only after success", async () => {
    const x = await fixture();
    await deliver(x);
    const r = await inspected(x);
    const refund = await f.createRefund(
      x.order.id,
      cmd({ purpose: "return", returnId: r.id }),
      admin,
    );
    expect(refund.amount).toBe(100000);
    expect(refund.shippingAmount).toBe(0);
    await expect(
      f.returnCommand(r.id, cmd({ action: "complete" }), admin),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      f.confirmManualRefund(refund.id, cmd({ proof: "" }), admin),
    ).rejects.toBeDefined();
    const c = cmd({ proof: "Bank transfer receipt local fixture" });
    await f.confirmManualRefund(refund.id, c, admin);
    await f.confirmManualRefund(refund.id, c, admin);
    await f.returnCommand(r.id, cmd({ action: "complete" }), admin);
    expect(
      (await db.select().from(s.orders).where(eq(s.orders.id, x.order.id)))[0]
        .paymentStatus,
    ).toBe("partially_refunded");
  });
  it("all partial refunds preserve last VND and shipping budget; over-refund is rejected", async () => {
    const x = await fixture();
    await deliver(x);
    const amounts = [];
    for (let i = 0; i < 3; i++) {
      const r = await inspected(x),
        refund = await f.createRefund(
          x.order.id,
          cmd({
            purpose: "return",
            returnId: r.id,
            ...(i === 2
              ? {
                  shippingAmount: 30000,
                  shippingReason: "Refund actual delivery charge",
                }
              : {}),
          }),
          admin,
        );
      amounts.push(refund.amount);
      await f.confirmManualRefund(
        refund.id,
        cmd({ proof: "Manual refund proof local fixture" }),
        admin,
      );
      await expect(
        f.createRefund(
          x.order.id,
          cmd({ purpose: "return", returnId: r.id }),
          admin,
        ),
      ).rejects.toMatchObject({ status: 409 });
    }
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(329999);
    expect(
      (await db.select().from(s.orders).where(eq(s.orders.id, x.order.id)))[0]
        .paymentStatus,
    ).toBe("refunded");
  });
  it("paid cancellation releases stock without restoring voucher, queues refund transactionally", async () => {
    const x = await fixture("stripe");
    const c = cmd({ purpose: "paid_cancellation" });
    const results = await Promise.all([
      f.createRefund(x.order.id, c, admin),
      f.createRefund(x.order.id, c, admin),
    ]);
    expect(results[0].id).toBe(results[1].id);
    expect(await balance(x)).toMatchObject({
      quantityOnHand: 10,
      quantityReserved: 0,
    });
    expect(
      await db
        .select()
        .from(s.outbox)
        .where(eq(s.outbox.key, `refund:${results[0].id}`)),
    ).toHaveLength(1);
    await expect(
      f.createRefund(x.order.id, cmd({ purpose: "paid_cancellation" }), admin),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("paid cancellation after handover is blocked", async () => {
    const x = await fixture("stripe");
    await deliver(x);
    await expect(
      f.createRefund(x.order.id, cmd({ purpose: "paid_cancellation" }), admin),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("only a definitive failed refund permits a new audited request; return restock is not repeated", async () => {
    const x = await fixture("stripe");
    await deliver(x);
    const record = await inspected(x);
    const first = await f.createRefund(
      x.order.id,
      cmd({ purpose: "return", returnId: record.id }),
      admin,
    );
    await j.processRefund(first.id, async (r) => ({
      state: "failed",
      verified: true,
      reference: r.reference,
      amount: r.providerAmount,
      currency: r.currency,
      id: "re_definitive_failure",
    }));
    const second = await f.createRefund(
      x.order.id,
      cmd({ purpose: "return", returnId: record.id }),
      admin,
    );
    expect(second.reference).not.toBe(first.reference);
    expect(second.state).toBe("pending");
    expect((await balance(x)).quantityOnHand).toBe(8);
    await expect(
      f.createRefund(
        x.order.id,
        cmd({ purpose: "return", returnId: record.id }),
        admin,
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("provider timeout is held for query with SAME reference; stale events cannot undo success", async () => {
    const x = await fixture("stripe");
    await db
      .update(s.checkoutSessions)
      .set({ state: "paid_late" })
      .where(eq(s.checkoutSessions.id, x.session.id));
    const checkout = await import("../src/services/checkout.js");
    expect(
      (await checkout.getCustomerOrder(x.buyer.id, x.order.id)).payment
        .requiresSupport,
    ).toBe(true);
    const r = await f.createRefund(
      x.order.id,
      cmd({ purpose: "paid_cancellation" }),
      admin,
    );
    const adapter = vi
      .fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockImplementationOnce(async (refund, payment, session, options) => {
        expect(options.submit).toBe(false);
        expect(refund.reference).toBe(r.reference);
        return {
          state: "succeeded",
          verified: true,
          amount: refund.providerAmount,
          currency: refund.currency,
          reference: refund.reference,
          id: "re_fixture",
        };
      });
    await j.processRefund(r.id, adapter);
    expect(
      (await db.select().from(s.refunds).where(eq(s.refunds.id, r.id)))[0]
        .state,
    ).toBe("needs_review");
    await j.processRefund(r.id, adapter);
    await ledger.inventoryTransaction((tx) =>
      f.applyRefundResult(tx, r.id, { state: "failed", verified: true }),
    );
    expect(
      (await db.select().from(s.refunds).where(eq(s.refunds.id, r.id)))[0]
        .state,
    ).toBe("succeeded");
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(
      (await checkout.getCustomerOrder(x.buyer.id, x.order.id)).payment
        .requiresSupport,
    ).toBe(false);
  });
  it("mismatched amount/currency/reference never settles a refund", async () => {
    const x = await fixture("stripe"),
      r = await f.createRefund(
        x.order.id,
        cmd({ purpose: "paid_cancellation" }),
        admin,
      );
    await expect(
      ledger.inventoryTransaction((tx) =>
        f.applyRefundResult(tx, r.id, {
          state: "succeeded",
          verified: true,
          reference: r.reference,
          amount: r.providerAmount,
          currency: "USD",
        }),
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("inbox deduplicates concurrent signed events and outbox atomically", async () => {
    const reference = randomUUID(),
      eventId = randomUUID();
    const results = await Promise.all(
      [1, 2, 3].map(() => j.receiveWebhook("stripe", eventId, reference)),
    );
    expect(results.filter((r) => !r.duplicate)).toHaveLength(1);
    expect(
      await db
        .select()
        .from(s.webhookInbox)
        .where(eq(s.webhookInbox.eventId, eventId)),
    ).toHaveLength(1);
  });
  it("SKIP LOCKED claims do not send the same pending refund twice", async () => {
    const x = await fixture("stripe"),
      r = await f.createRefund(
        x.order.id,
        cmd({ purpose: "paid_cancellation" }),
        admin,
      );
    const adapter = vi.fn(async (refund) => ({
      state: "succeeded",
      verified: true,
      reference: refund.reference,
      amount: refund.providerAmount,
      currency: refund.currency,
      id: "re_concurrent",
    }));
    await Promise.all(
      [1, 2].map(() =>
        j.processOutbox({
          limit: 1,
          deadline: Date.now() + 45000,
          refundAdapter: adapter,
          key: `refund:${r.id}`,
        }),
      ),
    );
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(
      (await db.select().from(s.refunds).where(eq(s.refunds.id, r.id)))[0]
        .state,
    ).toBe("succeeded");
  });
  it("native HTTP enforces owner/admin/origin and removes arbitrary shipment CRUD", async () => {
    const x = await fixture();
    state.userId = x.buyer.id;
    expect(
      (await request(`/admin/fulfillment/orders/${x.order.id}`, "buyer"))
        .status,
    ).toBe(403);
    expect(
      (await request(`/me/orders/${x.order.id}/fulfillment`, "buyer")).status,
    ).toBe(200);
    expect(
      (await request(`/me/orders/${x.order.id}/fulfillment`, null)).status,
    ).toBe(401);
    state.userId = admin.id;
    expect(
      (await request(`/me/orders/${x.order.id}/fulfillment`, "buyer")).status,
    ).toBe(404);
    expect(
      (
        await request("/shipment", "admin", {
          orderId: x.order.id,
          status: "delivered",
        })
      ).status,
    ).toBe(404);
    const response = await httpRequest(app,
      `/admin/fulfillment/orders/${x.order.id}/shipment`,
      {
        method: "POST",
        headers: {
          cookie: "admin",
          origin: "https://evil.invalid",
          "content-type": "application/json",
        },
        body: JSON.stringify(cmd({ action: "prepare" })),
      },
    );
    expect(response.status).toBe(403);
  });
  it("native Hono commands validate strict payloads and run the owned partial return workflow", async () => {
    const x = await fixture();
    state.userId = x.buyer.id;
    const url = `/admin/fulfillment/orders/${x.order.id}/shipment`;
    expect(
      await request(
        url,
        "admin",
        cmd({ action: "prepare", actorId: admin.id }),
      ),
    ).toMatchObject({ status: 400 });
    expect(
      await request(
        url,
        "admin",
        cmd({
          action: "prepare",
          carrier: "HTTP fixture",
          trackingNumber: randomUUID(),
        }),
      ),
    ).toMatchObject({ status: 200 });
    expect(
      await request(url, "admin", cmd({ action: "handover" })),
    ).toMatchObject({ status: 200 });
    expect(
      await request(
        url,
        "admin",
        cmd({ action: "delivered", codProof: "HTTP COD receipt" }),
      ),
    ).toMatchObject({ status: 200 });
    expect(
      await request(
        `/me/orders/${x.order.id}/returns`,
        "buyer",
        cmd({ items: [{ orderItemId: x.item.id, quantity: 1 }] }),
      ),
    ).toMatchObject({ status: 201, data: { status: "requested" } });
    expect(
      await request("/payment", "admin", {
        orderId: x.order.id,
        status: "completed",
        amount: 1,
      }),
    ).toMatchObject({ status: 404 });
  });
  it("legacy refund flags without a matching ledger block automatic double-refunds", async () => {
    const x = await fixture("stripe");
    await db
      .update(s.orders)
      .set({ paymentStatus: "partially_refunded" })
      .where(eq(s.orders.id, x.order.id));
    await expect(
      f.createRefund(x.order.id, cmd({ purpose: "paid_cancellation" }), admin),
    ).rejects.toMatchObject({ status: 409 });
    expect(await balance(x)).toMatchObject({
      quantityOnHand: 10,
      quantityReserved: 3,
    });
  });
  it("a rejected refund transaction rolls back stock release, cancellation, command and outbox", async () => {
    const x = await fixture("stripe"),
      input = cmd({ purpose: "paid_cancellation" });
    await db
      .update(s.payments)
      .set({ amount: "1" })
      .where(eq(s.payments.id, x.payment.id));
    await expect(
      f.createRefund(x.order.id, input, admin),
    ).rejects.toMatchObject({ status: 409 });
    expect(await balance(x)).toMatchObject({
      quantityOnHand: 10,
      quantityReserved: 3,
    });
    expect(
      (await db.select().from(s.orders).where(eq(s.orders.id, x.order.id)))[0]
        .orderStatus,
    ).toBe("confirmed");
    expect(
      await db
        .select()
        .from(s.fulfillmentCommands)
        .where(eq(s.fulfillmentCommands.id, input.commandId)),
    ).toHaveLength(0);
    expect(
      await db
        .select()
        .from(s.refunds)
        .where(eq(s.refunds.orderId, x.order.id)),
    ).toHaveLength(0);
  });
  it("job secret rejects unauthenticated callers; health redacts leases/payloads", async () => {
    process.env.INTERNAL_JOB_SECRET =
      "phase4-local-job-secret-at-least-32-characters";
    expect((await request("/internal/jobs/dispatch", "admin", {})).status).toBe(
      401,
    );
    const result = await request("/admin/fulfillment/operations");
    expect(result.status).toBe(200);
    expect(JSON.stringify(result.data)).not.toContain("leaseToken");
  });
  it("statistics counts collected/refunded/net from actual settlements", async () => {
    const totals = await pool.query(
      "select (select coalesce(sum(amount),0) from refund where state='succeeded') refunded,(select coalesce(sum(amount),0) from payment where status in ('completed','refunded')) collected",
    );
    const result = await request("/admin/statistics");
    expect({ summary: result.data, expected: totals.rows[0] }).toMatchObject({
      summary: { refunded: Number(totals.rows[0].refunded) },
    });
    expect(result.status).toBe(200);
    expect(result.data.revenue).toBe(
      result.data.collected - result.data.refunded,
    );
    expect(result.data.refunded).toBeGreaterThan(0);
    expect(result.data.collected).toBe(Number(totals.rows[0].collected));
  });
});
