import api from '../api.js'

function isTransientFetchError(error) {
  return error instanceof TypeError && /Failed to fetch/i.test(error.message || '')
}

async function withRetry(requestFn, options = {}) {
  const { retries = 1, retryDelayMs = 400 } = options

  try {
    return await requestFn()
  } catch (error) {
    if (retries <= 0 || !isTransientFetchError(error)) {
      throw error
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, retryDelayMs)
    })

    return withRetry(requestFn, {
      retries: retries - 1,
      retryDelayMs,
    })
  }
}

export async function getSupportSummary(options = {}) {
  const { startDate, endDate, status = 'all' } = options
  
  const response = await withRetry(() =>
    api.get('/reports/supports/summary', {
      params: {
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        status: status,
      },
    }),
  )

  return {
    message: response?.message ?? '',
    data: Array.isArray(response?.data) ? response.data : [],
    meta: response?.meta ?? null,
  }
}

export async function getSupportTicketsPerMonth(options = {}) {
  const { year, startDate, endDate } = options

  const response = await api.get('/reports/supports/tickets-per-month', {
    params: {
      year: year || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  })

  return {
    message: response?.message ?? '',
    chart: response?.chart ?? { labels: [], series: [] },
    meta: response?.meta ?? null,
  }
}

export async function getSupportTimeSpentPerMonth(options = {}) {
  const { year, startDate, endDate } = options

  const response = await api.get('/reports/supports/time-spent-per-month', {
    params: {
      year: year || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  })

  return {
    message: response?.message ?? '',
    chart: response?.chart ?? { labels: [], series: [] },
    meta: response?.meta ?? null,
  }
}

export async function getSupportTicketsDetail(supportId, options = {}) {
  const { startDate, endDate, status = 'all' } = options
  
  const response = await api.get(`/reports/supports/${supportId}/tickets`, {
    params: {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      status: status,
    },
  })

  return {
    message: response?.message ?? '',
    data: Array.isArray(response?.data) ? response.data : [],
  }
}

export async function exportSupportTickets(options = {}) {
  const { startDate, endDate, status = 'all' } = options
  const token = api.getToken?.()
  const url = api.buildUrl('/reports/tickets/export', {
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    status: status || undefined,
  })

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to export support tickets with status ${response.status}`)
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('content-disposition') || ''
  const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/)

  return {
    blob,
    fileName: fileNameMatch?.[1] || 'tickets_export.xlsx',
  }
}

export default {
  getSupportSummary,
  getSupportTicketsPerMonth,
  getSupportTimeSpentPerMonth,
  getSupportTicketsDetail,
  exportSupportTickets,
}
