export type ConditionType = 'AND' | 'OR' | 'NOT' | 'FIELD'
export type Operator = 'eq'|'neq'|'gt'|'gte'|'lt'|'lte'|'contains'|'startsWith'|'in'|'notIn'|'isNull'|'isNotNull'
export type ActionType = 'BLOCK' | 'WARN' | 'SET_FIELD'

export interface Condition {
  type: ConditionType
  field?: string
  operator?: Operator
  value?: string | number | boolean | string[]
  conditions?: Condition[]
}

export interface Action {
  type: ActionType
  message?: string
  field?: string
  value?: unknown
}

export interface RuleSet {
  id: string
  entityType: string
  name: string
  definition: { conditions: Condition; actions: Action[] }
  enabled: boolean
}

export interface EvaluationResult {
  blocked: boolean
  blockMessage?: string
  warnings: string[]
  mutations: Record<string, unknown>
}
