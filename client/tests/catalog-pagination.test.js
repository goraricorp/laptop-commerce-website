import { describe, expect, it, vi } from "vitest";
import { fetchCatalogPage } from "../src/lib/utils/catalog-pagination.js";

describe("catalog API pagination", () => {
  const rows = Array.from({ length: 356 }, (_, id) => ({ id }));
  const fetcher = () =>
    vi.fn(async (page, limit) => ({
      items: rows.slice((page - 1) * limit, page * limit),
      page,
      limit,
      total: rows.length,
    }));
  it("loads variants beyond the server 100-row cap", async () => {
    const fetch = fetcher();
    expect((await fetchCatalogPage(fetch, 1, 300)).items).toEqual(
      rows.slice(0, 300),
    );
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("preserves page offsets and the partial final page", async () => {
    expect((await fetchCatalogPage(fetcher(), 2, 200)).items).toEqual(
      rows.slice(200),
    );
  });
  it("does not fetch extra pages for a normal small request", async () => {
    const fetch = fetcher();
    expect((await fetchCatalogPage(fetch, 2, 24)).items).toEqual(
      rows.slice(24, 48),
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
