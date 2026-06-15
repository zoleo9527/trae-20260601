import React from 'react';
import { Appeal } from '../types';
import { APPEAL_TYPE_MAP, APPEAL_STATUS_MAP } from '../types';
import { formatDateTime, getStatusColor, getUrgencyLevel, calculateDaysRemaining } from '../utils/appealLogic';

interface AppealCardProps {
  appeal: Appeal;
  onClick: () => void;
  showUrgency?: boolean;
}

type StatusColor = 'orange' | 'blue' | 'purple' | 'cyan' | 'green' | 'red' | 'gray';

export const AppealCard: React.FC<AppealCardProps> = ({ appeal, onClick, showUrgency = true }) => {
  const statusColor = getStatusColor(appeal.status) as StatusColor;
  const urgencyLevel = getUrgencyLevel(appeal.deadline);
  const daysRemaining = calculateDaysRemaining(appeal.deadline);

  const urgencyStyle: Record<string, string> = {
    normal: 'bg-gray-100 text-gray-600',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
  };

  const statusStyle: Record<StatusColor, string> = {
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow ${
        urgencyLevel === 'danger' ? 'border-l-4 border-l-red-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-800">{appeal.productName}</span>
            <span className="text-sm text-gray-500">{appeal.productModel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full border ${statusStyle[statusColor]}`}>
              {APPEAL_STATUS_MAP[appeal.status]}
            </span>
            <span className="text-xs text-gray-500">{APPEAL_TYPE_MAP[appeal.appealType]}</span>
          </div>
        </div>
        {showUrgency && (
          <div className={`px-2 py-1 rounded text-xs font-medium ${urgencyStyle[urgencyLevel]}`}>
            {daysRemaining < 0 ? `已超时 ${Math.abs(daysRemaining)} 天` : daysRemaining === 0 ? '今日截止' : `${daysRemaining} 天`}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{appeal.description}</p>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>{appeal.customerName}</span>
          <span>{appeal.orderId}</span>
        </div>
        <span>{formatDateTime(appeal.createdAt)}</span>
      </div>

      {appeal.claimedAmount !== undefined && appeal.actualAmount !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-4 text-sm">
          <span className="text-gray-500">
            原估价: <span className="font-medium text-gray-700">{appeal.estimatedAmount}</span>
          </span>
          <span className="text-gray-500">
            实付: <span className="font-medium text-gray-700">{appeal.actualAmount}</span>
          </span>
          <span className="text-orange-600">
            诉求: <span className="font-medium">{appeal.claimedAmount}</span>
          </span>
        </div>
      )}
    </div>
  );
};