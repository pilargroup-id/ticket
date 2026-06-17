import api from '../api.js'

export async function getDeveloperProjectSummary(options = {}) {
  const { startDate, endDate, year, status } = options

  const response = await api.get('/reports/developers/projects/summary', {
    params: {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      year: year || undefined,
      status: (status && status !== 'all') ? status : undefined,
    },
  })

  return {
    message: response?.message ?? '',
    data: Array.isArray(response?.data) ? response.data : [],
    meta: response?.meta ?? null,
  }
}

export async function getDeveloperProjects(developerId, options = {}) {
  const { year, status } = options

  const response = await api.get(`/reports/developers/${developerId}/projects`, {
    params: {
      year: year || undefined,
      status: (status && status !== 'all') ? status : undefined,
    },
  })

  // Deep search for array data
  let finalData = []
  if (Array.isArray(response)) {
    finalData = response
  } else if (response && typeof response === 'object') {
    if (Array.isArray(response.data)) {
      finalData = response.data
    } else if (response.data && Array.isArray(response.data.rows)) {
      finalData = response.data.rows
    } else if (Array.isArray(response.rows)) {
      finalData = response.rows
    } else if (Array.isArray(response.projects)) {
      finalData = response.projects
    } else if (response.project_id) {
      // If it's a single project object, wrap it in an array
      finalData = [response]
    }
  }

  return {
    message: response?.message ?? '',
    data: finalData,
  }
}

export async function exportProjectReport(options = {}) {
  const { startDate, endDate, year, status } = options
  const token = api.getToken?.()
  const url = api.buildUrl('/reports/projects/export', {
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    year: year || undefined,
    status: status && status !== 'all' ? status : undefined,
  })

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to export project report with status ${response.status}`)
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('content-disposition') || ''
  const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/)

  return {
    blob,
    fileName: fileNameMatch?.[1] || 'projects_report.xlsx',
  }
}

export default {
  getDeveloperProjectSummary,
  getDeveloperProjects,
  exportProjectReport,
}
