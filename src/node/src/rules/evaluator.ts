import type { RuleSet, Condition, EvaluationResult } from './types.js'

export class ProductionEvaluator {
  evaluateAll(ruleSets: RuleSet[], payload: Record<string, unknown>): EvaluationResult {
    const result: EvaluationResult = {
      blocked: false,
      warnings: [],
      mutations: {},
    }

    for (const ruleSet of ruleSets) {
      if (!ruleSet.enabled) {
        continue
      }

      const conditionMet = this.evaluateCondition(ruleSet.definition.conditions, payload)
      if (!conditionMet) {
        continue
      }

      for (const action of ruleSet.definition.actions) {
        switch (action.type) {
          case 'BLOCK':
            result.blocked = true
            result.blockMessage = action.message
            return result

          case 'WARN':
            if (action.message != null) {
              result.warnings.push(action.message)
            }
            break

          case 'SET_FIELD':
            if (action.field != null) {
              result.mutations[action.field] = action.value
            }
            break
        }
      }
    }

    return result
  }

  private evaluateCondition(cond: Condition, payload: Record<string, unknown>): boolean {
    switch (cond.type) {
      case 'AND': {
        const children = cond.conditions ?? []
        return children.every((c) => this.evaluateCondition(c, payload))
      }
      case 'OR': {
        const children = cond.conditions ?? []
        return children.some((c) => this.evaluateCondition(c, payload))
      }
      case 'NOT': {
        const children = cond.conditions ?? []
        if (children.length === 0) return true
        return !this.evaluateCondition(children[0], payload)
      }
      case 'FIELD':
        return this.evaluateField(cond, payload)
      default:
        return false
    }
  }

  private evaluateField(cond: Condition, payload: Record<string, unknown>): boolean {
    const field = cond.field ?? ''
    const fieldValue = payload[field]
    const value = cond.value

    switch (cond.operator) {
      case 'eq':
        // eslint-disable-next-line eqeqeq
        return fieldValue == value
      case 'neq':
        // eslint-disable-next-line eqeqeq
        return fieldValue != value
      case 'gt':
        return Number(fieldValue) > Number(value)
      case 'gte':
        return Number(fieldValue) >= Number(value)
      case 'lt':
        return Number(fieldValue) < Number(value)
      case 'lte':
        return Number(fieldValue) <= Number(value)
      case 'contains':
        return String(fieldValue).includes(String(value))
      case 'startsWith':
        return String(fieldValue).startsWith(String(value))
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue as string)
      case 'notIn':
        return !Array.isArray(value) || !value.includes(fieldValue as string)
      case 'isNull':
        return fieldValue == null
      case 'isNotNull':
        return fieldValue != null
      default:
        return false
    }
  }
}
