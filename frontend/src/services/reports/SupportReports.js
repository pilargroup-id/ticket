import api from '../api.js'

export async function getSupportSummary(options = {}) {
  const { startDate, endDate, status = 'all' } = options
  
  const response = await api.get('/reports/supports/summary', {
    params: {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      status: status,
    },
  })

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

export default {
  getSupportSummary,
  getSupportTicketsPerMonth,
  getSupportTimeSpentPerMonth,
  getSupportTicketsDetail,
}
