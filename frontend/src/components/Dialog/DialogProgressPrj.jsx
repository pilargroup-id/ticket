import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import api from '../../services/api.js'
import { getStoredUser } from '../../services/auth.js'
import { XClose } from '../template/TemplateIcons.jsx'
import SliderProject from '../slider/SliderProgressPrj'

function DialogProgressPrj({
  isOpen = false,
  project = null,
  onClose,
  onSuccess,
}) {
  const [progressPercent, setProgressPercent] = useState(0)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (isOpen && project) {
      setProgressPercent(project.progressValue || 0)
      setDescription('')
      setErrorMessage('')
    }
  }, [isOpen, project])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleSubmit = async () => {
    if (!project?.id) return

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const isStart = project.rawStatus === 'waiting'
      const isHold = project.rawStatus === 'hold' || project.rawStatus === 'pending'
      
      let endpoint = `/project/${project.id}/progress`
      if (isStart) endpoint = `/project/${project.id}/start`
      else if (isHold) endpoint = `/project/${project.id}/unhold`
      
      const user = getStoredUser()
      const payload = {
        progress_percent: progressPercent,
        description: description.trim(),
        developer_id: user?.id,
      }

      const response = await api.post(endpoint, payload)

      onSuccess?.(response)
      onClose?.()
    } catch (err) {
      console.error('Failed to update progress:', err)
      setErrorMessage(
        err?.data?.message || err?.response?.data?.message || err?.message || 'Gagal memperbarui progress project.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const dialogNode = (
    <div className="dashboard-popup-overlay" role="presentation" onClick={onClose}>
      <div
        className="dashboard-popup register-user-popup mtickets-create-popup"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">Project Update</p>
            <h2 className="dashboard-popup__title">
              Update Progress: {project?.projectCode}
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

        <div className="dashboard-popup__body">
          <div className="register-user-popup__form">
            <div className="register-user-popup__grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="progress-percent">
                  Progress (%)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    id="progress-percent"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    className="register-user-popup__input"
                    style={{ flex: 1, padding: 0, height: '8px' }}
                    value={progressPercent}
                    onChange={(e) => setProgressPercent(Number(e.target.value))}
                  />
                  <span style={{ minWidth: '3rem', textAlign: 'right', fontWeight: 600 }}>
                    {progressPercent}%
                  </span>
                </div>
              </div>

              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="update-description">
                  Update Description / Notes
                </label>
                <textarea
                  id="update-description"
                  className="register-user-popup__input master-project-popup__textarea"
                  style={{ minHeight: '120px' }}
                  placeholder="Apa yang telah dikerjakan?..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <p
              style={{
                color: '#ef4444',
                fontSize: '0.85rem',
                marginTop: '0.75rem',
                padding: '0.5rem 0.75rem',
                background: 'rgba(239, 68, 68, 0.08)',
                borderRadius: '6px',
              }}
            >
              {errorMessage}
            </p>
          )}
        </div>

        <div className="dashboard-popup__actions">
          <button
            type="button"
            className="dashboard-popup__button dashboard-popup__button--secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="button"
            className="dashboard-popup__button dashboard-popup__button--primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? 'Menyimpan...' 
              : project?.rawStatus === 'waiting' 
                ? 'Start Project' 
                : (project?.rawStatus === 'hold' || project?.rawStatus === 'pending')
                  ? 'Continue Project'
                  : 'Update Progress'
            }
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialogNode, document.body)
}

export default DialogProgressPrj