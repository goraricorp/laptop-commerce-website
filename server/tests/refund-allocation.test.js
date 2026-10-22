import { describe, it, expect } from "vitest";
import {
  allocateOrder,
  unitAmount,
  settlementRefund,
} from "../src/lib/orders/refund-allocation.js";
describe("discount allocation and settlement conservation", () => {
  it("allocates largest remainders deterministically and conserves every VND across units", () => {
    const items = [
      { id: "b", total: "200000", quantity: 2 },
      { id: "a", total: "300000", quantity: 3 },
    ];
    const rows = allocateOrder(
      { id: "order", grandTotal: "529997", shippingTotal: "30000" },
      items,
    );
    expect(rows.reduce((n, r) => n + r.net, 0)).toBe(499997);
    expect(rows.reduce((n, r) => n + r.discount, 0)).toBe(3);
    for (const r of rows)
      expect(
        unitAmount(
          r,
          Array.from({ length: r.quantity }, (_, i) => i),
        ),
      ).toBe(r.net);
    expect(
      allocateOrder(
        { id: "order", grandTotal: "529997", shippingTotal: "30000" },
        items.reverse(),
      ),
    ).toEqual(rows);
  });
  it("conserves captured USD cents over partial VND refunds", () => {
    let used = 0,
      provider = 0;
    for (const amount of [33333, 33333, 33334]) {
      const value = settlementRefund(
        100000,
        "3.99",
        used,
        provider,
        amount,
        "USD",
      );
      used += amount;
      provider += Number(value);
    }
    expect(provider).toBeCloseTo(3.99, 8);
  });
  it("refuses fractional VND and inconsistent legacy totals", () => {
    expect(() =>
      allocateOrder({ grandTotal: "100.5", shippingTotal: "0" }, [
        { id: "a", total: "100.5", quantity: 1 },
      ]),
    ).toThrow();
    expect(() =>
      allocateOrder({ grandTotal: "200", shippingTotal: "0" }, [
        { id: "a", total: "100", quantity: 1 },
      ]),
    ).toThrow();
  });
});
