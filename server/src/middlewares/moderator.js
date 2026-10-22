export async function requireModerator(req, res, next) {
  const user = req["user"];
  if (!user)
    return res.status(401).json({
      message: "Unauthorized",
    });
  if (!["moderator", "administrator", "master"].includes(user.role))
    return res.status(403).json({
      message: "Forbidden",
    });
  await next();
}
