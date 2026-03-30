import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, useRef, useEffect, useState } from 'react'

// ── Button ────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', loading, children, disabled, style, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    fontFamily: 'var(--font-display)', fontWeight: 600,
    borderRadius: 'var(--radius-sm)', transition: 'all 0.15s ease',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1,
    whiteSpace: 'nowrap', letterSpacing: '-0.01em',
  }
  const sizes: Record<string, React.CSSProperties> = {
    sm: { fontSize: '12px', padding: '6px 12px' },
    md: { fontSize: '13px', padding: '9px 18px' },
    lg: { fontSize: '14px', padding: '11px 24px' },
  }
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: 'var(--accent)', color: '#fff', boxShadow: '0 0 0 0 var(--accent)' },
    secondary: { background: 'var(--bg-elevated)', color: 'var(--text)', border: '1px solid var(--border)' },
    ghost:     { background: 'transparent', color: 'var(--text-2)', border: '1px solid transparent' },
    danger:    { background: 'rgba(248,113,113,0.1)', color: 'var(--status-rejected)', border: '1px solid rgba(248,113,113,0.25)' },
  }
  return (
    <button disabled={disabled || loading} style={{ ...base, ...sizes[size], ...variants[variant], ...style }} {...props}>
      {loading ? <Spinner size={14} /> : children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}
export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </label>
      )}
      <input
        style={{
          background: 'var(--bg-sunken)', border: `1px solid ${error ? 'var(--status-rejected)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: '14px',
          color: 'var(--text)', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', width: '100%', ...style,
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
        onBlur={e => { e.target.style.borderColor = error ? 'var(--status-rejected)' : 'var(--border)'; e.target.style.boxShadow = 'none' }}
        {...props}
      />
      {error && <span style={{ fontSize: '12px', color: 'var(--status-rejected)' }}>{error}</span>}
    </div>
  )
}

// ── Textarea ──────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}
export function Textarea({ label, error, style, ...props }: TextareaProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </label>
      )}
      <textarea
        style={{
          background: 'var(--bg-sunken)', border: `1px solid ${error ? 'var(--status-rejected)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: '14px',
          color: 'var(--text)', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
          width: '100%', resize: 'vertical', minHeight: '100px',
          fontFamily: 'var(--font-display)', lineHeight: 1.6, ...style,
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
        onBlur={e => { e.target.style.borderColor = error ? 'var(--status-rejected)' : 'var(--border)'; e.target.style.boxShadow = 'none' }}
        {...props}
      />
      {error && <span style={{ fontSize: '12px', color: 'var(--status-rejected)' }}>{error}</span>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}
export function Select({ label, options, style, ...props }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </label>
      )}
      <select
        style={{
          background: 'var(--bg-sunken)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: '14px',
          color: 'var(--text)', outline: 'none', width: '100%', cursor: 'pointer', ...style,
        }}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '24px',
      boxShadow: 'var(--shadow-sm)', ...style,
    }}>
      {children}
    </div>
  )
}

// ── StatusBadge ───────────────────────────────────────────────
const statusColors: Record<string, string> = {
  applied:   'var(--status-applied)',
  awaiting:  'var(--status-awaiting)',
  interview: 'var(--status-interview)',
  offer:     'var(--status-offer)',
  rejected:  'var(--status-rejected)',
}
export function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] || 'var(--text-3)'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em',
      textTransform: 'capitalize',
      color, background: color + '18',
      fontFamily: 'var(--font-mono)',
      border: `1px solid ${color}30`,
    }}>
      {status}
    </span>
  )
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.15" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, backdropFilter: 'blur(6px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '32px',
        width: '100%', maxWidth: '560px', maxHeight: '90vh',
        overflowY: 'auto', boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-3)', fontSize: '22px', lineHeight: 1, padding: '2px 6px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── ConfirmModal ──────────────────────────────────────────────
interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}
export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '28px 32px',
          width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          {title}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '24px' }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={variant} size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

// ── PromptModal ───────────────────────────────────────────────
interface PromptModalProps {
  title: string
  message?: string
  placeholder?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}
export function PromptModal({
  title,
  message,
  placeholder = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: PromptModalProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleConfirm = () => {
    if (!value.trim()) return
    onConfirm(value.trim())
  }

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '28px 32px',
          width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ marginBottom: message ? '6px' : '18px', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          {title}
        </div>
        {message && (
          <div style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px', lineHeight: 1.5 }}>
            {message}
          </div>
        )}
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleConfirm()
            if (e.key === 'Escape') onCancel()
          }}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '9px 12px', fontSize: '14px',
            background: 'var(--bg-sunken)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text)', outline: 'none',
            fontFamily: 'var(--font-display)', marginBottom: '20px',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
        />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant="primary" size="sm" onClick={handleConfirm} disabled={!value.trim()}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 32px', color: 'var(--text-3)' }}>
      <div style={{ fontSize: '36px', marginBottom: '16px', opacity: 0.5 }}>{icon}</div>
      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>{description}</div>
    </div>
  )
}