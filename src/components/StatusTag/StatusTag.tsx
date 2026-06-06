import { 
  CaseStatus, 
  MedicalStatus, 
  FosterStatus, 
  SupplyStatus, 
  AdoptionStatus,
  ReviewStatus,
  HealthStatus 
} from '@/types';
import { 
  formatCaseStatus, 
  formatMedicalStatus, 
  formatFosterStatus, 
  formatSupplyStatus,
  formatAdoptionStatus,
  formatReviewStatus,
  formatHealthStatus
} from '@/utils/format';

interface StatusTagProps {
  type: 'case' | 'medical' | 'foster' | 'supply' | 'adoption' | 'review' | 'health';
  status: CaseStatus | MedicalStatus | FosterStatus | SupplyStatus | AdoptionStatus | ReviewStatus | HealthStatus;
}

export default function StatusTag({ type, status }: StatusTagProps) {
  const getStatusInfo = () => {
    switch (type) {
      case 'case':
        return formatCaseStatus(status as CaseStatus);
      case 'medical':
        return formatMedicalStatus(status as MedicalStatus);
      case 'foster':
        return formatFosterStatus(status as FosterStatus);
      case 'supply':
        return formatSupplyStatus(status as SupplyStatus);
      case 'adoption':
        return formatAdoptionStatus(status as AdoptionStatus);
      case 'review':
        return formatReviewStatus(status as ReviewStatus);
      case 'health':
        return formatHealthStatus(status as HealthStatus);
      default:
        return { label: status, color: 'bg-warm-100 text-warm-600' };
    }
  };

  const { label, color } = getStatusInfo();

  return (
    <span className={`tag ${color}`}>
      {label}
    </span>
  );
}
