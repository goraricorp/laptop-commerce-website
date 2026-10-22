/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PaginationCustom } from '@/components/element/pagination'

export function DataTables({ data = [], title = 'Bảng dữ liệu', columns }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState([])
  const keys = columns ?? Object.keys(data[0] ?? {}).filter((key) => key !== 'id')
  const filtered = useMemo(() => data.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(query.toLowerCase()))), [data, query])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const rowId = (row, index) => row.id ?? `${page}-${index}`

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><CardTitle>{title}</CardTitle><Input className="sm:max-w-xs" type="search" placeholder="Tìm kiếm…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Table>
          <TableHeader><TableRow><TableHead className="w-10"><Checkbox aria-label="Chọn tất cả các hàng" checked={rows.length > 0 && rows.every((row, index) => selected.includes(rowId(row, index)))} onCheckedChange={(checked) => setSelected(checked ? rows.map(rowId) : [])} /></TableHead>{keys.map((key) => <TableHead key={key}>{String(key).replaceAll('_', ' ')}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{rows.map((row, index) => { const id = rowId(row, index); return <TableRow key={id} data-state={selected.includes(id) ? 'selected' : undefined}><TableCell><Checkbox aria-label={`Chọn hàng ${index + 1}`} checked={selected.includes(id)} onCheckedChange={(checked) => setSelected((current) => checked ? [...current, id] : current.filter((entry) => entry !== id))} /></TableCell>{keys.map((key) => <TableCell key={key}>{key === 'status' ? <Badge variant="outline">{row[key]}</Badge> : String(row[key] ?? '—')}</TableCell>)}</TableRow> })}</TableBody>
        </Table>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><NativeSelect value={String(pageSize)} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }} className="w-24">{[10, 25, 50].map((size) => <NativeSelectOption key={size} value={size}>{size}</NativeSelectOption>)}</NativeSelect><PaginationCustom currentPage={Math.min(page, pageCount)} totalPages={pageCount} onPageChange={setPage} /></div>
      </CardContent>
    </Card>
  )
}
