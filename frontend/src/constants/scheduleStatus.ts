import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Circle,
  Loader,
  Package,
  Archive,
} from 'lucide-react';
import { ScheduleStatus } from '@/types';

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: any;
}

export const ScheduleStatusConfig: Record<ScheduleStatus, StatusConfig> = {
  DRAFT: {
    label: '草稿',
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-700',
    icon: FileText,
  },
  PENDING_CONFIRM: {
    label: '待社教老师确认',
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
    icon: Clock,
  },
  APPROVED: {
    label: '待活动主管审核',
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-700',
    icon: AlertCircle,
  },
  PUBLISHED: {
    label: '已发布',
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    textColor: 'text-green-700',
    icon: CheckCircle,
  },
  CHANGED: {
    label: '已变更',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    textColor: 'text-yellow-700',
    icon: AlertTriangle,
  },
  REJECTED: {
    label: '已退回',
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    textColor: 'text-red-700',
    icon: XCircle,
  },
};

export const ScheduleStatusFlow = [
  { status: 'DRAFT', label: '草稿' },
  { status: 'PENDING_CONFIRM', label: '待社教老师确认' },
  { status: 'APPROVED', label: '待活动主管审核' },
  { status: 'PUBLISHED', label: '已发布' },
  { status: 'CHANGED', label: '已变更' },
  { status: 'REJECTED', label: '已退回' },
] as const;
