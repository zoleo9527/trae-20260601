import type { DamageAssessment, DamageDetail } from '../types/assessment.types';
import { AssessmentStatus, DamageType, DamageLevel, RepairMethod } from '../types/assessment.types';
import { getCurrentTime, generateAssessmentNo } from '../utils';

const now = getCurrentTime();
const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();

export const mockAssessments: DamageAssessment[] = [
  {
    assessmentId: 'assess-001',
    taskId: 'task-003',
    assessmentNo: generateAssessmentNo(),
    assessorId: 'user-002',
    assessorName: '李四',
    assessmentTime: oneDayAgo,
    partsFee: 18000,
    laborFee: 5000,
    materialFee: 1000,
    totalAmount: 24000,
    repairMethod: '维修',
    repairPlan: '后保险杠更换，左后翼子板维修，后备箱盖喷漆',
    status: AssessmentStatus.PENDING_REVIEW,
    createdBy: 'user-002',
    createdByName: '李四',
    createdTime: oneDayAgo,
    updatedTime: oneDayAgo
  },
  {
    assessmentId: 'assess-002',
    taskId: 'task-004',
    assessmentNo: generateAssessmentNo(),
    assessorId: 'user-003',
    assessorName: '王五',
    assessmentTime: '2024-01-14 15:30:00',
    partsFee: 3500,
    laborFee: 1000,
    materialFee: 300,
    totalAmount: 4800,
    repairMethod: '维修',
    repairPlan: '后保险杠喷漆修复',
    status: AssessmentStatus.APPROVED,
    reviewerId: 'user-004',
    reviewerName: '赵六',
    reviewTime: '2024-01-14 16:00:00',
    reviewComment: '定损金额合理，同意核赔',
    createdBy: 'user-003',
    createdByName: '王五',
    createdTime: '2024-01-14 15:30:00',
    updatedTime: '2024-01-14 16:00:00'
  }
];

export const mockDamageDetails: DamageDetail[] = [
  {
    detailId: 'detail-001',
    assessmentId: 'assess-001',
    partName: '后保险杠',
    damageType: DamageType.BREAK,
    damageLevel: DamageLevel.SEVERE,
    repairMethod: RepairMethod.REPLACE,
    partFee: 12000,
    laborFee: 1500,
    remark: '后保险杠破裂，需要更换',
    createdTime: oneDayAgo
  },
  {
    detailId: 'detail-002',
    assessmentId: 'assess-001',
    partName: '左后翼子板',
    damageType: DamageType.DENT,
    damageLevel: DamageLevel.MEDIUM,
    repairMethod: RepairMethod.REPAIR,
    partFee: 4000,
    laborFee: 2000,
    remark: '凹陷需要钣金修复',
    createdTime: oneDayAgo
  },
  {
    detailId: 'detail-003',
    assessmentId: 'assess-001',
    partName: '后备箱盖',
    damageType: DamageType.SCRATCH,
    damageLevel: DamageLevel.SLIGHT,
    repairMethod: RepairMethod.PAINT,
    partFee: 2000,
    laborFee: 1500,
    remark: '轻微划痕，喷漆处理',
    createdTime: oneDayAgo
  },
  {
    detailId: 'detail-004',
    assessmentId: 'assess-002',
    partName: '后保险杠',
    damageType: DamageType.DENT,
    damageLevel: DamageLevel.MEDIUM,
    repairMethod: RepairMethod.REPAIR,
    partFee: 3500,
    laborFee: 1000,
    remark: '凹陷修复加喷漆',
    createdTime: '2024-01-14 15:30:00'
  }
];
