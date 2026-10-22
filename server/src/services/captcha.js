import process from "node:process";
function serviceError(status, message) {
  return Object.assign(new Error(message), { status });
}

export async function verifyCaptcha(token, remoteIp) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) throw serviceError(503, "Captcha is not configured");
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);
  const response = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    { method: "POST", body },
  );
  if (!response.ok) throw serviceError(502, "Captcha provider is unavailable");
  return await response.json();
}
