// A transaction has one pg connection. Await lazy Drizzle queries one at a time.
export async function readQueries(queries) {
  const results = []
  for (const query of queries) results.push(await query)
  return results
}
