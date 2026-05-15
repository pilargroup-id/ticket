import { useState, useRef, useEffect } from 'react'
import { Calendar01, ChevronDown } from '../template/TemplateIcons.jsx'

const PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Last Year', value: 'last_year' },
]

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getRange(preset) {
  const now = new Date()
  let start, end

  switch (preset) {
    case 'today':
      start = new Date(now)
      end = new Date(now)
      break
    case 'yesterday':
      start = new Date(now)
      start.setDate(now.getDate() - 1)
      end = new Date(start)
      break
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      break
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0)
      break
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date(now.getFullYear(), 11, 31)
      break
    case 'last_year':
      start = new Date(now.getFullYear() - 1, 0, 1)
      end = new Date(now.getFullYear() - 1, 11, 31)
      break
    default:
      return { startDate: '', endDate: '' }
  }

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  }
}

export default function ButtonFilterPreset({ onChange, label = 'Periode', initialPreset = 'this_month' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(initialPreset)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (preset) => {
    setSelected(preset)
    setIsOpen(false)
    onChange?.(getRange(preset))
  }

  return (
    <div className="range-date-button" style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        className={`range-date-button__trigger${isOpen ? ' range-date-button__trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%' }}
      >
        <Calendar01 size={18} aria-hidden="true" />
        <span className="range-date-button__copy">
          <span className="range-date-button__label">{label}</span>
          <span className="range-date-button__value">
            {PRESETS.find((p) => p.value === selected)?.label || 'Pilih'}
          </span>
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`range-date-button__chevron${isOpen ? ' range-date-button__chevron--open' : ''}`}
        />
      </button>

      {isOpen && (
        <div 
          className="dropdown-menu-custom" 
          style={{ 
            position: 'absolute', 
            top: '100%', 
            right: 0, 
            zIndex: 1000, 
            backgroundColor: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: '12px', 
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            marginTop: '8px',
            minWidth: '180px',
            padding: '6px',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className="dropdown-item-custom"
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 14px',
                textAlign: 'left',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: selected === preset.value ? '#f1f5f9' : 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: selected === preset.value ? '700' : '500',
                color: selected === preset.value ? '#1e293b' : '#64748b',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleSelect(preset.value)}
              onMouseEnter={(e) => { if (selected !== preset.value) e.target.style.backgroundColor = '#f8fafc'; e.target.style.color = '#1e293b' }}
              onMouseLeave={(e) => { if (selected !== preset.value) e.target.style.backgroundColor = 'transparent'; e.target.style.color = selected === preset.value ? '#1e293b' : '#64748b' }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
