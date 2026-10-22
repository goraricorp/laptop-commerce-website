/* eslint-disable react/prop-types */
import { useState } from 'react'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export function DatePicker({ value, onChange }) {
  const [date, setDate] = useState(value)
  const selected = value ?? date
  const selectDate = (nextDate) => {
    setDate(nextDate)
    onChange?.(nextDate)
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>{selected ? selected.toLocaleDateString() : 'Pick a date'}</PopoverTrigger>
      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selected} onSelect={selectDate} /></PopoverContent>
    </Popover>
  )
}
