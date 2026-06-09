function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

export function snakeToCamel<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => snakeToCamel(item)) as T
  }
  if (isObject(obj)) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[toCamel(key)] = snakeToCamel(value)
    }
    return result as T
  }
  return obj
}
