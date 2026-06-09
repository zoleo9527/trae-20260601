import type { Indicator, Warning, WarningLevel } from '@/types'

interface WarningRule {
  ruleName: string
  ruleDesc: string
  level: WarningLevel
  test: (indicators: Indicator[]) => Indicator | null
}

const rules: WarningRule[] = [
  {
    ruleName: '血糖持续偏高',
    ruleDesc: '空腹血糖 ≥ 7.0 mmol/L',
    level: 'red',
    test: (inds) => inds.find((i) => i.name === '空腹血糖' && i.value >= 7.0) ?? null,
  },
  {
    ruleName: '血压波动异常',
    ruleDesc: '收缩压 ≥ 180 mmHg 或舒张压 ≥ 110 mmHg',
    level: 'orange',
    test: (inds) =>
      inds.find((i) => (i.name === '收缩压' && i.value >= 180) || (i.name === '舒张压' && i.value >= 110)) ?? null,
  },
  {
    ruleName: '肾功能异常',
    ruleDesc: '血肌酐 ≥ 133 μmol/L',
    level: 'red',
    test: (inds) => inds.find((i) => i.name === '血肌酐' && i.value >= 133) ?? null,
  },
  {
    ruleName: '糖化血红蛋白异常',
    ruleDesc: '糖化血红蛋白 ≥ 7.0%',
    level: 'orange',
    test: (inds) => inds.find((i) => i.name === '糖化血红蛋白' && i.value >= 7.0) ?? null,
  },
  {
    ruleName: 'eGFR异常',
    ruleDesc: 'eGFR < 60 ml/min',
    level: 'red',
    test: (inds) => inds.find((i) => i.name === 'eGFR' && i.value < 60) ?? null,
  },
  {
    ruleName: '尿蛋白异常',
    ruleDesc: '尿蛋白 > 0.15 g/24h',
    level: 'orange',
    test: (inds) => inds.find((i) => i.name === '尿蛋白' && i.value > 0.15) ?? null,
  },
]

export function detectWarnings(
  followUpId: string,
  indicators: Indicator[],
  existingWarnings: Warning[]
): Warning[] {
  const newWarnings: Warning[] = []
  for (const rule of rules) {
    const matched = rule.test(indicators)
    if (!matched) continue
    const alreadyExists = existingWarnings.some(
      (w) => w.followUpId === followUpId && w.ruleName === rule.ruleName && w.status !== 'resolved' && w.status !== 'returned'
    )
    if (alreadyExists) continue
    newWarnings.push({
      id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      indicatorId: matched.id,
      followUpId,
      level: rule.level,
      ruleName: rule.ruleName,
      ruleDesc: rule.ruleDesc,
      status: 'active',
      assigneeRole: rule.level === 'red' ? 'doctor' : 'ph_specialist',
      assigneeName: rule.level === 'red' ? '陈医生' : '杨专员',
      triggeredAt: new Date().toISOString(),
      actions: [],
    })
  }
  return newWarnings
}

export function isIndicatorAbnormal(ind: Indicator): boolean {
  return ind.value < ind.normalMin || ind.value > ind.normalMax
}
