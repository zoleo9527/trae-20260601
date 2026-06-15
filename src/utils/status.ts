import { InspectionStatus, UserRole } from '@/types';

export const statusMap: Record<InspectionStatus, { label: string; color: string; bgColor: string }> = {
  pending_manager: { label: '待经理确认', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  pending_dispatch: { label: '待调度分配', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  pending_inspection: { label: '待出场验机', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  inspecting: { label: '验机中', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  pending_repair: { label: '待维修', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
  pending_sign: { label: '待司机签收', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
  completed: { label: '已完成', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  disputed: { label: '有争议', color: 'text-rose-700', bgColor: 'bg-rose-50 border-rose-200' },
};

export const roleMap: Record<UserRole, { label: string; color: string }> = {
  manager: { label: '租赁经理', color: 'text-slate-700' },
  dispatcher: { label: '调度员', color: 'text-blue-700' },
  technician: { label: '维修师傅', color: 'text-amber-700' },
  driver: { label: '司机', color: 'text-emerald-700' },
};

export const priorityMap: Record<string, { label: string; color: string; bgColor: string }> = {
  urgent: { label: '紧急', color: 'text-rose-700', bgColor: 'bg-rose-100' },
  high: { label: '高', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  normal: { label: '普通', color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

export const inspectionCategoryNames: Record<string, string> = {
  '外观检查': '外观检查',
  '性能检查': '性能检查',
  '安全检查': '安全检查',
  '附件检查': '附件检查',
};
