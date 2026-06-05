import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import type { WorkflowStep } from '../../../../types/workflowBuilder'
import { getTaskConfig } from '../toolbox/taskTypeRegistry'
import { TaskIcon } from '../nodes/TaskIcon'
import { Input, Textarea } from '../../../../design-system'
import { DocumentSettings } from './settings/DocumentSettings'
import { GenericSettings } from './settings/GenericSettings'
import { HttpSettings } from './settings/HttpSettings'
import { QuerySettings } from './settings/QuerySettings'
import { ResponseSettings } from './settings/ResponseSettings'
import { RequestSettings } from './settings/RequestSettings'
import { ConditionSettings } from './settings/ConditionSettings'
import { SwitchSettings } from './settings/SwitchSettings'
import { LoopSettings } from './settings/LoopSettings'
import { IteratorSettings } from './settings/IteratorSettings'
import { TimerSettings } from './settings/TimerSettings'
import { ApprovalSettings } from './settings/ApprovalSettings'
import { EmailSettings } from './settings/EmailSettings'
import { RuleSettings } from './settings/RuleSettings'
import { ResolverSettings } from './settings/ResolverSettings'
import { ValidatorSettings } from './settings/ValidatorSettings'
import { FilterSettings } from './settings/FilterSettings'
import { CacheSettings } from './settings/CacheSettings'
import { VariableSettings } from './settings/VariableSettings'
import { AiSettings } from './settings/AiSettings'
import { SecuritySettings } from './settings/SecuritySettings'
import { DateSettings } from './settings/DateSettings'
import { UuidSettings } from './settings/UuidSettings'
import { MathSettings } from './settings/MathSettings'
import { StringSettings } from './settings/StringSettings'
import { ArraySettings } from './settings/ArraySettings'
import { ObjectSettings } from './settings/ObjectSettings'
import { JsonSettings } from './settings/JsonSettings'
import { WebhookSettings } from './settings/WebhookSettings'
import { QueueSettings } from './settings/QueueSettings'
import { SmsSettings } from './settings/SmsSettings'
import { NotificationSettings } from './settings/NotificationSettings'
import { ActionSettings } from './settings/ActionSettings'
import { WorkflowSettings } from './settings/WorkflowSettings'
import { ExportSettings } from './settings/ExportSettings'
import { TemplateSettings } from './settings/TemplateSettings'
import { StateSettings } from './settings/StateSettings'
import { SequenceSettings } from './settings/SequenceSettings'
import { TransactionSettings } from './settings/TransactionSettings'
import { ParallelSettings } from './settings/ParallelSettings'
import { GeometrySettings } from './settings/GeometrySettings'
import { CryptoSettings } from './settings/CryptoSettings'
import { RsaSettings } from './settings/RsaSettings'
import { KeycloakSettings } from './settings/KeycloakSettings'
import { ProviderSettings } from './settings/ProviderSettings'
import { MinIOSettings } from './settings/MinIOSettings'
import { AzureSettings } from './settings/AzureSettings'
import { EsQuerySettings } from './settings/EsQuerySettings'
import { SubscriptionSettings } from './settings/SubscriptionSettings'
import { UIComponentSettings } from './settings/UIComponentSettings'
import { RepositorySettings } from './settings/RepositorySettings'
import { HistorySettings } from './settings/HistorySettings'
import { VersionSettings } from './settings/VersionSettings'
import { IdentifierSettings } from './settings/IdentifierSettings'
import { SchemaSettings } from './settings/SchemaSettings'
import { OrmSettings } from './settings/OrmSettings'
import { TrinoSettings } from './settings/TrinoSettings'

interface StepSettingsPanelProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
  onClose: () => void
  upstreamSteps?: WorkflowStep[]
}

export function StepSettingsPanel({ step, onChange, onClose, upstreamSteps = [] }: StepSettingsPanelProps) {
  const config = getTaskConfig(step.type)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  function renderSettings() {
    switch (step.type) {
      // Data Access
      case 'Document':
      case 'Entity':
        return <DocumentSettings step={step} onChange={onChange} />
      case 'Query':
        return <QuerySettings step={step} onChange={onChange} />
      case 'Identifier':
        return <IdentifierSettings step={step} onChange={onChange} />
      case 'History':
        return <HistorySettings step={step} onChange={onChange} />
      case 'Version':
        return <VersionSettings step={step} onChange={onChange} />

      // Repository & ORM
      case 'Repository':
        return <RepositorySettings step={step} onChange={onChange} />
      case 'ORM':
        return <OrmSettings step={step} onChange={onChange} />
      case 'Trino':
        return <TrinoSettings step={step} onChange={onChange} />

      // Control Flow
      case 'Condition':
        return <ConditionSettings step={step} onChange={onChange} upstreamSteps={upstreamSteps} />
      case 'Switch':
        return <SwitchSettings step={step} onChange={onChange} />
      case 'Loop':
        return <LoopSettings step={step} onChange={onChange} />
      case 'Iterator':
        return <IteratorSettings step={step} onChange={onChange} />
      case 'Transaction':
        return <TransactionSettings step={step} onChange={onChange} />
      case 'Sequence':
        return <SequenceSettings step={step} onChange={onChange} />

      // Parallel & Wait
      case 'Parallel':
        return <ParallelSettings step={step} onChange={onChange} />
      case 'Timer':
        return <TimerSettings step={step} onChange={onChange} />
      case 'Approval':
        return <ApprovalSettings step={step} onChange={onChange} />

      // Logic & Validation
      case 'Rule':
        return <RuleSettings step={step} onChange={onChange} />
      case 'Resolver':
        return <ResolverSettings step={step} onChange={onChange} />
      case 'Validator':
        return <ValidatorSettings step={step} onChange={onChange} />
      case 'Filter':
        return <FilterSettings step={step} onChange={onChange} />
      case 'Schema':
        return <SchemaSettings step={step} onChange={onChange} />

      // Transform
      case 'Date':
        return <DateSettings step={step} onChange={onChange} />
      case 'UUID':
        return <UuidSettings step={step} onChange={onChange} />
      case 'JSON':
        return <JsonSettings step={step} onChange={onChange} />
      case 'Object':
        return <ObjectSettings step={step} onChange={onChange} />
      case 'Array':
        return <ArraySettings step={step} onChange={onChange} />
      case 'String':
        return <StringSettings step={step} onChange={onChange} />
      case 'Math':
        return <MathSettings step={step} onChange={onChange} />

      // Geo & Security
      case 'Geometry':
        return <GeometrySettings step={step} onChange={onChange} />
      case 'Security':
        return <SecuritySettings step={step} onChange={onChange} />
      case 'Crypto':
        return <CryptoSettings step={step} onChange={onChange} />
      case 'RSA':
        return <RsaSettings step={step} onChange={onChange} />

      // Integration
      case 'HTTP':
        return <HttpSettings step={step} onChange={onChange} upstreamSteps={upstreamSteps} />
      case 'SMTP':
        return <EmailSettings step={step} onChange={onChange} />
      case 'SMS':
        return <SmsSettings step={step} onChange={onChange} />
      case 'Notification':
        return <NotificationSettings step={step} onChange={onChange} />
      case 'Webhook':
        return <WebhookSettings step={step} onChange={onChange} />
      case 'Queue':
        return <QueueSettings step={step} onChange={onChange} />
      case 'MinIO':
        return <MinIOSettings step={step} onChange={onChange} />
      case 'Azure':
        return <AzureSettings step={step} onChange={onChange} />
      case 'ESQuery':
        return <EsQuerySettings step={step} onChange={onChange} />

      // Platform / Orchestration
      case 'Action':
        return <ActionSettings step={step} onChange={onChange} />
      case 'Workflow':
        return <WorkflowSettings step={step} onChange={onChange} />
      case 'Subscription':
        return <SubscriptionSettings step={step} onChange={onChange} />
      case 'Cache':
        return <CacheSettings step={step} onChange={onChange} />
      case 'Export':
        return <ExportSettings step={step} onChange={onChange} />
      case 'Template':
        return <TemplateSettings step={step} onChange={onChange} />
      case 'UIComponent':
        return <UIComponentSettings step={step} onChange={onChange} />

      // AI & Identity
      case 'AI':
        return <AiSettings step={step} onChange={onChange} />
      case 'Keycloak':
        return <KeycloakSettings step={step} onChange={onChange} />
      case 'Provider':
        return <ProviderSettings step={step} onChange={onChange} />

      // State & Utility
      case 'Request':
        return <RequestSettings step={step} onChange={onChange} />
      case 'Response':
        return <ResponseSettings step={step} onChange={onChange} upstreamSteps={upstreamSteps} />
      case 'Variable':
        return <VariableSettings step={step} onChange={onChange} />
      case 'State':
        return <StateSettings step={step} onChange={onChange} />

      // Fallback for start/end/Promise and any unknown types
      default:
        return <GenericSettings step={step} onChange={onChange} />
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    marginBottom: 4,
  }

  const isStartOrEnd = step.type === 'start' || step.type === 'end'

  return (
    <div
      style={{
        width: 360,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 12px 8px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        {config && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: config.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <TaskIcon iconName={config.iconName} color={config.color} size={14} />
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
            {config?.label ?? step.type}
          </div>
          {config && (
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>
              {config.description}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: 'var(--color-text-muted)',
            borderRadius: 4,
            display: 'flex',
            flexShrink: 0,
          }}
          aria-label="Close settings panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Step name — only for non-start/end steps */}
      {!isStartOrEnd && (
        <div
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
            background: 'var(--color-surface-2)',
          }}
        >
          <label style={labelStyle}>Step name</label>
          <Input
            value={step.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="Human-readable label"
          />
        </div>
      )}

      {/* Type-specific settings */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>{renderSettings()}</div>

        {/* Note / annotation */}
        {!isStartOrEnd && (
          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: 12,
            }}
          >
            <label style={labelStyle}>Note / annotation</label>
            <Textarea
              value={step.note ?? ''}
              onChange={e => onChange({ note: e.target.value || undefined })}
              placeholder="Add a note visible as a tooltip on the canvas node…"
              rows={3}
            />
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Shown as a tooltip indicator on the canvas node.
            </div>
          </div>
        )}

        {/* Advanced section — step ID editing (developer tool) */}
        {!isStartOrEnd && (
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
            <button
              onClick={() => setAdvancedOpen(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 0',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                fontFamily: 'inherit',
              }}
              aria-expanded={advancedOpen}
            >
              {advancedOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              Advanced
            </button>

            {advancedOpen && (
              <div style={{ marginTop: 8 }}>
                <label style={labelStyle}>
                  Step ID (execution key)
                </label>
                <Input
                  value={step.id}
                  onChange={e => onChange({ id: e.target.value })}
                  placeholder="camelCaseId"
                  style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                />
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Technical identifier. Other steps reference this output as{' '}
                  <code style={{ fontFamily: 'monospace' }}>{'{$.'}{step.id}{'.data}'}</code>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
