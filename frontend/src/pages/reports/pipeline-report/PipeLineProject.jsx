import TimeLineMT from '../../../components/timeline/TimeLineMT.jsx'

function PipeLineProject({
  selectedProject,
  selectedProjectTimeline,
  selectedProjectTimelineMeta,
  timelineError,
  timelineLoading,
}) {
  return (
    <div className="pipeline-report__summary">
      {selectedProject ? (
        <div className="pipeline-report__detail-card pipeline-report__detail-card--soft">
          <p className="pipeline-report__detail-label">Keterangan</p>
          <h3 className="pipeline-report__detail-title">{selectedProject.title}</h3>
          <p className="pipeline-report__detail-copy">{selectedProject.detail}</p>

          <div className="pipeline-report__timeline-scroll">
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
