const STATUS_CARD_PIPELINE = [
  {
    title: 'Total Project',
  },
  {
    title: 'Done',
  },
  {
    title: 'On Track',
  },
  {
    title: 'at risk',
  },
  {
    title: 'delayed',
  },
]

function getColorForStatus(status) {
  switch (status) {
    case 'Total Project':
      return '#0275d8'
    case 'Done':
      return '#5cb85c'
    case 'On Track':
      return '#f0ad4e'
    case 'at risk':
      return '#f4d03f'
    case 'delayed':
      return '#6c757d'
    default:
      return '#d1d5db'
  }
}

function CardStatusPipeline({ activeStatus = '', onStatusChange, statusCounts = {} }) {
  const handleCardClick = (status) => {
    onStatusChange?.(activeStatus === status ? '' : status)
  }

  return (
    <section
      className="dashboard-overview mtickets-status-overview pipeline-status-overview"
      aria-label="Ringkasan status pipeline"
    >
      {STATUS_CARD_PIPELINE.map((card) => {
        const isActive = activeStatus === card.title
        const accentColor = getColorForStatus(card.title)
        const cardValue = statusCounts[card.title] ?? 0

        return (
          <article
            className={`dashboard-card clickable mtickets-status-card${isActive ? ' active' : ''}`}
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
              {cardValue}
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

export default CardStatusPipeline
