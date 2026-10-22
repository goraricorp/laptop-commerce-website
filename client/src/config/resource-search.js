export function validateResourceSearch(search) {
  return {
    resource: typeof search.resource === "string" ? search.resource : undefined,
  };
}
