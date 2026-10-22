import { z } from 'zod'

export const captchaBodySchema = z.object({ captcha: z.string().trim().min(1) })
