import { useState } from 'react'
import { Modal, Badge, Button, TabGroup, SearchInput } from '../../../../design-system'
import type { WorkflowDefinition } from '../../../../types/workflowBuilder'
import { WORKFLOW_TEMPLATES, type WorkflowTemplate, type TemplateCategory } from './workflowTemplates'

interface TemplateGalleryProps {
  onClose: () => void
  onApply: (definition: WorkflowDefinition) => void
}

type CategoryFilter = 'All' | TemplateCategory

const CATEGORY_TABS: { id: CategoryFilter; label: string }[] = [
  { id: 'All', label: 'All' },
  { id: 'Data CRUD', label: 'Data CRUD' },
  { id: 'Approvals', label: 'Approvals' },
  { id: 'Integration', label: 'Integration' },
  { id: 'Analytics', label: 'Analytics' },
]

function badgeVariantForCategory(cat: TemplateCategory) {
  switch (cat) {
    case 'Data CRUD': return 'brand' as const
    case 'Approvals': return 'warn' as const
    case 'Integration': return 'info' as const
    case 'Analytics': return 'success' as const
  }
}

export function TemplateGallery({ onClose, onApply }: TemplateGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)

  const filtered = WORKFLOW_TEMPLATES.filter(t => {
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      q === '' ||
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    return matchesCategory && matchesSearch
  })

  function handleApply(template: WorkflowTemplate) {
    onApply(template.definition)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Workflow Template Library"
      size="lg"
    >
      {selectedTemplate ? (
        /* ── Template preview ─────────────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button
            onClick={() => setSelectedTemplate(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--fg-secondary)',
              fontSize: 'var(--text-sm)',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'inherit',
            }}
          >
            ← Back to templates
          </button>

          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fg-primary)' }}>
              {selectedTemplate.name}
            </h3>
            <p style={{ margin: '0 0 8px', fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>
              {selectedTemplate.description}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              <Badge variant={badgeVariantForCategory(selectedTemplate.category)} dot={false}>
                {selectedTemplate.category}
              </Badge>
              {selectedTemplate.tags.map(tag => (
                <Badge key={tag} variant="neutral" dot={false}>{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Step list preview */}
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 8 }}>
              Workflow Steps ({selectedTemplate.definition.sequence.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedTemplate.definition.sequence.map((step, idx) => (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-secondary)',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: 'var(--fg-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--fg-primary)', fontWeight: 500 }}>
                    {step.name}
                  </span>
                  <Badge variant="neutral" dot={false}>{step.type}</Badge>
                  {step.branches && (
                    <Badge variant="warn" dot={false}>
                      {Object.keys(step.branches).length} branches
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setSelectedTemplate(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => handleApply(selectedTemplate)}>
              Use this template
            </Button>
          </div>
        </div>
      ) : (
        /* ── Template grid ────────────────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search */}
          <SearchInput
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search templates by name or tag…"
          />

          {/* Category tabs */}
          <TabGroup
            tabs={CATEGORY_TABS.map(t => ({ id: t.id, label: t.label }))}
            active={activeCategory}
            onChange={id => setActiveCategory(id as CategoryFilter)}
          />

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-secondary)', fontSize: 'var(--text-sm)' }}>
              No templates match your search.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
              }}
            >
              {filtered.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--border-focus)'
                    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'var(--border-secondary)'
                    el.style.boxShadow = 'none'
                  }}
                >
                  {/* Template name + category */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--fg-primary)', lineHeight: 1.3 }}>
                      {template.name}
                    </span>
                    <Badge variant={badgeVariantForCategory(template.category)} dot={false} style={{ flexShrink: 0 }}>
                      {template.category}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p style={{
                    margin: 0,
                    fontSize: 'var(--text-xs)',
                    color: 'var(--fg-secondary)',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {template.description}
                  </p>

                  {/* Tag badges */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {template.tags.slice(0, 4).map(tag => (
                      <Badge key={tag} variant="neutral" dot={false}>{tag}</Badge>
                    ))}
                    {template.tags.length > 4 && (
                      <Badge variant="neutral" dot={false}>+{template.tags.length - 4}</Badge>
                    )}
                  </div>

                  {/* Step count */}
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>
                    {template.definition.sequence.length} steps
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
