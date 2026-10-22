/* eslint-disable react/prop-types */
import { Fragment } from 'react'

import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'

function pagesAround(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  return [...pages].filter((page) => page > 0 && page <= totalPages).sort((a, b) => a - b)
}

export function PaginationCustom({ currentPage = 1, totalPages = 1, onPageChange }) {
  const pages = pagesAround(currentPage, totalPages)
  const go = (page) => (event) => {
    event.preventDefault()
    if (page >= 1 && page <= totalPages && page !== currentPage) onPageChange?.(page)
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem><PaginationPrevious href="#" aria-disabled={currentPage <= 1} onClick={go(currentPage - 1)} /></PaginationItem>
        {pages.map((page, index) => (
          <Fragment key={page}>
            {index > 0 && page - pages[index - 1] > 1 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
            <PaginationItem><PaginationLink href="#" isActive={page === currentPage} onClick={go(page)}>{page}</PaginationLink></PaginationItem>
          </Fragment>
        ))}
        <PaginationItem><PaginationNext href="#" aria-disabled={currentPage >= totalPages} onClick={go(currentPage + 1)} /></PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export const PaginationCustomBox = PaginationCustom
export const PaginationCustomPro = PaginationCustom
export const PaginationCustomNew = PaginationCustom
export const PaginationCustomOld = PaginationCustom
