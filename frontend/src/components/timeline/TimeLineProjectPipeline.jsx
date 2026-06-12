import PipeLineProject from '../../pages/reports/pipeline-report/PipeLineProject.jsx'

function TimeLineProject({
  errorMessage,
  isLoading,
  onSelectedStageChange,
  selectedProject,
  selectedProjectTimeline,
  selectedProjectTimelineMeta,
  timelineError,
  timelineLoading,
  selectedStage,
  statusCopy,
  statusCounts,
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
        statusCopy={statusCopy}
        statusCounts={statusCounts}
      />

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
                key={project.id}
                type="button"
                className={`pipeline-report__stage${
                  selectedStage === project.id ? ' pipeline-report__stage--active' : ''
                }`}
                aria-pressed={selectedStage === project.id}
                onClick={() =>
                  onSelectedStageChange((current) =>
                    String(current) === String(project.id) ? '' : project.id,
                  )
                }
              >
                <div className="pipeline-report__stage-index">{String(index + 1).padStart(2, '0')}</div>

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
  )
}

export default TimeLineProject
