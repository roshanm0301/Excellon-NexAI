function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function deepMerge(
  base: Record<string, unknown>,
  delta: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base }

  for (const key of Object.keys(delta)) {
    const deltaVal = delta[key]

    if (deltaVal === null) {
      delete result[key]
      continue
    }

    const baseVal = result[key]

    if (isPlainObject(deltaVal) && isPlainObject(baseVal)) {
      result[key] = deepMerge(baseVal, deltaVal)
    } else {
      result[key] = deltaVal
    }
  }

  return result
}
