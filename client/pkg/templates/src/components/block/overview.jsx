/* eslint-disable react/prop-types */

import { cn } from '@/lib/utils'

export function Overview({ children, className }) {
  return <section className={cn('mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8', className)}>{children}</section>
}
