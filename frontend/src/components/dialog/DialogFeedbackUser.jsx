import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Rating from '@mui/material/Rating'
import { XClose } from '../template/TemplateIcons.jsx'
import { postFeedback } from '../../services/tickets/Tickets.js'

const MIN_COMMENT_LENGTH = 6

function DialogFeedbackUser({
  isOpen = false,
  eyebrow = 'Feedback Ticket',
  title = 'Give Feedback',
  ticket = null,
  onClose,
  onConfirm,
}) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setRating(5)
      setComment('')
      setError('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

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

  const trimmedCommentLength = comment.trim().length
  const isCommentValid = trimmedCommentLength >= MIN_COMMENT_LENGTH

  const handleSubmit = async () => {
    if (!ticket?.id || !isCommentValid) return

    setIsSubmitting(true)
    setError('')

    try {
      const result = await postFeedback(ticket.id, { rating, comment: comment.trim() })
      onConfirm?.(result)
    } catch (err) {
      console.error('Failed to submit feedback:', err)
      setError(err.response?.data?.message || 'Gagal mengirim feedback. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return null
  }

  if (typeof document === 'undefined') {
    return null
  }

  const dialogNode = (
    <div className="dashboard-popup-overlay" role="presentation" onClick={onClose}>
      <div
        className="dashboard-popup register-user-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-feedback-title"
        onClick={(event) => event.stopPropagation()}
        style={{ maxWidth: '600px', width: '90vw' }}
      >
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">{eyebrow}</p>
            <h2 className="dashboard-popup__title" id="dialog-feedback-title">
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
          <div className="register-user-popup__form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="register-user-popup__field">
              <label className="register-user-popup__label">Rating Layanan</label>
              <div style={{ padding: '0.25rem 0' }}>
                <Rating
                  name="ticket-rating"
                  value={rating}
                  onChange={(event, newValue) => {
                    setRating(newValue)
                  }}
                  size="large"
                />
              </div>
            </div>

            <div className="register-user-popup__field">
              <label htmlFor="feedback-comment" className="register-user-popup__label">
                Komentar
              </label>
              <textarea
                id="feedback-comment"
                className="register-user-popup__input master-project-popup__textarea"
                style={{ minHeight: '120px', width: '100%', boxSizing: 'border-box' }}
                placeholder="Berikan masukan Anda untuk layanan kami..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <p
                style={{
                  margin: '0.25rem 0 0',
                  fontSize: '0.8rem',
                  color: isCommentValid ? 'var(--color-text-secondary)' : 'var(--template-fg-danger)',
                }}
              >
                {isCommentValid
                  ? `${trimmedCommentLength} karakter`
                  : `Minimal ${MIN_COMMENT_LENGTH} karakter (${trimmedCommentLength}/${MIN_COMMENT_LENGTH})`}
              </p>
            </div>

            {error && (
              <p className="dashboard-popup__error" style={{ color: 'var(--template-fg-danger)', fontSize: '0.875rem' }}>
                {error}
              </p>
            )}
          </div>
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
            disabled={isSubmitting || !rating || !isCommentValid}
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Feedback'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialogNode, document.body)
}

export default DialogFeedbackUser