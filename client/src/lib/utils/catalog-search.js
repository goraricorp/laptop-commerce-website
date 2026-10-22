// Keep the complete storefront query in the URL; malformed URL state has safe defaults.
export function catalogSearchState(search = {}) {
  const state = {
    page: Math.max(1, Math.floor(Number(search.page) || 1)),
    sort: ["newest", "name", "price-asc", "price-desc"].includes(search.sort)
      ? search.sort
      : "newest",
  };
  for (const key of ["q", "categoryId", "brand", "brandId"])
    if (typeof search[key] === "string" && search[key].trim())
      state[key] = search[key].trim();
  for (const key of ["minPrice", "maxPrice"])
    if (
      search[key] !== undefined &&
      search[key] !== "" &&
      Number.isFinite(Number(search[key])) &&
      Number(search[key]) >= 0
    )
      state[key] = Number(search[key]);
  let attributes = search.attributes;
  if (typeof attributes === "string") {
    try {
      attributes = JSON.parse(attributes);
    } catch {
      attributes = undefined;
    }
  }
  if (
    attributes &&
    typeof attributes === "object" &&
    !Array.isArray(attributes)
  ) {
    const entries = Object.entries(attributes).filter(
      ([key, values]) =>
        key &&
        Array.isArray(values) &&
        values.length &&
        values.every((value) => typeof value === "string"),
    );
    if (entries.length) state.attributes = Object.fromEntries(entries);
  }
  return state;
}
export function changeCatalogFilter(state, patch) {
  return catalogSearchState({ ...state, ...patch, page: 1 });
}
export function toggleCatalogValue(values = [], value) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
