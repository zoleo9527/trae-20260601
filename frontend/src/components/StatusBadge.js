import React from 'react';
import { Tag } from 'antd';

const statusConfig = {
  training: {
    planning: { color: 'default', text: '规划中' },
    registration: { color: 'processing', text: '报名中' },
    in_progress: { color: 'warning', text: '进行中' },
    completed: { color: 'success', text: '已完成' },
    cancelled: { color: 'error', text: '已取消' }
  },
  certificate: {
    pending: { color: 'default', text: '待制作' },
    creating: { color: 'processing', text: '制作中' },
    pending_review: { color: 'warning', text: '待审核' },
    needs_correction: { color: 'error', text: '需修正' },
    approved: { color: 'success', text: '已批准' },
    issued: { color: 'success', text: '已发放' },
    cancelled: { color: 'error', text: '已取消' },
    revoked: { color: 'error', text: '已撤回' }
  },
  registration: {
    registered: { color: 'processing', text: '已报名' },
    attended: { color: 'success', text: '已参训' },
    absent: { color: 'error', text: '缺席' },
    cancelled: { color: 'default', text: '已取消' },
    replaced: { color: 'warning', text: '已替换' }
  },
  exception: {
    discovered: { color: 'error', text: '待处理' },
    assigned: { color: 'warning', text: '已分配' },
    processing: { color: 'processing', text: '处理中' },
    resolved: { color: 'success', text: '已解决' },
    closed: { color: 'default', text: '已关闭' }
  },
  evaluation: {
    draft: { color: 'default', text: '草稿' },
    published: { color: 'success', text: '已发布' },
    frozen: { color: 'error', text: '已冻结' }
  },
  priority: {
    low: { color: 'default', text: '低' },
    medium: { color: 'warning', text: '中' },
    high: { color: 'error', text: '高' },
    urgent: { color: 'error', text: '紧急' }
  },
  homework: {
    not_submitted: { color: 'error', text: '未提交' },
    submitted: { color: 'success', text: '已提交' },
    late: { color: 'warning', text: '迟交' },
    graded: { color: 'processing', text: '已批改' }
  }
};

function StatusBadge({ type, status }) {
  const config = statusConfig[type]?.[status] || { color: 'default', text: status };

  return (
    <Tag color={config.color}>
      {config.text}
    </Tag>
  );
}

export default StatusBadge;

export { statusConfig };
