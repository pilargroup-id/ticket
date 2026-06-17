import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

import { FileText01, XClose } from '../template/TemplateIcons.jsx'

function SelectAllIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <path d="m14 16 2 2 4-4" />
    </svg>
  )
}

function DialogSelectedExport({
  isOpen = false,
  onClose,
  onConfirm,
  exporting = false,
  options = [],
  selectedValues = [],
  onToggleValue,
  onToggleAll,
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const allSelected = options.length > 0 && selectedValues.length === options.length
  const hasSelection = selectedValues.length > 0

  const selectedSummary = useMemo(() => {
    if (!hasSelection) {
      return 'Belum ada section yang dipilih.'
    }

    if (allSelected) {
      return 'Semua section report akan diexport.'
    }

    return `${selectedValues.length} section report dipilih untuk diexport.`
  }, [allSelected, hasSelection, selectedValues.length])

  if (!isOpen || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className="dashboard-popup-overlay" role="presentation" onClick={onClose}>
      <div
        className="dashboard-popup master-project-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-selected-export-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">Export Report</p>
            <h2 className="dashboard-popup__title" id="dialog-selected-export-title">
              Pilih Data Export
            </h2>
          </div>
          <button
            type="button"
            className="dashboard-popup__close"
            aria-label="Tutup dialog"
            onClick={onClose}
            disabled={exporting}
          >
            <XClose size={18} />
          </button>
        </div>

        <div className="dashboard-popup__body">
          <div className="register-user-popup__section">
            <div
              className="register-user-popup__section-header"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p className="register-user-popup__hint" style={{ margin: 0 }}>
                  Pilih satu atau beberapa section report yang ingin diunduh. Anda juga bisa
                  memilih semua section sekaligus.
                </p>
                <p className="register-user-popup__selection-summary">{selectedSummary}</p>
              </div>

              <button
                type="button"
                className="users-table__icon-button"
                onClick={onToggleAll}
                disabled={exporting}
                aria-label={allSelected ? 'Batalkan pilih semua' : 'Pilih semua'}
                title={allSelected ? 'Batalkan pilih semua' : 'Pilih semua'}
                style={{
                  color: allSelected ? 'var(--accent-teal)' : undefined,
                  background: allSelected ? 'rgba(42, 157, 143, 0.08)' : undefined,
                  borderColor: allSelected ? 'rgba(42, 157, 143, 0.28)' : undefined,
                  flexShrink: 0,
                }}
              >
                <SelectAllIcon size={18} />
              </button>
            </div>

            <div className="register-user-popup__apps-list" style={{ gridTemplateColumns: '1fr' }}>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value)

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`register-user-popup__apps-item${isSelected ? ' is-selected' : ''}`}
                    onClick={() => onToggleValue?.(option.value)}
                    disabled={exporting}
                  >
                    <input
                      type="checkbox"
                      className="register-user-popup__apps-checkbox"
                      checked={isSelected}
                      onChange={() => onToggleValue?.(option.value)}
                      onClick={(event) => event.stopPropagation()}
                      disabled={exporting}
                    />
                    <div className="register-user-popup__apps-copy">
                      <span>{option.label}</span>
                      <small>{option.description}</small>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="dashboard-popup__actions">
          <button
            type="button"
            className="dashboard-popup__button dashboard-popup__button--secondary"
            onClick={onClose}
            disabled={exporting}
          >
            Batal
          </button>
          <button
            type="button"
            className="dashboard-popup__button dashboard-popup__button--primary"
            onClick={onConfirm}
            disabled={!hasSelection || exporting}
          >
            <FileText01 size={16} aria-hidden="true" />
            <span>{exporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default DialogSelectedExport
