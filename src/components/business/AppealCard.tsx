import React from 'react';
import { Card, Tag } from 'antd';
import type { Appeal } from '../../types';
import StatusBadge from '../common/StatusBadge';

interface AppealCardProps {
  appeal: Appeal;
  onClick?: () => void;
}

const AppealCard: React.FC<AppealCardProps> = ({ appeal, onClick }) => {
  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{appeal.position}</h3>
            <p className="text-sm text-gray-600">{appeal.company}</p>
          </div>
          <StatusBadge status={appeal.status} type="appeal" />
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs text-orange-600 mb-1">申诉原因</p>
          <p className="text-sm text-gray-800">{appeal.appealReason}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">招聘顾问</p>
            <p className="text-sm font-medium text-gray-800">{appeal.recruiterName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">企业HR</p>
            <p className="text-sm font-medium text-gray-800">{appeal.hrName}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">证据材料</p>
          <div className="space-y-2">
            {appeal.evidence.map((e, index) => (
              <div key={index} className="flex items-start gap-2">
                <Tag color={e.role === '企业HR' ? 'orange' : 'green'}>{e.role}</Tag>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{e.description}</p>
                  <div className="flex gap-2 mt-1">
                    {e.files.map((file, fileIndex) => (
                      <Tag key={fileIndex} color="default">
                        {file}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AppealCard;