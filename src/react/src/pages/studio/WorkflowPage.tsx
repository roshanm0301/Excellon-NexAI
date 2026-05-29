import { Card, Banner } from '../../design-system'

export function WorkflowPage() {
  return (
    <div>
      <div className="ex-page-header">
        <div className="ex-page-head-row">
          <div>
            <h1 className="ex-h1">Workflow</h1>
            <p className="ex-page-sub">Define status machines, SLA rules, and human tasks</p>
          </div>
        </div>
      </div>
      <Card style={{ marginTop: 24 }}>
        <Banner variant="info" title="Coming in Phase 4" message="The Workflow canvas will be implemented after the Workflow Engine backend is complete." />
      </Card>
    </div>
  )
}
export default WorkflowPage
