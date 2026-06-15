import React from 'react';
import { AuditLog } from '../types';
import { APPEAL_STATUS_MAP, USER_ROLE_MAP } from '../types';
import { formatDateTime } from '../utils/appealLogic';

interface AuditLogListProps {
  logs: AuditLog[];
}

export const AuditLogList: React.FC<AuditLogListProps> = ({ logs }) => {
  const getActionLabel = (action: string, log: AuditLog): string => {
    const actions: Record<string, string> = {
      create: '创建申诉',
      status_change: '状态变更',
      evidence_upload: '上传证据',
      reject: '驳回申诉',
      return: '退回申诉',
      resolve: '确认解决',
    };
    
    let label = actions[action] || action;
    
    if (action === 'status_change' && log.previousStatus && log.newStatus) {
      label = `${APPEAL_STATUS_MAP[log.previousStatus]} → ${APPEAL_STATUS_MAP[log.newStatus]}`;
    }
    
    return label;
  };

  const getActionColor = (action: string): string => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-700',
      status_change: 'bg-blue-100 text-blue-700',
      evidence_upload: 'bg-purple-100 text-purple-700',
      reject: 'bg-red-100 text-red-700',
      return: 'bg-yellow-100 text-yellow-700',
      resolve: 'bg-green-100 text-green-700',
    };
    return colors[action] || 'bg-gray-100 text-gray-700';
  };

  const renderDetails = (log: AuditLog) => {
    if (log.details.comment) {
      return <p className="text-sm text-gray-600 mt-1">{log.details.comment}</p>;
    }
    if (log.details.reason) {
      return <p className="text-sm text-gray-600 mt-1">原因: {log.details.reason}</p>;
    }
    if (log.details.resolutionAmount) {
      return <p className="text-sm text-gray-600 mt-1">处理金额: {log.details.resolutionAmount}</p>;
    }
    return null;
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-500">暂无操作记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map(log => (
        <div key={log.id} className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                {getActionLabel(log.action, log)}
              </div>
              <span className="text-xs text-gray-500">{USER_ROLE_MAP[log.actorRole]}</span>
            </div>
            <span className="text-xs text-gray-400">{formatDateTime(log.timestamp)}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-700">{log.actorName}</span>
            <span className="text-xs text-gray-400">操作</span>
          </div>
          {renderDetails(log)}
        </div>
      ))}
    </div>
  );
};