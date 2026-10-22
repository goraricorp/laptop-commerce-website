/* eslint-disable react/prop-types */

import { Link, useRouterState } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

const accountNavigation = [
  ['Tài khoản', '/admin/account/settings'],
  ['Thông báo', '/admin/account/notifications'],
  ['Kết nối', '/admin/account/connections'],
]

export function AccountWrapper({ children, title }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return (
    <section className="flex flex-col gap-6">
      <header><p className="text-sm text-muted-foreground">Cài đặt tài khoản</p><h1 className="text-2xl font-semibold tracking-tight">{title}</h1></header>
      <nav className="flex flex-wrap gap-2">
        {accountNavigation.map(([label, to]) => <Button key={to} nativeButton={false} render={<Link to={to} />} variant={pathname === to ? 'default' : 'outline'}>{label}</Button>)}
      </nav>
      {children}
    </section>
  )
}
