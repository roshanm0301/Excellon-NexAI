/**
 * ComponentInfoPopover — Floating info card for the Component Palette.
 *
 * UX: Click-triggered (not hover) because hover conflicts with drag-start.
 * Positions to the right of the palette. Flips upward if near viewport bottom.
 * Dismisses on outside-click or Escape key.
 */

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { ComponentRegistryEntry } from '../../../types/viewStudio'
import type { ComponentInfoEntry, MiniPreviewTemplate } from './ComponentInfoData'

interface ComponentInfoPopoverProps {
  entry: ComponentRegistryEntry
  info: ComponentInfoEntry
  anchorRect: DOMRect
  onClose: () => void
}

// ─── Positioning ──────────────────────────────────────────────────────────────

function calcPosition(anchorRect: DOMRect): { top: number; left: number } {
  const POPOVER_WIDTH = 284
  const POPOVER_EST_HEIGHT = 420
  const GAP = 10

  const left = anchorRect.right + GAP
  let top = anchorRect.top

  // Clamp bottom: if popover would overflow viewport, shift up
  const maxTop = window.innerHeight - POPOVER_EST_HEIGHT - 8
  if (top > maxTop) top = Math.max(8, maxTop)

  // If there is not enough space to the right, try left side
  const adjustedLeft = left + POPOVER_WIDTH > window.innerWidth - 8
    ? anchorRect.left - POPOVER_WIDTH - GAP
    : left

  return { top, left: adjustedLeft }
}

// ─── Category badge colours ────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  layout:    { bg: '#dbeafe', color: '#1d4ed8' },
  input:     { bg: '#dcfce7', color: '#15803d' },
  display:   { bg: '#fef3c7', color: '#92400e' },
  data:      { bg: '#ede9fe', color: '#6d28d9' },
  action:    { bg: '#fee2e2', color: '#b91c1c' },
  composite: { bg: '#fce7f3', color: '#9d174d' },
  container: { bg: '#e0f2fe', color: '#0369a1' },
  navigation:{ bg: '#f0fdf4', color: '#166534' },
  chart:     { bg: '#fdf4ff', color: '#7e22ce' },
  media:     { bg: '#fff7ed', color: '#c2410c' },
  feedback:  { bg: '#fefce8', color: '#854d0e' },
}

// ─── Mini Preview ─────────────────────────────────────────────────────────────

function MiniPreview({ template }: { template: MiniPreviewTemplate }) {
  const s = {
    wrap: { padding: '10px 14px', width: '100%', boxSizing: 'border-box' as const },
    label: { fontSize: 9, color: '#64748b', marginBottom: 4, fontWeight: 500 },
    input: {
      border: '1px solid #cbd5e1', borderRadius: 3, padding: '4px 7px',
      fontSize: 9, color: '#94a3b8', background: '#fff',
      display: 'flex', alignItems: 'center', gap: 4,
    },
    inputDark: {
      border: '1px solid #cbd5e1', borderRadius: 3, padding: '4px 7px',
      fontSize: 9, color: '#334155', background: '#fff',
      display: 'flex', alignItems: 'center', gap: 4,
    },
    pill: {
      display: 'inline-flex', alignItems: 'center', padding: '2px 7px',
      borderRadius: 99, fontSize: 9, fontWeight: 500,
    },
    row: { display: 'flex', alignItems: 'center', gap: 6 },
    col: { display: 'flex', flexDirection: 'column' as const, gap: 5 },
    sep: { borderTop: '1px solid #e2e8f0', margin: '6px 0' },
    mono: { fontFamily: 'monospace' },
  }

  switch (template) {

    case 'text_input':
      return (
        <div style={s.wrap}>
          <div style={s.col}>
            <div style={s.label}>Customer Name</div>
            <div style={s.input}><span>Enter text...</span></div>
          </div>
        </div>
      )

    case 'number_input':
      return (
        <div style={s.wrap}>
          <div style={s.col}>
            <div style={s.label}>Quantity</div>
            <div style={{ ...s.input, justifyContent: 'space-between' }}>
              <span style={s.mono}>0</span>
              <span style={{ color: '#94a3b8', fontSize: 10, lineHeight: 1 }}>▲▼</span>
            </div>
          </div>
        </div>
      )

    case 'date_picker':
      return (
        <div style={s.wrap}>
          <div style={s.col}>
            <div style={s.label}>Service Date</div>
            <div style={{ ...s.input, justifyContent: 'space-between' }}>
              <span>DD / MM / YYYY</span>
              <span style={{ fontSize: 11 }}>📅</span>
            </div>
          </div>
        </div>
      )

    case 'dropdown':
      return (
        <div style={s.wrap}>
          <div style={s.col}>
            <div style={s.label}>Status</div>
            <div style={{ ...s.input, justifyContent: 'space-between' }}>
              <span>Select option...</span>
              <span style={{ fontSize: 9, color: '#64748b' }}>▾</span>
            </div>
          </div>
        </div>
      )

    case 'multi_select':
      return (
        <div style={s.wrap}>
          <div style={s.col}>
            <div style={s.label}>Categories</div>
            <div style={{ ...s.input, flexWrap: 'wrap' as const, gap: 3, height: 'auto', padding: '3px 5px' }}>
              <span style={{ ...s.pill, background: '#eff6ff', color: '#1d4ed8' }}>Sedan ×</span>
              <span style={{ ...s.pill, background: '#eff6ff', color: '#1d4ed8' }}>SUV ×</span>
              <span style={{ fontSize: 8, color: '#94a3b8' }}>+ add</span>
            </div>
          </div>
        </div>
      )

    case 'checkbox':
      return (
        <div style={s.wrap}>
          <div style={s.col}>
            <div style={{ ...s.row }}>
              <div style={{ width: 11, height: 11, border: '1.5px solid #3b82f6', borderRadius: 2, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 8, lineHeight: 1 }}>✓</span>
              </div>
              <span style={{ fontSize: 9, color: '#334155' }}>Email opt-in</span>
            </div>
            <div style={{ ...s.row }}>
              <div style={{ width: 11, height: 11, border: '1.5px solid #cbd5e1', borderRadius: 2, background: '#fff' }} />
              <span style={{ fontSize: 9, color: '#334155' }}>SMS opt-in</span>
            </div>
            <div style={{ ...s.row }}>
              <div style={{ width: 11, height: 11, border: '1.5px solid #3b82f6', borderRadius: 2, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 8, lineHeight: 1 }}>✓</span>
              </div>
              <span style={{ fontSize: 9, color: '#334155' }}>Push notifications</span>
            </div>
          </div>
        </div>
      )

    case 'radio_group':
      return (
        <div style={s.wrap}>
          <div style={s.col}>
            {[['High', true], ['Medium', false], ['Low', false]].map(([label, checked]) => (
              <div key={label as string} style={s.row}>
                <div style={{ width: 11, height: 11, borderRadius: '50%', border: `1.5px solid ${checked ? '#3b82f6' : '#cbd5e1'}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {checked && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6' }} />}
                </div>
                <span style={{ fontSize: 9, color: '#334155' }}>{label as string}</span>
              </div>
            ))}
          </div>
        </div>
      )

    case 'toggle':
      return (
        <div style={s.wrap}>
          <div style={s.col}>
            <div style={s.row}>
              <div style={{ width: 28, height: 14, borderRadius: 99, background: '#3b82f6', position: 'relative' as const, flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', position: 'absolute' as const, right: 2, top: 2, boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
              </div>
              <span style={{ fontSize: 9, color: '#334155' }}>Active</span>
            </div>
            <div style={s.row}>
              <div style={{ width: 28, height: 14, borderRadius: 99, background: '#e2e8f0', position: 'relative' as const, flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', position: 'absolute' as const, left: 2, top: 2, boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
              </div>
              <span style={{ fontSize: 9, color: '#94a3b8' }}>Inactive</span>
            </div>
          </div>
        </div>
      )

    case 'textarea':
      return (
        <div style={s.wrap}>
          <div style={s.col}>
            <div style={s.label}>Remarks</div>
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 3, padding: '4px 7px', fontSize: 9, color: '#94a3b8', background: '#fff', minHeight: 44 }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', marginBottom: 3, paddingBottom: 3 }}>Enter notes here...</div>
              <div style={{ height: 5, background: '#f1f5f9', borderRadius: 2, width: '70%' }} />
              <div style={{ height: 5, background: '#f1f5f9', borderRadius: 2, width: '40%', marginTop: 3 }} />
            </div>
          </div>
        </div>
      )

    case 'file_upload':
      return (
        <div style={s.wrap}>
          <div style={{ border: '1.5px dashed #cbd5e1', borderRadius: 5, padding: '10px', textAlign: 'center' as const, background: '#fafafa' }}>
            <div style={{ fontSize: 14, marginBottom: 3 }}>↑</div>
            <div style={{ fontSize: 9, color: '#64748b' }}>Drop files or click to upload</div>
            <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 2 }}>PDF, JPG, PNG up to 10 MB</div>
          </div>
        </div>
      )

    case 'reference_select':
      return (
        <div style={s.wrap}>
          <div style={s.col}>
            <div style={s.label}>Customer</div>
            <div style={{ ...s.input, justifyContent: 'space-between' }}>
              <span>Search or select...</span>
              <span style={{ fontSize: 11, color: '#3b82f6' }}>🔍</span>
            </div>
            <div style={{ fontSize: 8, color: '#64748b', marginTop: -2 }}>Links to Customer entity</div>
          </div>
        </div>
      )

    case 'button':
      return (
        <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ background: '#3b82f6', color: '#fff', borderRadius: 4, padding: '5px 12px', fontSize: 9, fontWeight: 600 }}>Save</div>
          <div style={{ background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 4, padding: '5px 10px', fontSize: 9 }}>Cancel</div>
          <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 4, padding: '5px 10px', fontSize: 9 }}>Delete</div>
        </div>
      )

    case 'label':
      return (
        <div style={s.wrap}>
          <div style={s.col}>
            <div style={{ ...s.row, gap: 20 }}>
              <div style={s.col}>
                <div style={{ fontSize: 8, color: '#94a3b8' }}>Record ID</div>
                <div style={{ fontSize: 10, color: '#1e293b', fontWeight: 600, ...s.mono }}>CUS-00142</div>
              </div>
              <div style={s.col}>
                <div style={{ fontSize: 8, color: '#94a3b8' }}>Created By</div>
                <div style={{ fontSize: 10, color: '#1e293b', fontWeight: 600 }}>Admin</div>
              </div>
            </div>
          </div>
        </div>
      )

    case 'heading':
      return (
        <div style={s.wrap}>
          <div style={s.col}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Customer Details</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Heading · H2</div>
          </div>
        </div>
      )

    case 'badge':
      return (
        <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ ...s.pill, background: '#dbeafe', color: '#1d4ed8' }}>Premium</span>
          <span style={{ ...s.pill, background: '#dcfce7', color: '#15803d' }}>Active</span>
          <span style={{ ...s.pill, background: '#fef3c7', color: '#92400e' }}>VIP</span>
        </div>
      )

    case 'status_badge':
      return (
        <div style={s.wrap}>
          <div style={s.col}>
            {[
              { label: 'Confirmed', dot: '#22c55e', bg: '#f0fdf4', color: '#15803d' },
              { label: 'Pending',   dot: '#f59e0b', bg: '#fef9c3', color: '#92400e' },
              { label: 'Cancelled', dot: '#ef4444', bg: '#fef2f2', color: '#b91c1c' },
            ].map(({ label, dot, bg, color }) => (
              <div key={label} style={s.row}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                <span style={{ ...s.pill, background: bg, color, padding: '1px 5px' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )

    case 'metric':
      return (
        <div style={s.wrap}>
          <div style={{ fontSize: 9, color: '#64748b', marginBottom: 2 }}>Total Revenue</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>₹ 24,500</div>
          <div style={{ ...s.row, marginTop: 3, gap: 4 }}>
            <span style={{ fontSize: 9, color: '#16a34a', fontWeight: 600 }}>↑ 8.2%</span>
            <span style={{ fontSize: 8, color: '#94a3b8' }}>vs last month</span>
          </div>
        </div>
      )

    case 'avatar':
      return (
        <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>JD</div>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'linear-gradient(135deg,#f093fb,#f5576c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>AR</div>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 10, fontWeight: 700 }}>?</div>
        </div>
      )

    case 'data_table':
      return (
        <div style={{ ...s.wrap, overflowX: 'hidden' as const }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Name', 'Status', 'Date'].map(h => (
                  <th key={h} style={{ padding: '3px 5px', textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[['Roshan M.', 'Active', '12 Jun'], ['Priya K.', 'Pending', '11 Jun']].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '3px 5px', color: j === 1 ? '#16a34a' : '#334155' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'card_grid':
      return (
        <div style={{ ...s.wrap, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[['Sedan', '#3b82f6'], ['SUV', '#8b5cf6'], ['Truck', '#f59e0b'], ['Electric', '#22c55e']].map(([name, color]) => (
            <div key={name} style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 7px', background: '#fff' }}>
              <div style={{ width: '100%', height: 14, borderRadius: 3, background: color as string, opacity: 0.2, marginBottom: 4 }} />
              <div style={{ fontSize: 8, fontWeight: 600, color: '#334155' }}>{name}</div>
              <div style={{ fontSize: 7, color: '#94a3b8' }}>12 models</div>
            </div>
          ))}
        </div>
      )

    case 'filter_panel':
      return (
        <div style={s.wrap}>
          <div style={s.col}>
            <div style={{ fontSize: 8, fontWeight: 600, color: '#64748b', marginBottom: 2 }}>FILTERS</div>
            {['Status', 'Date Range', 'Category'].map(f => (
              <div key={f} style={s.col}>
                <div style={{ fontSize: 8, color: '#64748b' }}>{f}</div>
                <div style={{ ...s.input, justifyContent: 'space-between', marginBottom: 2 }}>
                  <span>All</span>
                  <span style={{ fontSize: 8 }}>▾</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'related_list':
      return (
        <div style={s.wrap}>
          <div style={{ ...s.row, justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: '#334155' }}>Service Items</span>
            <span style={{ fontSize: 8, color: '#3b82f6', cursor: 'pointer' }}>+ Add</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8 }}>
            <tbody>
              {[['Oil Change', '₹600'], ['Filter', '₹150']].map(([item, price]) => (
                <tr key={item} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '3px 5px', color: '#334155' }}>{item}</td>
                  <td style={{ padding: '3px 5px', color: '#64748b', textAlign: 'right' as const }}>{price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'section':
      return (
        <div style={{ ...s.wrap, padding: 8 }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '5px 9px', borderBottom: '1px solid #e2e8f0', fontSize: 9, fontWeight: 600, color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Personal Info <span style={{ fontSize: 10, color: '#94a3b8' }}>▾</span>
            </div>
            <div style={{ padding: '7px 9px', display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
              <div style={{ height: 10, background: '#f1f5f9', borderRadius: 2, width: '80%' }} />
              <div style={{ height: 10, background: '#f1f5f9', borderRadius: 2, width: '60%' }} />
            </div>
          </div>
        </div>
      )

    case 'card':
      return (
        <div style={{ ...s.wrap, padding: 8 }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: '8px 10px', background: '#fff' }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Summary Card</div>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 2, width: '90%', marginBottom: 3 }} />
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 2, width: '60%' }} />
          </div>
        </div>
      )

    case 'row_col':
      return (
        <div style={{ ...s.wrap, padding: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ border: '1.5px dashed #cbd5e1', borderRadius: 4, padding: '8px 6px', textAlign: 'center' as const }}>
                <div style={{ fontSize: 8, color: '#94a3b8' }}>Col {i}</div>
                <div style={{ height: 10, background: '#f1f5f9', borderRadius: 2, marginTop: 4 }} />
              </div>
            ))}
          </div>
        </div>
      )

    case 'toolbar':
      return (
        <div style={{ ...s.wrap, padding: 8 }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', background: '#f8fafc', display: 'flex', gap: 5, alignItems: 'center' }}>
            <div style={{ background: '#3b82f6', color: '#fff', borderRadius: 3, padding: '3px 8px', fontSize: 8, fontWeight: 600 }}>Save</div>
            <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 3, padding: '3px 8px', fontSize: 8, color: '#475569' }}>Cancel</div>
            <div style={{ flex: 1 }} />
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 3, padding: '3px 8px', fontSize: 8, color: '#b91c1c' }}>Delete</div>
          </div>
        </div>
      )

    case 'tab_container':
      return (
        <div style={{ ...s.wrap, padding: 8 }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {['Details', 'Orders', 'Docs'].map((tab, i) => (
                <div key={tab} style={{ padding: '4px 9px', fontSize: 8, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? '#3b82f6' : '#94a3b8', borderBottom: i === 0 ? '2px solid #3b82f6' : '2px solid transparent', cursor: 'pointer' }}>{tab}</div>
              ))}
            </div>
            <div style={{ padding: '7px 9px' }}>
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 2, width: '80%', marginBottom: 4 }} />
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 2, width: '50%' }} />
            </div>
          </div>
        </div>
      )

    case 'accordion':
      return (
        <div style={{ ...s.wrap, padding: 8 }}>
          <div style={s.col}>
            {[['Advanced Settings', true], ['Audit Info', false]].map(([label, open]) => (
              <div key={label as string} style={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: open ? '#f8fafc' : '#fff', fontSize: 9, color: '#334155' }}>
                  <span>{label as string}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{open ? '▾' : '▸'}</span>
                </div>
                {open && (
                  <div style={{ padding: '5px 8px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ height: 7, background: '#f1f5f9', borderRadius: 2 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )

    case 'divider':
      return (
        <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ fontSize: 8, color: '#94a3b8', whiteSpace: 'nowrap' as const }}>Divider</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>
      )

    case 'modal':
      return (
        <div style={{ ...s.wrap, padding: 8 }}>
          <div style={{ position: 'relative' as const, border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.12)', background: '#fff', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 9px', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: '#0f172a' }}>Confirm Action</span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>✕</span>
            </div>
            <div style={{ padding: '7px 9px' }}>
              <div style={{ height: 7, background: '#f1f5f9', borderRadius: 2, width: '90%', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                <div style={{ background: '#f1f5f9', borderRadius: 3, padding: '3px 7px', fontSize: 8, color: '#64748b' }}>Cancel</div>
                <div style={{ background: '#3b82f6', borderRadius: 3, padding: '3px 7px', fontSize: 8, color: '#fff', fontWeight: 600 }}>Confirm</div>
              </div>
            </div>
          </div>
        </div>
      )

    case 'drawer':
      return (
        <div style={{ ...s.wrap, padding: 8 }}>
          <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 5, overflow: 'hidden', height: 70 }}>
            <div style={{ flex: 1, background: '#f8fafc', opacity: 0.6 }}>
              <div style={{ height: 8, background: '#e2e8f0', margin: '7px 8px 4px', borderRadius: 2 }} />
              <div style={{ height: 8, background: '#e2e8f0', margin: '0 8px', borderRadius: 2, width: '60%' }} />
            </div>
            <div style={{ width: 90, borderLeft: '2px solid #3b82f6', background: '#fff', padding: '6px 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 8, fontWeight: 600, color: '#334155' }}>Edit</span>
                <span style={{ fontSize: 9, color: '#94a3b8' }}>✕</span>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 2, marginBottom: 3 }} />
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 2, width: '70%' }} />
            </div>
          </div>
        </div>
      )

    case 'conditional':
      return (
        <div style={{ ...s.wrap, padding: 8 }}>
          <div style={{ border: '2px dashed #94a3b8', borderRadius: 5, padding: '6px 9px', background: '#fafafa' }}>
            <div style={{ fontSize: 8, color: '#64748b', marginBottom: 4 }}>
              <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: 3, padding: '1px 4px', fontWeight: 600 }}>IF</span>
              <span style={{ color: '#334155', margin: '0 4px' }}>delivery = "courier"</span>
            </div>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 2, marginBottom: 3 }} />
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 2, width: '60%' }} />
          </div>
        </div>
      )

    case 'totals_panel':
      return (
        <div style={{ ...s.wrap, padding: 8 }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
            {[['Subtotal', '₹ 8,200', false], ['Tax (18%)', '₹ 1,476', false], ['Discount', '– ₹ 400', false]].map(([label, val, bold]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', borderBottom: '1px solid #f1f5f9', fontSize: 8, color: bold ? '#0f172a' : '#475569', fontWeight: bold ? 700 : 400 }}>
                <span>{label as string}</span><span>{val as string}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#f8fafc', fontSize: 9, fontWeight: 700, color: '#0f172a' }}>
              <span>Total</span><span>₹ 9,276</span>
            </div>
          </div>
        </div>
      )

    case 'wizard_step':
      return (
        <div style={{ ...s.wrap, padding: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 8 }}>
            {[1, 2, 3, 4].map((step, i, arr) => (
              <>
                <div key={step} style={{ width: 18, height: 18, borderRadius: '50%', background: i === 0 ? '#3b82f6' : i === 1 ? '#e0f2fe' : '#f1f5f9', border: i === 1 ? '1.5px solid #3b82f6' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: i === 0 ? '#fff' : i === 1 ? '#3b82f6' : '#94a3b8', flexShrink: 0 }}>{step}</div>
                {i < arr.length - 1 && <div key={`line-${step}`} style={{ flex: 1, height: 1.5, background: i === 0 ? '#3b82f6' : '#e2e8f0' }} />}
              </>
            ))}
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#334155', marginBottom: 3 }}>Customer Details</div>
          <div style={{ height: 7, background: '#f1f5f9', borderRadius: 2, width: '80%' }} />
        </div>
      )

    case 'split_panel':
      return (
        <div style={{ ...s.wrap, padding: 8 }}>
          <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 5, overflow: 'hidden', height: 66 }}>
            <div style={{ width: 80, borderRight: '1px solid #e2e8f0', background: '#f8fafc', padding: '5px 6px' }}>
              <div style={{ fontSize: 7, fontWeight: 600, color: '#64748b', marginBottom: 3 }}>LIST</div>
              {['Roshan', 'Priya', 'Ahmed'].map((n, i) => (
                <div key={n} style={{ padding: '2px 4px', borderRadius: 3, background: i === 0 ? '#eff6ff' : 'transparent', fontSize: 8, color: i === 0 ? '#1d4ed8' : '#475569', marginBottom: 1 }}>{n}</div>
              ))}
            </div>
            <div style={{ flex: 1, padding: '5px 7px' }}>
              <div style={{ fontSize: 8, fontWeight: 600, color: '#334155', marginBottom: 4 }}>DETAIL</div>
              <div style={{ height: 7, background: '#f1f5f9', borderRadius: 2, marginBottom: 3 }} />
              <div style={{ height: 7, background: '#f1f5f9', borderRadius: 2, width: '60%' }} />
            </div>
          </div>
        </div>
      )

    case 'dashboard_grid':
      return (
        <div style={{ ...s.wrap, padding: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {[['Revenue', '₹24.5K', '#3b82f6'], ['Orders', '142', '#8b5cf6'], ['Jobs', '38', '#f59e0b'], ['Parts', '2,180', '#22c55e']].map(([label, val, color]) => (
              <div key={label} style={{ border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 7px', background: '#fff' }}>
                <div style={{ fontSize: 7, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: color as string }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'kanban':
      return (
        <div style={{ ...s.wrap, padding: 8 }}>
          <div style={{ display: 'flex', gap: 5, overflow: 'hidden' }}>
            {[['New', '#e0f2fe', '#0369a1'], ['In Progress', '#fef9c3', '#92400e'], ['Done', '#f0fdf4', '#166534']].map(([col, bg, color]) => (
              <div key={col} style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 7, fontWeight: 600, color: color as string, background: bg as string, borderRadius: 3, padding: '2px 5px', textAlign: 'center' as const, marginBottom: 3 }}>{col}</div>
                {[1, 2].map(i => (
                  <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: 3, padding: '3px 4px', background: '#fff', marginBottom: 2 }}>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 2, marginBottom: 2 }} />
                    <div style={{ height: 5, background: '#f1f5f9', borderRadius: 2, width: '70%' }} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )

    default:
      return (
        <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 9 }}>
          Preview not available
        </div>
      )
  }
}

// ─── Main Popover ─────────────────────────────────────────────────────────────

export function ComponentInfoPopover({ entry, info, anchorRect, onClose }: ComponentInfoPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const { top, left } = calcPosition(anchorRect)
  const catStyle = CATEGORY_COLORS[entry.category] ?? { bg: '#f1f5f9', color: '#475569' }

  // Outside-click dismiss
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay so the click that opened the popover doesn't immediately close it
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  // Escape key dismiss
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      ref={popoverRef}
      className="cp-info-popover"
      style={{ top, left }}
      role="dialog"
      aria-label={`${entry.component_name} info`}
    >
      {/* Header */}
      <div className="cp-info-popover__header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="cp-info-popover__name">{entry.component_name}</span>
          <span className="cp-info-popover__tagline-sub">{info.tagline}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className="cp-info-popover__cat"
            style={{ background: catStyle.bg, color: catStyle.color }}
          >
            {entry.category}
          </span>
          <button className="cp-info-popover__close" onClick={onClose} aria-label="Close">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Visual mini-preview */}
      <div className="cp-info-popover__preview">
        <MiniPreview template={info.previewTemplate} />
      </div>

      {/* Body */}
      <div className="cp-info-popover__body">
        {/* Description */}
        <p className="cp-info-popover__desc">{info.description}</p>

        {/* Use cases */}
        <div>
          <div className="cp-info-popover__section-label">Used for</div>
          <ul className="cp-info-popover__use-cases">
            {info.useCases.map(uc => <li key={uc}>{uc}</li>)}
          </ul>
        </div>

        {/* Key properties */}
        <div>
          <div className="cp-info-popover__section-label">Key properties</div>
          <div className="cp-info-popover__props">
            {info.keyProps.map(p => (
              <span key={p} className="cp-info-popover__prop-chip">{p}</span>
            ))}
          </div>
        </div>

        {/* Surfaces (from registry) */}
        {Array.isArray(entry.supported_surfaces) && entry.supported_surfaces.length > 0 && entry.supported_surfaces[0] !== 'all' && (
          <div>
            <div className="cp-info-popover__section-label">Surfaces</div>
            <div className="cp-info-popover__props">
              {(entry.supported_surfaces as string[]).map(s => (
                <span key={s} className="cp-info-popover__prop-chip" style={{ background: '#f0fdf4', color: '#166534' }}>{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
