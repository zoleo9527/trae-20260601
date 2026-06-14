export const API_BASE_URL = '/api/v1';

export const STATUS_CONFIG = {
  'PENDING_ACCEPTANCE': { label: '待受理', color: '#faad14' },
  'ACCEPTANCE_IN_PROGRESS': { label: '受理中', color: '#1890ff' },
  'MATERIAL_VERIFICATION': { label: '材料核验中', color: '#722ed1' },
  'VERIFICATION_PASSED': { label: '核验通过', color: '#52c41a' },
  'VERIFICATION_FAILED': { label: '核验不通过', color: '#ff4d4f' },
  'MATERIAL_INCOMPLETE': { label: '材料不全', color: '#fa8c16' },
  'QC_REVIEW_PENDING': { label: '待质控审核', color: '#13c2c2' },
  'QC_APPROVED': { label: '审核通过', color: '#52c41a' },
  'QC_REJECTED': { label: '复核不通过', color: '#ff4d4f' },
  'COMPLETED': { label: '已完成', color: '#8c8c8c' },
  'ON_HOLD': { label: '暂停/超时', color: '#f5222d' }
};

export const ROLE_CONFIG = {
  'acceptor': { label: '受理员', color: '#1890ff' },
  'appraiser': { label: '鉴定人', color: '#52c41a' },
  'qc_reviewer': { label: '质控审核', color: '#722ed1' },
  'admin': { label: '管理员', color: '#faad14' }
};

export const ACTION_TYPE_CONFIG = {
  'CREATE': { label: '创建', color: '#1890ff' },
  'UPDATE': { label: '更新', color: '#52c41a' },
  'SUBMIT': { label: '提交', color: '#722ed1' },
  'VERIFY': { label: '核验', color: '#13c2c2' },
  'APPROVE': { label: '批准', color: '#52c41a' },
  'REJECT': { label: '拒绝', color: '#ff4d4f' },
  'STATUS_CHANGE': { label: '状态变更', color: '#faad14' },
  'MATERIAL_UPDATE': { label: '材料更新', color: '#1890ff' },
  'ABNORMAL_FLAG': { label: '异常标记', color: '#f5222d' },
  'ABNORMAL_RESOLVE': { label: '异常解决', color: '#52c41a' }
};

export const VERIFICATION_STATUS_CONFIG = {
  'pending': { label: '待核验', color: '#faad14' },
  'passed': { label: '核验通过', color: '#52c41a' },
  'failed': { label: '核验不通过', color: '#ff4d4f' }
};
