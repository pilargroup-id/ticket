import { useMemo, useState } from 'react'

import CardStatusPipeline from './CardStatusPipeLine.jsx'

const PIPELINE_STATUS_COUNTS = {
  'Total Project': 18,
  Complete: 11,
  'On Track': 4,
  'At Risk': 2,
  Delayed: 1,
}

const PIPELINE_STAGES = [
  {
    title: 'Discovery',
    detail: 'Brief intake, scope validation, dan estimasi awal.',
    accent: '#0275d8',
  },
  {
    title: 'Execution',
    detail: 'Pekerjaan aktif dengan tracking progress harian.',
    accent: '#5cb85c',
  },
  {
    title: 'Review',
    detail: 'Final QA, sign-off, dan persiapan handover.',
    accent: '#f0ad4e',
  },
  {
    title: 'Closed',
    detail: 'Dokumentasi selesai dan project dinyatakan complete.',
    accent: '#6c757d',
  },
]

function getSelectedStatusCopy(activeStatus) {
  if (!activeStatus) {
    return {
      title: 'Pipeline Overview',
    }
  }

  return {
    title: `${activeStatus} Projects`,
    detail:
      'Fokus ini menampilkan stage yang paling relevan dengan status yang dipilih, supaya card besar tetap padat dan mudah dipindai.',
  }
}

function PipeLine({ activePage }) {
  const [activeStatus, setActiveStatus] = useState('')

  const statusCopy = useMemo(() => getSelectedStatusCopy(activeStatus), [activeStatus])

  const visibleStages = useMemo(() => {
    if (!activeStatus) {
      return PIPELINE_STAGES
    }

    if (activeStatus === 'Complete') {
      return PIPELINE_STAGES.slice(1)
    }

    if (activeStatus === 'Delayed' || activeStatus === 'At Risk') {
      return PIPELINE_STAGES.slice(2)
    }

    return PIPELINE_STAGES
  }, [activeStatus])

  return (
    <section className="pipeline-report" aria-label="Pipeline report">
      <CardStatusPipeline
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        statusCounts={PIPELINE_STATUS_COUNTS}
      />

      <article className="dashboard-panel pipeline-report__panel" aria-label="Pipeline detail">
        <div className="dashboard-panel__header dashboard-panel__header--split pipeline-report__header">
          <div className="chart-card__header-copy">
            <p className="dashboard-panel__eyebrow">{activePage?.eyebrow ?? 'Reports'}</p>
            <h1 className="dashboard-panel__title">{activePage?.title ?? 'Pipeline'}</h1>
            <p className="users-table-card__description pipeline-report__description">
              {statusCopy.detail}
            </p>
          </div>

          <div className="pipeline-report__legend">
            <span className="pipeline-report__legend-item">
              <span className="pipeline-report__legend-dot pipeline-report__legend-dot--blue" />
              Delivery
            </span>
            <span className="pipeline-report__legend-item">
              <span className="pipeline-report__legend-dot pipeline-report__legend-dot--green" />
              Stable
            </span>
            <span className="pipeline-report__legend-item">
              <span className="pipeline-report__legend-dot pipeline-report__legend-dot--amber" />
              Attention
            </span>
          </div>
        </div>

        <div className="pipeline-report__body">
          <div className="pipeline-report__summary">
            <div className="pipeline-report__hero">
              <p className="pipeline-report__eyebrow">Current Focus</p>
              <h2 className="pipeline-report__hero-title">{statusCopy.title}</h2>
              <p className="pipeline-report__hero-copy">
                Layout dibuat seperti overview panel: status cards tetap berada di atas, sementara
                kartu besar di bawah dibuat lebih tinggi dan mengisi sisa ruang tanpa menyisakan
                whitespace di bawah.
              </p>
            </div>
          </div>

          <div className="pipeline-report__timeline" aria-label="Pipeline stages">
            {visibleStages.map((stage, index) => (
              <article className="pipeline-report__stage" key={stage.title}>
                <div className="pipeline-report__stage-index">{String(index + 1).padStart(2, '0')}</div>
                <div className="pipeline-report__stage-copy">
                  <h3 className="pipeline-report__stage-title">{stage.title}</h3>
                  <p className="pipeline-report__stage-detail">{stage.detail}</p>
                </div>
                <span
                  className="pipeline-report__stage-accent"
                  style={{ backgroundColor: stage.accent }}
                />
              </article>
            ))}
          </div>
        </div>
      </article>
    </section>
  )
}

export default PipeLine
