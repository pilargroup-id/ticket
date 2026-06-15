import { useState, useEffect } from 'react'
import { getTicketReportAll } from '../../../services/reports/TicketReports'

const STATUS_CARD_PROJECTS = [
  {
    title: 'Resolve',
  },
  {
    title: 'In SLA',
  },
  {
    title: 'Breached',
  },
  {
    title: 'SLA%',
  },
]

function getColorForStatus(status) {
  switch (status) {
    case 'Resolve':
      return '#3b82f6' // Blue
    case 'In SLA':
      return '#10b981' // Green
    case 'Breached':
      return '#ef4444' // Red
    case 'SLA%':
      return '#6366f1' // Indigo
    default:
      return '#d1d5db'
  }
}

function toSafeNumber(value) {
  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : 0
}

function formatPercentage(value) {
  const parsedValue = toSafeNumber(value)

  return Number.isInteger(parsedValue)
    ? String(parsedValue)
    : parsedValue.toFixed(2).replace(/\.?0+$/, '')
}

function buildSlaSummary(reportData = {}) {
  const status = reportData?.status ?? {}
  const sla = reportData?.sla ?? {}

  const resolved =
    sla?.resolved ?? (toSafeNumber(status?.resolved) + toSafeNumber(status?.feedback))
  const inSla = sla?.on_time ?? sla?.resolved_in_sla ?? 0
  const breached = sla?.late ?? Math.max(toSafeNumber(resolved) - toSafeNumber(inSla), 0)
  const percentage = sla?.percentage_on_time ?? sla?.sla_percent ?? 0

  return {
    'Resolve': toSafeNumber(resolved),
    'In SLA': toSafeNumber(inSla),
    'Breached': toSafeNumber(breached),
    'SLA%': `${formatPercentage(percentage)}%`,
  }
}

function CardSLASummary({ filters, activeStatus = '', onStatusChange }) {
  const [statusCounts, setStatusCounts] = useState({
    'Resolve': 0,
    'In SLA': 0,
    'Breached': 0,
    'SLA%': '0%',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchSLAData() {
      if (!filters?.startDate || !filters?.endDate) return

      setLoading(true)
      try {
        const response = await getTicketReportAll({
          startDate: filters?.startDate,
          endDate: filters?.endDate
        })
        setStatusCounts(buildSlaSummary(response?.data))
      } catch (error) {
        console.error('Error fetching SLA data:', error)
        setStatusCounts(buildSlaSummary())
      } finally {
        setLoading(false)
      }
    }

    fetchSLAData()
  }, [filters?.startDate, filters?.endDate])

  const handleCardClick = (status) => {
    onStatusChange?.(activeStatus === status ? '' : status)
  }

  return (
    <section
      className="dashboard-overview mtickets-status-overview"
      aria-label="Ringkasan SLA"
    >
      {STATUS_CARD_PROJECTS.map((card) => {
        const isActive = activeStatus === card.title
        const accentColor = getColorForStatus(card.title)
        const cardValue = statusCounts[card.title] ?? 0

        return (
          <article
            className={`dashboard-card clickable mtickets-status-card${isActive ? ' active' : ''}${loading ? ' loading' : ''}`}
            key={card.title}
            style={isActive ? { borderColor: accentColor } : undefined}
            onClick={() => handleCardClick(card.title)}
          >
            <div className="card-accent-bar" style={{ backgroundColor: accentColor }} />

            <div className="dashboard-card__badge-row">
              <div className="status-badge">
                <span className="status-indicator" style={{ backgroundColor: accentColor }} />
                <span className="dashboard-card__label">{card.title}</span>
              </div>
            </div>

            <strong className="dashboard-card__value mtickets-status-card__value">
              {loading ? '...' : cardValue}
            </strong>

            <div className="dashboard-card__footer-text">
              {isActive ? 'Click again to reset' : 'Click to filter'}
            </div>
          </article>
        )
      })}
    </section>
  )
}

export default CardSLASummary
