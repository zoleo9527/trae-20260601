import React from 'react';
import { Tag } from 'antd';

interface StatusBadgeProps {
  status: string;
  type?: 'settlement' | 'appeal';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'settlement' }) => {
  const getStatusConfig = () => {
    if (type === 'settlement') {
      switch (status) {
        case 'pending_hr_confirm':
          return { color: 'orange', text: '待企业HR确认' };
        case 'pending_operator_review':
          return { color: 'blue', text: '待运营审核' };
        case 'completed':
          return { color: 'green', text: '已完成' };
        case 'rejected':
          return { color: 'red', text: '已驳回' };
        case 'appealing':
          return { color: 'purple', text: '异常申诉中' };
        default:
          return { color: 'default', text: status };
      }
    } else {
      switch (status) {
        case 'pending_recruiter_response':
          return { color: 'orange', text: '待招聘顾问补充' };
        case 'pending_operator_arbitration':
          return { color: 'blue', text: '待运营仲裁' };
        case 'resolved':
          return { color: 'green', text: '已解决' };
        case 'rejected':
          return { color: 'red', text: '已驳回' };
        default:
          return { color: 'default', text: status };
      }
    }
  };

  const config = getStatusConfig();

  return <Tag color={config.color}>{config.text}</Tag>;
};

export default StatusBadge;