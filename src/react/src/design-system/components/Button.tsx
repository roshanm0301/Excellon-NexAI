import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import MuiButton from '@mui/material/Button'
import MuiIconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline-brand' | 'brand-link'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  children?: ReactNode
}

const MUI_VARIANT: Record<ButtonVariant, { variant: 'contained' | 'outlined' | 'text'; color: 'primary' | 'error' | 'inherit' }> = {
  primary:         { variant: 'contained', color: 'primary' },
  secondary:       { variant: 'outlined',  color: 'primary' },
  ghost:           { variant: 'text',      color: 'primary' },
  danger:          { variant: 'contained', color: 'error'   },
  'outline-brand': { variant: 'outlined',  color: 'primary' },
  'brand-link':    { variant: 'text',      color: 'primary' },
}

const MUI_SIZE: Record<ButtonSize, 'small' | 'medium' | 'large'> = {
  sm: 'small', md: 'medium', lg: 'large',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, iconPosition = 'left', loading = false, children, disabled, onClick, type, style, className },
  ref
) {
  const { variant: muiVariant, color } = MUI_VARIANT[variant]
  const muiSize = MUI_SIZE[size]

  const startIcon = !loading && icon && iconPosition === 'left' ? icon : undefined
  const endIcon   = !loading && icon && iconPosition === 'right' ? icon : undefined

  return (
    <MuiButton
      ref={ref}
      variant={muiVariant}
      color={color}
      size={muiSize}
      disabled={disabled || loading}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      type={type as 'button' | 'submit' | 'reset' | undefined}
      startIcon={loading ? <CircularProgress size={14} color="inherit" /> : startIcon}
      endIcon={endIcon}
      style={style}
      className={className}
      sx={variant === 'brand-link' ? { color: 'var(--fg-brand)', '&:hover': { color: 'var(--fg-brand-strong)' } } : undefined}
    >
      {children}
    </MuiButton>
  )
})

export function IconButton({
  children,
  className,
  disabled,
  onClick,
  type,
  title,
  style,
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <MuiIconButton
      size="small"
      disabled={disabled}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      type={type as 'button' | 'submit' | 'reset' | undefined}
      title={title}
      style={style}
      className={className}
      sx={{ color: 'var(--fg-secondary)', '&:hover': { color: 'var(--fg-primary)', bgcolor: 'var(--bg-tertiary)' } }}
    >
      {children}
    </MuiIconButton>
  )
}
