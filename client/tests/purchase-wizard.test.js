import { describe, expect, it } from "vitest";
import {
  cartIsValid,
  paymentLabels,
  validateWizardStep,
} from "../src/lib/checkout/wizard.js";

const items = [{ id: "variant-1", price: 15000000, quantity: 1 }];
const addresses = [{ id: "saved-address-1" }];
const recipient = {
  name: "Nguyễn Văn A",
  phone: "0901234567",
  email: "buyer@example.com",
  delivery: "delivery",
  addressId: "saved-address-1",
  store: "hcm",
  shipping: "standard",
  note: "",
};
const validate = (
  step,
  values = recipient,
  payment = "cod",
  list = addresses,
) => validateWizardStep(step, items, values, payment, list);

describe("purchase wizard validation", () => {
  it("rejects empty carts and invalid quantities or prices at every step", () => {
    expect(cartIsValid(items)).toBe(true);
    for (const step of [0, 1, 2, 3])
      expect(
        validateWizardStep(step, [], recipient, "cod", addresses),
      ).toHaveProperty("cart");
    for (const patch of [
      { quantity: 0 },
      { quantity: 1.5 },
      { price: NaN },
      { price: -1 },
    ])
      expect(cartIsValid([{ ...items[0], ...patch }])).toBe(false);
  });
  it("allows cart review before recipient information is filled", () => {
    expect(validateWizardStep(0, items, {}, undefined)).toEqual({});
  });
  it("blocks invalid contact information", () => {
    expect(
      Object.keys(
        validate(1, { ...recipient, name: "", phone: "abc", email: "invalid" }),
      ),
    ).toEqual(expect.arrayContaining(["name", "phone", "email"]));
  });
  it("requires an address in the saved list, even when arbitrary address text is supplied", () => {
    for (const step of [1, 2, 3]) {
      expect(
        validate(step, {
          ...recipient,
          addressId: "someone-elses-address",
          address: "24 Nguyễn Huệ",
          city: "HCM",
        }),
      ).toHaveProperty("addressId");
      expect(validate(step, recipient, "cod", [])).toHaveProperty("addressId");
    }
    expect(validate(1)).toEqual({});
  });
  it("allows pickup without a shipping address but requires a known store", () => {
    expect(
      validate(1, { ...recipient, delivery: "store", addressId: undefined }),
    ).toEqual({});
    expect(
      validate(1, { ...recipient, delivery: "store", store: "unknown" }),
    ).toHaveProperty("store");
  });
  it("accepts exactly the six requested payment methods", () => {
    expect(Object.keys(paymentLabels)).toEqual([
      "cod",
      "momo",
      "zalopay",
      "vnpay",
      "paypal",
      "stripe",
    ]);
    for (const method of Object.keys(paymentLabels))
      expect(validate(3, recipient, method)).toEqual({});
    for (const method of ["card", "bank", "unrecognized"])
      expect(validate(3, recipient, method)).toHaveProperty("payment");
  });
});
