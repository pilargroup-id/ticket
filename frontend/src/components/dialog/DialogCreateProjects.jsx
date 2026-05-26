import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import api from '../../services/api.js'
import { getStoredUser } from '../../services/auth.js'
import { XClose } from '../template/TemplateIcons.jsx'

function DialogCreateProjects({
  isOpen = false,
  eyebrow = 'Create Projects',
  title = 'Create Projects',
  onClose,
  onCreated,
}) {
  const authUser = getStoredUser()
  const [users, setUsers] = useState([])
  const [titleProject, setTitleProject] = useState('')
  const [requestDate, setRequestDate] = useState(() => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  })
  const [requestorId, setRequestorId] = useState(authUser?.id ?? '')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [priority, setPriority] = useState('Low')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [requestorSearch, setRequestorSearch] = useState('')
  const [requestorOpen, setRequestorOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    async function fetchUsers() {
      try {
        const response = await api.get('/user')
        if (!cancelled) {
          const list = response?.data?.data ?? response?.data ?? []
          setUsers(list)
          // Pre-fill search label if requestorId is already set
          const preSelected = list.find((u) => String(u.id) === String(authUser?.id))
          if (preSelected) setRequestorSearch(preSelected.name)
        }
      } catch (err) {
        console.error('Failed to fetch users:', err)
      }
    }

    fetchUsers()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setTitleProject('')
      const now = new Date()
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
      setRequestDate(now.toISOString().slice(0, 16))
      setRequestorId(authUser?.id ?? '')
      setStartDate('')
      setEndDate('')
      setPriority('Low')
      setDescription('')
      setIsSubmitting(false)
      setErrorMessage('')
      setRequestorSearch('')
      setRequestorOpen(false)
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
  }, [isOpen, onClose, authUser?.id])

  const handleSubmit = async () => {
    setErrorMessage('')

    if (!titleProject.trim()) {
      setErrorMessage('Silakan isi Project Name.')
      return
    }
    if (!requestorId) {
      setErrorMessage('Silakan pilih Requestor.')
      return
    }
    if (!startDate || !endDate) {
      setErrorMessage('Silakan isi Start Plan dan End Planned.')
      return
    }

    setIsSubmitting(true)

    try {
      const formatDateTime = (dt) => (dt ? dt.replace('T', ' ') + (dt.length === 16 ? ':00' : '') : '')
      const requestor = users.find((u) => String(u.id) === String(requestorId))
      const requestorName = requestor?.name || requestorSearch || ''

      const payload = {
        project_name: titleProject.trim(),
        requestor_id: requestorId,
        requestor_name: requestorName,
        request_date: formatDateTime(requestDate),
        start_date: formatDateTime(startDate),
        end_date: formatDateTime(endDate),
        priority: priority.toLowerCase(),
        notes: description.trim(),
        description: description.trim(),
        status: 'waiting',
        progress_percent: 0,
      }

      const response = await api.post('/project', payload)

      onCreated?.(response)
      onClose?.()
    } catch (err) {
      console.error('Failed to create project:', err)
      setErrorMessage(
        err?.data?.message || err?.response?.data?.message || err?.message || 'Gagal membuat project. Silakan coba lagi.',
      )
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
        className="dashboard-popup register-user-popup mtickets-create-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-create-ticket-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">{eyebrow}</p>
            <h2 className="dashboard-popup__title" id="dialog-create-ticket-title">
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
          <div className="register-user-popup__form">
            <div
              className="register-user-popup__grid"
              style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
            >
              {/* Row 1 */}
              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="project-title">
                  Project Name
                </label>
                <input
                  id="project-title"
                  type="text"
                  className="register-user-popup__input"
                  placeholder="Masukkan nama project"
                  value={titleProject}
                  onChange={(e) => setTitleProject(e.target.value)}
                />
              </div>

              <div className="register-user-popup__field" style={{ position: 'relative' }}>
                <label className="register-user-popup__label" htmlFor="project-requestor-search">
                  Requestor
                </label>
                <input
                  id="project-requestor-search"
                  type="text"
                  className="register-user-popup__input"
                  placeholder="Cari requestor..."
                  value={requestorSearch}
                  autoComplete="off"
                  onFocus={() => setRequestorOpen(true)}
                  onBlur={() => setTimeout(() => setRequestorOpen(false), 150)}
                  onChange={(e) => {
                    setRequestorSearch(e.target.value)
                    setRequestorId('')
                    setRequestorOpen(true)
                  }}
                />
                {requestorOpen && (
                  <ul
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 9999,
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      margin: '2px 0 0',
                      padding: 0,
                      listStyle: 'none',
                    }}
                  >
                    {users
                      .filter((u) =>
                        u.name.toLowerCase().includes(requestorSearch.toLowerCase()),
                      )
                      .map((u) => (
                        <li
                          key={u.id}
                          onMouseDown={() => {
                            setRequestorId(u.id)
                            setRequestorSearch(u.name)
                            setRequestorOpen(false)
                          }}
                          style={{
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            color: '#111827',
                            background: u.id === requestorId ? '#f3f4f6' : 'transparent',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              u.id === requestorId ? '#f3f4f6' : 'transparent')
                          }
                        >
                          {u.name}
                        </li>
                      ))}
                    {users.filter((u) =>
                      u.name.toLowerCase().includes(requestorSearch.toLowerCase()),
                    ).length === 0 && (
                      <li
                        style={{
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.85rem',
                          color: '#9ca3af',
                        }}
                      >
                        Tidak ada hasil
                      </li>
                    )}
                  </ul>
                )}
              </div>

              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="project-priority">
                  Priority
                </label>
                <select
                  id="project-priority"
                  className="register-user-popup__select register-user-popup__select--arrow-offset"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {/* Row 2 */}
              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="project-request-date">
                  Request Date
                </label>
                <input
                  id="project-request-date"
                  type="datetime-local"
                  className="register-user-popup__input"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                />
              </div>

              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="project-start-date">
                  Start Plan
                </label>
                <input
                  id="project-start-date"
                  type="datetime-local"
                  className="register-user-popup__input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="register-user-popup__field">
                <label className="register-user-popup__label" htmlFor="project-end-date">
                  End Planned
                </label>
                <input
                  id="project-end-date"
                  type="datetime-local"
                  className="register-user-popup__input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {/* Row 3 — full width */}
              <div
                className="register-user-popup__field"
                style={{ gridColumn: '1 / -1' }}
              >
                <label className="register-user-popup__label" htmlFor="project-description">
                  Description
                </label>
                <textarea
                  id="project-description"
                  className="register-user-popup__input master-project-popup__textarea"
                  placeholder="Jelaskan deskripsi project"
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
            {isSubmitting ? 'Membuat...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialogNode, document.body)
}

export default DialogCreateProjects