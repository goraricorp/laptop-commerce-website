import { afterEach, describe, expect, it, vi } from "vitest";
import { readComparison } from "../src/hooks/use-comparison.js";
afterEach(() => vi.unstubAllGlobals());
describe("persisted comparison selection", () => {
  it("discards product snapshots, malformed UUIDs and duplicates and caps at four IDs", () => {
    const ids = Array.from(
      { length: 5 },
      (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    );
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify([
          { id: ids[0], price: 1 },
          "------------------------------------",
          ids[0],
          ...ids,
        ]),
    });
    expect(readComparison()).toEqual(ids.slice(0, 4));
  });
  it("recovers from corrupt or inaccessible storage without creating substitute products", () => {
    vi.stubGlobal("localStorage", { getItem: () => "{invalid" });
    expect(readComparison()).toEqual([]);
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw Error("Storage denied");
      },
    });
    expect(readComparison()).toEqual([]);
  });
});
