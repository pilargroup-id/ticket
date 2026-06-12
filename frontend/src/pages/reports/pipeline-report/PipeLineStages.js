const PIPELINE_DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export const PIPELINE_STATUS_ORDER = ['Total Project', 'Complete', 'On Track', 'At Risk', 'Delayed']

export const PIPELINE_STATUS_COLORS = {
  'Total Project': '#0275d8',
  Complete: '#2f855a',
  'On Track': '#4f8ef7',
  'At Risk': '#f0ad4e',
  Delayed: '#d92d20',
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

function clampProgress(value) {
  const numericValue = toFiniteNumber(value)

  if (numericValue === null) {
    return null
  }

  return Math.min(100, Math.max(0, numericValue))
}

function formatProjectDate(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return PIPELINE_DATE_FORMATTER.format(date)
}

function buildDateRangeLabel(startDate, endDate) {
  const startLabel = formatProjectDate(startDate)
  const endLabel = formatProjectDate(endDate)

  if (startLabel === '-' && endLabel === '-') {
    return 'Keterangan tanggal belum tersedia'
  }

  if (startLabel === '-') {
    return `Selesai ${endLabel}`
  }

  if (endLabel === '-') {
    return `Mulai ${startLabel}`
  }

  return `Mulai ${startLabel} | Selesai ${endLabel}`
}

function getProjectName(project = {}) {
  return getFirstFilledText(project?.project_name, project?.title, project?.name, project?.projectCode, '-')
}

function getProjectProgressBucket(progressPercent) {
  const progress = clampProgress(progressPercent)

  if (progress === null) {
    return 'Delayed'
  }

  if (progress >= 100) {
    return 'Complete'
  }

  if (progress >= 70) {
    return 'On Track'
  }

  if (progress >= 40) {
    return 'At Risk'
  }

  return 'Delayed'
}

function getProgressAccent(progressPercent) {
  return PIPELINE_STATUS_COLORS[getProjectProgressBucket(progressPercent)] || PIPELINE_STATUS_COLORS.Delayed
}

export function normalizePipelineProject(project = {}, index = 0) {
  const title = getProjectName(project)
  const progressValue = clampProgress(project?.progress_percent)
  const progressLabel = progressValue === null ? '-' : `${Math.round(progressValue)}%`
  const bucket = getProjectProgressBucket(progressValue)
  const startDate = project?.start_date || null
  const endDate = project?.end_date || null

  return {
    id: project?.id ?? `${title}-${index}`,
    title,
    name: title,
    progress: progressValue ?? 0,
    progressLabel,
    bucket,
    accent: getProgressAccent(progressValue),
    detail: buildDateRangeLabel(startDate, endDate),
    startDateLabel: formatProjectDate(startDate),
    endDateLabel: formatProjectDate(endDate),
    rawStartDate: startDate,
    rawEndDate: endDate,
    rawProgressPercent: progressValue,
  }
}

export function buildPipelineProjects(projects = []) {
  return (Array.isArray(projects) ? projects : [])
    .map((project, index) => normalizePipelineProject(project, index))
    .sort((leftItem, rightItem) => {
      const leftProgress = toFiniteNumber(leftItem.rawProgressPercent) ?? -1
      const rightProgress = toFiniteNumber(rightItem.rawProgressPercent) ?? -1

      if (rightProgress !== leftProgress) {
        return rightProgress - leftProgress
      }

      return leftItem.title.localeCompare(rightItem.title, 'id-ID')
    })
}

export function buildPipelineStatusCounts(projects = []) {
  const counts = {
    'Total Project': 0,
    Complete: 0,
    'On Track': 0,
    'At Risk': 0,
    Delayed: 0,
  }

  for (const project of Array.isArray(projects) ? projects : []) {
    const bucket = project?.bucket || getProjectProgressBucket(project?.progress)
    counts['Total Project'] += 1
    counts[bucket] += 1
  }

  return counts
}

export function getPipelineStatusCopy(activeStatus, counts = {}) {
  const totalProjects = counts['Total Project'] ?? 0
  const activeCount = activeStatus ? counts[activeStatus] ?? 0 : totalProjects

  if (!activeStatus) {
    return {
      title: 'Semua project yang masuk pipeline ditampilkan di sini.',
      subtitle: `${totalProjects} project tersedia`,
    }
  }

  return {
    title: `${activeCount} project masuk ke kategori ${activeStatus.toLowerCase()}.`,
    subtitle: `Filter aktif: ${activeStatus}`,
  }
}
