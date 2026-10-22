import inject from "light-my-request";
// Only tests use Web Request/Response shapes. Production handlers are native Express.
export async function request(app, path, options = {}) {
  let url = typeof path === "string" ? path : path.url;
  const target = new URL(url, "http://localhost");
  const headers = Object.fromEntries(
    new Headers(
      options.headers ?? (typeof path !== "string" ? path.headers : {}),
    ),
  );
  let body = options.body;
  if (body instanceof FormData) {
    const encoded = new Request("http://localhost", { method: "POST", body });
    headers["content-type"] = encoded.headers.get("content-type");
    body = Buffer.from(await encoded.arrayBuffer());
  }
  const result = await inject(app, {
    url: target.pathname + target.search,
    method: options.method ?? "GET",
    headers: { host: target.host, ...headers },
    ...(body === undefined ? {} : { payload: body }),
  });
  const responseHeaders = new Headers();
  for (const [name, value] of Object.entries(result.headers))
    for (const entry of Array.isArray(value) ? value : [value])
      if (entry !== undefined) responseHeaders.append(name, String(entry));
  return new Response(
    [204, 304].includes(result.statusCode) ? null : result.rawPayload,
    { status: result.statusCode, headers: responseHeaders },
  );
}
