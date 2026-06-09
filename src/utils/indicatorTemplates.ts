export interface IndicatorTemplate {
  name: string
  unit: string
  normalMin: number
  normalMax: number
}

const templates: Record<string, IndicatorTemplate[]> = {
  '2型糖尿病': [
    { name: '空腹血糖', unit: 'mmol/L', normalMin: 3.9, normalMax: 6.1 },
    { name: '餐后2h血糖', unit: 'mmol/L', normalMin: 3.9, normalMax: 7.8 },
    { name: '糖化血红蛋白', unit: '%', normalMin: 4.0, normalMax: 6.0 },
  ],
  '高血压': [
    { name: '收缩压', unit: 'mmHg', normalMin: 90, normalMax: 140 },
    { name: '舒张压', unit: 'mmHg', normalMin: 60, normalMax: 90 },
    { name: '心率', unit: '次/分', normalMin: 60, normalMax: 100 },
  ],
  '冠心病': [
    { name: '收缩压', unit: 'mmHg', normalMin: 90, normalMax: 140 },
    { name: '舒张压', unit: 'mmHg', normalMin: 60, normalMax: 90 },
    { name: '总胆固醇', unit: 'mmol/L', normalMin: 2.8, normalMax: 5.2 },
    { name: '低密度脂蛋白', unit: 'mmol/L', normalMin: 0, normalMax: 3.4 },
  ],
  '慢性肾病': [
    { name: '血肌酐', unit: 'μmol/L', normalMin: 44, normalMax: 133 },
    { name: 'eGFR', unit: 'ml/min', normalMin: 60, normalMax: 120 },
    { name: '尿蛋白', unit: 'g/24h', normalMin: 0, normalMax: 0.15 },
    { name: '血尿素氮', unit: 'mmol/L', normalMin: 2.9, normalMax: 8.2 },
  ],
}

export function getTemplatesForDisease(diseaseType: string): IndicatorTemplate[] {
  const parts = diseaseType.split('+')
  const seen = new Set<string>()
  const result: IndicatorTemplate[] = []
  for (const part of parts) {
    const tpl = templates[part.trim()]
    if (tpl) {
      for (const t of tpl) {
        if (!seen.has(t.name)) {
          seen.add(t.name)
          result.push(t)
        }
      }
    }
  }
  return result
}

export function getAllTemplates(): IndicatorTemplate[] {
  const seen = new Set<string>()
  const result: IndicatorTemplate[] = []
  for (const tpl of Object.values(templates)) {
    for (const t of tpl) {
      if (!seen.has(t.name)) {
        seen.add(t.name)
        result.push(t)
      }
    }
  }
  return result
}
