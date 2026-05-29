import type { ReactNode } from 'react'

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
    <div className="ex-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`ex-tab${active === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count != null && (
            <span className="ex-count gray">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
