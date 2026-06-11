import { ReportStatus, MaterialType } from '@/lib/types';

export const MATERIAL_DEFAULTS: { name: string; type: MaterialType }[] = [
  { name: '销售小票汇总', type: MaterialType.SALES_SLIP },
  { name: '结算对账单', type: MaterialType.SETTLEMENT_STATEMENT },
  { name: '增值税发票', type: MaterialType.INVOICE },
];

export function generateReportNo(month: string, count: number): string {
  const m = month.replace('-', '');
  const seq = String(count + 1).padStart(3, '0');
  return `SR${m}${seq}`;
}
