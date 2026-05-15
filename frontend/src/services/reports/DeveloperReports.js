import api from '../api.js'

export async function getDeveloperProjectSummary(options = {}) {
  const { startDate, endDate, year, status } = options
  
  const response = await api.get('/reports/developers/projects/summary', {
    params: {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      year: year || undefined,
      status: status === 'all' ? '' : status,
    },
  })

  return {
    message: response?.message ?? '',
    data: Array.isArray(response?.data) ? response.data : [],
    meta: response?.meta ?? null,
  }
}

export default {
  getDeveloperProjectSummary,
}
