import api from '../api.js'

export async function getTicketsPerMonth(options = {}) {
  const { year } = options

  const response = await api.get('/reports/tickets/per-month', {
    params: {
      year: year || undefined,
    },
  })

  return {
    message: response?.message ?? '',
    data: Array.isArray(response?.data) ? response.data : [],
  }
}

export async function getTicketReportAll(options = {}) {
  const { startDate, endDate } = options

  const response = await api.get('/reports/ticket-all', {
    params: {
      start_date: startDate,
      end_date: endDate,
    },
  })

  return {
    message: response?.message ?? '',
    data: response?.data ?? {},
  }
}

export async function getTicketsSLA(options = {}) {
  const { startDate, endDate } = options

  const response = await api.get('/reports/tickets/sla', {
    params: {
      start_date: startDate,
      end_date: endDate,
    },
  })

  return {
    message: response?.message ?? '',
    data: response?.data ?? {},
  }
}

export async function getTimeSpentPerMonthDepartment(options = {}) {
  const { year } = options

  const response = await api.get('/reports/tickets/time-spent-per-month-department', {
    params: {
      year: year || undefined,
    },
  })

  return {
    message: response?.message ?? '',
    chart: response?.chart ?? { labels: [], series: [] },
  }
}

export async function getTicketsDistributionCategory(options = {}) {
  const { startDate, endDate } = options

  const response = await api.get('/reports/tickets/distribution-category', {
    params: {
      start_date: startDate,
      end_date: endDate,
    },
  })

  return {
    message: response?.message ?? '',
    data: Array.isArray(response?.data) ? response.data : [],
  }
}

export default {
  getTicketsPerMonth,
  getTicketReportAll,
  getTicketsSLA,
  getTimeSpentPerMonthDepartment,
  getTicketsDistributionCategory,
}
