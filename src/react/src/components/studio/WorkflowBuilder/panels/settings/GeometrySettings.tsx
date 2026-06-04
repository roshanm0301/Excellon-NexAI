import React from 'react'
import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface GeometrySettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = [
  { value: 'calculateDistance', label: 'Calculate distance' },
  { value: 'pointInPolygon', label: 'Point in polygon?' },
  { value: 'geocodeAddress', label: 'Geocode address' },
  { value: 'reverseGeocode', label: 'Reverse geocode' },
  { value: 'bufferZone', label: 'Buffer zone' },
  { value: 'centroid', label: 'Centroid' },
]

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  marginBottom: 4,
}

const helpStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  color: 'var(--color-text-muted)',
  marginTop: 2,
  marginBottom: 10,
}

const mono: React.CSSProperties = { fontFamily: 'monospace', fontSize: '0.8125rem' }

export function GeometrySettings({ step, onChange }: GeometrySettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const operation = String(settings.operation ?? 'calculateDistance')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  const isDistance = operation === 'calculateDistance'
  const isPolygon = operation === 'pointInPolygon'
  const isGeocode = operation === 'geocodeAddress'
  const isReverseGeocode = operation === 'reverseGeocode'
  const isBuffer = operation === 'bufferZone'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Operation</label>
        <Select
          value={operation}
          onChange={e => update({ operation: e.target.value })}
          options={OPERATIONS}
        />
      </div>

      <div>
        <label style={labelStyle}>Point A</label>
        <Input
          value={String(settings.pointA ?? '')}
          onChange={e => update({ pointA: e.target.value })}
          placeholder="{$.body.location}"
          style={mono}
        />
        <div style={helpStyle}>Coordinates as [longitude, latitude] or a GeoJSON Point expression.</div>
      </div>

      {isDistance && (
        <div>
          <label style={labelStyle}>Point B</label>
          <Input
            value={String(settings.pointB ?? '')}
            onChange={e => update({ pointB: e.target.value })}
            placeholder="{$.body.destination}"
            style={mono}
          />
          <div style={helpStyle}>Second point. Required for distance calculations.</div>
        </div>
      )}

      {isPolygon && (
        <div>
          <label style={labelStyle}>Polygon</label>
          <Textarea
            value={String(settings.polygon ?? '')}
            onChange={e => update({ polygon: e.target.value })}
            rows={3}
            placeholder="[[lng1,lat1],[lng2,lat2],...]"
          />
          <div style={helpStyle}>GeoJSON coordinates array.</div>
        </div>
      )}

      {isGeocode && (
        <div>
          <label style={labelStyle}>Address</label>
          <Input
            value={String(settings.address ?? '')}
            onChange={e => update({ address: e.target.value })}
            placeholder="{$.body.address}"
            style={mono}
          />
        </div>
      )}

      {isReverseGeocode && (
        <div>
          <label style={labelStyle}>Coordinates</label>
          <Input
            value={String(settings.coordinates ?? '')}
            onChange={e => update({ coordinates: e.target.value })}
            placeholder="{$.body.coordinates}"
            style={mono}
          />
        </div>
      )}

      {isBuffer && (
        <div>
          <label style={labelStyle}>Radius (metres)</label>
          <Input
            type="number"
            value={String(settings.radiusMetres ?? '')}
            onChange={e =>
              update({ radiusMetres: e.target.value === '' ? '' : Number(e.target.value) })
            }
            placeholder="500"
          />
        </div>
      )}

      <div>
        <label style={labelStyle}>Output variable</label>
        <Input
          value={String(settings.outputVar ?? '')}
          onChange={e => update({ outputVar: e.target.value })}
          placeholder="result"
          style={mono}
        />
      </div>
    </div>
  )
}
