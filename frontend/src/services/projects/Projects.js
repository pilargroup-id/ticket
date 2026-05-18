import api from '../api.js'

export const PROJECT_STATUS_LABELS = {
  waiting: 'Waiting',
  start: 'In Progress',
  progress: 'In Progress',
  in_progress: 'In Progress',
  hold: 'Pending',
  pending: 'Pending',
  unhold: 'In Progress',
  resolved: 'Resolved',
  void: 'Void',
}

const PROJECT_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const PROJECT_HISTORY_TITLE_LABELS = {
  waiting: 'Project menunggu proses',
  start: 'Project dimulai',
  progress: 'Progress diperbarui',
  in_progress: 'Progress diperbarui',
  hold: 'Project di-hold',
  pending: 'Project di-hold',
  unhold: 'Project dilanjutkan',
  resolved: 'Project diselesaikan',
  void: 'Project dibatalkan',
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

function toFiniteNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue)) {
    return null
  }

  return parsedValue
}

function parseTimestamp(value) {
  if (!value) {
    return 0
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return 0
  }

  return parsedDate.getTime()
}

function getLatestProjectPriority(project = {}) {
  const details = Array.isArray(project?.details) ? project.details : []

  for (let index = details.length - 1; index >= 0; index -= 1) {
    const detailPriority = getFirstFilledText(details[index]?.priority, details[index]?.raw_priority)

    if (detailPriority) {
      return detailPriority
    }
  }

  return getFirstFilledText(project?.priority, project?.latest_priority)
}

function getLatestProjectDescription(project = {}) {
  const details = Array.isArray(project?.details) ? project.details : []

  for (let index = details.length - 1; index >= 0; index -= 1) {
    const detailDescription = getFirstFilledText(details[index]?.description)

    if (detailDescription) {
      return detailDescription
    }
  }

  return getFirstFilledText(project?.description) || '-'
}

function getProjectHistoryTimestamp(history = {}) {
  return history?.progress_date || history?.created_at || history?.updated_at || null
}

function buildProjectHistoryDetail(history = {}) {
  const meta = []
  const progressPercent = toFiniteNumber(history?.progress_percent)
  const pendingMinutes = toFiniteNumber(history?.pending_minutes)
  const actorName = getFirstFilledText(history?.by_name)
  const description = getFirstFilledText(history?.description, history?.reason)

  if (progressPercent !== null) {
    meta.push(`Progress ${progressPercent}%`)
  }

  if (actorName) {
    meta.push(`Oleh ${actorName}`)
  }

  if (pendingMinutes !== null) {
    meta.push(`Pending ${pendingMinutes} menit`)
  }

  if (meta.length > 0 && description) {
    return `${meta.join(' | ')}. ${description}`
  }

  if (meta.length > 0) {
    return meta.join(' | ')
  }

  return description || 'Tidak ada deskripsi tambahan.'
}

export function formatProjectDate(value) {
  return formatDate(value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatProjectDateTime(value) {
  return formatDate(value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatProjectStatus(status) {
  const normalizedStatus = String(status || '').trim().toLowerCase()
  const fallbackStatus = getFirstFilledText(status)

  return PROJECT_STATUS_LABELS[normalizedStatus] || fallbackStatus || '-'
}

export function formatProjectPriority(priority) {
  const normalizedPriority = String(priority || '').trim().toLowerCase()
  const fallbackPriority = getFirstFilledText(priority)

  return PROJECT_PRIORITY_LABELS[normalizedPriority] || fallbackPriority || '-'
}

export function formatProjectProgress(progress) {
  const parsedProgress = toFiniteNumber(progress)

  if (parsedProgress !== null) {
    return `${parsedProgress}%`
  }

  return getFirstFilledText(progress) || '-'
}

export function normalizeProject(project = {}) {
  const projectCode = getFirstFilledText(project?.project_code, project?.code, project?.id)
  const projectName = getFirstFilledText(project?.project_name, project?.title, project?.name)
  const requestorName = getFirstFilledText(project?.requestor_name, project?.requestor?.name)
  const rawStatus = String(project?.status || '').trim().toLowerCase()
  const rawPriority = getLatestProjectPriority(project)
  const requestDateValue = project?.request_date || null
  const startDateValue = project?.start_date || null
  const endDateValue = project?.end_date || null
  const actualStartDateValue = project?.actual_start_date || null
  const actualEndDateValue = project?.actual_end_date || null
  const effectiveEndDateValue = project?.effective_end_date || null
  const updatedAtValue = project?.updated_at || null
  const progressValue = toFiniteNumber(project?.progress_percent)
  const totalPendingMinutes = toFiniteNumber(project?.total_pending_minutes)

  return {
    id: project?.id ?? projectCode,
    projectCode: projectCode || '-',
    projectName: projectName || '-',
    name: projectName || '-',
    requestorId: project?.requestor_id ?? project?.requestor?.id ?? null,
    requestor: requestorName || '-',
    priority: formatProjectPriority(rawPriority),
    rawPriority: String(rawPriority || '').trim().toLowerCase(),
    progress: formatProjectProgress(project?.progress_percent),
    progressValue,
    status: formatProjectStatus(rawStatus),
    rawStatus,
    requestDate: formatProjectDate(requestDateValue),
    requestDateValue,
    startDate: formatProjectDate(startDateValue),
    startDateValue,
    endDate: formatProjectDate(endDateValue),
    endDateValue,
    description: getLatestProjectDescription(project),
    actualStartDate: formatProjectDateTime(actualStartDateValue),
    actualStartDateValue,
    actualEndDate: formatProjectDateTime(actualEndDateValue),
    actualEndDateValue,
    effectiveEndDate: formatProjectDateTime(effectiveEndDateValue),
    effectiveEndDateValue,
    pendingMinutes: totalPendingMinutes !== null ? `${totalPendingMinutes} menit` : '-',
    isLate: Number(project?.is_late) === 1 ? 'Ya' : 'Tidak',
    notes: getFirstFilledText(project?.notes) || '-',
    lastUpdated: formatProjectDateTime(updatedAtValue),
    lastUpdatedValue: updatedAtValue,
  }
}

function buildProjectsQuery({ startDate, endDate } = {}) {
  const hasCompleteDateRange = Boolean(startDate && endDate)

  return {
    start_date: hasCompleteDateRange ? startDate : undefined,
    end_date: hasCompleteDateRange ? endDate : undefined,
  }
}

export function normalizeProjectStatusCounts(projects = []) {
  const baseCounts = {
    Waiting: 0,
    'In Progress': 0,
    Pending: 0,
    Resolved: 0,
    Void: 0,
  }

  return (Array.isArray(projects) ? projects : []).reduce((counts, project) => {
    const statusLabel = formatProjectStatus(project?.rawStatus ?? project?.status)

    if (!statusLabel || statusLabel === '-') {
      return counts
    }

    counts[statusLabel] = (counts[statusLabel] ?? 0) + 1
    return counts
  }, baseCounts)
}

export async function getProjects(options = {}) {
  const response = await api.get('/project', {
    params: buildProjectsQuery(options),
  })

  const normalizedData = Array.isArray(response?.data) ? response.data.map(normalizeProject) : []

  normalizedData.sort((a, b) => {
    const idA = Number(a.id) || 0
    const idB = Number(b.id) || 0
    return idB - idA
  })

  return {
    message: response?.message ?? '',
    data: normalizedData,
  }
}

export function normalizeProjectHistoryItem(history = {}) {
  const rawType = String(history?.type || history?.status || '').trim().toLowerCase()
  const timestamp = getProjectHistoryTimestamp(history)
  const progressValue = toFiniteNumber(history?.progress_percent)

  return {
    id: history?.id ?? `${rawType}-${timestamp ?? 'history'}`,
    status: formatProjectStatus(rawType),
    title: PROJECT_HISTORY_TITLE_LABELS[rawType] || 'Status project diperbarui',
    detail: buildProjectHistoryDetail(history),
    timestamp,
    byName: getFirstFilledText(history?.by_name) || '-',
    description: getFirstFilledText(history?.description, history?.reason) || '-',
    progress: formatProjectProgress(history?.progress_percent),
    progressValue,
  }
}

export async function getProjectHistory(projectId) {
  const response = await api.get(`/project/${projectId}/history`)
  const normalizedHistory = Array.isArray(response?.history)
    ? response.history
        .map(normalizeProjectHistoryItem)
        .sort(
          (leftItem, rightItem) =>
            parseTimestamp(leftItem.timestamp) - parseTimestamp(rightItem.timestamp),
        )
    : []

  return {
    message: response?.message ?? '',
    data: normalizedHistory,
  }
}

export default {
  formatProjectDate,
  formatProjectDateTime,
  formatProjectHistoryItem: normalizeProjectHistoryItem,
  formatProjectPriority,
  formatProjectProgress,
  formatProjectStatus,
  getProjectHistory,
  getProjects,
  normalizeProject,
  normalizeProjectHistoryItem,
  normalizeProjectStatusCounts,
}
