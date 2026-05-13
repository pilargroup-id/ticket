import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import TimeLineMT from '../timeline/TimeLineProject.jsx'
import { getProjectHistory } from '../../services/projects/Projects.js'
import { XClose } from '../template/TemplateIcons.jsx'

function DialogHistoryPrj({
  isOpen,
  onClose,
  project,
}) {
  const [historyItems, setHistoryItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !project?.id) return

    let isMounted = true

    async function loadHistory() {
      setIsLoading(true)
      setError('')
      try {
        const response = await getProjectHistory(project.id)
        if (!isMounted) return

        const sortedData = [...(response.data || [])].sort((a, b) => {
          const dateA = new Date(a.timestamp || a.created_at || a.createdAt || 0).getTime()
          const dateB = new Date(b.timestamp || b.created_at || b.createdAt || 0).getTime()
          return dateB - dateA
        })

        setHistoryItems(sortedData)
      } catch (err) {
        if (!isMounted) return
        setError(err.message || 'Gagal memuat riwayat project.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [isOpen, project?.id])

  if (!isOpen) return null

  const dialogNode = (
    <div className="dashboard-popup-overlay" role="presentation" onClick={onClose}>
      <div
        className="dashboard-popup"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        style={{ width: '1200px', maxWidth: '98vw' }}
      >
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">Project History</p>
            <h2 className="dashboard-popup__title">
              History: {project?.projectCode || ''}
            </h2>
          </div>

          <button
            type="button"
            className="dashboard-popup__close"
            aria-label="Tutup dialog"
            onClick={onClose}
          >
            <XClose size={18} />
          </button>
        </div>

        <div className="dashboard-popup__body" style={{ maxHeight: '75vh', overflowY: 'auto', padding: '1.5rem 2rem' }}>
          <div className="users-table__detail-shell" style={{ gridTemplateColumns: '1fr', maxHeight: 'none', overflowY: 'visible' }}>
            {isLoading ? (
              <p className="mtickets-timeline__empty">Memuat riwayat project...</p>
            ) : error ? (
              <p className="mtickets-timeline__empty text-danger">{error}</p>
            ) : (
              <TimeLineMT
                items={historyItems}
                emptyMessage="Belum ada riwayat status untuk project ini."
                ariaLabel={`Timeline status ${project?.projectCode || ''}`}
              />
            )}
          </div>
        </div>

        <div className="dashboard-popup__actions">
          <button
            type="button"
            className="dashboard-popup__button dashboard-popup__button--secondary"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialogNode, document.body)
}

export default DialogHistoryPrj
