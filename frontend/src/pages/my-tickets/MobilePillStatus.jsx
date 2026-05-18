import React from 'react';

const STATUS_CARDS = [
  { title: 'All' },
  { title: 'Resolved' },
  { title: 'Waiting' },
  { title: 'In Progress' },
  { title: 'Feedback' },
  { title: 'Void' },
];

function getColorForStatus(status) {
  switch (status) {
    case 'Waiting': return '#f59e0b'; // Orange
    case 'In Progress': return '#3b82f6'; // Blue
    case 'Resolved': return '#10b981'; // Green
    case 'Feedback': return '#eab308'; // Yellow/Gold
    case 'Void': return '#ef4444'; // Red
    default: return '#64748b'; // Gray
  }
}

function getStatusStyle(status, isActive) {
  if (!isActive) {
    return {
      bgColor: '#ffffff',
      borderColor: '#e2e8f0',
      textColor: '#334155',
      badgeBg: '#f1f5f9',
      badgeTextColor: '#64748b',
      dotColor: getColorForStatus(status)
    };
  }

  // Active styles based on status
  switch (status) {
    case 'All':
      return {
        bgColor: '#f0fdfa', // soft teal
        borderColor: '#2a9d8f', // brand teal
        textColor: '#115e59', // dark teal
        badgeBg: '#ccfbf1',
        badgeTextColor: '#134e4a',
      };
    case 'Waiting':
      return {
        bgColor: '#fffbeb', // soft amber
        borderColor: '#f59e0b', // amber
        textColor: '#b45309', // dark amber
        badgeBg: '#fde68a',
        badgeTextColor: '#78350f',
        dotColor: '#f59e0b'
      };
    case 'In Progress':
      return {
        bgColor: '#eff6ff', // soft blue
        borderColor: '#3b82f6', // blue
        textColor: '#1d4ed8', // dark blue
        badgeBg: '#bfdbfe',
        badgeTextColor: '#1e3a8a',
        dotColor: '#3b82f6'
      };
    case 'Resolved':
      return {
        bgColor: '#ecfdf5', // soft green
        borderColor: '#10b981', // green
        textColor: '#047857', // dark green
        badgeBg: '#a7f3d0',
        badgeTextColor: '#064e3b',
        dotColor: '#10b981'
      };
    case 'Feedback':
      return {
        bgColor: '#fefce8', // soft yellow/gold
        borderColor: '#eab308', // yellow
        textColor: '#854d0e', // dark yellow
        badgeBg: '#fef08a',
        badgeTextColor: '#422006',
        dotColor: '#eab308'
      };
    case 'Void':
      return {
        bgColor: '#fef2f2', // soft red
        borderColor: '#ef4444', // red
        textColor: '#b91c1c', // dark red
        badgeBg: '#fecaca',
        badgeTextColor: '#7f1d1d',
        dotColor: '#ef4444'
      };
    default:
      return {
        bgColor: '#f8fafc',
        borderColor: '#94a3b8',
        textColor: '#334155',
        badgeBg: '#cbd5e1',
        badgeTextColor: '#1e293b',
        dotColor: '#64748b'
      };
  }
}

function getBoxShadowForStatus(status, isActive) {
  if (!isActive) return '0 1px 2px rgba(0,0,0,0.05)';
  switch (status) {
    case 'All': return '0 4px 10px rgba(42, 157, 143, 0.15)';
    case 'Waiting': return '0 4px 10px rgba(245, 158, 11, 0.15)';
    case 'In Progress': return '0 4px 10px rgba(59, 130, 246, 0.15)';
    case 'Resolved': return '0 4px 10px rgba(16, 185, 129, 0.15)';
    case 'Feedback': return '0 4px 10px rgba(234, 179, 8, 0.15)';
    case 'Void': return '0 4px 10px rgba(239, 68, 68, 0.15)';
    default: return '0 4px 10px rgba(100, 116, 139, 0.15)';
  }
}

function MobilePillStatus({ activeStatus = '', onStatusChange, statusCounts = {}, style = {} }) {
  const handleCardClick = (status) => {
    if (status === 'All') {
      onStatusChange?.('');
    } else {
      onStatusChange?.(activeStatus === status ? '' : status);
    }
  };

  // Calculate total for "All"
  const totalCount = Object.values(statusCounts).reduce((acc, curr) => acc + curr, 0);

  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      overflowX: 'auto',
      padding: '12px 16px 8px',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      WebkitOverflowScrolling: 'touch',
      ...style
    }}>
      {STATUS_CARDS.map((card) => {
        const isAll = card.title === 'All';
        const isActive = isAll ? activeStatus === '' : activeStatus === card.title;
        const styles = getStatusStyle(card.title, isActive);
        const count = isAll ? totalCount : (statusCounts[card.title] ?? 0);

        return (
          <div
            key={card.title}
            onClick={() => handleCardClick(card.title)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '24px',
              backgroundColor: styles.bgColor,
              border: `1px solid ${styles.borderColor}`,
              boxShadow: getBoxShadowForStatus(card.title, isActive),
              transform: isActive ? 'scale(1.02)' : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              color: styles.textColor,
              fontWeight: 500,
              fontSize: '13px',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {!isAll && (
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: styles.dotColor,
              }} />
            )}
            <span>{card.title}</span>
            <div style={{
              backgroundColor: styles.badgeBg,
              color: styles.badgeTextColor,
              borderRadius: '12px',
              padding: '2px 6px',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'all 0.2s ease-in-out',
            }}>
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MobilePillStatus;
