/* eslint-disable react/prop-types */

import { useEffect, useMemo, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import {
  CheckCircle2,
  ImageIcon,
  KeyRound,
  LockKeyhole,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import { AuthFieldError } from '@/components/auth/auth-field-error'
import { PasswordInput } from '@/components/auth/password-input'
import { Spinner } from '@/components/element/spinner'
import { FileUpload } from '@/components/upload/file-upload'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useUser } from '@/hooks/use-user'
import { getSupabaseConfig } from '@/lib/supabase/client'
import { userAccountSchema } from '@/schemas/user-account'

function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function toDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('vi-VN')
}

function getDefaults(user) {
  return {
    birthday: toDateInput(user?.birthday),
    currentPassword: '',
    email: user?.email ?? '',
    firstName: user?.firstName ?? '',
    image: user?.image ?? '',
    lastName: user?.lastName ?? '',
    name: user?.name ?? '',
    newPassword: '',
    phone: user?.phone ?? '',
  }
}

function EditableField({ autoComplete, field, label, placeholder, type = 'text' }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Input
        autoComplete={autoComplete}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={field.state.value}
      />
      <AuthFieldError errors={field.state.meta.errors} />
    </div>
  )
}

function ReadOnlyField({ label, value, type = 'text' }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Input disabled type={type} value={value ?? ''} />
    </div>
  )
}

function AccountCard({ account, index }) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Tài khoản liên kết {index + 1}</CardTitle>
          <Badge variant="secondary">{account.providerId}</Badge>
        </div>
        <CardDescription>Better Auth chỉ cho phép đọc metadata an toàn của tài khoản này.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ReadOnlyField label="ID tài khoản" value={account.id} />
        <ReadOnlyField label="Account ID" value={account.accountId} />
        <ReadOnlyField label="Provider ID" value={account.providerId} />
        <ReadOnlyField label="Issuer" value={account.issuer || '—'} />
        <ReadOnlyField label="User ID" value={account.userId} />
        <ReadOnlyField label="Phạm vi quyền" value={account.scopes?.join(', ') || '—'} />
        <ReadOnlyField label="Ngày tạo" value={toDateTime(account.createdAt)} />
        <ReadOnlyField label="Cập nhật lúc" value={toDateTime(account.updatedAt)} />
        <ReadOnlyField label="Access token" type="password" value="Không được API trả về" />
        <ReadOnlyField label="Refresh token" type="password" value="Không được API trả về" />
        <ReadOnlyField label="ID token" type="password" value="Không được API trả về" />
        <ReadOnlyField label="Mật khẩu đã băm" type="password" value="Không được API trả về" />
      </CardContent>
    </Card>
  )
}

export function UserAccountForm() {
  const navigate = useNavigate()
  const {
    accounts,
    accountsQuery,
    changeEmail,
    changePassword,
    updateUser,
    user,
  } = useUser({ loadAccounts: true })
  const [notice, setNotice] = useState(null)
  const supabaseConfig = useMemo(() => getSupabaseConfig(), [])
  const hasSupabaseConfig = Boolean(supabaseConfig.url && supabaseConfig.anonKey)
  const form = useForm({
    defaultValues: getDefaults(user),
    validators: { onChange: userAccountSchema },
    onSubmit: async ({ value }) => {
      setNotice(null)
      try {
        await updateUser({
          birthday: value.birthday ? new Date(`${value.birthday}T00:00:00.000Z`) : null,
          firstName: value.firstName || null,
          image: value.image || null,
          lastName: value.lastName || null,
          name: value.name.trim(),
          phone: value.phone || null,
        })

        const emailChanged = value.email.trim().toLowerCase() !== user.email.toLowerCase()
        if (emailChanged) {
          await changeEmail({ callbackURL: new URL('/user/demo', window.location.origin).href, newEmail: value.email.trim() })
        }

        if (value.currentPassword && value.newPassword) {
          await changePassword({
            currentPassword: value.currentPassword,
            newPassword: value.newPassword,
            revokeOtherSessions: true,
          })
        }

        form.setFieldValue('currentPassword', '')
        form.setFieldValue('newPassword', '')
        setNotice({
          message: emailChanged
            ? 'Thông tin đã được lưu. Hãy mở email mới để xác nhận việc thay đổi địa chỉ email.'
            : 'Thông tin người dùng đã được cập nhật thành công.',
          type: 'success',
        })
      } catch (cause) {
        setNotice({
          message: cause instanceof Error ? cause.message : 'Không thể cập nhật thông tin người dùng.',
          type: 'error',
        })
      }
    },
  })

  useEffect(() => {
    if (user) form.reset(getDefaults(user))
  }, [form, user])

  if (!user) return null
  const displayName = user.name || user.email || 'Người dùng'
  const avatarFallback = displayName.slice(0, 2).toUpperCase()

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Cập nhật người dùng và tài khoản</h1>
        <p className="text-sm text-muted-foreground">
          Các trường được Better Auth hỗ trợ có thể chỉnh sửa; dữ liệu hệ thống và provider chỉ được xem.
        </p>
      </div>

      {notice ? (
        <Alert variant={notice.type === 'error' ? 'destructive' : undefined}>
          {notice.type === 'error' ? <LockKeyhole className="size-4" /> : <CheckCircle2 className="size-4" />}
          <AlertTitle>{notice.type === 'error' ? 'Cập nhật thất bại' : 'Đã cập nhật'}</AlertTitle>
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card>
          <CardContent className="items-center text-center">
            <form.Subscribe selector={(state) => state.values.image}>
              {(image) => (
                <Avatar className="size-24 rounded-3xl">
                  <AvatarImage alt={displayName} src={image} />
                  <AvatarFallback className="rounded-3xl text-2xl">{avatarFallback}</AvatarFallback>
                </Avatar>
              )}
            </form.Subscribe>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant="secondary">{user.role ?? 'user'}</Badge>
            <Separator />
            <div className="flex w-full flex-col gap-3 text-left text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Email</span>
                <span>{user.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Ngày tham gia</span>
                <span>{toDateTime(user.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="size-4" />Ảnh đại diện</CardTitle>
              <CardDescription>Ảnh được tải trực tiếp lên Supabase Storage; URL công khai sẽ được lưu vào Better Auth.</CardDescription>
            </CardHeader>
            <CardContent>
              {hasSupabaseConfig ? (
                <FileUpload
                  autoUpload
                  maxFiles={1}
                  onUploadComplete={(urls) => form.setFieldValue('image', urls[0] ?? '')}
                />
              ) : (
                <Alert>
                  <ImageIcon className="size-4" />
                  <AlertTitle>Chưa cấu hình Supabase phía client</AlertTitle>
                  <AlertDescription>
                    Thêm VITE_PUBLIC_SUPABASE_URL và VITE_PUBLIC_SUPABASE_ANON_KEY để bật tải ảnh. Bạn vẫn có thể nhập URL ảnh bên dưới.
                  </AlertDescription>
                </Alert>
              )}
              <form.Field name="image">
                {(field) => <EditableField field={field} label="URL ảnh đại diện" placeholder="https://…" />}
              </form.Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserRound className="size-4" />Thông tin có thể chỉnh sửa</CardTitle>
              <CardDescription>Tên, ảnh và các trường mở rộng đã khai báo trong cấu hình Better Auth.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <form.Field name="name">{(field) => <EditableField autoComplete="name" field={field} label="Tên hiển thị" />}</form.Field>
              <form.Field name="email">{(field) => <EditableField autoComplete="email" field={field} label="Email" type="email" />}</form.Field>
              <form.Field name="firstName">{(field) => <EditableField autoComplete="given-name" field={field} label="Tên" />}</form.Field>
              <form.Field name="lastName">{(field) => <EditableField autoComplete="family-name" field={field} label="Họ" />}</form.Field>
              <form.Field name="phone">{(field) => <EditableField autoComplete="tel" field={field} label="Số điện thoại" type="tel" />}</form.Field>
              <form.Field name="birthday">{(field) => <EditableField autoComplete="bday" field={field} label="Ngày sinh" type="date" />}</form.Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4" />Dữ liệu hệ thống chỉ đọc</CardTitle>
              <CardDescription>Các trường này do Better Auth và cơ sở dữ liệu quản lý nên không thể gửi qua update-user.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <ReadOnlyField label="User ID" value={user.id} />
              <ReadOnlyField label="Vai trò" value={user.role ?? 'user'} />
              <ReadOnlyField label="Trạng thái email" value={user.emailVerified ? 'Đã xác thực' : 'Chưa xác thực'} />
              <ReadOnlyField label="Ngày tạo" value={toDateTime(user.createdAt)} />
              <ReadOnlyField label="Cập nhật lúc" value={toDateTime(user.updatedAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="size-4" />Đổi mật khẩu</CardTitle>
              <CardDescription>Để trống cả hai ô nếu bạn không muốn thay đổi mật khẩu của account credential.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <form.Field name="currentPassword">
                {(field) => (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={field.name}>Mật khẩu hiện tại</Label>
                    <PasswordInput autoComplete="current-password" id={field.name} name={field.name} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} value={field.state.value} />
                    <AuthFieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>
              <form.Field name="newPassword">
                {(field) => (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={field.name}>Mật khẩu mới</Label>
                    <PasswordInput autoComplete="new-password" id={field.name} name={field.name} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} value={field.state.value} />
                    <AuthFieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={() => void navigate({ to: '/user/profile' })} type="button" variant="outline">Hủy</Button>
            <form.Subscribe selector={(state) => [userAccountSchema.safeParse(state.values).success, state.isSubmitting]}>
              {([isValid, isSubmitting]) => (
                <Button disabled={!isValid || isSubmitting} type="submit">
                  {isSubmitting ? <Spinner className="size-4" /> : <Save className="size-4" />}
                  {isSubmitting ? 'Đang lưu…' : 'Lưu thay đổi'}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">Bảng account</h2>
          <p className="text-sm text-muted-foreground">Các tài khoản đăng nhập đang liên kết với người dùng.</p>
        </div>
        {accountsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner className="size-4" />Đang tải tài khoản…</div>
        ) : accountsQuery.error ? (
          <Alert variant="destructive"><LockKeyhole className="size-4" /><AlertTitle>Không thể tải account</AlertTitle><AlertDescription>{accountsQuery.error.message}</AlertDescription></Alert>
        ) : accounts.length ? (
          accounts.map((account, index) => <AccountCard account={account} index={index} key={account.id} />)
        ) : (
          <Alert><Mail className="size-4" /><AlertTitle>Không có dữ liệu account</AlertTitle><AlertDescription>Better Auth chưa trả về tài khoản liên kết nào cho phiên hiện tại.</AlertDescription></Alert>
        )}
      </div>
    </form>
  )
}
