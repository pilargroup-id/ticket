import { Edit03, Trash03 } from '../../components/template/TemplateIcons.jsx'

export const PAGE_SIZE_OPTIONS = [5, 10, 15]
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0]
export const EMPTY_DATE_RANGE = {
  startDate: '',
  endDate: '',
}
export const INITIAL_TICKET_ROWS = []

function normalizeText(value) {
  if (value === undefined || value === null) {
    return ''
  }

  return String(value).trim()
}

export function getStatusVariant(status) {
  if (status === 'Waiting') {
    return 'pending'
  }

  if (status === 'In Progress' || status === 'Resolved') {
    return 'active'
  }

  if (status === 'Feedback') {
    return 'app'
  }

  return 'inactive'
}

function matchesSearch(ticket, searchQuery) {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return [
    ticket?.id,
    ticket?.ticketCode,
    ticket?.category,
    ticket?.requestor,
    ticket?.problem,
    ticket?.issue,
    ticket?.requestDate,
    ticket?.status,
    ticket?.priority,
    ticket?.supportName,
    ticket?.supportRole,
    ticket?.solution,
    ticket?.notes,
  ].some((value) => normalizeText(value).toLowerCase().includes(normalizedQuery))
}

function matchesStatus(ticket, statusFilter) {
  if (!statusFilter) {
    return true
  }

  return ticket?.status === statusFilter
}

function parseInputDate(value) {
  const [year, month, day] = String(value).split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  const date = new Date(year, month - 1, day)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }

  return date
}

function parseTicketDateValue(ticket) {
  const rawValue =
    ticket?.requestDateValue ||
    ticket?.startDateValue ||
    ticket?.lastUpdatedValue ||
    ticket?.requestDate ||
    null

  if (!rawValue) {
    return null
  }

  const parsedDate = new Date(rawValue)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate
}

function matchesDateRange(ticket, range) {
  if (!range.startDate || !range.endDate) {
    return true
  }

  const startDate = parseInputDate(range.startDate)
  const endDate = parseInputDate(range.endDate)

  if (!startDate || !endDate) {
    return true
  }

  const ticketDate = parseTicketDateValue(ticket)

  if (!ticketDate) {
    return false
  }

  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  const ticketTime = ticketDate.getTime()

  return ticketTime >= startDate.getTime() && ticketTime <= endDate.getTime()
}

export function getFilteredTicketRows(
  ticketRows,
  { searchQuery = '', dateRange = EMPTY_DATE_RANGE, statusFilter = '' } = {},
) {
  const normalizedRows = Array.isArray(ticketRows) ? ticketRows : []

  return normalizedRows.filter(
    (ticket) =>
      matchesSearch(ticket, searchQuery) &&
      matchesDateRange(ticket, dateRange) &&
      matchesStatus(ticket, statusFilter),
  )
}

export function hasActiveTicketFilters({
  searchQuery = '',
  dateRange = EMPTY_DATE_RANGE,
  statusFilter = '',
} = {}) {
  const hasActiveDateFilter = Boolean(dateRange.startDate && dateRange.endDate)
  const hasActiveStatusFilter = Boolean(statusFilter)

  return Boolean(searchQuery || hasActiveDateFilter || hasActiveStatusFilter)
}

export function getTicketPageRows(filteredRows, currentPage, pageSize) {
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const currentPageStart = (safeCurrentPage - 1) * pageSize
  const rows = filteredRows.slice(currentPageStart, currentPageStart + pageSize)
  const firstItem = filteredRows.length === 0 ? 0 : currentPageStart + 1
  const lastItem =
    filteredRows.length === 0 ? 0 : Math.min(currentPageStart + rows.length, filteredRows.length)

  return {
    totalPages,
    safeCurrentPage,
    rows,
    firstItem,
    lastItem,
  }
}

export function getTicketPaginationSummary(firstItem, lastItem, totalItems) {
  if (totalItems === 0) {
    return '0 dari 0 tiket'
  }

  return `${firstItem}-${lastItem} dari ${totalItems} tiket`
}

function createFallbackTimelineTimestamp(ticket) {
  return (
    ticket?.requestDateValue ||
    ticket?.startDateValue ||
    ticket?.endDateValue ||
    ticket?.lastUpdatedValue ||
    null
  )
}

export function getTicketTimelineItems(ticket) {
  const timelineItems = Array.isArray(ticket?.timeline)
    ? ticket.timeline.filter(
        (item) => item && (item.status || item.title || item.detail || item.timestamp),
      )
    : []

  if (timelineItems.length > 0) {
    return timelineItems
  }

  return [
    {
      status: ticket?.status ?? 'Waiting',
      title: 'Status ticket saat ini',
      detail:
        ticket?.solution ||
        ticket?.problem ||
        ticket?.issue ||
        'Belum ada riwayat status yang tersedia untuk ticket ini.',
      timestamp: createFallbackTimelineTimestamp(ticket),
    },
  ]
}

export function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 'end-ellipsis', totalPages]
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'start-ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [
    1,
    'start-ellipsis',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'end-ellipsis',
    totalPages,
  ]
}

export function getTicketEmptyMessage(filters) {
  return hasActiveTicketFilters(filters)
    ? 'Tidak ada ticket yang sesuai dengan filter yang dipilih.'
    : 'Belum ada ticket untuk ditampilkan.'
}

export function getTicketTableActions({ onEdit, onDelete }) {
  return [
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit03,
      onClick: onEdit,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash03,
      variant: 'danger',
      onClick: onDelete,
    },
  ]
}
