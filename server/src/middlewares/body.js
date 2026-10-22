import express from "express";
export const maxRequestSize = 4_100_000;
export const jsonBody = express.json({ limit: maxRequestSize, strict: false });
const urlencoded = express.urlencoded({
  extended: false,
  limit: maxRequestSize,
  parameterLimit: 100,
});
export const parseBody = [
  jsonBody,
  urlencoded,
  (req, res, next) => {
    req.body ??= {};
    next();
  },
];
export function checkContentLength(req, res, next) {
  const length = Number(req.get("content-length"));
  if (Number.isFinite(length) && length > maxRequestSize)
    return res
      .status(413)
      .json({ message: "Request vượt quá giới hạn kích thước." });
  next();
}
