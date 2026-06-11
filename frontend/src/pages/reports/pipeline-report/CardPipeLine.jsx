const STATUS_CARD_PIPELINE = [
    {
        tittle: 'Total Project',
    },
    {
        tittle: 'Complete',
    },
    {
        tittle: 'On Track',
    },
    {
        tittle: 'At Risk',
    },
    {
        tittle: 'Delayed',
    },
]

function getColorForStatus(status) {
    switch (status) {
        case 'Total Project':
            return '#0275d8'
        case 'Complete':
            return '#5cb85c'
        case 'On Track':
            return '#f0ad4e'
        case 'At Risk':
            return '#c77d00'
        case 'Delayed':
            return '#6c757d'
    }
}

function CardStatusPipeline({ activeStatus = '', onStatusChange, statusCounts = {} }) {
    const handleCardClick = (status) => {
        onStatusChange?.(activeStatus === status ? '' : status)
    }

    return (
        <section className="dashboard-overview mtickets-status-overview" aria-label="Ringkasan status project">
            {STATUS_CARD_PIPELINE.map((card) => {
                const isActive = activeStatus === card.tittle
                const accentColor = getColorForStatus(card.tittle)
                const cardValue = statusCounts[card.tittle] ?? 0
    )