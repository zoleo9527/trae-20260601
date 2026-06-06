import { RescueStatus, MedicalStatus } from '@/types';

interface StatusBadgeProps {
  status: RescueStatus | MedicalStatus;
  type?: 'rescue' | 'medical';
}

const rescueStatusConfig: Record<RescueStatus, { label: string; color: string }> = {
  [RescueStatus.PENDING]: { label: '待处理', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  [RescueStatus.REGISTERED]: { label: '已登记', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  [RescueStatus.FOSTERING]: { label: '寄养中', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  [RescueStatus.TREATING]: { label: '治疗中', color: 'bg-red-100 text-red-700 border-red-200' },
  [RescueStatus.READY_FOR_ADOPTION]: { label: '待领养', color: 'bg-green-100 text-green-700 border-green-200' },
  [RescueStatus.ADOPTED]: { label: '已领养', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  [RescueStatus.RETURNED]: { label: '已退回', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  [RescueStatus.CLOSED]: { label: '已关闭', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const medicalStatusConfig: Record<MedicalStatus, { label: string; color: string }> = {
  [MedicalStatus.NOT_ASSESSED]: { label: '未评估', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  [MedicalStatus.ASSESSING]: { label: '评估中', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  [MedicalStatus.NEEDS_TREATMENT]: { label: '需治疗', color: 'bg-red-100 text-red-700 border-red-200' },
  [MedicalStatus.TREATING]: { label: '治疗中', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  [MedicalStatus.RECOVERED]: { label: '已痊愈', color: 'bg-green-100 text-green-700 border-green-200' },
};

export default function StatusBadge({ status, type = 'rescue' }: StatusBadgeProps) {
  const config = type === 'rescue' ? rescueStatusConfig[status as RescueStatus] : medicalStatusConfig[status as MedicalStatus];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
    >
      {config.label}
    </span>
  );
}
