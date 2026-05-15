import api from '../api.js'

export async function getDeveloperProjectSummary(options = {}) {
  const { startDate, endDate } = options

  const response = await api.get('/reports/developers/projects/summary', {
    params: {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
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
