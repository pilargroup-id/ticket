import { useRef, useState } from 'react'

import { Calendar01 } from '../template/TemplateIcons.jsx'

// Nilai yang diterima/dikirim tetap format datetime-local: "YYYY-MM-DDTHH:mm".
// Tampilan ke user: "YYYY-MM-DD HH:mm" (tahun-bulan-hari jam), tahun maksimal 4 digit.
const MIN_VALUE = '1000-01-01T00:00'
const MAX_VALUE = '9999-12-31T23:59'
const PLACEHOLDER = 'YYYY-MM-DD HH:mm'

const toDisplay = (value) => (value ? String(value).slice(0, 16).replace('T', ' ') : '')

const maskInput = (raw) => {
  const digits = String(raw).replace(/\D/g, '').slice(0, 12)
  let out = digits.slice(0, 4)
  if (digits.length > 4) out += `-${digits.slice(4, 6)}`
  if (digits.length > 6) out += `-${digits.slice(6, 8)}`
  if (digits.length > 8) out += ` ${digits.slice(8, 10)}`
  if (digits.length > 10) out += `:${digits.slice(10, 12)}`
  return out
}

const parseDisplay = (text) => {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(text)
  if (!match) return null

  const [, y, mo, d, h, mi] = match
  const year = Number(y)
  const month = Number(mo)
  const day = Number(d)
  const hour = Number(h)
  const minute = Number(mi)

  if (year < 1000 || month < 1 || month > 12 || hour > 23 || minute > 59) return null

  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) return null

  return `${y}-${mo}-${d}T${h}:${mi}`
}

const isValidNativeValue = (value) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(String(value || ''))

function InputDateTime({ id, name, value = '', onChange, className = 'register-user-popup__input', style, disabled = false }) {
  const pickerRef = useRef(null)
  const [draft, setDraft] = useState(null)

  const emit = (nextValue) => {
    onChange?.({ target: { name, value: nextValue } })
  }

  const handleTextChange = (event) => {
    const masked = maskInput(event.target.value)

    if (masked === '') {
      setDraft(null)
      emit('')
      return
    }

    const parsed = parseDisplay(masked)
    if (parsed) {
      setDraft(null)
      emit(parsed)
      return
    }

    setDraft(masked)
  }

  const handleBlur = () => {
    // Input belum lengkap/tidak valid: kembalikan ke nilai terakhir yang valid.
    setDraft(null)
  }

  const handlePickerChange = (event) => {
    const nextValue = event.target.value
    if (!nextValue) {
      emit('')
      return
    }
    if (!isValidNativeValue(nextValue)) return
    setDraft(null)
    emit(nextValue.slice(0, 16))
  }

  const openPicker = () => {
    const picker = pickerRef.current
    if (!picker || disabled) return
    try {
      picker.showPicker()
    } catch {
      picker.focus()
      picker.click()
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={PLACEHOLDER}
        maxLength={PLACEHOLDER.length}
        className={className}
        value={draft ?? toDisplay(value)}
        onChange={handleTextChange}
        onBlur={handleBlur}
        disabled={disabled}
        style={{ width: '100%', boxSizing: 'border-box', paddingRight: '2.75rem', ...style }}
      />
      <input
        ref={pickerRef}
        type="datetime-local"
        tabIndex={-1}
        aria-hidden="true"
        min={MIN_VALUE}
        max={MAX_VALUE}
        value={isValidNativeValue(value) ? String(value).slice(0, 16) : ''}
        onChange={handlePickerChange}
        disabled={disabled}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '2.5rem',
          height: '100%',
          opacity: 0,
          pointerEvents: 'none',
          border: 0,
          padding: 0,
        }}
      />
      <button
        type="button"
        aria-label="Pilih tanggal dan jam"
        onClick={openPicker}
        disabled={disabled}
        style={{
          position: 'absolute',
          top: '50%',
          right: '0.6rem',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          padding: '0.25rem',
          border: 0,
          background: 'transparent',
          color: 'var(--primary-blue)',
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        <Calendar01 size={18} />
      </button>
    </div>
  )
}

export default InputDateTime
