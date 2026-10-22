/* eslint-disable react/prop-types */
import { Link } from '@tanstack/react-router'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const navigation = [
  { link: '/account/settings', name: 'Tài khoản' },
  { link: '/account/notifications', name: 'Thông báo' },
  { link: '/account/connections', name: 'Kết nối' },
]

export function AccountWrapper({ title, children }) {
  return (
    <section className="flex flex-col gap-6">
      <header><p className="text-sm text-muted-foreground">Cài đặt tài khoản</p><h1 className="text-2xl font-semibold tracking-tight">{title}</h1></header>
      <Tabs>
        <TabsList>
          {navigation.map((item) => <TabsTrigger key={item.link} value={item.link} render={<Link to={item.link} />}>{item.name}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      {children}
    </section>
  )
}
