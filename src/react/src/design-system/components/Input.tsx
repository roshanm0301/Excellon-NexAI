import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  /** Leading icon rendered inside the input wrapper */
  icon?: ReactNode
  /** Optional prefix text (e.g. "+91", "₹") */
  prefix?: string
  /** Optional trailing text (e.g. "incl. GST") */
  suffix?: string
}

let _idCounter = 0
function genId() { return `ex-input-${++_idCounter}` }

export function Input({ label, hint, error, icon, prefix, suffix, id, className, disabled, ...props }: InputProps) {
  const inputId = id ?? genId()
  const wrapperClass = [
    'ex-input',
    error ? 'error' : '',
    disabled ? 'disabled' : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <div className="ex-field">
      {label && (
        <label htmlFor={inputId} className="ex-field-label">
          {label}
        </label>
      )}
      <div className={wrapperClass}>
        {icon && <span className="lead">{icon}</span>}
        {prefix && <span className="pfx">{prefix}</span>}
        <input id={inputId} disabled={disabled} {...props} />
        {suffix && <span className="trl">{suffix}</span>}
      </div>
      {error && <span className="ex-field-error">{error}</span>}
      {hint && !error && <span className="ex-field-hint">{hint}</span>}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search...', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="ex-search">
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx={11} cy={11} r={8} />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input value={value} onChange={onChange} placeholder={placeholder} {...props} />
    </div>
  )
}

export function Textarea({
  label, hint, error, id, disabled, ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string; error?: string }) {
  const textareaId = id ?? genId()
  const cls = ['ex-textarea', error ? 'error' : ''].filter(Boolean).join(' ')
  return (
    <div className="ex-field">
      {label && <label htmlFor={textareaId} className="ex-field-label">{label}</label>}
      <textarea id={textareaId} className={cls} disabled={disabled} {...props} />
      {error && <span className="ex-field-error">{error}</span>}
      {hint && !error && <span className="ex-field-hint">{hint}</span>}
    </div>
  )
}
