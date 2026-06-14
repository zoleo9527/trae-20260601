import type { UserRole, DocumentIssue, BusinessStatus } from '@prisma/client';
import { STATUS_LABELS, DOCUMENT_ISSUE_LABELS } from './constants';

export function getRoleName(role: UserRole | string): string {
  const roleMap: Record<string, string> = {
    HALL_MANAGER: '大堂经理',
    ACCOUNT_MANAGER: '客户经理',
    OPERATION_SUPERVISOR: '运营主管',
  };
  return roleMap[role] || role;
}

export function formatAmount(amount: any): string {
  if (amount === null || amount === undefined) return '';
  if (typeof amount === 'number') {
    return amount.toLocaleString('zh-CN');
  }
  if (typeof amount === 'string') {
    const num = parseFloat(amount);
    return isNaN(num) ? amount : num.toLocaleString('zh-CN');
  }
  if (typeof amount === 'object' && amount !== null) {
    if (typeof amount.toNumber === 'function') {
      return amount.toNumber().toLocaleString('zh-CN');
    }
    if (typeof amount.toString === 'function') {
      const num = parseFloat(amount.toString());
      return isNaN(num) ? amount.toString() : num.toLocaleString('zh-CN');
    }
  }
  return String(amount);
}

export function getAmountNumber(amount: any): number | null {
  if (amount === null || amount === undefined) return null;
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') {
    const num = parseFloat(amount);
    return isNaN(num) ? null : num;
  }
  if (typeof amount === 'object' && amount !== null) {
    if (typeof amount.toNumber === 'function') {
      return amount.toNumber();
    }
    if (typeof amount.toString === 'function') {
      const num = parseFloat(amount.toString());
      return isNaN(num) ? null : num;
    }
  }
  return null;
}

export function getBlockedReason(businessCase: any): string | null {
  if (
    businessCase.status === 'DOCUMENT_CHECKING' &&
    businessCase.documentCheck?.issues?.length > 0
  ) {
    const issues = businessCase.documentCheck.issues
      .map((issue: string) => DOCUMENT_ISSUE_LABELS[issue as DocumentIssue] || issue)
      .join(', ');
    return `资料问题: ${issues}`;
  }

  if (businessCase.status === 'DUE_DILIGENCE' && businessCase.dueDiligence?.needsSupplement) {
    return `尽调补件: ${businessCase.dueDiligence.supplementNote || '需要补充材料'}`;
  }

  if (businessCase.status === 'RETURNED' && businessCase.authReviews?.[0]) {
    return `授权退回: ${businessCase.authReviews[0].reason}`;
  }

  if (businessCase.status === 'PENDING_AUTHORIZATION') {
    if (businessCase.authReviews?.length > 0) {
      const lastReview = businessCase.authReviews[0];
      if (lastReview.result === 'ESCALATED') {
        return `等待${lastReview.reviewLevel + 1}级授权: ${lastReview.reason}`;
      }
    }
    return '等待运营主管授权';
  }

  return null;
}

export function getHandlerInfo(businessCase: any): string {
  if (businessCase.assignee) {
    return `${getRoleName(businessCase.assignee.role)} ${businessCase.assignee.name}`;
  }
  if (businessCase.acceptor) {
    return `${getRoleName(businessCase.acceptor.role)} ${businessCase.acceptor.name} (受理)`;
  }
  return '暂未分配';
}

export function getWaitMinutes(businessCase: any): number {
  if (!businessCase.authPendingAt) return 0;
  const pendingTime =
    typeof businessCase.authPendingAt === 'string'
      ? new Date(businessCase.authPendingAt)
      : businessCase.authPendingAt;
  return Math.floor((Date.now() - pendingTime.getTime()) / 60000);
}

export function formatWaitTime(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}小时${m}分钟`;
  }
  return `${minutes}分钟`;
}
