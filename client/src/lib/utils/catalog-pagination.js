// The catalog API caps each response at 100 rows.
export async function fetchCatalogPage(fetchPage, page, limit) {
  const offset = (page - 1) * limit;
  const firstPage = Math.floor(offset / 100) + 1;
  const first = await fetchPage(firstPage, 100);
  const lastPage = Math.min(
    Math.ceil((offset + limit) / 100),
    Math.ceil(first.total / 100),
  );
  const pages = await Promise.all(
    Array.from({ length: Math.max(0, lastPage - firstPage) }, (_, index) =>
      fetchPage(firstPage + index + 1, 100),
    ),
  );
  const start = offset % 100;
  return {
    items: [first, ...pages]
      .flatMap((result) => result.items)
      .slice(start, start + limit),
    page,
    limit,
    total: first.total,
  };
}
