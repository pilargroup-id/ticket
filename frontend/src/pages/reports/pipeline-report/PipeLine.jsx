import { useEffect, useMemo, useState } from 'react'

import api from '../../../services/api.js'
import CardStatusPipeline from './CardStatusPipeLine.jsx'
import {
  buildPipelineProjects,
  buildPipelineStatusCounts,
  getPipelineStatusCopy,
} from './PipeLineStages.js'

function getVisibleProjects(projects, activeStatus) {
  if (!activeStatus) {
    return projects
  }

  return projects.filter((project) => project.bucket === activeStatus)
}

function PipeLine({ activePage }) {
  const [activeStatus, setActiveStatus] = useState('')
  const [selectedStage, setSelectedStage] = useState('')
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProjects() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await api.get('/project', { signal: controller.signal })
        const projectList = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : Array.isArray(response?.projects)
              ? response.projects
              : []

        setProjects(projectList)
      } catch (error) {
        if (error?.name === 'AbortError') {
          return
        }

        setProjects([])
        setErrorMessage(error?.message || 'Gagal memuat data project.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProjects()

    return () => {
      controller.abort()
    }
  }, [])

  const pipelineProjects = useMemo(() => buildPipelineProjects(projects), [projects])
  const statusCounts = useMemo(
    () => buildPipelineStatusCounts(pipelineProjects),
    [pipelineProjects],
  )
  const visibleProjects = useMemo(
    () => getVisibleProjects(pipelineProjects, activeStatus),
    [activeStatus, pipelineProjects],
  )
  const statusCopy = useMemo(
    () => getPipelineStatusCopy(activeStatus, statusCounts),
    [activeStatus, statusCounts],
  )
  const selectedProject = useMemo(
    () => visibleProjects.find((project) => String(project.id) === String(selectedStage)) || null,
    [selectedStage, visibleProjects],
  )

  useEffect(() => {
    if (selectedStage && !visibleProjects.some((project) => String(project.id) === String(selectedStage))) {
      setSelectedStage('')
    }
  }, [selectedStage, visibleProjects])

  return (
    <section className="pipeline-report" aria-label="Pipeline report">
      <CardStatusPipeline
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        statusCounts={statusCounts}
      />

      <article className="dashboard-panel pipeline-report__panel" aria-label="Pipeline detail">
        <div className="dashboard-panel__header dashboard-panel__header--split pipeline-report__header">
          <div className="chart-card__header-copy">
            <p className="dashboard-panel__eyebrow">{activePage?.eyebrow ?? 'Reports'}</p>
            <h1 className="dashboard-panel__title">{activePage?.title ?? 'Pipeline'}</h1>
          </div>

          <div className="pipeline-report__legend">
            <span className="pipeline-report__legend-item">
              <span className="pipeline-report__legend-dot pipeline-report__legend-dot--blue" />
              Total
            </span>
            <span className="pipeline-report__legend-item">
              <span className="pipeline-report__legend-dot pipeline-report__legend-dot--green" />
              On track
            </span>
            <span className="pipeline-report__legend-item">
              <span className="pipeline-report__legend-dot pipeline-report__legend-dot--amber" />
              Perhatian
            </span>
          </div>
        </div>

        <div className="pipeline-report__body">
          <div className="pipeline-report__summary">
            <div className="pipeline-report__hero">
              <p className="pipeline-report__eyebrow">Current Focus</p>
              <h2 className="pipeline-report__hero-title">Project Pipeline</h2>
              <p className="pipeline-report__hero-copy">{statusCopy.title}</p>
              <p className="pipeline-report__hero-copy pipeline-report__hero-copy--muted">
                {statusCopy.subtitle}
              </p>
            </div>

            <div className="pipeline-report__metrics" aria-label="Pipeline summary metrics">
              <div className="pipeline-report__metric">
                <span className="pipeline-report__metric-label">Total Project</span>
                <strong className="pipeline-report__metric-value">{statusCounts['Total Project'] ?? 0}</strong>
              </div>
              <div className="pipeline-report__metric">
                <span className="pipeline-report__metric-label">Complete</span>
                <strong className="pipeline-report__metric-value">{statusCounts.Complete ?? 0}</strong>
              </div>
              <div className="pipeline-report__metric">
                <span className="pipeline-report__metric-label">On Track</span>
                <strong className="pipeline-report__metric-value">{statusCounts['On Track'] ?? 0}</strong>
              </div>
            </div>

            {selectedProject ? (
              <div className="pipeline-report__detail-card">
                <p className="pipeline-report__detail-label">Keterangan</p>
                <h3 className="pipeline-report__detail-title">{selectedProject.title}</h3>
                <p className="pipeline-report__detail-copy">{selectedProject.detail}</p>
                <div className="pipeline-report__detail-progress">
                  <span className="pipeline-report__detail-progress-label">Progress</span>
                  <strong>{selectedProject.progressLabel}</strong>
                </div>
              </div>
            ) : (
              <div className="pipeline-report__detail-card pipeline-report__detail-card--soft">
                <p className="pipeline-report__detail-label">Keterangan</p>
                <h3 className="pipeline-report__detail-title">Pilih project</h3>
                <p className="pipeline-report__detail-copy">
                  Klik salah satu project di daftar kanan untuk melihat detail tanggal dan progress.
                </p>
              </div>
            )}
          </div>

          <div className="pipeline-report__timeline-wrap">
            {isLoading ? (
              <div className="pipeline-report__timeline-state" aria-live="polite">
                <div className="pipeline-report__state-card">
                  <div className="pipeline-report__state-skeleton pipeline-report__state-skeleton--title" />
                  <div className="pipeline-report__state-skeleton" />
                  <div className="pipeline-report__state-skeleton pipeline-report__state-skeleton--wide" />
                  <div className="pipeline-report__state-skeleton pipeline-report__state-skeleton--wide" />
                </div>
              </div>
            ) : errorMessage ? (
              <div className="pipeline-report__timeline-state" aria-live="polite">
                <div className="pipeline-report__state-card pipeline-report__state-card--error">
                  <p className="pipeline-report__state-title">Data project tidak bisa dimuat</p>
                  <p className="pipeline-report__state-copy">{errorMessage}</p>
                </div>
              </div>
            ) : visibleProjects.length === 0 ? (
              <div className="pipeline-report__timeline-state" aria-live="polite">
                <div className="pipeline-report__state-card">
                  <p className="pipeline-report__state-title">Tidak ada project yang cocok</p>
                  <p className="pipeline-report__state-copy">
                    Ubah filter status atau tunggu data project tersedia di `api/project`.
                  </p>
                </div>
              </div>
            ) : (
              <div className="pipeline-report__timeline" aria-label="Pipeline projects">
                {visibleProjects.map((project, index) => (
                  <button
                    type="button"
                    className={`pipeline-report__stage${
                      selectedStage === project.id ? ' pipeline-report__stage--active' : ''
                    }`}
                    key={project.id}
                    aria-pressed={selectedStage === project.id}
                    onClick={() =>
                      setSelectedStage((current) => (String(current) === String(project.id) ? '' : project.id))
                    }
                  >
                    <div className="pipeline-report__stage-index">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div className="pipeline-report__stage-copy">
                      <div className="pipeline-report__stage-title-row">
                        <h3 className="pipeline-report__stage-title">{project.title}</h3>
                        <span className="pipeline-report__stage-percent">{project.progressLabel}</span>
                      </div>

                      <div className="pipeline-report__stage-progress" aria-hidden="true">
                        <span
                          className="pipeline-report__stage-progress-fill"
                          style={{
                            width: `${project.progress}%`,
                            backgroundColor: project.accent,
                            color: project.accent,
                          }}
                        />
                      </div>

                      <p className="pipeline-report__stage-detail">{project.detail}</p>
                    </div>

                    <span
                      className="pipeline-report__stage-accent"
                      style={{
                        backgroundColor: project.accent,
                        boxShadow: `0 0 0 6px ${project.accent}18`,
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>
    </section>
  )
}

export default PipeLine
