import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

import { XClose } from '../template/TemplateIcons.jsx'
import api from '../../services/api.js'
import DialogLoading from './DialogLoading.jsx'

function DialogExecutionTicket({
  isOpen = false,
  eyebrow = 'Execution Ticket',
  title = 'Execution Ticket',
  ticket = null,
  onClose,
  onConfirm,
}) {
  const [supports, setSupports] = useState([])
  const [formData, setFormData] = useState({
    support_id: '',
    status: 'In Progress',
    priority: 'Medium',
    start_date: '',
    end_date: '',
    time_spent: 0,
    solution: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Populate form data when ticket changes
  useEffect(() => {
    if (isOpen && ticket) {
      setFormData({
        support_id: ticket.support_id || '',
        status: ticket.status || 'In Progress',
        priority: ticket.priority || 'Medium',
        start_date: ticket.start_date ? ticket.start_date.substring(0, 16).replace(' ', 'T') : '',
        end_date: ticket.end_date ? ticket.end_date.substring(0, 16).replace(' ', 'T') : '',
        time_spent: ticket.time_spent || 0,
        solution: ticket.solution || '',
      })
    }
  }, [isOpen, ticket])

  // Fetch supports when dialog opens
  useEffect(() => {
    if (!isOpen) return

    async function fetchSupports() {
      setIsLoading(true)
      try {
        const response = await api.get('/user/supports')
        setSupports(response?.data ?? [])
      } catch (err) {
        console.error('Failed to fetch supports:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSupports()
  }, [isOpen])

  // Calculate time spent whenever dates change
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      const diffMs = end - start
      
      if (diffMs > 0) {
        const diffMins = Math.floor(diffMs / 60000)
        setFormData((prev) => ({ ...prev, time_spent: diffMins }))
      } else {
        setFormData((prev) => ({ ...prev, time_spent: 0 }))
      }
    }
  }, [formData.start_date, formData.end_date])

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!ticket?.id) return

    setIsSubmitting(true)
    try {
      const isResolved = formData.status === 'Resolved'
      const payload = {
        status: formData.status.toLowerCase().replace(' ', '_'),
        support_id: formData.support_id,
        priority: formData.priority.toLowerCase(),
        start_date: formData.start_date,
      }

      if (isResolved) {
        payload.solution = formData.solution
        payload.end_date = formData.end_date
        if (formData.time_spent > 0) {
          payload.time_spent = formData.time_spent
        }
      }

      const response = await api.put(`/ticket/${ticket.id}`, payload)
      await onConfirm?.(response.data?.data)
    } catch (err) {
      console.error('Failed to update ticket:', err)
      const message = err.data?.message || 'Gagal mengupdate ticket. Silakan coba lagi.'
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  if (isSubmitting) {
    return createPortal(
      <DialogLoading
        isOpen={true}
        eyebrow={eyebrow}
        title={title}
        loadingLabel="Sedang menyimpan..."
        detail="Mohon tunggu sebentar, kami sedang memperbarui data ticket ini."
      />,
      document.body,
    )
  }

  return createPortal(
    <div className="dashboard-popup-overlay" role="presentation" onClick={onClose}>
      <div
        className="dashboard-popup register-user-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-execution-title"
        onClick={(event) => event.stopPropagation()}
        style={{ maxWidth: '780px', width: '90vw' }}
      >
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">{eyebrow}</p>
            <h2 className="dashboard-popup__title" id="dialog-execution-title">
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
          <div className="register-user-popup__form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Row 1: Support, Status, Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="support_id">
                  Support
                </label>
                <select
                  id="support_id"
                  name="support_id"
                  className="register-user-popup__select register-user-popup__select--arrow-offset"
                  value={formData.support_id}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="">Pilih Support</option>
                  {supports.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="register-user-popup__select register-user-popup__select--arrow-offset"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="priority">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  className="register-user-popup__select register-user-popup__select--arrow-offset"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Row 2: Start Date, End Date, Time Spent */}
            <div style={{ display: 'grid', gridTemplateColumns: '5fr 5fr 3fr', gap: '1rem', alignItems: 'start' }}>
              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="start_date">
                  Start Date & Clock
                </label>
                <input
                  id="start_date"
                  name="start_date"
                  type="datetime-local"
                  className="register-user-popup__input"
                  value={formData.start_date}
                  onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', fontSize: '0.8rem' }}
                />
              </div>

              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="end_date">
                  End Date & Clock
                </label>
                <input
                  id="end_date"
                  name="end_date"
                  type="datetime-local"
                  className="register-user-popup__input"
                  value={formData.end_date}
                  onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box', fontSize: '0.8rem' }}
                />
              </div>

              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="time_spent">
                  Time Spent
                </label>
                <input
                  id="time_spent"
                  name="time_spent"
                  type="number"
                  className="register-user-popup__input"
                  value={formData.time_spent}
                  onChange={handleChange}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
                <p className="register-user-popup__hint" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                  Dihitung otomatis (menit).
                </p>
              </div>
            </div>

            {/* Row 3: Solution */}
            <div className="register-user-popup__field">
              <label className="register-user-popup__label" htmlFor="solution">
                Solution
              </label>
              <textarea
                id="solution"
                name="solution"
                className="register-user-popup__input master-project-popup__textarea"
                style={{ minHeight: '100px', width: '100%', boxSizing: 'border-box' }}
                placeholder="Jelaskan solusi atau tindakan yang telah dilakukan."
                value={formData.solution}
                onChange={handleChange}
              />
            </div>

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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : 'Execution Ticket'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default DialogExecutionTicket