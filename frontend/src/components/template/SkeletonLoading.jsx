import React from 'react'

function SkeletonLoading({ pageType = '' }) {
  const isOverviewPage =
    pageType.toLowerCase().includes('overview') ||
    pageType === '/MyTickets' ||
    pageType === '/TicketsOverview'

  return (
    <div className="skeleton-loading" aria-hidden="true" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header Skeleton */}
      <div
        className="skeleton-header"
        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        <div className="skeleton" style={{ height: '14px', width: '100px', opacity: 0.6 }} />
        <div className="skeleton" style={{ height: '32px', width: '240px' }} />
        <div className="skeleton" style={{ height: '14px', width: '400px', opacity: 0.4 }} />
      </div>

      {/* Overview Cards Skeleton */}
      {isOverviewPage && (
        <div className="skeleton-cards-grid" style={{ marginTop: '24px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton skeleton-card"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
              }}
            />
          ))}
        </div>
      )}

      {/* Table/Content Skeleton */}
      <div
        className="skeleton-table"
        style={{
          marginTop: isOverviewPage ? '0' : '24px',
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(5px)',
        }}
      >
        <div className="skeleton-table-header skeleton" style={{ width: '200px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton skeleton-table-row" style={{ opacity: 1 - i * 0.1 }} />
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  )
}

export default SkeletonLoading
