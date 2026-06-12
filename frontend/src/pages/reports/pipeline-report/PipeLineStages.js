const PIPELINE_DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export const PIPELINE_STATUS_ORDER = ['Total Project', 'Done', 'On Track', 'at risk', 'delayed']

export const PIPELINE_STATUS_COLORS = {
  'Total Project': '#0275d8',
  Done: '#2f855a',
  'On Track': '#4f8ef7',
  'at risk': '#f4d03f',
  delayed: '#d92d20',
}

export const PIPELINE_STATUS_LABELS = {
  Done: 'Done',
  'On Track': 'On Track',
  'at risk': 'at risk',
  delayed: 'delayed',
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

function normalizeDateValue(value) {
  if (typeof value !== 'string') {
    return value
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00:00`
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)) {
    return value.replace(' ', 'T')
  }

  return value
}

function parseProjectDate(value) {
  if (!value) {
    return null
  }

  const parsedDate = new Date(normalizeDateValue(value))

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate
}

function formatProjectDate(value) {
  if (!value) {
    return '-'
  }

  const date = parseProjectDate(value)

  if (!date) {
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

function buildCompactPeriodLabel(startDate, endDate) {
  const startLabel = formatProjectDate(startDate)
  const endLabel = formatProjectDate(endDate)

  if (startLabel === '-' && endLabel === '-') {
    return 'Periode belum tersedia'
  }

  if (startLabel === '-') {
    return `Selesai ${endLabel}`
  }

  if (endLabel === '-') {
    return `Mulai ${startLabel}`
  }

  return `${startLabel} - ${endLabel}`
}

function getProjectName(project = {}) {
  return getFirstFilledText(project?.project_name, project?.title, project?.name, project?.projectCode, '-')
}

function getProjectCode(project = {}, fallbackTitle = '') {
  return getFirstFilledText(project?.project_code, project?.code, project?.projectCode, project?.id, fallbackTitle)
}

function getProjectDescription(project = {}) {
  return (
    getFirstFilledText(
      project?.description,
      project?.summary,
      project?.notes,
      project?.problem,
      project?.scope,
      project?.detail,
    ) || 'Deskripsi project belum tersedia.'
  )
}

function getProjectOwner(project = {}) {
  return getFirstFilledText(
    project?.owner_name,
    project?.project_owner,
    project?.owner,
    project?.pic_name,
    project?.pic,
    project?.requestor_name,
    project?.requestor?.name,
  )
}

function getProjectCategory(project = {}) {
  return getFirstFilledText(
    project?.category_name,
    project?.category,
    project?.system_category,
    project?.module,
    project?.domain,
  )
}

function getProjectProgressBucket(progressPercent) {
  const project = typeof progressPercent === 'object' && progressPercent !== null ? progressPercent : {}
  const progress = clampProgress(
    typeof progressPercent === 'object' && progressPercent !== null
      ? project?.progress_percent ?? project?.progress
      : progressPercent,
  )
  const rawStatus = String(project?.status ?? project?.rawStatus ?? '').trim().toLowerCase()
  const startDate = parseProjectDate(project?.start_date ?? project?.rawStartDate ?? null)
  const endDate = parseProjectDate(project?.end_date ?? project?.rawEndDate ?? null)
  const nowTimestamp = Date.now()

  if (rawStatus === 'resolved' || progress === 100) {
    return 'Done'
  }

  if (rawStatus === 'pending' || rawStatus === 'hold') {
    return 'delayed'
  }

  if (project?.is_late === true || Number(project?.is_late) === 1) {
    return 'delayed'
  }

  if (endDate && nowTimestamp > endDate.getTime()) {
    return 'delayed'
  }

  if (progress === null) {
    return 'delayed'
  }

  if (startDate && endDate) {
    const totalDuration = endDate.getTime() - startDate.getTime()

    if (totalDuration > 0) {
      const elapsedDuration = nowTimestamp - startDate.getTime()
      const elapsedPercent = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100))

      if (elapsedPercent >= 50 && progress < 50) {
        return 'at risk'
      }
    }
  }

  return 'On Track'
}

function getProgressAccent(progressPercent, project = {}) {
  return (
    PIPELINE_STATUS_COLORS[getProjectProgressBucket({
      ...project,
      progress_percent: progressPercent,
    })] || PIPELINE_STATUS_COLORS.delayed
  )
}

function getPipelineStatusLabel(bucket) {
  return PIPELINE_STATUS_LABELS[bucket] || bucket || '-'
}

export function normalizePipelineProject(project = {}, index = 0) {
  const title = getProjectName(project)
  const projectCode = getProjectCode(project, title)
  const progressValue = clampProgress(project?.progress_percent)
  const progressLabel = progressValue === null ? '-' : `${Math.round(progressValue)}%`
  const bucket = getProjectProgressBucket(project)
  const startDate = project?.start_date || null
  const endDate = project?.end_date || null
  const owner = getProjectOwner(project)
  const category = getProjectCategory(project)
  const description = getProjectDescription(project)

  return {
    id: project?.id ?? `${projectCode || title}-${index}`,
    title,
    name: title,
    code: projectCode || '-',
    progress: progressValue ?? 0,
    progressLabel,
    bucket,
    statusLabel: getPipelineStatusLabel(bucket),
    accent: getProgressAccent(progressValue, project),
    detail: buildDateRangeLabel(startDate, endDate),
    periodLabel: buildCompactPeriodLabel(startDate, endDate),
    startDateLabel: formatProjectDate(startDate),
    endDateLabel: formatProjectDate(endDate),
    rawStartDate: startDate,
    rawEndDate: endDate,
    rawProgressPercent: progressValue,
    description,
    owner: owner || 'Belum ditentukan',
    category: category || 'Belum ditentukan',
  }
}

export function buildPipelineProjects(projects = []) {
  return (Array.isArray(projects) ? projects : [])
    .map((project, index) => normalizePipelineProject(project, index))
    .sort((leftItem, rightItem) => {
      const leftIsDone = leftItem.bucket === 'Done'
      const rightIsDone = rightItem.bucket === 'Done'

      if (leftIsDone !== rightIsDone) {
        return leftIsDone ? 1 : -1
      }

      const leftProgress = toFiniteNumber(leftItem.rawProgressPercent) ?? -1
      const rightProgress = toFiniteNumber(rightItem.rawProgressPercent) ?? -1

      if (leftIsDone) {
        if (rightProgress !== leftProgress) {
          return rightProgress - leftProgress
        }
      } else if (leftProgress !== rightProgress) {
        return leftProgress - rightProgress
      }

      return leftItem.title.localeCompare(rightItem.title, 'id-ID')
    })
}

export function buildPipelineStatusCounts(projects = []) {
  const counts = {
    'Total Project': 0,
    Done: 0,
    'On Track': 0,
    'at risk': 0,
    delayed: 0,
  }

  for (const project of Array.isArray(projects) ? projects : []) {
    const bucket = project?.bucket || getProjectProgressBucket(project)
    counts['Total Project'] += 1
    counts[bucket] += 1
  }

  return counts
}

export function getPipelineStatusCopy(activeStatus, counts = {}) {
  const totalProjects = counts['Total Project'] ?? 0
  const isAllProjectsView = !activeStatus || activeStatus === 'Total Project'
  const activeCount = isAllProjectsView ? totalProjects : counts[activeStatus] ?? 0

  if (isAllProjectsView) {
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
