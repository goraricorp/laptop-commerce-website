import { describe, it, expect } from "vitest";
import {
  resourceTableKeys,
  productBrandIdentity,
  tableIdentity,
} from "../src/lib/utils/admin-table.js";

describe("admin table identity presentation", () => {
  it("groups brand logo/name and product type, falling back when no logo is configured", () => {
    const row = { brandId: "b", productType: "laptop" };
    expect(
      productBrandIdentity(
        row,
        {},
        { b: { label: "Dell", logoUrl: "/dell.webp" } },
      ),
    ).toEqual({ title: "Dell", description: "Laptop", image: "/dell.webp" });
    expect(productBrandIdentity(row, { brands: { b: "Dell" } })).toEqual({
      title: "Dell",
      description: "Laptop",
      image: null,
    });
  });
  it("resolves relation identities when no display title exists", () => {
    const row = { productId: "p", title: "", status: "pending" };
    expect(
      tableIdentity("product-reviews", row, { products: { p: "Laptop" } })
        .title,
    ).toBe("Laptop");
    expect(resourceTableKeys([row], "product-reviews")[0]).toBe("productId");
  });
  it("merges product images/descriptions without losing category/brand names or status", () => {
    const row = {
      id: "p",
      categoryId: "c",
      brandId: "b",
      name: "Laptop",
      slug: "laptop",
      summary: "Mô tả",
      imageUrl: "/actual.webp",
      status: "active",
      createdAt: "2026-01-01",
    };
    expect(resourceTableKeys([row], "products")).toEqual([
      "name",
      "brandId",
      "status",
      "createdAt",
    ]);
    expect(tableIdentity("products", row)).toMatchObject({
      title: "Laptop",
      description: "laptop | Mô tả",
      image: "/actual.webp",
    });
  });
  it("uses email/avatar for users and slug/logo for brands", () => {
    expect(
      tableIdentity("users", {
        name: "Admin",
        email: "admin@example.test",
        image: "/avatar.png",
      }),
    ).toMatchObject({
      title: "Admin",
      description: "admin@example.test",
      image: "/avatar.png",
      imageFit: "cover",
    });
    const row = {
      name: "Dell",
      slug: "dell",
      logoUrl: "/logo.webp",
      isActive: false,
    };
    expect(tableIdentity("brands", row)).toMatchObject({
      title: "Dell",
      description: "dell",
      image: "/logo.webp",
    });
    expect(resourceTableKeys([row], "brands")).toEqual(["name", "isActive"]);
  });
  it("shows attribute code and display type together, keeps filterability separate", () => {
    const row = {
      name: "RAM",
      code: "ram",
      displayType: "text",
      isFilterable: true,
      position: 1,
    };
    expect(tableIdentity("attributes", row).description).toBe("ram | text");
    expect(resourceTableKeys([row], "attributes")).toEqual([
      "name",
      "isFilterable",
      "position",
    ]);
  });
  it("renders media with resolved product names instead of IDs/URLs and ignores videos as avatars", () => {
    const row = {
      id: "m",
      productId: "p",
      url: "/private.webp",
      mediaType: "image",
      alt: "Ảnh chính",
    };
    expect(
      tableIdentity("product-media", row, { products: { p: "Laptop thật" } }),
    ).toMatchObject({
      title: "Laptop thật",
      description: "Ảnh chính",
      image: "/private.webp",
    });
    expect(resourceTableKeys([row], "product-media")).not.toContain("url");
    expect(
      tableIdentity("product-media", { ...row, mediaType: "video" }).image,
    ).toBeNull();
  });
  it("keeps status visible even when a user row has many profile fields", () => {
    const row = {
      id: "u",
      name: "User",
      email: "u@example.test",
      image: null,
      emailVerified: true,
      role: "user",
      username: "user",
      firstName: "A",
      lastName: "B",
      phone: "123",
      banned: true,
    };
    const keys = resourceTableKeys([row], "users");
    expect(keys).toContain("banned");
    expect(keys).not.toContain("image");
    expect(keys).not.toContain("email");
  });
});
