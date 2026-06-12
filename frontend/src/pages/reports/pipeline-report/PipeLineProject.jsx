import TimeLineMT from '../../../components/timeline/TimeLineMT.jsx'

function PipeLineProject({
  selectedProject,
  selectedProjectTimeline,
  selectedProjectTimelineMeta,
  timelineError,
  timelineLoading,
  statusCopy,
  statusCounts,
}) {
  return (
    <div className="pipeline-report__summary">
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
        <div className="pipeline-report__detail-card pipeline-report__detail-card--soft">
          <p className="pipeline-report__detail-label">Keterangan</p>
          <h3 className="pipeline-report__detail-title">{selectedProject.title}</h3>
          <p className="pipeline-report__detail-copy">{selectedProject.detail}</p>
          <div className="pipeline-report__detail-progress">
            <span className="pipeline-report__detail-progress-label">Progress</span>
            <strong>{selectedProject.progressLabel}</strong>
          </div>

          {statusCopy ? (
            <div className="pipeline-report__detail-copy" style={{ marginTop: '0.75rem' }}>
              <strong>{statusCopy.title}</strong>
              {statusCopy.subtitle ? <p>{statusCopy.subtitle}</p> : null}
            </div>
          ) : null}

          <div style={{ marginTop: '1.25rem' }}>
            {timelineLoading ? (
              <p className="pipeline-report__detail-copy">Memuat timeline project...</p>
            ) : timelineError ? (
              <p className="pipeline-report__detail-copy text-danger">{timelineError}</p>
            ) : (
              <TimeLineMT
                items={selectedProjectTimeline}
                emptyMessage="Belum ada riwayat timeline untuk project ini."
                ariaLabel={`Timeline project ${selectedProjectTimelineMeta?.name || selectedProject.title}`}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="pipeline-report__detail-card pipeline-report__detail-card--soft">
          <p className="pipeline-report__detail-label">Keterangan</p>
          <h3 className="pipeline-report__detail-title">Pilih project</h3>
          <p className="pipeline-report__detail-copy">
            Klik salah satu project di daftar kanan untuk melihat detail dan timeline per project.
          </p>
        </div>
      )}
    </div>
  )
}

export default PipeLineProject
