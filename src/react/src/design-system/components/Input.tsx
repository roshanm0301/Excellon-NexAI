import type { InputHTMLAttributes, ReactNode } from 'react'
import React from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  icon?: ReactNode
}

export function Input({ label, hint, error, icon, id, className, ...props }: InputProps) {
  const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`
  return (
    <div className="ex-field-row" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {label && (
        <label htmlFor={inputId} className="label" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--fg-secondary)' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--fg-tertiary)', display: 'flex', alignItems: 'center',
          }}>
            {icon}
          </span>
        )}
        <input
          id={inputId}
          style={{
            width: '100%',
            height: 40,
            padding: icon ? '0 12px 0 36px' : '0 12px',
            border: `1px solid ${error ? 'var(--border-error)' : 'var(--border-primary)'}`,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-primary)',
            color: 'var(--fg-primary)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          className={className}
          {...props}
        />
      </div>
      {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--error-600)' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>{hint}</span>}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search...', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="ex-search">
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" />
      </svg>
      <input value={value} onChange={onChange} placeholder={placeholder} {...props} />
    </div>
  )
}

export function Textarea({
  label, hint, error, id, ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string; error?: string }) {
  const textareaId = id ?? `textarea-${Math.random().toString(36).slice(2)}`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {label && <label htmlFor={textareaId} className="label">{label}</label>}
      <textarea
        id={textareaId}
        style={{
          width: '100%', minHeight: 80, padding: '8px 12px',
          border: `1px solid ${error ? 'var(--border-error)' : 'var(--border-primary)'}`,
          borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
          color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-sans)', resize: 'vertical', outline: 'none',
          boxSizing: 'border-box',
        }}
        {...props}
      />
      {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--error-600)' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>{hint}</span>}
    </div>
  )
}
