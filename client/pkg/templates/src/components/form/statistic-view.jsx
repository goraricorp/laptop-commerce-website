/* eslint-disable react/prop-types */
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function label(key) { return key.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase()) }

export function StatisticView({ item, show, onHide }) {
  return <Dialog open={Boolean(show)} onOpenChange={(open) => !open && onHide?.()}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Statistics</DialogTitle><DialogDescription>Current data snapshot.</DialogDescription></DialogHeader><dl className="grid gap-3 sm:grid-cols-2">{Object.entries(item ?? {}).map(([key, value]) => <div key={key} className="rounded-lg border p-3"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label(key)}</dt><dd className="mt-1 break-words text-sm">{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}</dd></div>)}</dl><DialogFooter><Button type="button" onClick={onHide}>Close</Button></DialogFooter></DialogContent></Dialog>
}
