export const TIME_SLOTS = [
  { value: '18:00-20:00', label: '晚间 (18:00-20:00)' },
  { value: '20:00-22:00', label: '黄金档 (20:00-22:00)' },
  { value: '22:00-00:00', label: '深夜 (22:00-00:00)' },
  { value: '00:00-02:00', label: '凌晨 (00:00-02:00)' }
];

export const TIME_SLOT_LABELS: Record<string, string> = {
  '18:00-20:00': '晚间 (18:00-20:00)',
  '20:00-22:00': '黄金档 (20:00-22:00)',
  '22:00-00:00': '深夜 (22:00-00:00)',
  '00:00-02:00': '凌晨 (00:00-02:00)',
  'morning': '上午 (10:00-14:00)',
  'afternoon': '下午 (14:00-18:00)',
  'evening': '晚间 (18:00-22:00)',
  'night': '深夜 (22:00-02:00)'
};

export const STAGE_OPTIONS = [
  { value: 'main', label: '主舞台' },
  { value: 'secondary', label: '副舞台' },
  { value: 'outdoor', label: '户外舞台' }
];

export const STAGE_LABELS: Record<string, string> = {
  'main': '主舞台',
  'secondary': '副舞台',
  'outdoor': '户外舞台',
  'vip': 'VIP区',
  'lounge': '休息区'
};

export function getTimeSlotLabel(slot: string): string {
  return TIME_SLOT_LABELS[slot] || slot;
}

export function getStageLabel(stage: string): string {
  return STAGE_LABELS[stage] || stage;
}
