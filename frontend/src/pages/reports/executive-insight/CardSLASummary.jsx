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
        if (response.data) {
          const { status, sla } = response.data
          setStatusCounts({
            'Resolve': (status?.resolved || 0) + (status?.feedback || 0),
            'In SLA': sla?.on_time || 0,
            'Breached': sla?.late || 0,
            'SLA%': `${sla?.percentage_on_time || 0}%`,
          })
        }
      } catch (error) {
        console.error('Error fetching SLA data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSLAData()
  }, [filters])

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
