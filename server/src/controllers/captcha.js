import { captchaBodySchema } from "../schemas/captcha.js";
import { verifyCaptcha } from "../services/captcha.js";
export async function checkCaptcha(req, res) {
  const { captcha } = captchaBodySchema.parse(req["body"]);
  const result = await verifyCaptcha(captcha, req.get("x-real-ip"));
  if (!result.success)
    return res.status(400).json({
      message: "Invalid captcha",
      details: {
        codes: result["error-codes"],
      },
    });
  return res.status(200).json({
    success: true,
  });
}
