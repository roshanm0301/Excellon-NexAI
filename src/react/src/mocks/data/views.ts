// Mock view seed data removed — UI Studio uses the real backend (VITE_MSW=false).
// MSW smoke tests get an empty view list; pages show empty states.

export interface ViewSeed {
  artifact_id: string
  artifact_name: string
  artifact_type: string
  tenant_id: string
  surface_type: string
  primary_entity: string
  view_code: string
  view_label: string
  created_at: string
  updated_at: string
  created_by: string
  revision: number
  is_draft: boolean
  is_active: boolean
}

export const seedViews: ViewSeed[] = []
