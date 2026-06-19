import type { ReactNode } from 'react'
import MuiTabs from '@mui/material/Tabs'
import MuiTab from '@mui/material/Tab'

interface Tab {
  id: string
  label: ReactNode
  count?: number
}

interface TabGroupProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

export function TabGroup({ tabs, active, onChange }: TabGroupProps) {
  return (
    <MuiTabs
      value={active}
      onChange={(_e, newValue: string) => onChange(newValue)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ minHeight: 36, borderBottom: '1px solid var(--border-secondary)' }}
    >
      {tabs.map(tab => (
        <MuiTab
          key={tab.id}
          value={tab.id}
          label={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {tab.label}
              {tab.count != null && (
                <span style={{
                  background: 'var(--neutral-100)',
                  color: 'var(--fg-tertiary)',
                  borderRadius: 9999,
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  padding: '1px 6px',
                  minWidth: 18,
                  textAlign: 'center',
                }}>
                  {tab.count}
                </span>
              )}
            </span>
          }
        />
      ))}
    </MuiTabs>
  )
}
