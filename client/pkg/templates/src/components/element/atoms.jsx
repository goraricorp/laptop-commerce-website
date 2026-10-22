/* eslint-disable react/prop-types */
import { XIcon } from 'lucide-react'

import { Alert as ShadcnAlert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge as ShadcnBadge } from '@/components/ui/badge'
import { Button as ShadcnButton } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const tone = {
  danger: 'destructive',
  error: 'destructive',
  primary: 'default',
  secondary: 'secondary',
  success: 'default',
  warning: 'secondary',
}

export function Alert({ type = 'default', title, dismissible, children, onDismiss }) {
  return (
    <ShadcnAlert variant={tone[type] === 'destructive' ? 'destructive' : 'default'} className="relative">
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
      {dismissible && (
        <button type="button" onClick={onDismiss} className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close alert">
          <XIcon className="size-4" />
        </button>
      )}
    </ShadcnAlert>
  )
}

export function Badge({ type = 'default', label, rounded, outline, textType, children }) {
  return (
    <ShadcnBadge variant={outline ? 'outline' : (tone[type] ?? 'default')} className={cn(rounded && 'rounded-full', textType)}>
      {label && <span>{label}</span>}{children}
    </ShadcnBadge>
  )
}

export function Button({ type = 'default', size = 'default', state, rounded, outline, textType, children, ...props }) {
  return (
    <ShadcnButton variant={outline ? 'outline' : (tone[type] ?? type)} size={size} disabled={state === 'disabled' || props.disabled} className={cn(rounded && 'rounded-full', textType)} {...props}>
      {children}
    </ShadcnButton>
  )
}

export function TextDivider({ text, alignment = 'center', color, icon, style }) {
  return (
    <div className={cn('flex items-center gap-3', alignment === 'left' && 'justify-start', alignment === 'right' && 'justify-end')} style={style}>
      {alignment !== 'left' && <Separator className="flex-1" />}
      <span className="inline-flex shrink-0 items-center gap-2 text-sm text-muted-foreground" style={{ color }}>
        {icon && <i className={icon} aria-hidden="true" />}{text}
      </span>
      {alignment !== 'right' && <Separator className="flex-1" />}
    </div>
  )
}
