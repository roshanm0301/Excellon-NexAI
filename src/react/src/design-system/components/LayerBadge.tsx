export type Layer = 'platform' | 'vertical' | 'tenant' | 'node' | 'role'

const LAYER_COLORS: Record<Layer, string> = {
  platform: 'var(--layer-platform)',
  vertical: 'var(--layer-vertical)',
  tenant:   'var(--layer-tenant)',
  node:     'var(--layer-node)',
  role:     'var(--layer-role)',
}

interface LayerBadgeProps {
  layer: Layer
  size?: 'sm' | 'md'
}

export function LayerBadge({ layer, size = 'sm' }: LayerBadgeProps) {
  const color = LAYER_COLORS[layer]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'sm' ? '1px 7px' : '2px 9px',
      borderRadius: 9999,
      fontSize: size === 'sm' ? 11 : 12,
      fontWeight: 600,
      letterSpacing: '0.03em',
      background: color + '18',
      color,
      border: `1px solid ${color}40`,
      lineHeight: 1.5,
      textTransform: 'capitalize',
    }}>
      {layer}
    </span>
  )
}
