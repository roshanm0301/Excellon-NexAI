import { useState } from 'react'
import { Activity, Shield, FileText, FlaskConical } from 'lucide-react'
import { TabGroup } from '../../design-system'
import {
  RuleCoverageDashboard,
  WorkflowMonitoringDashboard,
  ExecutionLogsPanel,
  SimulationPanel,
} from '../../components/studio/Monitoring'

const TABS = [
  { id: 'coverage', label: 'Rule Coverage', icon: Shield },
  { id: 'health', label: 'Workflow Health', icon: Activity },
  { id: 'logs', label: 'Execution Logs', icon: FileText },
  { id: 'simulation', label: 'Simulation Lab', icon: FlaskConical },
]

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState('coverage')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--border-primary)',
        display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-primary)',
      }}>
        <Activity size={20} color="var(--brand-500)" />
        <h1 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fg-primary)' }}>
          Monitoring & Coverage
        </h1>
      </div>

      {/* Tab navigation */}
      <div style={{ padding: '0 24px', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-primary)' }}>
        <TabGroup
          tabs={TABS}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'coverage' && <RuleCoverageDashboard />}
        {activeTab === 'health' && <WorkflowMonitoringDashboard />}
        {activeTab === 'logs' && <ExecutionLogsPanel />}
        {activeTab === 'simulation' && <SimulationPanel />}
      </div>
    </div>
  )
}
