import process from 'node:process'
import { verifyEmailTransport } from '../src/lib/email/mailer.js'

try {
  await verifyEmailTransport()
  console.info('Nodemailer Gmail connection and authentication verified. No email was sent.')
} catch (error) {
  console.error('Gmail authentication failed. Set EMAIL_APSS to a valid Google App Password belonging to EMAIL_USER.', {
    code: error.code,
    responseCode: error.responseCode,
  })
  process.exitCode = 1
}
