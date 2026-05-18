import React from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ComputerIcon from '@mui/icons-material/Computer';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import { formatTicketDate, formatTicketTimeWIB } from '../../services/my-tickets/MyTickets.js';

function getCategoryStyles(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('software')) {
    if (cat.includes('rp')) return { icon: <ComputerIcon sx={{ color: '#3b82f6', fontSize: 26 }} />, bg: '#eff6ff' };
    return { icon: <CodeIcon sx={{ color: '#10b981', fontSize: 26 }} />, bg: '#ecfdf5' };
  }
  if (cat.includes('database')) return { icon: <StorageIcon sx={{ color: '#10b981', fontSize: 26 }} />, bg: '#ecfdf5' };
  return { icon: <ErrorOutlinedIcon sx={{ color: '#64748b', fontSize: 26 }} />, bg: '#f1f5f9' };
}

function getStatusColor(status) {
  switch (status) {
    case 'Waiting': return { bg: '#fffbeb', text: '#f59e0b', dot: '#f59e0b' };
    case 'In Progress': return { bg: '#eff6ff', text: '#3b82f6', dot: '#3b82f6' };
    case 'Resolved': return { bg: '#ecfdf5', text: '#10b981', dot: '#10b981' };
    case 'Feedback': return { bg: '#fefce8', text: '#eab308', dot: '#eab308' };
    case 'Void': return { bg: '#fef2f2', text: '#ef4444', dot: '#ef4444' };
    default: return { bg: '#f1f5f9', text: '#64748b', dot: '#64748b' };
  }
}

function MobileCardMT({ ticket, onEdit, onFeedback }) {
  if (!ticket) return null;

  const catStyles = getCategoryStyles(ticket.category);
  const statusColors = getStatusColor(ticket.status);
  
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      position: 'relative',
      border: '1px solid #f1f5f9'
    }}>
      {/* Top Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Category Icon */}
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: catStyles.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {catStyles.icon}
          </div>
          {/* Ticket ID & Category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{ticket.ticketCode || '-'}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{ticket.category || '-'}</div>
          </div>
        </div>
        {/* Status Pill */}
        <div style={{
          backgroundColor: statusColors.bg,
          color: statusColors.text,
          padding: '6px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColors.dot }} />
          {ticket.status || '-'}
        </div>
      </div>

      {/* Middle Section - Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>
          {ticket.problem || 'No Description'}
        </div>
        <ChevronRightIcon sx={{ color: '#94a3b8' }} />
      </div>

      {/* Users Section */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Requester */}
        <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <PersonOutlinedIcon sx={{ color: '#94a3b8', fontSize: 18, marginTop: '2px' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Requester</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              {ticket.requestor || ticket.nama_pembuat || '-'}
            </span>
          </div>
        </div>
        {/* Divider */}
        <div style={{ width: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />
        {/* Support */}
        <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'flex-start', paddingLeft: '8px' }}>
          <SupportAgentIcon sx={{ color: '#94a3b8', fontSize: 18, marginTop: '2px' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Support</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              {ticket.supportName || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: '#f1f5f9' }} />

      {/* Bottom Section - Date & Time & Action Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#64748b',
        fontSize: '12px',
        fontWeight: 500
      }}>
        {/* Left side: Date & Time */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CalendarTodayIcon sx={{ fontSize: 14 }} />
            <span>{formatTicketDate(ticket.requestDateValue)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AccessTimeIcon sx={{ fontSize: 14 }} />
            <span>{formatTicketTimeWIB(ticket.requestDateValue)}</span>
          </div>
        </div>

        {/* Right side: Action Button (Edit / Feedback) */}
        {ticket.status === 'Resolved' ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFeedback?.(ticket);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#fef3c7', // light yellow
              color: '#d97706', // dark yellow/amber
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#fde68a';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#fef3c7';
            }}
          >
            <RateReviewOutlinedIcon sx={{ fontSize: 14 }} />
            <span>Feedback</span>
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(ticket);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f1f5f9', // light gray
              color: '#475569', // slate
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
            }}
          >
            <EditOutlinedIcon sx={{ fontSize: 14 }} />
            <span>Edit</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default MobileCardMT;
