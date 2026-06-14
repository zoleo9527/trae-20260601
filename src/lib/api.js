export const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export async function login(username, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: { username, password }
  });
}

export async function logout() {
  return apiRequest('/auth/logout', {
    method: 'POST'
  });
}

export async function getSamples(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/samples?action=list&${queryString}`);
}

export async function getSample(id) {
  return apiRequest(`/samples?action=get&id=${id}`);
}

export async function getSampleFlows(sampleId) {
  return apiRequest(`/samples?action=flows&sampleId=${sampleId}`);
}

export async function getStatistics() {
  return apiRequest('/samples?action=statistics');
}

export async function getAppraisers() {
  return apiRequest('/samples?action=appraisers');
}

export async function createSample(data) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'create', ...data }
  });
}

export async function receiveSample(sampleId, remarks) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'receive', sampleId, remarks }
  });
}

export async function processSample(sampleId, remarks) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'process', sampleId, remarks }
  });
}

export async function completeSample(sampleId, remarks) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'complete', sampleId, remarks }
  });
}

export async function returnSample(sampleId, remarks) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'return', sampleId, remarks }
  });
}

export async function rejectSample(sampleId, remarks) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'reject', sampleId, remarks }
  });
}

export async function assignAppraiser(sampleId, appraiserId, remarks) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'assign', sampleId, appraiserId, remarks }
  });
}

export async function requestSupplementary(sampleId, reason, requiredItems) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'supplementary', sampleId, reason, requiredItems }
  });
}

export async function receiveSupplementary(requestId) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'supplementaryReceive', requestId }
  });
}

export async function getRoleData() {
  return apiRequest('/samples?action=roleData');
}

export async function getReceptionChecks(sampleId) {
  return apiRequest(`/samples?action=receptionChecks&sampleId=${sampleId}`);
}

export async function addReceptionCheck(sampleId, checkItem, checkResult, remarks) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'addReceptionCheck', sampleId, checkItem, checkResult, remarks }
  });
}

export async function getSamplePhotos(sampleId) {
  return apiRequest(`/samples?action=photos&sampleId=${sampleId}`);
}

export async function addSamplePhoto(sampleId, photoType, description) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'addPhoto', sampleId, photoType, description }
  });
}

export async function getAbnormalities(sampleId) {
  return apiRequest(`/samples?action=abnormalities&sampleId=${sampleId}`);
}

export async function reportAbnormality(sampleId, abnormalityType, description, severity) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'reportAbnormality', sampleId, abnormalityType, description, severity }
  });
}

export async function handleAbnormality(abnormalityId, handlingResult) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'handleAbnormality', abnormalityId, handlingResult }
  });
}

export async function getOpinionDocuments(sampleId) {
  return apiRequest(`/samples?action=opinionDocs&sampleId=${sampleId}`);
}

export async function createOpinionDocument(sampleId, documentTitle, documentContent) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'createOpinionDoc', sampleId, documentTitle, documentContent }
  });
}

export async function submitOpinionDocumentForReview(documentId) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'submitOpinionDocReview', documentId }
  });
}

export async function reviewOpinionDocument(documentId, status, reviewComments) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'reviewOpinionDoc', documentId, status, reviewComments }
  });
}

export async function createUrgencyReminder(sampleId, reminderType, title, message, targetUserId) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'createReminder', sampleId, reminderType, title, message, targetUserId }
  });
}

export async function acknowledgeReminder(reminderId) {
  return apiRequest('/samples', {
    method: 'POST',
    body: { action: 'acknowledgeReminder', reminderId }
  });
}

export async function getOverdueSamples() {
  return apiRequest('/samples?action=overdue');
}

export const statusLabels = {
  pending: '待接收',
  received: '已接收',
  processing: '检测中',
  completed: '已完成',
  returned: '已退回',
  supplementary: '需补充'
};

export const statusColors = {
  pending: '#909399',
  received: '#409EFF',
  processing: '#E6A23C',
  completed: '#67C23A',
  returned: '#909399',
  supplementary: '#F56C6C'
};

export const priorityLabels = {
  low: '低',
  normal: '普通',
  high: '紧急',
  urgent: '特急'
};

export const priorityColors = {
  low: '#909399',
  normal: '#409EFF',
  high: '#E6A23C',
  urgent: '#F56C6C'
};

export const sampleTypes = [
  '血液',
  '尿液',
  '毛发',
  '组织',
  '指纹',
  '笔迹',
  '文件',
  '电子数据',
  '其他'
];

export const roleLabels = {
  acceptor: '受理员',
  appraiser: '鉴定人',
  quality_controller: '质控审核',
  admin: '管理员'
};

export const actionTypeLabels = {
  receive: '接收样本',
  process: '开始处理',
  return: '退回样本',
  supplementary: '补充材料',
  complete: '完成鉴定',
  assign: '分配鉴定人',
  quality_check: '质控审核',
  reject: '驳回'
};

export const checkItems = [
  '样本外观完整性',
  '样本数量核对',
  '样本标识清晰度',
  '样本保存条件',
  '委托书一致性核对',
  '样本包装完整性'
];

export const photoTypes = {
  overview: '样本全景',
  detail: '样本细节',
  label: '样本标签',
  damage: '损坏部位',
  other: '其他'
};

export const abnormalityTypes = {
  damage: '样本损坏',
  insufficient: '样本数量不足',
  wrong_label: '标签错误',
  contamination: '样本污染',
  other: '其他异常'
};

export const severityLevels = {
  low: '轻微',
  medium: '中等',
  high: '严重',
  critical: '危急'
};

export const documentStatusLabels = {
  draft: '草稿',
  reviewing: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  final: '最终版'
};

export const reminderTypeLabels = {
  deadline: '截止日期提醒',
  supplementary: '补充材料催办',
  quality_check: '质控审核催办',
  custom: '自定义催办'
};
