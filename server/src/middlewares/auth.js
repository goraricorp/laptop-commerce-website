import { fromNodeHeaders } from "better-auth/node";
import { assertAssured } from "../lib/auth/assurance.js";
import { auth } from "../lib/auth/index.js";
export async function requireAuth(req, res, next) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session)
    return res.status(401).json({
      message: "Unauthorized",
    });
  try {
    if (session.user?.twoFactorEnabled) assertAssured(session);
  } catch (error) {
    return res.status(error.statusCode ?? 403).json({
      message: error.body?.message ?? error.message,
      code: error.body?.code,
    });
  }
  req["auth"] = session;
  req["user"] = session.user;
  await next();
}
