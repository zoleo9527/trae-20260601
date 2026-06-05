export const GRADING_LEVELS = {
  A: 'A',
  B: 'B',
  C: 'C',
  SCRAP: 'SCRAP',
} as const;

export type GradingLevel = (typeof GRADING_LEVELS)[keyof typeof GRADING_LEVELS];

export const GRADING_LABELS: Record<GradingLevel, string> = {
  A: 'A级',
  B: 'B级',
  C: 'C级',
  SCRAP: '报废',
};

export const VALID_GRADING_LEVELS = new Set(Object.values(GRADING_LEVELS));

export function normalizeGradingLevel(level: string | null | undefined): GradingLevel {
  if (!level) return GRADING_LEVELS.SCRAP;
  const upperLevel = level.toUpperCase();
  if (upperLevel === 'REJECTED') return GRADING_LEVELS.SCRAP;
  if (VALID_GRADING_LEVELS.has(upperLevel as GradingLevel)) return upperLevel as GradingLevel;
  return GRADING_LEVELS.SCRAP;
}

export function normalizeGrading<T extends { level: string }>(grading: T | null | undefined): (Omit<T, 'level'> & { level: GradingLevel }) | null {
  if (!grading) return null;
  return {
    ...grading,
    level: normalizeGradingLevel(grading.level),
  };
}

export function normalizeProcurementGrading<T extends { grading?: { level: string } | null }>(procurement: T): T {
  if (!procurement.grading) return procurement;
  return {
    ...procurement,
    grading: normalizeGrading(procurement.grading),
  };
}