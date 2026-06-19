import type { SurfaceType, ViewPayload, ComponentNode } from '../types/viewStudio'

import standardCrud from './standard_crud.json'
import advancedCrud from './advanced_crud.json'
import headerLine from './header_line.json'
import detailPage from './detail_page.json'
import dashboardTpl from './dashboard.json'
import wizardTpl from './wizard.json'
import splitView from './split_view.json'
import kanbanTpl from './kanban.json'
import calendarTpl from './calendar.json'
import customPage from './custom_page.json'

// ─── Template registry ────────────────────────────────────────────────────────

const TEMPLATES: Partial<Record<SurfaceType, ViewPayload>> = {
  standard_crud:  standardCrud as unknown as ViewPayload,
  advanced_crud:  advancedCrud as unknown as ViewPayload,
  header_line:    headerLine   as unknown as ViewPayload,
  detail_page:    detailPage   as unknown as ViewPayload,
  dashboard:      dashboardTpl as unknown as ViewPayload,
  wizard:         wizardTpl    as unknown as ViewPayload,
  split_view:     splitView    as unknown as ViewPayload,
  kanban:         kanbanTpl    as unknown as ViewPayload,
  calendar:       calendarTpl  as unknown as ViewPayload,
  custom_page:    customPage   as unknown as ViewPayload,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatEntityLabel(rawEntity: string): string {
  return rawEntity
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function replaceEntity(str: string, entity: string): string {
  return str.replace(/__ENTITY__/g, entity)
}

/**
 * Deep-clone a component node, replacing __ENTITY__ placeholders and
 * regenerating all component_key values with fresh UUIDs so each view
 * gets its own independent set of keys.
 */
function rekey(node: ComponentNode, entity: string): ComponentNode {
  const newKey = `${node.component_code}_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
  return {
    ...node,
    component_key: newKey,
    label: replaceEntity(node.label ?? '', entity),
    props: JSON.parse(replaceEntity(JSON.stringify(node.props ?? {}), entity)),
    children: (node.children ?? []).map(child => rekey(child, entity)),
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a deep copy of the default template for the given surface type
 * with the entity name substituted and fresh component keys generated.
 *
 * Returns undefined if no template is registered for the surface.
 */
export function applyTemplate(
  surface: SurfaceType,
  primaryEntity: string,
): ViewPayload | undefined {
  const template = TEMPLATES[surface]
  if (!template) return undefined

  const entityLabel = formatEntityLabel(primaryEntity || 'record')
  return {
    ...template,
    component_tree: rekey(template.component_tree, entityLabel),
  }
}

export { TEMPLATES }
