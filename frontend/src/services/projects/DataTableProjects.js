export const PAGE_SIZE_OPTIONS = [5, 10, 15]
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0]
export const EMPTY_DATE_RANGE = {
  startDate: '',
  endDate: '',
}
export const INITIAL_PROJECT_ROWS = []

function normalizeText(value) {
  if (value === undefined || value === null) {
    return ''
  }

  return String(value).trim()
}

export function getStatusVariant(status) {
  if (status === 'Waiting' || status === 'Pending') {
    return 'pending'
  }

  if (status === 'In Progress' || status === 'Resolved') {
    return 'active'
  }

  if (status === 'Void') {
    return 'inactive'
  }

  return 'app'
}

function matchesSearch(project, searchQuery) {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return [
    project?.id,
    project?.projectCode,
    project?.projectName,
    project?.requestor,
    project?.priority,
    project?.progress,
    project?.status,
    project?.requestDate,
    project?.startDate,
    project?.endDate,
    project?.notes,
  ].some((value) => normalizeText(value).toLowerCase().includes(normalizedQuery))
}

function matchesStatus(project, statusFilter) {
  if (!statusFilter) {
    return true
  }

  return project?.status === statusFilter
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

function parseProjectDateValue(project) {
  const rawValue =
    project?.requestDateValue ||
    project?.startDateValue ||
    project?.endDateValue ||
    project?.actualStartDateValue ||
    project?.actualEndDateValue ||
    project?.effectiveEndDateValue ||
    project?.lastUpdatedValue ||
    project?.requestDate ||
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

function matchesDateRange(project, range) {
  if (!range.startDate || !range.endDate) {
    return true
  }

  const startDate = parseInputDate(range.startDate)
  const endDate = parseInputDate(range.endDate)

  if (!startDate || !endDate) {
    return true
  }

  const projectDate = parseProjectDateValue(project)

  if (!projectDate) {
    return false
  }

  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  const projectTime = projectDate.getTime()

  return projectTime >= startDate.getTime() && projectTime <= endDate.getTime()
}

export function getFilteredProjectRows(
  projectRows,
  { searchQuery = '', dateRange = EMPTY_DATE_RANGE, statusFilter = '' } = {},
) {
  const normalizedRows = Array.isArray(projectRows) ? projectRows : []

  return normalizedRows.filter(
    (project) =>
      matchesSearch(project, searchQuery) &&
      matchesDateRange(project, dateRange) &&
      matchesStatus(project, statusFilter),
  )
}

export function hasActiveProjectFilters({
  searchQuery = '',
  dateRange = EMPTY_DATE_RANGE,
  statusFilter = '',
} = {}) {
  const hasActiveDateFilter = Boolean(dateRange.startDate && dateRange.endDate)
  const hasActiveStatusFilter = Boolean(statusFilter)

  return Boolean(searchQuery || hasActiveDateFilter || hasActiveStatusFilter)
}

export function getProjectPageRows(filteredRows, currentPage, pageSize) {
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

export function getProjectPaginationSummary(firstItem, lastItem, totalItems) {
  if (totalItems === 0) {
    return '0 dari 0 project'
  }

  return `${firstItem}-${lastItem} dari ${totalItems} project`
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

export function getProjectEmptyMessage(filters) {
  return hasActiveProjectFilters(filters)
    ? 'Tidak ada project yang sesuai dengan filter yang dipilih.'
    : 'Belum ada project untuk ditampilkan.'
}
