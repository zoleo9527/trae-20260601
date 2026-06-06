import { 
  CaseStatus, 
  MedicalStatus, 
  FosterStatus, 
  SupplyStatus, 
  AdoptionStatus,
  ReviewStatus,
  HealthStatus,
  TimelineEventType,
  AnimalType,
  UserRole
} from '@/types';

export const formatCaseStatus = (status: CaseStatus): { label: string; color: string } => {
  const statusMap: Record<CaseStatus, { label: string; color: string }> = {
    registered: { label: '已登记', color: 'bg-blue-100 text-blue-700' },
    medical: { label: '医疗中', color: 'bg-red-100 text-red-700' },
    fostering: { label: '寄养中', color: 'bg-primary-100 text-primary-700' },
    adopted: { label: '已领养', color: 'bg-green-100 text-green-700' },
    archived: { label: '已归档', color: 'bg-warm-100 text-warm-600' },
  };
  return statusMap[status];
};

export const formatMedicalStatus = (status: MedicalStatus): { label: string; color: string } => {
  const statusMap: Record<MedicalStatus, { label: string; color: string }> = {
    pending: { label: '待检查', color: 'bg-yellow-100 text-yellow-700' },
    treating: { label: '治疗中', color: 'bg-red-100 text-red-700' },
    healthy: { label: '已康复', color: 'bg-green-100 text-green-700' },
  };
  return statusMap[status];
};

export const formatFosterStatus = (status: FosterStatus): { label: string; color: string } => {
  const statusMap: Record<FosterStatus, { label: string; color: string }> = {
    active: { label: '进行中', color: 'bg-green-100 text-green-700' },
    ended: { label: '已结束', color: 'bg-warm-100 text-warm-600' },
    returned: { label: '已退回', color: 'bg-red-100 text-red-700' },
  };
  return statusMap[status];
};

export const formatSupplyStatus = (status: SupplyStatus): { label: string; color: string } => {
  const statusMap: Record<SupplyStatus, { label: string; color: string }> = {
    pending: { label: '待审批', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  };
  return statusMap[status];
};

export const formatAdoptionStatus = (status: AdoptionStatus): { label: string; color: string } => {
  const statusMap: Record<AdoptionStatus, { label: string; color: string }> = {
    pending: { label: '审核中', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  };
  return statusMap[status];
};

export const formatReviewStatus = (status: ReviewStatus): { label: string; color: string } => {
  const statusMap: Record<ReviewStatus, { label: string; color: string }> = {
    pending: { label: '待复核', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
    supplement_needed: { label: '需补录', color: 'bg-orange-100 text-orange-700' },
  };
  return statusMap[status];
};

export const formatHealthStatus = (status: HealthStatus): { label: string; color: string } => {
  const statusMap: Record<HealthStatus, { label: string; color: string }> = {
    poor: { label: '较差', color: 'bg-red-100 text-red-700' },
    fair: { label: '一般', color: 'bg-yellow-100 text-yellow-700' },
    good: { label: '良好', color: 'bg-green-100 text-green-700' },
  };
  return statusMap[status];
};

export const formatTimelineEventType = (type: TimelineEventType): { label: string; icon: string; color: string } => {
  const typeMap: Record<TimelineEventType, { label: string; icon: string; color: string }> = {
    register: { label: '登记', icon: 'FilePlus', color: 'bg-blue-500' },
    medical: { label: '医疗', icon: 'Stethoscope', color: 'bg-red-500' },
    foster: { label: '寄养', icon: 'Home', color: 'bg-primary-500' },
    supply: { label: '物资', icon: 'Package', color: 'bg-purple-500' },
    adoption: { label: '领养', icon: 'Heart', color: 'bg-pink-500' },
    review: { label: '复核', icon: 'CheckCircle', color: 'bg-secondary-500' },
    archive: { label: '归档', icon: 'Archive', color: 'bg-warm-500' },
    return: { label: '退回', icon: 'RotateCcw', color: 'bg-orange-500' },
    supplement: { label: '补录', icon: 'Edit3', color: 'bg-cyan-500' },
    followup: { label: '回访', icon: 'Phone', color: 'bg-indigo-500' },
  };
  return typeMap[type];
};

export const formatAnimalType = (type: AnimalType): string => {
  const typeMap: Record<AnimalType, string> = {
    cat: '猫咪',
    dog: '狗狗',
    other: '其他',
  };
  return typeMap[type];
};

export const formatUserRole = (role: UserRole): string => {
  const roleMap: Record<UserRole, string> = {
    volunteer: '救助志愿者',
    veterinarian: '兽医',
    adoption_officer: '领养审核员',
    supply_manager: '物资管理员',
  };
  return roleMap[role];
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};
