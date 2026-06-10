export function snakeToCamel(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(item => snakeToCamel(item))
  
  const result: any = {}
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (match, char) => char.toUpperCase())
    const value = obj[key]
    result[camelKey] = typeof value === 'object' && value !== null ? snakeToCamel(value) : value
  }
  return result
}

export function camelToSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(item => camelToSnake(item))
  
  const result: any = {}
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    const value = obj[key]
    result[snakeKey] = typeof value === 'object' && value !== null ? camelToSnake(value) : value
  }
  return result
}