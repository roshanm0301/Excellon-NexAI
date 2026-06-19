import MuiCircularProgress from '@mui/material/CircularProgress'
import MuiSkeleton from '@mui/material/Skeleton'

interface SpinnerProps {
  size?: number
  color?: string
  className?: string
}

export function Spinner({ size = 24, color = 'var(--brand-500)', className }: SpinnerProps) {
  return (
    <MuiCircularProgress
      size={size}
      className={className}
      sx={{ color: color }}
    />
  )
}

export function Skeleton({
  width,
  height = 16,
  borderRadius = 4,
}: {
  width?: string | number
  height?: number
  borderRadius?: number
}) {
  return (
    <MuiSkeleton
      variant="rectangular"
      width={width ?? '100%'}
      height={height}
      sx={{ borderRadius: `${borderRadius}px`, bgcolor: 'var(--neutral-100)' }}
    />
  )
}
