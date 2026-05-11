import { useId } from 'react'

import { RefreshCw05 } from '../template/TemplateIcons.jsx'

function DialogLoading({
  isOpen = true,
  eyebrow = 'Dashboard',
  pageName = '',
  title,
  loadingLabel,
  detail,
}) {
  const titleId = useId()

  if (!isOpen) {
    return null
  }

  const resolvedPageName = String(pageName || '').trim()
  const resolvedTitle = title || (resolvedPageName ? `Opening ${resolvedPageName}` : 'Opening Page')
  const resolvedLoadingLabel =
    loadingLabel || (resolvedPageName ? `Loading ${resolvedPageName}...` : 'Loading page...')
  const resolvedDetail =
    detail ||
    (resolvedPageName
      ? `Sedang membuka halaman ${resolvedPageName}. Mohon tunggu sebentar.`
      : 'Sedang membuka halaman. Mohon tunggu sebentar.')

  return (
    <div className="dashboard-popup-overlay" role="presentation">
      <div
        className="dashboard-popup"
        role="dialog"
        aria-modal="true"
        aria-busy="true"
        aria-labelledby={titleId}
      >
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">{eyebrow}</p>
            <h2 className="dashboard-popup__title" id={titleId}>
              {resolvedTitle}
            </h2>
          </div>
        </div>

        <div
          className="dashboard-popup__body"
          style={{ justifyItems: 'center', paddingTop: '1.5rem', paddingBottom: '1.75rem' }}
        >
          <RefreshCw05
            size={28}
            className="dashboard-popup__spinner"
            style={{ color: 'var(--accent-teal)' }}
          />
          <p className="dashboard-popup__text" style={{ margin: 0, fontWeight: 700 }}>
            {resolvedLoadingLabel}
          </p>
          <p
            className="dashboard-popup__text"
            style={{ margin: 0, maxWidth: '320px', textAlign: 'center' }}
          >
            {resolvedDetail}
          </p>
        </div>
      </div>
    </div>
  )
}

export default DialogLoading
