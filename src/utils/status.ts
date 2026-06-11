import type { HouseStatus, ControlStage, OperationType, UserRole } from '../types';

/**
 * 房源状态中文映射
 */
export const HOUSE_STATUS_MAP: Record<HouseStatus, string> = {
  available: '可售',
  locked: '锁定',
  sold: '已售',
  reserved: '预留',
};

/**
 * 销控阶段中文映射
 */
export const STAGE_MAP: Record<ControlStage, string> = {
  application: '销控申请',
  review: '经理审核',
  lock: '执行锁定',
  completed: '已完成',
  rejected: '已驳回',
};

/**
 * 操作类型中文映射
 */
export const OPERATION_TYPE_MAP: Record<OperationType, string> = {
  create_application: '创建销控申请',
  submit_for_review: '提交审核',
  review_approve: '审核通过',
  review_reject: '审核驳回',
  lock_house: '锁定房源',
  unlock_house: '解锁房源',
  complete_sale: '完成销售',
  update_remark: '更新备注',
};

/**
 * 用户角色中文映射
 */
export const ROLE_MAP: Record<UserRole, string> = {
  consultant: '置业顾问',
  manager: '案场经理',
  controller: '销控专员',
};

/**
 * 获取房源状态对应的颜色
 * @param status 房源状态
 * @returns Tailwind 颜色类名
 */
export function getStatusColor(status: HouseStatus): string {
  const colorMap: Record<HouseStatus, string> = {
    available: 'bg-success/10 text-success border-success/30',
    locked: 'bg-secondary/10 text-secondary border-secondary/30',
    sold: 'bg-slate-400/10 text-slate-500 border-slate-300',
    reserved: 'bg-primary/10 text-primary border-primary/30',
  };
  return colorMap[status];
}

/**
 * 获取销控阶段对应的颜色
 * @param stage 销控阶段
 * @returns Tailwind 颜色类名
 */
export function getStageColor(stage: ControlStage): string {
  const colorMap: Record<ControlStage, string> = {
    application: 'bg-primary/10 text-primary border-primary/30',
    review: 'bg-secondary/10 text-secondary border-secondary/30',
    lock: 'bg-success/10 text-success border-success/30',
    completed: 'bg-slate-500/10 text-slate-600 border-slate-300',
    rejected: 'bg-danger/10 text-danger border-danger/30',
  };
  return colorMap[stage];
}
