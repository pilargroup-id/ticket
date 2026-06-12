import PipeLineProject from '../../pages/reports/pipeline-report/PipeLineProject.jsx'

function TimeLineProject({
  errorMessage,
  isLoading,
  onSelectedStageChange,
  onSortModeChange,
  searchQuery,
  selectedProject,
  selectedProjectTimeline,
  selectedProjectTimelineMeta,
  timelineError,
  timelineLoading,
  sortMode,
  selectedStage,
  visibleProjects,
}) {
  return (
    <div className="pipeline-report__body">
      <PipeLineProject
        selectedProject={selectedProject}
        selectedProjectTimeline={selectedProjectTimeline}
        selectedProjectTimelineMeta={selectedProjectTimelineMeta}
        timelineError={timelineError}
        timelineLoading={timelineLoading}
      />

      <div className="pipeline-report__timeline-wrap">
        <div className="pipeline-report__timeline-shell">
          <div className="pipeline-report__timeline-header">
            <div className="pipeline-report__timeline-copy">
              <p className="pipeline-report__timeline-eyebrow">Pipeline</p>
              <h3 className="pipeline-report__timeline-title">Daftar Project</h3>
              {/* <p className="pipeline-report__timeline-subtitle">
                Pantau urutan project aktif dengan status, progres, dan periode kerja yang jelas.
              </p> */}
            </div>

            <div className="pipeline-report__timeline-toolbar">
            </div>
          </div>

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
                {searchQuery?.trim()
                  ? 'Periksa kata kunci pencarian atau hapus filter status yang sedang aktif.'
                  : 'Ubah filter status atau tunggu data project tersedia di `api/project`.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="pipeline-report__timeline" aria-label="Pipeline projects">
            {visibleProjects.map((project, index) => (
              <button
                key={project.id}
                type="button"
                className={`pipeline-report__stage${
                  selectedStage === project.id ? ' pipeline-report__stage--active' : ''
                }`}
                aria-pressed={selectedStage === project.id}
                onClick={() => onSelectedStageChange?.(project.id)}
                style={
                  selectedStage === project.id
                    ? {
                        borderColor: project.accent,
                        boxShadow: `0 16px 36px ${project.accent}1a`,
                      }
                    : undefined
                }
              >
                <div
                  className="pipeline-report__stage-index"
                  style={
                    selectedStage === project.id
                      ? {
                          backgroundColor: `${project.accent}14`,
                          color: project.accent,
                        }
                      : undefined
                  }
                >
                  {String(index + 1).padStart(2, '0')}
                </div>

                <div className="pipeline-report__stage-copy">
                  <div className="pipeline-report__stage-title-row">
                    <div className="pipeline-report__stage-title-copy">
                      <h3 className="pipeline-report__stage-title">{project.title}</h3>
                      <p className="pipeline-report__stage-meta">
                        {project.code !== '-' ? project.code : project.periodLabel}
                      </p>
                    </div>
                    <span
                      className={`pipeline-report__stage-status pipeline-report__stage-status--${project.bucket
                        .toLowerCase()
                        .replace(/\s+/g, '-')}`}
                      style={
                        selectedStage === project.id
                          ? {
                              borderColor: `${project.accent}55`,
                              backgroundColor: `${project.accent}12`,
                              color: project.accent,
                            }
                          : undefined
                      }
                    >
                      {project.statusLabel}
                    </span>
                  </div>

                  <div className="pipeline-report__stage-progress-row">
                    <span className="pipeline-report__stage-percent">{project.progressLabel}</span>
                    <span className="pipeline-report__stage-date">{project.periodLabel}</span>
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

                  <p className="pipeline-report__stage-detail">{project.description}</p>
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
    </div>
  )
}

export default TimeLineProject
