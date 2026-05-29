import { Modal, Input, Toggle, NumberInput, Button } from '../../../design-system'

export interface IDConfig {
  strategy: 'uuid_v4' | 'uuid_v7'
  displayId?: {
    enabled: boolean
    prefix: string
    separator: string
    seed: number
    padding: number
  }
}

interface IDConfigPanelProps {
  open: boolean
  onClose: () => void
  value: IDConfig
  onChange: (v: IDConfig) => void
}

function buildPreview(cfg: IDConfig['displayId']): string {
  if (!cfg?.enabled) return ''
  const num = cfg.seed > 0 ? cfg.seed : 1
  const padded = String(num).padStart(cfg.padding || 6, '0')
  return `${cfg.prefix || 'ID'}${cfg.separator || '-'}${padded}`
}

export function IDConfigPanel({ open, onClose, value, onChange }: IDConfigPanelProps) {
  const displayId = value.displayId ?? { enabled: false, prefix: '', separator: '-', seed: 1, padding: 6 }

  const setDisplayId = (patch: Partial<typeof displayId>) => {
    onChange({ ...value, displayId: { ...displayId, ...patch } })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ID Configuration"
      size="md"
      footer={
        <Button variant="primary" onClick={onClose}>Done</Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Strategy */}
        <fieldset style={{ border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
          <legend style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-secondary)', padding: '0 8px' }}>ID Strategy</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(['uuid_v4', 'uuid_v7'] as const).map(strategy => (
              <label key={strategy} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="id-strategy"
                  value={strategy}
                  checked={value.strategy === strategy}
                  onChange={() => onChange({ ...value, strategy })}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--fg-primary)' }}>
                    {strategy === 'uuid_v4' ? 'UUID v4 (random)' : 'UUID v7 (time-ordered, better for indexes)'}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                    {strategy === 'uuid_v4'
                      ? 'Fully random UUID. Works for all entity types.'
                      : 'Monotonically increasing UUID. Recommended for high-insert-rate entities.'}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Display ID */}
        <fieldset style={{ border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
          <legend style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-secondary)', padding: '0 8px' }}>Display ID</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Toggle
              label="Enable display ID (human-readable sequence)"
              checked={displayId.enabled}
              onChange={enabled => setDisplayId({ enabled })}
            />
            {displayId.enabled && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input
                    label="Prefix"
                    value={displayId.prefix}
                    onChange={e => setDisplayId({ prefix: e.target.value })}
                    placeholder="e.g. ORD"
                  />
                  <Input
                    label="Separator"
                    value={displayId.separator}
                    onChange={e => setDisplayId({ separator: e.target.value })}
                    placeholder="e.g. -"
                  />
                  <NumberInput
                    label="Seed (start from)"
                    value={displayId.seed}
                    onChange={v => setDisplayId({ seed: typeof v === 'number' ? v : 1 })}
                    min={1}
                  />
                  <NumberInput
                    label="Padding digits"
                    value={displayId.padding}
                    onChange={v => setDisplayId({ padding: typeof v === 'number' ? Math.min(10, Math.max(2, v)) : 6 })}
                    min={2}
                    max={10}
                  />
                </div>
                <div style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '10px 14px',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--fg-secondary)',
                }}>
                  <span style={{ fontWeight: 500 }}>Preview: </span>
                  <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-600)' }}>
                    {buildPreview(displayId)}
                  </code>
                </div>
              </>
            )}
          </div>
        </fieldset>
      </div>
    </Modal>
  )
}
