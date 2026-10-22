import dotenv from 'dotenv'
import process from 'node:process'

dotenv.config({ path: '.env.local', override: false, debug: false, quiet: true })

export const nodeEnv = process.env.NODE_ENV
export const serverUrl = process.env.VITE_PUBLIC_SERVER_URL
export const clientUrl = process.env.VITE_PUBLIC_CLIENT_URL
export const mobileUrl = process.env.VITE_PUBLIC_MOBILE_URL
export const jwtSecret = process.env.VITE_JWT_SECRET
export const databaseUrl = process.env.DATABASE_URL

export const betterAuthApiKey = process.env.BETTER_AUTH_API_KEY
export const betterAuthUrl = process.env.BETTER_AUTH_URL ?? `${serverUrl}/auth`
export const betterAuthSecret = process.env.BETTER_AUTH_SECRET
if (!betterAuthSecret || betterAuthSecret.length < 32) {
  throw new Error('BETTER_AUTH_SECRET is required and must contain at least 32 characters')
}

export const awsEndpointUrlS3 = process.env.AWS_ENDPOINT_URL_S3
export const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID
export const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
export const awsRegion = process.env.AWS_REGION
export const storageBucket = process.env.VITE_STORAGE_BUCKET
export const storageMaxFileSize = process.env.VITE_STORAGE_MAX_FILE_SIZE ? Number(process.env.VITE_STORAGE_MAX_FILE_SIZE) : undefined
export const storageAllowedTypes = process.env.VITE_STORAGE_ALLOWED_TYPES

// EMAIL_APSS is the app password variable declared in .env.example.
// EMAIL_PASS is exported separately, never used as a secret fallback.
export const emailUser = process.env.EMAIL_USER
export const emailAppPassword = String(process.env.EMAIL_APSS)
export const emailPassword = process.env.EMAIL_PASS
export const emailFrom = process.env.EMAIL_FROM
export const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY

export const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY
export const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const paypalEnabled = process.env.PAYPAL_ENABLED === 'true'
export const paypalClientId = process.env.PAYPAL_CLIENT_ID
export const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET
export const paypalMode = process.env.PAYPAL_MODE
export const paypalEnvironment = process.env.PAYPAL_ENVIRONMENT
if (paypalEnvironment !== undefined && !['sandbox', 'production'].includes(paypalEnvironment)) {
  throw new Error('PAYPAL_ENVIRONMENT must be sandbox or production')
}
export const paypalApiUrl = paypalEnvironment === undefined ? undefined
  : paypalEnvironment === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

export const momoEnabled = process.env.MOMO_ENABLED === 'true'
export const momoPartnerCode = process.env.MOMO_PARTNER_CODE
export const momoAccessKey = process.env.MOMO_ACCESS_KEY
export const momoSecretKey = process.env.MOMO_SECRET_KEY
export const momoEndpoint = process.env.MOMO_ENDPOINT
export const momoSignatureKey = process.env.MOMO_SIGNATURE_KEY
export const momoPaymentCode = process.env.MOMO_PAYMENT_CODE
export const momoPartnerName = process.env.MOMO_PARTNER_NAME
export const momoRedirectUrl = process.env.MOMO_REDIRECT_URL
export const momoIpnUrl = process.env.MOMO_IPN_URL

export const zalopayEnabled = process.env.ZALOPAY_MERCHANT_ENABLED === 'true'
export const zalopayAppId = process.env.ZALOPAY_MERCHANT_APP_ID
export const zalopayKey1 = process.env.ZALOPAY_MERCHANT_KEY1
export const zalopayKey2 = process.env.ZALOPAY_MERCHANT_KEY2
export const zalopayEndpoint = process.env.ZALOPAY_MERCHANT_ENDPOINT
export const zalopayGatewayEndpoint = process.env.ZALOPAY_MERCHANT_GATEWAY_ENDPOINT
export const zalopayCallbackUrl = process.env.ZALOPAY_MERCHANT_CALLBACK_URL
export const zalopayRedirectUrl = process.env.ZALOPAY_MERCHANT_REDIRECT_URL

export const vnpayEnabled = process.env.VNPAY_ENABLED === 'true'
export const vnpayTmnCode = process.env.VNPAY_TMN_CODE
export const vnpayHashSecret = process.env.VNPAY_HASH_SECRET
export const vnpayUrl = process.env.VNPAY_URL
export const vnpayReturnUrl = process.env.VNPAY_RETURN_URL

export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
export const paypalVndPerUsd = process.env.PAYPAL_VND_PER_USD

export const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID
