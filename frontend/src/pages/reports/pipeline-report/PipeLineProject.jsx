const DETAIL_DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

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

function normalizeDateValue(value) {
  if (typeof value !== 'string') {
    return value
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)) {
    return value.replace(' ', 'T')
  }

  return value
}

function formatDetailDate(value) {
  if (!value) {
    return '-'
  }

  const parsedDate = new Date(normalizeDateValue(value))

  if (Number.isNaN(parsedDate.getTime())) {
    return '-'
  }

  return DETAIL_DATE_FORMATTER.format(parsedDate)
}

function getMilestoneTimestampValue(item = {}) {
  const value =
    item?.timestamp ||
    item?.progress_date ||
    item?.progressDate ||
    item?.created_at ||
    item?.updated_at ||
    item?.end ||
    item?.start ||
    null

  if (!value) {
    return null
  }

  const parsedDate = new Date(normalizeDateValue(value))

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate.getTime()
}

function getSortedMilestoneItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return []
  }

  return items
    .map((item, index) => ({
      item,
      index,
    }))
    .sort((leftEntry, rightEntry) => {
      const leftIsHeader = leftEntry.item?.type === 'header'
      const rightIsHeader = rightEntry.item?.type === 'header'

      if (leftIsHeader !== rightIsHeader) {
        return leftIsHeader ? 1 : -1
      }

      const leftTimestamp = getMilestoneTimestampValue(leftEntry.item)
      const rightTimestamp = getMilestoneTimestampValue(rightEntry.item)

      if (leftTimestamp !== null && rightTimestamp !== null && leftTimestamp !== rightTimestamp) {
        return rightTimestamp - leftTimestamp
      }

      if (leftTimestamp !== null && rightTimestamp === null) {
        return -1
      }

      if (leftTimestamp === null && rightTimestamp !== null) {
        return 1
      }

      return leftEntry.index - rightEntry.index
    })
    .map((entry) => entry.item)
}

function getProjectStatusLabel(project = {}) {
  const rawStatus = getFirstFilledText(project?.status_label, project?.status, project?.bucket)
  const normalized = rawStatus.toLowerCase()

  if (normalized.includes('done') || normalized.includes('complete') || normalized.includes('selesai') || normalized.includes('resolved')) {
    return 'Done'
  }

  if (normalized.includes('on track') || normalized.includes('sesuai')) {
    return 'On Track'
  }

  if (normalized.includes('at risk') || normalized.includes('perhatian')) {
    return 'at risk'
  }

  if (normalized.includes('delay') || normalized.includes('terlambat')) {
    return 'delayed'
  }

  return rawStatus || '-'
}

function getProjectStatusTone(project = {}) {
  const statusLabel = getProjectStatusLabel(project).toLowerCase()

  if (statusLabel.includes('done')) {
    return 'complete'
  }

  if (statusLabel.includes('on track')) {
    return 'on-track'
  }

  if (statusLabel.includes('at risk')) {
    return 'at-risk'
  }

  if (statusLabel.includes('delay')) {
    return 'delayed'
  }

  return 'neutral'
}

function buildPeriodLabel(startDate, endDate) {
  const startLabel = formatDetailDate(startDate)
  const endLabel = formatDetailDate(endDate)

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

function getProjectSummary(meta = {}, fallbackProject = {}) {
  const source = meta && Object.keys(meta).length > 0 ? meta : fallbackProject
  const title = getFirstFilledText(
    source?.project_name,
    source?.name,
    source?.title,
    fallbackProject?.title,
    '-',
  )
  const description =
    getFirstFilledText(
      source?.description,
      source?.summary,
      source?.notes,
      fallbackProject?.description,
    ) || 'Deskripsi project belum tersedia.'
  const owner = getFirstFilledText(
    source?.owner_name,
    source?.project_owner,
    source?.owner,
    source?.pic_name,
    source?.pic,
    source?.requestor_name,
    source?.requestor?.name,
    fallbackProject?.owner,
  )
  const category = getFirstFilledText(
    source?.category_name,
    source?.category,
    source?.system_category,
    source?.module,
    source?.domain,
    fallbackProject?.category,
  )
  const progressValue = Number(
    getFirstFilledText(source?.progress_percent, source?.progress, fallbackProject?.progress),
  )
  const progress = Number.isFinite(progressValue) ? Math.max(0, Math.min(100, progressValue)) : 0
  const startDate = source?.start_date || source?.start || fallbackProject?.rawStartDate || null
  const endDate = source?.end_date || source?.end || fallbackProject?.rawEndDate || null

  return {
    title,
    description,
    owner: owner || 'Belum ditentukan',
    category: category || 'Belum ditentukan',
    progress,
    progressLabel: `${Math.round(progress)}%`,
    statusLabel: getProjectStatusLabel(source),
    statusTone: getProjectStatusTone(source),
    periodLabel: buildPeriodLabel(startDate, endDate),
    startDateLabel: formatDetailDate(startDate),
    endDateLabel: formatDetailDate(endDate),
  }
}

function renderMilestoneList(items = []) {
  const sortedItems = getSortedMilestoneItems(items)

  if (sortedItems.length === 0) {
    return <p className="pipeline-report__milestone-empty">Belum ada milestone untuk project ini.</p>
  }

  return (
    <div className="pipeline-report__milestone-list" role="list" aria-label="Timeline project">
      {sortedItems.map((item, index) => {
        const timestampLabel = formatDetailDate(item?.timestamp)
        const statusLabel = getFirstFilledText(item?.status, 'Project')
        const developerName = getFirstFilledText(
          item?.developer_name,
          item?.developer?.name,
          item?.developer,
          item?.pic_name,
          item?.pic,
          item?.owner_name,
          item?.owner,
        )
        const itemKey = item?.id ?? `${item?.title ?? 'milestone'}-${index}`

        return (
          <div key={itemKey} className="pipeline-report__milestone-item" role="listitem">
            <div className="pipeline-report__milestone-rail" aria-hidden="true">
              <span className="pipeline-report__milestone-line" />
              <span className="pipeline-report__milestone-dot" />
              <span className="pipeline-report__milestone-line" />
            </div>

            <div className="pipeline-report__milestone-copy">
              <div className="pipeline-report__milestone-row">
                <div className="pipeline-report__milestone-meta">
                  <p className="pipeline-report__milestone-title">{item?.title || 'Tahap project'}</p>
                  <p className="pipeline-report__milestone-developer">
                    {developerName ? `Dikerjakan oleh ${developerName}` : 'Dikerjakan oleh -'}
                  </p>
                  <p className="pipeline-report__milestone-date">{timestampLabel}</p>
                </div>

                <span className="pipeline-report__milestone-status">{statusLabel}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PipeLineProject({
  selectedProject,
  selectedProjectTimeline,
  selectedProjectTimelineMeta,
  timelineError,
  timelineLoading,
}) {
  if (!selectedProject) {
    return (
      <div className="pipeline-report__summary">
        <div className="pipeline-report__detail-card pipeline-report__detail-card--summary">
          <p className="pipeline-report__detail-label">Keterangan Project</p>
          <h3 className="pipeline-report__detail-title">Pilih project</h3>
          <p className="pipeline-report__detail-copy">
            Klik salah satu project di daftar pipeline untuk melihat ringkasan, progres, dan
            milestone-nya.
          </p>
        </div>
      </div>
    )
  }

  const summary = getProjectSummary(selectedProjectTimelineMeta, selectedProject)
  const progressStyle = {
    '--pipeline-accent': selectedProject?.accent || '#4f8ef7',
    '--pipeline-progress': `${summary.progress}%`,
  }

  return (
    <div className="pipeline-report__summary">
      <div
        className="pipeline-report__detail-card pipeline-report__detail-card--summary"
        style={progressStyle}
      >
        <div className="pipeline-report__detail-head">
          <div className="pipeline-report__detail-head-copy">
            <p className="pipeline-report__detail-label">Keterangan Project</p>
            <h3 className="pipeline-report__detail-title">{summary.title}</h3>
            <p className="pipeline-report__detail-copy">{summary.description}</p>
          </div>

          <div className="pipeline-report__detail-score">
            <div className="pipeline-report__detail-ring" aria-hidden="true">
              <span className="pipeline-report__detail-ring-value">{summary.progressLabel}</span>
            </div>
            <span
              className={`pipeline-report__detail-status pipeline-report__detail-status--${summary.statusTone}`}
            >
              {summary.statusLabel}
            </span>
          </div>
        </div>

        <div className="pipeline-report__detail-metrics" aria-label="Informasi utama">
          <div className="pipeline-report__detail-metric">
            <span className="pipeline-report__detail-metric-label">Periode</span>
            <strong className="pipeline-report__detail-metric-value">{summary.periodLabel}</strong>
          </div>
          <div className="pipeline-report__detail-metric">
            <span className="pipeline-report__detail-metric-label">Progress</span>
            <strong className="pipeline-report__detail-metric-value">{summary.progressLabel}</strong>
          </div>
          <div className="pipeline-report__detail-metric">
            <span className="pipeline-report__detail-metric-label">Owner / PIC</span>
            <strong className="pipeline-report__detail-metric-value">{summary.owner}</strong>
          </div>
          <div className="pipeline-report__detail-metric">
            <span className="pipeline-report__detail-metric-label">Kategori</span>
            <strong className="pipeline-report__detail-metric-value">{summary.category}</strong>
          </div>
        </div>

        <div className="pipeline-report__detail-progress">
          <div className="pipeline-report__detail-progress-copy">
            <span className="pipeline-report__detail-progress-label">Progres Saat Ini</span>
            <p className="pipeline-report__detail-copy">
              {summary.periodLabel} | {summary.statusLabel}
            </p>
          </div>
          <div className="pipeline-report__detail-progress-bar" aria-hidden="true">
            <span
              className="pipeline-report__detail-progress-fill"
              style={{ width: `${summary.progress}%`, backgroundColor: selectedProject?.accent }}
            />
          </div>
        </div>

        <div className="pipeline-report__milestone">
          <div className="pipeline-report__milestone-header">
            <div>
              <p className="pipeline-report__detail-label">Timeline / Milestone</p>
              <h4 className="pipeline-report__milestone-title-copy">Pergerakan project terpilih</h4>
            </div>

            <span className="pipeline-report__milestone-count">
              {Array.isArray(selectedProjectTimeline) ? selectedProjectTimeline.length : 0} item
            </span>
          </div>

          <div className="pipeline-report__timeline-scroll">
            {timelineLoading ? (
              <p className="pipeline-report__detail-copy">Memuat timeline project...</p>
            ) : timelineError ? (
              <p className="pipeline-report__detail-copy text-danger">{timelineError}</p>
            ) : (
              renderMilestoneList(selectedProjectTimeline)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PipeLineProject
