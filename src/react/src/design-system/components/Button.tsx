import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'secondary',
  size: _size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = variant === 'primary' ? 'primary'
    : variant === 'ghost' ? 'ghost'
    : variant === 'danger' ? 'danger'
    : 'secondary'

  return (
    <button
      className={`ex-btn ${variantClass}${className ? ` ${className}` : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size={16} />}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  )
}

export function IconButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`ex-icon-btn${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </button>
  )
}

// Spinner inline to avoid circular import
function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      style={{
        animation: 'spin 1.4s linear infinite',
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  )
}
