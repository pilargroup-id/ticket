import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

import { getStoredUser } from '../../services/auth.js'
import api from '../../services/api.js'
import { FileText01, XClose } from '../template/TemplateIcons.jsx'

function SearchableDropdown({
  id,
  label,
  placeholder,
  value,
  search,
  setSearch,
  setValue,
  options,
  isOpen,
  setIsOpen,
}) {
  return (
    <div className="register-user-popup__field" style={{ position: 'relative' }}>
      <label className="register-user-popup__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        className="register-user-popup__input"
        placeholder={placeholder}
        value={search}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        onChange={(e) => {
          setSearch(e.target.value)
          setValue('')
          setIsOpen(true)
        }}
      />
      {isOpen && (
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
          {options
            .filter((opt) => opt.name.toLowerCase().includes(search.toLowerCase()))
            .map((opt) => (
              <li
                key={opt.id}
                onMouseDown={() => {
                  setValue(opt.id)
                  setSearch(opt.name)
                  setIsOpen(false)
                }}
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  color: '#111827',
                  background: opt.id === value ? '#f3f4f6' : 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = opt.id === value ? '#f3f4f6' : 'transparent')
                }
              >
                {opt.name}
              </li>
            ))}
          {options.filter((opt) => opt.name.toLowerCase().includes(search.toLowerCase()))
            .length === 0 && (
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
  )
}

function DialogCreateTicketAdmin({
  isOpen = false,
  eyebrow = 'Create Ticket',
  title = 'Create Tickets',
  onClose,
  onCreated,
}) {
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [users, setUsers] = useState([])
  const [userId, setUserId] = useState('')
  const [supports, setSupports] = useState([])
  const [supportId, setSupportId] = useState('')
  const [requestorSearch, setRequestorSearch] = useState('')
  const [requestorOpen, setRequestorOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [supportSearch, setSupportSearch] = useState('')
  const [supportOpen, setSupportOpen] = useState(false)
  const [priority, setPriority] = useState('')
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

    async function fetchData() {
      try {
        const [catRes, userRes, supportRes] = await Promise.all([
          api.get('/user/category'),
          api.get('/user'),
          api.get('/support'),
        ])
        if (!cancelled) {
          setCategories(catRes?.data ?? [])
          setUsers(userRes?.data ?? [])
          setSupports(supportRes?.data ?? [])
        }
      } catch (err) {
        console.error('Failed to fetch form data:', err)
        if (!cancelled) {
          setCategories([])
          setUsers([])
          setSupports([])
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  // Reset form & handle Escape key
  useEffect(() => {
    if (!isOpen) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setCategoryId('')
      setCategorySearch('')
      setCategoryOpen(false)
      setUserId('')
      setRequestorSearch('')
      setRequestorOpen(false)
      setSupportId('')
      setSupportSearch('')
      setSupportOpen(false)
      setPriority('')
      setProblem('')
      setSelectedFile(null)
      setSelectedFileName('')
      setIsDragActive(false)
      setIsSubmitting(false)
      setErrorMessage('')
      /* eslint-enable react-hooks/set-state-in-effect */
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

    if (!userId) {
      setErrorMessage('Silakan pilih requestor terlebih dahulu.')
      return
    }

    if (!categoryId) {
      setErrorMessage('Silakan pilih category terlebih dahulu.')
      return
    }

    if (!problem.trim()) {
      setErrorMessage('Silakan isi deskripsi masalah.')
      return
    }

    if (!supportId) {
      setErrorMessage('Silakan pilih support terlebih dahulu.')
      return
    }

    if (!priority) {
      setErrorMessage('Silakan pilih priority terlebih dahulu.')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('user_id', userId)
      formData.append('category_id', categoryId)
      formData.append('problem', problem.trim())
      formData.append('status', 'waiting') // default status
      formData.append('support_id', supportId)
      formData.append('priority', priority)

      if (namaPembuat) {
        formData.append('nama_pembuat', namaPembuat)
      }

      if (selectedFile) {
        formData.append('image', selectedFile)
      }

      const response = await api.post('/ticket/admin', formData)

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
                  <SearchableDropdown
                    id="ticket-requestor"
                    label="Requestor"
                    placeholder="Cari requestor..."
                    value={userId}
                    search={requestorSearch}
                    setSearch={setRequestorSearch}
                    setValue={setUserId}
                    options={users}
                    isOpen={requestorOpen}
                    setIsOpen={setRequestorOpen}
                  />

                  <SearchableDropdown
                    id="ticket-category"
                    label="Category"
                    placeholder="Cari category..."
                    value={categoryId}
                    search={categorySearch}
                    setSearch={setCategorySearch}
                    setValue={setCategoryId}
                    options={categories}
                    isOpen={categoryOpen}
                    setIsOpen={setCategoryOpen}
                  />

                  <SearchableDropdown
                    id="ticket-support"
                    label="Support"
                    placeholder="Cari support..."
                    value={supportId}
                    search={supportSearch}
                    setSearch={setSupportSearch}
                    setValue={setSupportId}
                    options={supports}
                    isOpen={supportOpen}
                    setIsOpen={setSupportOpen}
                  />

                  <div className="register-user-popup__field">
                    <label className="register-user-popup__label" htmlFor="ticket-priority">
                      Priority
                    </label>
                    <select
                      id="ticket-priority"
                      className="register-user-popup__select register-user-popup__select--arrow-offset"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="">
                        Pilih priority
                      </option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="register-user-popup__field register-user-popup__field--full">
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

export default DialogCreateTicketAdmin
