import type { FieldDef } from './FieldBuilder'
import type { Section } from './SectionBuilder'

interface EntityPreviewProps {
  fields: FieldDef[]
  sections: Section[]
}

function FieldPreview({ field }: { field: FieldDef }) {
  const label = field.label || field.name

  if (field.type === 'boolean') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--fg-secondary)' }}>{label}</span>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)', width: 'fit-content',
        }}>
          <div style={{ width: 32, height: 18, background: 'var(--neutral-200)', borderRadius: 'var(--radius-full)', position: 'relative' }}>
            <div style={{ width: 14, height: 14, background: 'var(--neutral-400)', borderRadius: '50%', position: 'absolute', top: 2, left: 2 }} />
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>Toggle</span>
        </div>
      </div>
    )
  }

  if (field.type === 'date' || field.type === 'datetime') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--fg-secondary)' }}>{label}</span>
        <div style={{
          height: 36, padding: '0 12px', border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
          display: 'flex', alignItems: 'center', gap: 8,
          color: 'var(--fg-quaternary)', fontSize: 'var(--text-sm)',
        }}>
          <span>📅</span>
          <span>{field.type === 'datetime' ? 'DD/MM/YYYY HH:MM' : 'DD/MM/YYYY'}</span>
        </div>
      </div>
    )
  }

  if (field.type === 'text') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--fg-secondary)' }}>{label}</span>
        <div style={{
          minHeight: 64, padding: '8px 12px', border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
          color: 'var(--fg-quaternary)', fontSize: 'var(--text-sm)',
        }}>
          {field.nullText || 'Enter text…'}
        </div>
      </div>
    )
  }

  if (field.type === 'enum') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--fg-secondary)' }}>{label}</span>
        <div style={{
          height: 36, padding: '0 12px', border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: 'var(--fg-quaternary)', fontSize: 'var(--text-sm)',
        }}>
          <span>Select an option…</span>
          <span style={{ color: 'var(--fg-tertiary)' }}>▾</span>
        </div>
      </div>
    )
  }

  if (field.storageType === 'computed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--fg-secondary)' }}>{label}</span>
        <div style={{
          height: 36, padding: '0 12px', border: '1px dashed var(--border-secondary)',
          borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)',
          display: 'flex', alignItems: 'center',
          color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)',
          fontStyle: 'italic',
        }}>
          Computed
        </div>
      </div>
    )
  }

  // Default: text input skeleton
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--fg-secondary)' }}>{label}</span>
      <div style={{
        height: 36, padding: '0 12px', border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center',
        color: 'var(--fg-quaternary)', fontSize: 'var(--text-sm)',
      }}>
        {field.nullText || `Enter ${label.toLowerCase()}…`}
      </div>
    </div>
  )
}

export function EntityPreview({ fields, sections }: EntityPreviewProps) {
  const fieldMap = new Map(fields.map(f => [f.name, f]))
  const assignedFieldNames = new Set(sections.flatMap(s => s.fields))
  const ungroupedFields = fields.filter(f => !assignedFieldNames.has(f.name))

  const allSections: { title: string; fields: FieldDef[] }[] = [
    ...sections.map(s => ({
      title: s.title,
      fields: s.fields.map(name => fieldMap.get(name)).filter((f): f is FieldDef => !!f),
    })),
    ...(ungroupedFields.length > 0 ? [{ title: 'General', fields: ungroupedFields }] : []),
  ]

  if (allSections.length === 0 || fields.length === 0) {
    return (
      <div style={{
        padding: 32, textAlign: 'center',
        color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)',
        border: '1px dashed var(--border-secondary)', borderRadius: 'var(--radius-lg)',
      }}>
        Add fields in the Schema tab to preview the form.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '6px 12px' }}>
        Preview — read-only mock of the entity form as end users will see it
      </div>
      {allSections.map((section, sIdx) => (
        <fieldset
          key={sIdx}
          style={{ border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)', padding: 16 }}
        >
          <legend style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-secondary)', padding: '0 8px' }}>
            {section.title}
          </legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {section.fields.map(field => (
              <FieldPreview key={field.name} field={field} />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  )
}
