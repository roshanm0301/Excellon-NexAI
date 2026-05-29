import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { TabGroup, Card, Banner } from '../../design-system'

const TABS = [
  { id: 'fields', label: 'Fields' },
  { id: 'sections', label: 'Sections' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'settings', label: 'Settings' },
  { id: 'node-scoping', label: 'Node Scoping' },
  { id: 'indexes', label: 'Indexes' },
  { id: 'retention', label: 'Retention' },
  { id: 'er-diagram', label: 'ER Diagram' },
]

export function EntityEditorPage() {
  const { entityType } = useParams<{ entityType: string }>()
  const [activeTab, setActiveTab] = useState('fields')

  return (
    <div>
      <div className="ex-page-header">
        <div className="ex-page-head-row">
          <div>
            <div className="eyebrow">Entity</div>
            <h1 className="ex-h1">{entityType}</h1>
          </div>
        </div>
        <TabGroup tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      <Card style={{ marginTop: 24 }}>
        <Banner
          variant="info"
          title="Implementation in progress"
          message={`The ${activeTab} editor for entity "${entityType}" is being built. Backend compilation is ready.`}
        />
      </Card>
    </div>
  )
}
