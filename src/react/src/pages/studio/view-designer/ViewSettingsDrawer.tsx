/**
 * ViewSettingsDrawer — Slide-out panel for view-level configuration
 *
 * Provides tabs for:
 * - Data Sources
 * - Version History
 * - Import / Export
 * - Permissions (global)
 * - Validation
 * - Surface Config (Dashboard/Wizard)
 * - Plugins
 */

import React, { useState } from 'react'
import { X, Database, History, FileJson, Shield, ShieldCheck, LayoutDashboard, Puzzle } from 'lucide-react'
import { Button } from '../../../design-system'
import { DataSourceEditor } from './DataSourceEditor'
import { VersionHistoryPanel } from './VersionHistoryPanel'
import { ImportExportPanel } from './ImportExportPanel'
import { PermissionEditor } from './PermissionEditor'
import { ValidationRuleEditor } from './ValidationRuleEditor'
import { DashboardLayoutEditor } from './DashboardLayoutEditor'
import { WizardStepEditor } from './WizardStepEditor'
import { PluginManagerPanel } from './PluginManagerPanel'
import './PanelStyles.css'

export type DrawerTab = 'datasources' | 'versions' | 'import-export' | 'permissions' | 'validation' | 'surface' | 'plugins'

interface DrawerProps {
  viewId: string
  viewLabel: string
  surfaceType: string
  primaryEntity: string
  viewCode?: string
  onClose: () => void
  initialTab?: DrawerTab
}

const TABS: { value: DrawerTab; label: string; icon: React.ReactNode }[] = [
  { value: 'datasources', label: 'Data', icon: <Database size={14} /> },
  { value: 'versions', label: 'History', icon: <History size={14} /> },
  { value: 'import-export', label: 'I/O', icon: <FileJson size={14} /> },
  { value: 'permissions', label: 'Perms', icon: <Shield size={14} /> },
  { value: 'validation', label: 'Valid', icon: <ShieldCheck size={14} /> },
  { value: 'surface', label: 'Surface', icon: <LayoutDashboard size={14} /> },
  { value: 'plugins', label: 'Plugins', icon: <Puzzle size={14} /> },
]

export function ViewSettingsDrawer({
  viewId,
  viewLabel,
  surfaceType,
  primaryEntity,
  viewCode,
  onClose,
  initialTab = 'datasources',
}: DrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>(initialTab)

  const getSurfaceEditor = () => {
    if (surfaceType === 'dashboard') return <DashboardLayoutEditor />
    if (surfaceType === 'wizard') return <WizardStepEditor />
    return (
      <div style={{ padding: '0.75rem' }}>
        <p className="pp-empty-msg">
          No surface-specific configuration for "{surfaceType}".
          Dashboard and Wizard surfaces have additional settings.
        </p>
      </div>
    )
  }

  return (
    <div className="vsd-overlay" onClick={onClose}>
      <div className="vsd-drawer" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="vsd-drawer__header">
          <span className="vsd-drawer__title">View Settings</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {/* Tab bar */}
        <div className="vsd-drawer__tabs">
          {TABS.map(tab => (
            <button
              key={tab.value}
              className={`vsd-tab ${activeTab === tab.value ? 'vsd-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.value)}
              title={tab.label}
            >
              {tab.icon}
              <span className="vsd-tab__label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="vsd-drawer__content">
          {activeTab === 'datasources' && <DataSourceEditor />}
          {activeTab === 'versions' && <VersionHistoryPanel viewId={viewId} />}
          {activeTab === 'import-export' && (
            <ImportExportPanel
              viewLabel={viewLabel}
              surfaceType={surfaceType}
              primaryEntity={primaryEntity}
              viewCode={viewCode}
            />
          )}
          {activeTab === 'permissions' && <PermissionEditor />}
          {activeTab === 'validation' && <ValidationRuleEditor />}
          {activeTab === 'surface' && getSurfaceEditor()}
          {activeTab === 'plugins' && <PluginManagerPanel />}
        </div>
      </div>
    </div>
  )
}
