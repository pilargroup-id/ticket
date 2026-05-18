import api from '../api.js'

export const TICKET_STATUS_LABELS = {
  waiting: 'Waiting',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  feedback: 'Feedback',
  void: 'Void',
}

const TICKET_STATUS_QUERIES = {
  waiting: 'waiting',
  'in progress': 'in_progress',
  in_progress: 'in_progress',
  resolved: 'resolved',
  feedback: 'feedback',
  void: 'void',
  all: 'all',
}

const TICKET_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

function getFirstFilledText(...values) {
  for (const value of values) {
    if (value === undefined || value === null) {
      continue
    }

    const normalizedValue = String(value).trim()

    if (normalizedValue) {
      return normalizedValue
    }
  }

  return ''
}

function formatDate(value, options) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', options).format(date)
}

export function formatTicketDate(value) {
  return formatDate(value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTicketDateTime(value) {
  return formatDate(value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatTicketTimeWIB(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${hours}:${minutes} WIB`
}

export function formatTicketStatus(status) {
  const normalizedStatus = String(status || '').trim().toLowerCase()
  const fallbackStatus = getFirstFilledText(status)

  return TICKET_STATUS_LABELS[normalizedStatus] || fallbackStatus || '-'
}

export function formatTicketPriority(priority) {
  const normalizedPriority = String(priority || '').trim().toLowerCase()
  const fallbackPriority = getFirstFilledText(priority)

  return TICKET_PRIORITY_LABELS[normalizedPriority] || fallbackPriority || '-'
}

function formatValueWithUnit(value, unit) {
  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue)) {
    return '-'
  }

  return `${parsedValue} ${unit}`
}

function createTicketTimeline(ticket) {
  const timeline = []
  const requestDate = ticket?.request_date || ticket?.created_at
  const startDate = ticket?.start_date
  const endDate = ticket?.end_date || ticket?.updated_at
  const supportName = getFirstFilledText(ticket?.support_name, ticket?.support?.name)
  const status = String(ticket?.status || '').trim().toLowerCase()

  if (requestDate) {
    timeline.push({
      status: 'Created',
      title: 'Ticket dibuat',
      detail:
        getFirstFilledText(ticket?.problem) || 'Permintaan ticket berhasil dikirim oleh user.',
      timestamp: requestDate,
    })
  }

  if (startDate) {
    timeline.push({
      status: 'In Progress',
      title: 'Penanganan dimulai',
      detail: supportName
        ? `Ticket mulai ditangani oleh ${supportName}.`
        : 'Ticket mulai masuk ke proses penanganan.',
      timestamp: startDate,
    })
  }

  if (status === 'resolved' && endDate) {
    timeline.push({
      status: 'Resolved',
      title: 'Ticket diselesaikan',
      detail:
        getFirstFilledText(ticket?.solution, ticket?.notes) ||
        'Ticket telah ditandai selesai oleh support.',
      timestamp: endDate,
    })
  }

  if (status === 'feedback' && endDate) {
    timeline.push({
      status: 'Feedback',
      title: 'Feedback dikirim',
      detail:
        getFirstFilledText(ticket?.notes, ticket?.solution) ||
        'User sudah memberikan feedback untuk ticket ini.',
      timestamp: endDate,
    })
  }

  if (status === 'void' && endDate) {
    timeline.push({
      status: 'Void',
      title: 'Ticket dibatalkan',
      detail: getFirstFilledText(ticket?.notes) || 'Ticket dibatalkan atau dinyatakan tidak valid.',
      timestamp: endDate,
    })
  }

  return timeline
}

export function normalizeTicket(ticket = {}) {
  const requestDateValue = ticket?.request_date || ticket?.created_at || null
  const startDateValue = ticket?.start_date || null
  const endDateValue = ticket?.end_date || null
  const updatedAtValue = ticket?.updated_at || null
  const userName = getFirstFilledText(ticket?.user_name, ticket?.user?.name)
  const creatorName = getFirstFilledText(ticket?.nama_pembuat, userName)
  const requestorName = creatorName || userName
  const supportName = getFirstFilledText(ticket?.support_name, ticket?.support?.name)
  const categoryName = getFirstFilledText(ticket?.category_name, ticket?.category?.name)
  const ticketCode = getFirstFilledText(ticket?.ticket_code, ticket?.id)
  const rawStatus = String(ticket?.status || '').trim().toLowerCase()
  const rawPriority = String(ticket?.priority || '').trim().toLowerCase()

  return {
    id: ticket?.id ?? ticketCode,
    ticketCode: ticketCode || '-',
    userName: userName || '-',
    creatorName: creatorName || '-',
    namaPembuat: creatorName || '-',
    category: categoryName || '-',
    requestor: requestorName || '-',
    problem: getFirstFilledText(ticket?.problem) || '-',
    status: formatTicketStatus(rawStatus),
    rawStatus,
    priority: formatTicketPriority(rawPriority),
    rawPriority,
    supportId: ticket?.support_id ?? ticket?.support?.id ?? null,
    supportName: supportName || '-',
    solution: getFirstFilledText(ticket?.solution) || '-',
    notes: getFirstFilledText(ticket?.notes) || '-',
    requestDate: formatTicketDateTime(requestDateValue),
    requestDateValue,
    startDate: formatTicketDateTime(startDateValue),
    startDateValue,
    endDate: formatTicketDateTime(endDateValue),
    endDateValue,
    waitingHour: formatValueWithUnit(ticket?.waiting_hour, 'jam'),
    timeSpent: formatValueWithUnit(ticket?.time_spent, 'menit'),
    isLate: Number(ticket?.is_late) === 1 ? 'Ya' : 'Tidak',
    lastUpdated: formatTicketDateTime(updatedAtValue),
    lastUpdatedValue: updatedAtValue,
    timeline: createTicketTimeline(ticket),
  }
}

export const normalizeMyTicket = normalizeTicket

export function getTicketStatusQueryValue(status) {
  const normalizedStatus = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')

  return TICKET_STATUS_QUERIES[normalizedStatus] || TICKET_STATUS_QUERIES.all
}

function buildTicketsQuery({
  status = 'all',
  startDate,
  endDate,
  perPage = 200,
  includeAssets = false,
} = {}) {
  return {
    status,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    per_page: perPage,
    include_assets: includeAssets,
  }
}

export async function getTickets(options = {}) {
  const response = await api.get('/ticket', {
    params: buildTicketsQuery({
      ...options,
      status: getTicketStatusQueryValue(options?.status),
    }),
  })

  return {
    message: response?.message ?? '',
    data: Array.isArray(response?.data) ? response.data.map(normalizeTicket) : [],
    meta: response?.meta ?? null,
  }
}

function buildTicketReportQuery({ startDate, endDate } = {}) {
  return {
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  }
}

export function normalizeTicketStatusCounts(report = {}) {
  const rawStatusCounts = report?.data?.status ?? report?.status ?? report ?? {}

  return {
    Waiting: Number(rawStatusCounts.waiting) || 0,
    'In Progress': Number(rawStatusCounts.in_progress) || 0,
    Resolved: Number(rawStatusCounts.resolved) || 0,
    Feedback: Number(rawStatusCounts.feedback) || 0,
    Void: Number(rawStatusCounts.void) || 0,
  }
}

export async function getTicketReport(options = {}) {
  const response = await api.get('/reports/ticket-all', {
    params: buildTicketReportQuery(options),
  })

  return {
    message: response?.message ?? '',
    data: response?.data ?? {},
    statusCounts: normalizeTicketStatusCounts(response),
  }
}

export async function getMyTickets(options = {}) {
  const response = await api.get('/user/tickets', {
    params: buildTicketsQuery({
      ...options,
      status: getTicketStatusQueryValue(options?.status),
    }),
  })

  return {
    message: response?.message ?? '',
    data: Array.isArray(response?.data) ? response.data.map(normalizeTicket) : [],
    meta: response?.meta ?? null,
  }
}

export async function getFeedbacks() {
  const response = await api.get('/feedback')
  return response?.data ?? {}
}

export async function postFeedback(ticketId, { rating, comment }) {
  const response = await api.post(`/user/feedback/${ticketId}`, {
    rating,
    description: comment,
  })
  return response?.data ?? {}
}

export default {
  formatTicketDate,
  formatTicketDateTime,
  formatTicketPriority,
  formatTicketStatus,
  getTicketReport,
  getTicketStatusQueryValue,
  getTickets,
  getMyTickets,
  getFeedbacks,
  postFeedback,
  normalizeMyTicket,
  normalizeTicket,
  normalizeTicketStatusCounts,
}
