function PipeLineProject({ selectedProject, statusCopy, statusCounts }) {
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
  )
}

export default PipeLineProject
