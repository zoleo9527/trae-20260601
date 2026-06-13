import React from 'react';
import type { HistoryRecord } from '../../types';
import { Tag } from 'antd';

interface HistoryTimelineProps {
  history: HistoryRecord[];
}

const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ history }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case '运营':
        return 'blue';
      case '招聘顾问':
        return 'green';
      case '企业HR':
        return 'orange';
      default:
        return 'default';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">历史备注</h3>
      <div className="space-y-4">
        {history.map((record, index) => (
          <div key={index} className="flex gap-4 items-start">
            <div className="w-32 text-sm text-gray-500 flex-shrink-0">
              {record.time}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Tag color={getRoleColor(record.role)}>{record.role}</Tag>
                <span className="font-medium text-gray-800">{record.operator}</span>
                <span className="text-gray-600">{record.action}</span>
              </div>
              <p className="text-gray-600 text-sm">{record.remark}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryTimeline;