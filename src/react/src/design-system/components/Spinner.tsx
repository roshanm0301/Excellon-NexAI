interface SpinnerProps {
  size?: number
  color?: string
}

export function Spinner({ size = 24, color = 'var(--brand-500)' }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      style={{ animation: 'spin 1.4s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

export function Skeleton({ width, height = 16, borderRadius = 4 }: { width?: string | number; height?: number; borderRadius?: number }) {
  return (
    <div style={{
      width: width ?? '100%', height, borderRadius,
      background: 'var(--neutral-100)',
      animation: 'shimmer 1.4s linear infinite',
    }}>
      <style>{`@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  )
}
