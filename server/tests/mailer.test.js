import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  config: { emailUser: 'test@gmail.com', emailAppPassword: 'abcd efgh ijkl mnop', emailFrom: undefined },
  createTransport: vi.fn(), verify: vi.fn(), sendMail: vi.fn(),
}))
vi.mock('../src/lib/utils/environment.js', () => mocks.config)
vi.mock('nodemailer', () => ({ default: { createTransport: mocks.createTransport } }))
import { sendVerificationOtpEmail, verifyEmailTransport } from '../src/lib/email/mailer.js'

beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(mocks.config, { emailUser: 'test@gmail.com', emailAppPassword: 'abcd efgh ijkl mnop' })
  mocks.createTransport.mockReturnValue({ verify: mocks.verify, sendMail: mocks.sendMail })
  mocks.verify.mockResolvedValue(true)
})

describe('Nodemailer Gmail credentials', () => {
  it('removes Gmail App Password grouping spaces and verifies without sending a message', async () => {
    await verifyEmailTransport()
    expect(mocks.createTransport).toHaveBeenCalledWith({ service: 'gmail', connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000, auth: { user: 'test@gmail.com', pass: 'abcdefghijklmnop' } })
    expect(mocks.verify).toHaveBeenCalledOnce()
    expect(mocks.sendMail).not.toHaveBeenCalled()
  })

  it('does not swallow SMTP authentication errors', async () => {
    const error = Object.assign(new Error('Authentication failed'), { code: 'EAUTH', responseCode: 534 })
    mocks.sendMail.mockRejectedValueOnce(error)
    await expect(sendVerificationOtpEmail({ email: 'recipient@example.com', otp: '123456' })).rejects.toBe(error)
  })

  it('rejects missing app password without falling back to another secret', async () => {
    mocks.config.emailAppPassword = ''
    await expect(verifyEmailTransport()).rejects.toThrow('EMAIL_APSS')
    expect(mocks.createTransport).not.toHaveBeenCalled()
  })
})
