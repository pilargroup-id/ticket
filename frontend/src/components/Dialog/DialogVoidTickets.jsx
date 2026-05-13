import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import api from '../../services/api.js'
import { XClose } from '../template/TemplateIcons.jsx'
import DialogLoading from './DialogLoading.jsx'

function DialogVoidTickets({
  isOpen = false,
  ticket = null,
  onClose,
  onConfirm,
  eyebrow = 'Void Ticket',
  title = 'Void Ticket',
  description = null,
  secondaryDescription = '',
  confirmLabel = 'Void',
}) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (isOpen && ticket) {
      setReason('')
      setErrorMessage('')
    }
  }, [isOpen, ticket])

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
    if (!ticket?.id) return

    if (!reason.trim()) {
      setErrorMessage('Alasan Void (notes) wajib diisi.')
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)

    try {
      // Perintah USER: PATCH /ticket/void/{id} dengan field 'notes'
      const payload = {
        notes: reason.trim(),
      }

      const response = await api.patch(`/ticket/void/${ticket.id}`, payload)

      onConfirm?.(response?.data?.data || response?.data || response)
      onClose?.()
    } catch (err) {
      console.error('Failed to void ticket:', err)
      setErrorMessage(
        err?.data?.message || err?.response?.data?.message || err?.message || 'Gagal membatalkan ticket.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  if (isSubmitting) {
    return createPortal(
      <DialogLoading
        isOpen={true}
        eyebrow={eyebrow}
        title={title}
        loadingLabel="Sedang memproses..."
        detail="Mohon tunggu sebentar, kami sedang membatalkan ticket ini."
      />,
      document.body,
    )
  }

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
            <p className="dashboard-popup__eyebrow">{eyebrow}</p>
            <h2 className="dashboard-popup__title">
              {title}
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
          <div style={{ marginBottom: '1.5rem' }}>
            {description ? (
              <div style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {description}
              </div>
            ) : (
              <p style={{ color: '#4b5563', fontSize: '0.95rem' }}>
                Apakah Anda yakin ingin membatalkan (void) ticket ini?
              </p>
            )}
            {secondaryDescription && (
              <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {secondaryDescription}
              </p>
            )}
          </div>

          <div className="register-user-popup__form">
            <div className="register-user-popup__grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="void-reason">
                  Alasan Void (Wajib)
                </label>
                <textarea
                  id="void-reason"
                  className="register-user-popup__input master-project-popup__textarea"
                  style={{ minHeight: '100px' }}
                  placeholder="Mengapa ticket ini dibatalkan?..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
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
            style={{ background: '#ef4444' }}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialogNode, document.body)
}

export default DialogVoidTickets