import express from "express";
import { parseBody } from "../../src/middlewares/body.js";
import { request } from "./request.js";
export function routeRequest(router, method, pattern) {
  return async (input, response, onError) => {
    const app = express();
    app.use((req, res, next) => {
      req.user = { role: "administrator", ...input.user };
      next();
    });
    app.use(parseBody);
    app.use(router);
    app.use((error, req, res, next) => {
      void next;
      onError?.(error);
      res.status(error.status ?? 400).json({ message: error.message });
    });
    const path = pattern.replace(
        /:([^/]+)/g,
        (_, key) => input.params?.[key] ?? key,
      ),
      query = new URLSearchParams(input.query ?? {});
    const result = await request(app, path + (query.size ? `?${query}` : ""), {
      method: method.toUpperCase(),
      ...(input.body === undefined
        ? {}
        : {
            headers: { "content-type": "application/json" },
            body: JSON.stringify(input.body),
          }),
    });
    response.status?.(result.status);
    response.json?.(await result.json());
    return result;
  };
}
