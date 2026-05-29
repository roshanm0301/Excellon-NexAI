import { Card, Banner } from '../../design-system'

export function RuleBuilderPage() {
  return (
    <div>
      <div className="ex-page-header">
        <div className="ex-page-head-row">
          <div>
            <h1 className="ex-h1">Rule Builder</h1>
            <p className="ex-page-sub">Define validation rules, computed fields, and workflow guards</p>
          </div>
        </div>
      </div>
      <Card style={{ marginTop: 24 }}>
        <Banner variant="info" title="Coming in Phase 4" message="The Rule Builder UI will be implemented after the Rules Engine backend is complete." />
      </Card>
    </div>
  )
}
