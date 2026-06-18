import {
  Circle,
  Loader,
  AlertTriangle,
  CheckCircle,
  Package,
  Archive,
} from 'lucide-react';
import { MaterialStatus } from '@/types';

export interface MaterialStatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: any;
}

export const MaterialStatusConfig: Record<MaterialStatus, MaterialStatusConfig> = {
  NOT_STARTED: {
    label: '未开始',
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-700',
    icon: Circle,
  },
  IN_PROGRESS: {
    label: '准备中',
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
    icon: Loader,
  },
  BLOCKED: {
    label: '受阻',
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    textColor: 'text-red-700',
    icon: AlertTriangle,
  },
  READY: {
    label: '已就绪',
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    textColor: 'text-green-700',
    icon: CheckCircle,
  },
  IN_USE: {
    label: '使用中',
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-700',
    icon: Package,
  },
  RETURNED: {
    label: '已归还',
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-700',
    icon: Archive,
  },
};

export const MaterialStatusFlow = [
  { status: 'NOT_STARTED', label: '未开始' },
  { status: 'IN_PROGRESS', label: '准备中' },
  { status: 'READY', label: '已就绪' },
  { status: 'IN_USE', label: '使用中' },
  { status: 'RETURNED', label: '已归还' },
] as const;
