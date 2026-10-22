import { describe, expect, it } from "vitest";
import {
  catalogSearchState,
  changeCatalogFilter,
  toggleCatalogValue,
} from "../src/lib/utils/catalog-search";
describe("catalog URL state", () => {
  it("restores search, facets, price, sorting and page", () => {
    const state = {
      q: "laptop",
      brandId: "brand",
      categoryId: "category",
      minPrice: 0,
      maxPrice: 500,
      sort: "price-desc",
      page: 4,
      attributes: { ram: ["16gb"] },
    };
    expect(
      catalogSearchState({
        ...state,
        attributes: JSON.stringify(state.attributes),
      }),
    ).toEqual(state);
    expect(changeCatalogFilter(state, { q: "new" })).toEqual({
      ...state,
      q: "new",
      page: 1,
    });
  });
  it("clears empty groups and handles malformed URL values", () => {
    expect(
      catalogSearchState({ page: -4, sort: "unknown", attributes: "bad" }),
    ).toEqual({ page: 1, sort: "newest" });
    expect(
      changeCatalogFilter(
        { attributes: { ram: ["8gb"] }, page: 3 },
        { attributes: { ram: [] } },
      ),
    ).toEqual({ page: 1, sort: "newest" });
    expect(toggleCatalogValue(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleCatalogValue(["a", "b"], "a")).toEqual(["b"]);
  });
});
