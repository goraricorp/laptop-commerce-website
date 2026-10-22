import nodemailer from 'nodemailer'

import {
  emailAppPassword,
  emailFrom,
  emailUser,
} from '../utils/environment.js'

function createTransporter() {
  if (!emailUser || !emailAppPassword) {
    throw new Error('Chưa cấu hình EMAIL_USER và EMAIL_APSS để gửi email')
  }

  // Google displays App Passwords in groups; spaces are not part of the password.

  return nodemailer.createTransport({
    service: 'gmail',
    connectionTimeout:10000, greetingTimeout:10000, socketTimeout:15000,
    auth: { user: emailUser, pass: emailAppPassword.replace(/\s+/g, '') },
  })
}

export async function verifyEmailTransport() {
  return createTransporter().verify()
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

async function sendMail(message) {
  const transporter = createTransporter()
  const result = await transporter.sendMail({
    from: emailFrom ?? `Webkitlab <${emailUser}>`,
    ...message,
  })

  const accepted = Array.isArray(result.accepted) ? result.accepted : []
  const rejected = Array.isArray(result.rejected) ? result.rejected : []

  if (!accepted.length || rejected.length) {
    const error = new Error('Máy chủ email không chấp nhận người nhận')
    error.cause = { accepted, rejected, response: result.response }
    throw error
  }

  console.info('[Email] Đã chuyển thư đến máy chủ SMTP', {
    accepted: accepted.length,
    rejected: rejected.length,
    messageId: result.messageId,
    response: result.response,
  })

  return result
}

export async function sendVerificationOtpEmail({ email, otp }) {
  const safeOtp = escapeHtml(otp)

  return sendMail({
    to: email,
    subject: `${otp} là mã xác thực Webkitlab của bạn`,
    text: `Mã xác thực Webkitlab của bạn là ${otp}. Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.`,
    html: `
      <div style="margin:0;background:#f4f4f5;padding:32px 16px;font-family:Arial,sans-serif;color:#18181b">
        <div style="margin:0 auto;max-width:560px;border:1px solid #e4e4e7;border-radius:12px;background:#ffffff;padding:32px">
          <h1 style="margin:0 0 12px;font-size:24px">Mã xác thực Webkitlab</h1>
          <p style="margin:0 0 24px;line-height:1.6;color:#52525b">Nhập mã gồm 6 chữ số dưới đây để xác nhận yêu cầu của bạn.</p>
          <div style="margin:0 0 24px;border-radius:10px;background:#f4f4f5;padding:20px;text-align:center;font-size:32px;font-weight:700;letter-spacing:10px">${safeOtp}</div>
          <p style="margin:0;line-height:1.6;color:#71717a">Mã có hiệu lực trong 5 phút. Nếu bạn không yêu cầu mã, hãy bỏ qua email này.</p>
        </div>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail({ email, name, url }) {
  const safeName = escapeHtml(name || 'bạn')
  const safeUrl = escapeHtml(url)

  return sendMail({
    to: email,
    subject: 'Đặt lại mật khẩu Webkitlab',
    text: `Xin chào ${name || 'bạn'}, mở liên kết sau để đặt lại mật khẩu: ${url}`,
    html: `<p>Xin chào ${safeName},</p><p>Bạn vừa yêu cầu đặt lại mật khẩu Webkitlab.</p><p><a href="${safeUrl}">Đặt lại mật khẩu</a></p><p>Liên kết có hiệu lực trong 60 phút.</p>`,
  })
}

export async function sendDeleteAccountEmail({ email, name, url }) {
  const safeName = escapeHtml(name || 'bạn')
  const safeUrl = escapeHtml(url)

  return sendMail({
    to: email,
    subject: 'Xác nhận xoá tài khoản Webkitlab',
    text: `Xin chào ${name || 'bạn'}, mở liên kết sau để xác nhận xoá tài khoản: ${url}`,
    html: `<p>Xin chào ${safeName},</p><p>Vui lòng xác nhận yêu cầu xoá tài khoản Webkitlab.</p><p><a href="${safeUrl}">Xác nhận xoá tài khoản</a></p>`,
  })
}

export async function sendOrderEventEmail({email,code,event,messageId}) {
  const labels={payment_confirmed:'Đã xác nhận thanh toán',payment_needs_review:'Thanh toán cần đối soát, đơn chưa được giao',shipment_prepare:'Đang chuẩn bị giao',shipment_handover:'Đã bàn giao vận chuyển',shipment_delivered:'Đã giao thành công',shipment_failed:'Giao chưa thành công',shipment_retry:'Đang giao lại',return_requested:'Đã nhận yêu cầu trả hàng',return_approved:'Đã duyệt trả hàng',return_rejected:'Đã từ chối trả hàng',return_received:'Đã nhận hàng trả',return_inspected:'Đã kiểm hàng trả',return_completed:'Đã hoàn tất hồ sơ trả hàng',refund_succeeded:'Đã xác nhận hoàn tiền thành công'}
  const label=Object.hasOwn(labels,event)?labels[event]:'Có cập nhật mới'
  return sendMail({to:email,subject:`Cập nhật đơn ${code}`,text:`Đơn ${code}: ${label}. Vui lòng đăng nhập để xem chi tiết.`,messageId})
}

export async function sendNewsletterEmail({email,purpose,url}) {
  return sendMail({to:email,subject:purpose==='confirm'?'Xác nhận đăng ký bản tin':'Đã xác nhận đăng ký bản tin',text:purpose==='confirm'?`Chúng tôi đã tiếp nhận yêu cầu. Mở liên kết và bấm xác nhận: ${url}`:`Đã xác nhận đăng ký bản tin. Bạn có thể hủy đăng ký tại: ${url}`})
}
