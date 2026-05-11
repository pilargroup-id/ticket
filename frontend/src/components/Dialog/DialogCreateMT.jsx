import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

import api from '../../services/api.js'
import { getStoredUser } from '../../services/auth.js'
import { FileText01, XClose } from '../template/TemplateIcons.jsx'

function DialogCreateTicket({
  isOpen = false,
  eyebrow = 'Create Ticket',
  title = 'Create Tickets',
  onClose,
  onCreated,
}) {
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [problem, setProblem] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [isDragActive, setIsDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const authUser = getStoredUser()
  const namaPembuat = authUser?.name ?? ''

  // Fetch categories when dialog opens
  useEffect(() => {
    if (!isOpen) {
      return
    }

    let cancelled = false

    async function fetchCategories() {
      try {
        const response = await api.get('/user/category')
        if (!cancelled) {
          setCategories(response?.data ?? [])
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
        if (!cancelled) {
          setCategories([])
        }
      }
    }

    fetchCategories()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  // Reset form & handle Escape key
  useEffect(() => {
    if (!isOpen) {
      setCategoryId('')
      setProblem('')
      setSelectedFile(null)
      setSelectedFileName('')
      setIsDragActive(false)
      setIsSubmitting(false)
      setErrorMessage('')
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

  const handleFileSelect = useCallback((file) => {
    if (file) {
      setSelectedFile(file)
      setSelectedFileName(file.name)
    }
  }, [])

  const handleFileChange = (event) => {
    handleFileSelect(event.target.files?.[0])
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragActive(false)
    handleFileSelect(event.dataTransfer.files?.[0])
  }

  const handleSubmit = async () => {
    setErrorMessage('')

    if (!categoryId) {
      setErrorMessage('Silakan pilih category terlebih dahulu.')
      return
    }

    if (!problem.trim()) {
      setErrorMessage('Silakan isi deskripsi masalah.')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('category_id', categoryId)
      formData.append('problem', problem.trim())

      if (namaPembuat) {
        formData.append('nama_pembuat', namaPembuat)
      }

      if (selectedFile) {
        formData.append('image', selectedFile)
      }

      const response = await api.post('/user/ticket', formData)

      onCreated?.(response)
      onClose?.()
    } catch (err) {
      console.error('Failed to create ticket:', err)
      setErrorMessage(
        err?.data?.message || err?.message || 'Gagal membuat ticket. Silakan coba lagi.',
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
          <div className="register-user-popup__layout">
            <div className="register-user-popup__main">
              <div className="register-user-popup__form">
                <div className="register-user-popup__grid">
                  <div className="register-user-popup__field">
                    <label className="register-user-popup__label" htmlFor="ticket-category">
                      Category
                    </label>
                    <select
                      id="ticket-category"
                      className="register-user-popup__select register-user-popup__select--arrow-offset"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="" disabled>
                        Pilih category
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="register-user-popup__field">
                    <label className="register-user-popup__label" htmlFor="ticket-nama-pembuat">
                      Nama Pembuat
                    </label>
                    <input
                      id="ticket-nama-pembuat"
                      type="text"
                      className="register-user-popup__input"
                      value={namaPembuat}
                      readOnly
                      disabled
                    />
                  </div>

                  <div className="register-user-popup__field register-user-popup__field--full">
                    <label className="register-user-popup__label" htmlFor="ticket-issue">
                      Masalah
                    </label>
                    <textarea
                      id="ticket-issue"
                      className="register-user-popup__input master-project-popup__textarea"
                      placeholder="Jelaskan permasalahan atau kebutuhan yang ingin diajukan."
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <aside className="register-user-popup__section mtickets-create-popup__upload-panel">
              <div className="register-user-popup__section-header">
                <p className="register-user-popup__label">Upload File</p>
                <p className="register-user-popup__hint">
                  Letakkan dokumen pendukung di area ini agar popup tetap ringkas.
                </p>
              </div>

              <label
                htmlFor="ticket-attachment"
                className={`register-user-popup__upload mtickets-create-popup__upload${
                  isDragActive ? ' is-drag-active' : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  id="ticket-attachment"
                  type="file"
                  className="register-user-popup__upload-input"
                  onChange={handleFileChange}
                />
                <span className="register-user-popup__upload-icon">
                  <FileText01 size={20} />
                </span>
                <span className="register-user-popup__upload-title">Drag and drop file di sini</span>
                <span className="register-user-popup__upload-meta">
                  atau klik untuk memilih file dari perangkat Anda
                </span>
                <span className="register-user-popup__upload-file">
                  {selectedFileName || 'Belum ada file yang dipilih'}
                </span>
              </label>
            </aside>
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
            {isSubmitting ? 'Membuat...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialogNode, document.body)
}

export default DialogCreateTicket
