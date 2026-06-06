import { CaseRecord, UserRole } from '../types';
import { ROLE_LABELS } from './statusFlow';

export const getLatestRejectReason = (record: CaseRecord): string => {
  if (!record.rejectReason) return '';
  const lines = record.rejectReason.split('\n').filter(l => l.trim());
  const latest = lines[lines.length - 1];
  const cleaned = latest.replace(/^\[.*?\]\s*/, '');
  return cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned;
};

export const getSupplementarySummary = (record: CaseRecord): string => {
  if (!record.supplementaryRemark) return '';
  const lines = record.supplementaryRemark.split('\n').filter(l => l.trim());
  const latest = lines[lines.length - 1];
  const cleaned = latest.replace(/^\[.*?\]\s*/, '');
  return cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned;
};

export const hasRejectHistory = (record: CaseRecord): boolean => {
  return !!record.rejectReason && record.rejectReason.trim().length > 0;
};

export const hasSupplementary = (record: CaseRecord): boolean => {
  return !!record.supplementaryRemark && record.supplementaryRemark.trim().length > 0;
};

export const enrichCaseRecord = (record: CaseRecord, extra: {
  brandName?: string;
  productName?: string;
  talentName?: string;
  businessName?: string;
  agentName?: string;
}) => {
  return {
    ...record,
    brandName: extra.brandName,
    productName: extra.productName,
    talentName: extra.talentName,
    latestRejectReason: getLatestRejectReason(record),
    supplementarySummary: getSupplementarySummary(record),
    hasReject: hasRejectHistory(record),
    hasSupplementary: hasSupplementary(record),
    responsibleRole: record.currentHandler ? ROLE_LABELS[record.currentHandler] : '-',
    businessName: extra.businessName,
    agentName: extra.agentName
  };
};

export type EnrichedCaseRecord = ReturnType<typeof enrichCaseRecord>;

export const filterCases = (
  cases: CaseRecord[],
  filters: {
    status?: string;
    currentHandler?: UserRole;
    hasReject?: boolean;
    hasSupplementary?: boolean;
  }
): CaseRecord[] => {
  return cases.filter(c => {
    if (filters.status && c.status !== filters.status) return false;
    if (filters.currentHandler && c.currentHandler !== filters.currentHandler) return false;
    if (filters.hasReject !== undefined && hasRejectHistory(c) !== filters.hasReject) return false;
    if (filters.hasSupplementary !== undefined && hasSupplementary(c) !== filters.hasSupplementary) return false;
    return true;
  });
};
